#!/usr/bin/env node
/*
 * scan-form-secrets.js  (read-only security audit of node config forms)
 *
 * Usage:  node scan-form-secrets.js [reportPath]
 *   - scans every Atlas_Forms script under the projects folder (excluding obsolete/backup/unapproved/unsorted)
 *   - cross-checks the live DB (sqlcmd, read-only SELECTs only): Atlas_Forms, Process_ProcessElementTypes
 *     (ConfigurationSchema), Template_DataTemplates (ContentData) and AIExt_CredentialTypes
 *   - writes a Markdown report (default: ../audit/form-secrets-audit-<date>.md next to this script)
 * It never modifies scripts, code or the database. Secret-looking values are never printed
 * (only first 4 chars + '***').
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'C:/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects';
const SQL_SERVER = '.\\SQLEXPRESS';
const SQL_DB = 'data-ocean-platform-prod';
const EXCLUDED_DIRS = /^(obsolete|backup|unapproved|unsorted)$/i;
const REPORT = process.argv[2] || path.join(__dirname, 'form-secrets-audit-2026-09-20.md');
const SELF = __filename;

// ---------------------------------------------------------------- file walking
function walk(dir, out, excluded) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDED_DIRS.test(e.name)) countExcluded(p, excluded);
      else walk(p, out, excluded);
    } else if (/\.sql$/i.test(e.name)) out.push(p);
  }
}
function countExcluded(dir, excluded) {
  const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
  const kind = path.basename(dir).toLowerCase();
  let n = 0;
  (function rec(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) rec(path.join(d, e.name));
      else if (/\.sql$/i.test(e.name)) n++;
    }
  })(dir);
  excluded.byKind[kind] = (excluded.byKind[kind] || 0) + n;
  excluded.total += n;
  excluded.dirs.push(rel + ' (' + n + ')');
}

// ---------------------------------------------------------------- T-SQL literal extraction
function extractLiterals(text) {
  const lits = [];
  const re = /(?<![A-Za-z0-9_])N?'(?=\s*[\[{])/g;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length, s = '';
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === "'") {
        if (text[i + 1] === "'") { s += "'"; i++; } else break;
      } else s += ch;
    }
    lits.push(s);
    re.lastIndex = i + 1;
  }
  return lits;
}

// ---------------------------------------------------------------- field collection
const NON_INPUT = /^(heading|header|divider|separator|alert|info|infobox|html|markdown|label|section|group|tabs|tab|panel|card|row|column|columns|container|paragraph|text-block|textblock|description|note|banner|spacer|button|link|step|wizard|fieldset|accordion|expression-builder-info)$/i;
function str(v) { return typeof v === 'string' ? v : (typeof v === 'number' || typeof v === 'boolean' ? String(v) : ''); }
function optionValues(o) {
  const cfg = o.config || o.options || o.enum || o.values || o.choices;
  let arr = null;
  if (Array.isArray(cfg)) arr = cfg;
  else if (cfg && Array.isArray(cfg.options)) arr = cfg.options;
  else if (Array.isArray(o.enum)) arr = o.enum;
  if (!arr) return [];
  return arr.map(x => (x && typeof x === 'object') ? str(x.value !== undefined ? x.value : x.label) : str(x)).slice(0, 60);
}
function makeField(o, id) {
  const cfg = (o.config && typeof o.config === 'object') ? o.config : {};
  const sub = [o.inputType, cfg.inputType, o.format, cfg.format, o.variant, cfg.variant, o.widget, o['ui:widget'], cfg.type]
    .map(str).filter(Boolean).join(',').toLowerCase();
  const masked = !!(o.masked || o.mask || cfg.masked || cfg.mask || o.writeOnly || o.secret || o.sensitive || cfg.secret || o.isSecret);
  return {
    id: String(id),
    type: str(o.type).toLowerCase() || 'string',
    sub, masked,
    label: str(o.label || o.title),
    placeholder: str(o.placeholder || cfg.placeholder),
    help: str(o.helpText || o.description || o.hint || cfg.helpText),
    def: o.defaultValue !== undefined ? o.defaultValue : (o.default !== undefined ? o.default : (cfg.defaultValue !== undefined ? cfg.defaultValue : undefined)),
    options: optionValues(o),
  };
}
function collectFields(root, out) {
  (function rec(n, isPropsMap) {
    if (Array.isArray(n)) { n.forEach(x => rec(x, false)); return; }
    if (!n || typeof n !== 'object') return;
    if (isPropsMap) {
      for (const k of Object.keys(n)) {
        const v = n[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && (v.type !== undefined || v.title !== undefined || v.description !== undefined || v.format !== undefined)) {
          const f = makeField(v, k);
          if (typeof v.type !== 'string') f.type = 'string';
          out.push(f);
        }
        rec(v, false);
      }
      return;
    }
    const idv = n.id !== undefined ? n.id : (n.name !== undefined ? n.name : n.key);
    if (typeof idv === 'string' && typeof n.type === 'string' && !NON_INPUT.test(n.type)) out.push(makeField(n, idv));
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) rec(v, true);
      else rec(v, false);
    }
  })(root, false);
}
function fallbackFields(text, out) {
  const ids = [...text.matchAll(/"(?:id|name|key)"\s*:\s*"([^"]+)"/g)];
  for (let i = 0; i < ids.length; i++) {
    const start = ids[i].index, end = i + 1 < ids.length ? ids[i + 1].index : Math.min(text.length, start + 800);
    const win = text.slice(start, Math.min(end, start + 800));
    const g = (k) => { const mm = win.match(new RegExp('"' + k + '"\\s*:\\s*"([^"]*)"')); return mm ? mm[1] : ''; };
    const type = g('type');
    if (!type || NON_INPUT.test(type)) continue;
    out.push({ id: ids[i][1], type: type.toLowerCase(), sub: (g('inputType') + ',' + g('format')).toLowerCase(), masked: /"(masked|secret|writeOnly)"\s*:\s*true/.test(win),
      label: g('label') || g('title'), placeholder: g('placeholder'), help: g('helpText') || g('description'), def: (win.match(/"(?:defaultValue|default)"\s*:\s*"([^"]*)"/) || [])[1], options: [] });
  }
}

// ---------------------------------------------------------------- classification
const compact = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const wordsOf = s => String(s || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const BENIGN = new Set(['boolean', 'switch', 'checkbox', 'toggle', 'select', 'radio', 'multiselect', 'multi-select', 'slider', 'date', 'datetime', 'time', 'color', 'number', 'integer', 'enum', 'radiogroup', 'segmented', 'buttongroup']);
const TEXTY = new Set(['text', 'textarea', 'string', 'password', 'code', 'json', 'editor', 'expression', 'sql', 'url', 'uri', 'email', 'rich-text-editor', 'keyvalue', 'key-value', 'object', 'array', 'map', 'file', 'json-editor', 'code-editor', 'sql-editor', 'expression-builder', 'tags', 'kv', 'headers']);
const BLOCKCHAIN_GROUPS = new Set(['Blockchain', 'Ondo']);
const SECRETY_LITERAL = /((?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}|sk_(live|test)_[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abposr]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----|AIza[0-9A-Za-z_-]{30,})/;
const CRED_EMBED = /((password|pwd|pass)=[^;&\s"]+|:\/\/[^\/\s:@"]+:[^\/\s@"]+@|user(name)?\s*:\s*pass(word)?@|<password>|:password@|:pass@)/i;
const SECRET_TEXT_HINT = /\b(password|passwd|secret|api[ _-]?key|access[ _-]?key|private[ _-]?key|bearer|access token|refresh token|bot token|auth token|seed phrase|mnemonic|passphrase)\b/i;

function hit(sev, cat, reason, fix, credType) { return { sev, cat, reason, fix, credType: credType || '' }; }
const CT = {
  BASIC: 'BASIC_AUTH', API: 'API_KEY', BEARER: 'BEARER_TOKEN', OAUTH: 'OAUTH2', CERT: 'CERTIFICATE',
  CONN: 'CONNECTION_STRING (proposed)', PK: 'PRIVATE_KEY (proposed)', MNEMONIC: 'WALLET_MNEMONIC (proposed)', SSH: 'SSH_KEY (proposed)',
  AWS: 'AWS_ACCESS_KEY (proposed)', HMAC: 'SIGNING_SECRET (proposed)', COOKIE: 'SESSION_COOKIE (proposed)', SA: 'SERVICE_ACCOUNT_JSON (proposed)',
  KUBE: 'KUBECONFIG (proposed)', PIN: 'PIN_OR_PASSCODE (proposed)', ENV: 'SECRET_ENV_SET (proposed)', HDR: 'CUSTOM_HEADERS (proposed)',
};

function classify(f, ctx) {
  const hits = [];
  const c = compact(f.id), l = compact(f.label), hay = c + '|' + l;
  const lw = wordsOf(f.label), iw = wordsOf(f.id);
  const t = f.type, isBenign = BENIGN.has(t) && !f.masked && !/password|secret|masked/.test(f.sub);
  const compliant = /credential(id)?$|^credential/.test(c) || /credential/.test(t);
  if (compliant) return { compliant: true, hits };
  const pt = (f.placeholder + ' ' + f.help);
  const valueRule = (sev, cat, reason, fix, cred) => {
    if (isBenign) hits.push(hit('REVIEW', cat, 'name matches but control is ' + t + ' (not a free-value input): ' + reason, 'confirm no secret is stored in this control', cred));
    else hits.push(hit(sev, cat, reason, fix, cred));
  };
  // control-type based
  if (t === 'password' || t === 'secret' || t === 'masked' || t === 'secure-text' || t === 'secret-text' || /(password|secret|masked|protected)/.test(f.sub) || f.masked) {
    hits.push(hit('CRITICAL', 'password-control', 'control type/format is password/secret/masked (' + (f.masked && !/password|secret|masked/.test(t + f.sub) ? 'masked flag' : (t + ' ' + f.sub).trim()) + ')', 'remove field; require credentialID picker', ''));
  }
  // password
  if (/passw(or)?d|passwd|pwd|passphrase|passcode/.test(hay) && !/(reset|forgot|change|policy|length|complexity|strength|expir)/.test(hay)) valueRule('CRITICAL', 'password', 'collects a password/passphrase value', 'remove field; use credential type BASIC_AUTH (username+password)', CT.BASIC);
  // secret
  if (/secret/.test(hay)) {
    if (/(secretname|secretref|secretid|secretarn|secretpath|secretmanager|secretsmanager|secretengine|secretversion|secretlength|secretstore|secretkeyref|secretsfrom)/.test(hay)) hits.push(hit('MEDIUM', 'secret-reference', 'reference to a secret (name/path/arn), not the value itself', 'confirm it is only a reference; prefer a credential picker', ''));
    else valueRule('CRITICAL', 'secret', 'collects a secret value (client secret / secret key / signing secret)', /webhook|signing/.test(hay) ? 'remove; use credential type SIGNING_SECRET (proposed)' : (/client|oauth/.test(hay) ? 'remove; use credential type OAUTH2' : 'remove; use credential type API_KEY'), /webhook|signing/.test(hay) ? CT.HMAC : (/client|oauth/.test(hay) ? CT.OAUTH : CT.API));
  }
  // indirect: vault/connection key NAME instead of a credential
  if (/(vaultkey|connectionstringkey|connectionkey|secretkeyname|passwordkey|tokenkey)$/.test(c)) {
    hits.push(hit('HIGH', 'secret-key-reference', 'names a secret-store / config key that holds the secret (indirect); not a credentialID', 'replace with credentialID picker so the secret is resolved from the credential vault', /connection/.test(c) ? CT.CONN : CT.API));
    return { compliant: false, hits };
  }
  // api / access / license keys
  if (/apikey|xapikey|apisecret|subscriptionkey|accountkey|sharedkey|sharedaccesskey|accesskey(?!id)|secretkey|secretaccesskey|masterkey|encryptionkey|licen[sc]ekey|authkey|signingkey|signaturekey|hmac|clientkey|appkey|sastoken|connectionkey|activationkey|adminkey|integrationkey|webhookkey|apitoken/.test(hay)) {
    const cred = /hmac|signing|signature/.test(hay) ? CT.HMAC : (/accesskey|secretaccesskey/.test(hay) ? CT.AWS : CT.API);
    valueRule('CRITICAL', 'api-key', 'collects an API/access/signing/license key value', 'remove field; use credential type ' + cred, cred);
  }
  if (/accesskeyid/.test(hay)) valueRule('HIGH', 'access-key-id', 'access key ID (half of an access key pair)', 'move with its secret half into credential type AWS_ACCESS_KEY (proposed)', CT.AWS);
  // private key / mnemonic
  if (/privatekey|sshkey|walletkey|keypair|secretkeybase|signerkey|deployerkey|privkey|privatekeyhex|sshprivate/.test(hay)) valueRule('CRITICAL', 'private-key', 'collects a private key', 'remove field; use credential type ' + (/ssh/.test(hay) ? CT.SSH : CT.PK), /ssh/.test(hay) ? CT.SSH : CT.PK);
  if (/mnemonic|seedphrase|recoveryphrase|seedwords|secretphrase|walletphrase|keyphrase/.test(hay)) valueRule('CRITICAL', 'mnemonic', 'collects a mnemonic / seed phrase', 'remove field; use credential type WALLET_MNEMONIC (proposed)', CT.MNEMONIC);
  // certificates / key files / service-account json / kubeconfig
  if (/kubeconfig/.test(hay) && !/(path|file)/.test(hay)) valueRule('CRITICAL', 'kubeconfig', 'kubeconfig content (contains tokens/certs)', 'remove; use credential type KUBECONFIG (proposed)', CT.KUBE);
  else if (/(privatekeypath|keyfilepath|keyfile|certpath|certificatepath|pempath|kubeconfigpath|credentialsfile|credentialspath|serviceaccountfile|keypath|pfxpath|p12path)/.test(hay)) valueRule('HIGH', 'key-file-path', 'points at a key/cert/credential file on the server', 'remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed)', CT.CERT);
  else if (/(certificate|pem|pfx|p12|keystore|cacert|clientcert|serviceaccountjson|serviceaccountkey|credentialsjson|googlecredentials|serviceaccount)/.test(hay) && !/(certificateid|certificatetype|certificatename|validate|verify|certificatearn|certificatevalidation|certificateurl|certificatestore|certificatesource|certificatethumb|certificatepolicy|certificateauthorityid)/.test(hay)) {
    if (TEXTY.has(t) || t === 'textarea') valueRule(/serviceaccount|credentials/.test(hay) ? 'CRITICAL' : 'CRITICAL', 'certificate-key-material', 'collects certificate / PEM / PFX / service-account key material', /serviceaccount|credentials/.test(hay) ? 'remove; use credential type SERVICE_ACCOUNT_JSON (proposed)' : 'remove; use credential type CERTIFICATE', /serviceaccount|credentials/.test(hay) ? CT.SA : CT.CERT);
  }
  // tokens
  const tokenNeg = /(max|min|total|prompt|completion|input|output|context|usage|budget|reserved|stop|logit|bad|sampling|new|response)tokens?|token(count|limit|usage|budget|address|symbol|decimals?|contract|amount|uri|url|endpoint|expir|type|ttl|lifetime|id|in|out|standard|name|price|list|metadata|balance|transfer|supply|pair|pool|mint|swap|burn|chunk|size|estimate|counter|window|penalty|ids|index|offset|a|b|0|1|filter|meta|bucket|limits)|tokenizer|tokenization|numtokens|nctx/;
  if (/token|bearer|jwt/.test(hay) && !tokenNeg.test(hay)) {
    const strong = /(access|refresh|auth|bot|bearer|api|session|idtoken|personal|oauth|csrf|verification|webhook|security|jwt|sas|service|user|app|channel|installation|secret|private|pat)token|bearer|jwt/.test(hay);
    const bareToken = /^token(\||$)|^token$/.test(hay) || /\|token$/.test(hay);
    if (strong || bareToken) {
      const bcCtx = BLOCKCHAIN_GROUPS.has(ctx.group) && !strong;
      if (bcCtx && !/(auth|bearer|access|api|secret|bot|jwt)/i.test(pt)) hits.push(hit('AMBIGUOUS', 'token', 'field "token" in a blockchain node - probably an asset token address/symbol, not an auth token', 'decide: if asset selector keep, if auth token move to credential', CT.BEARER));
      else valueRule('CRITICAL', 'token', 'collects an auth/access/bot/bearer token value', 'remove field; use credential type ' + (/oauth|refresh|access/.test(hay) ? 'OAUTH2 or BEARER_TOKEN' : 'BEARER_TOKEN'), /oauth|refresh/.test(hay) ? CT.OAUTH : CT.BEARER);
    }
  }
  // authorization header value
  if (/authorization|authheader|authorisation/.test(hay) && !/(authorizationurl|authorizationtype|authorizationmethod|authorizationcode|authorizationendpoint|authorizationscope|authorizationmode|authorizationgrant|authorizationstatus|authorizationpolicy|authorizationrule|authorizationtype|authorizationlevel)/.test(hay)) valueRule('CRITICAL', 'authorization-header', 'authorization header value supplied on form', 'remove; use credential type BEARER_TOKEN / API_KEY', CT.BEARER);
  // cookie / session
  if (/cookie|sessionid|sessionkey|csrf|xsrf|sessiontoken/.test(hay) && !/(cookiename|cookiepolicy|cookiedomain|cookiepath|cookiesamesite|cookieexpir)/.test(hay)) valueRule('CRITICAL', 'cookie-session', 'cookie / session value', 'remove; use credential type SESSION_COOKIE (proposed)', CT.COOKIE);
  // pin
  if ((lw.includes('pin') || iw.includes('pin') || /pincode|securitypin/.test(hay)) && iw.length <= 3 && !iw.concat(lw).some(w => /^(name|type|status|hash|cid|file|json|list|pinned|service|remote|options|ipfs|count|policy|replication)$/.test(w))) valueRule('CRITICAL', 'pin', 'PIN value', 'remove; use credential type PIN_OR_PASSCODE (proposed)', CT.PIN);
  // connection strings
  if (/connectionstring|connstr|connectionuri|(^|\|)dsn|databaseurl|dburl|mongouri|mongodburi|redisurl|amqpurl|brokerurl|jdbc|connectionurl|connurl|(^|\|)conn(ection)?$/.test(hay)) {
    if (CRED_EMBED.test(pt + ' ' + str(f.def))) hits.push(hit('CRITICAL', 'connection-string', 'connection string whose placeholder/help/default embeds credentials (Password=/user:pass@)', 'remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH', CT.CONN));
    else hits.push(hit('HIGH', 'connection-string', 'connection string / URI field - can embed user:password', 'accept host/port/db only and take user+password from a credentialID (BASIC_AUTH)', CT.CONN));
  }
  // placeholder/default embedding creds in any text field
  if (!hits.some(h => h.cat === 'connection-string') && TEXTY.has(t) && CRED_EMBED.test(f.placeholder + ' ' + str(f.def))) hits.push(hit('CRITICAL', 'embedded-credentials', 'placeholder/default shows credentials embedded in a value (user:pass@ or Password=)', 'remove or forbid userinfo; use credentialID', CT.BASIC));
  // secret-hint in placeholder/help only
  if (!hits.length && TEXTY.has(t) && t !== 'url' && !/(type|method|mode|name|id|path|mount|namespace|data|properties|derivation|status|kind|scheme|label|prefix)$/.test(c) && SECRET_TEXT_HINT.test(pt) && !/tokens\b/i.test(pt) && !/(credential|do not|don't|never|instead|reference|picker|vault)/i.test(pt)) hits.push(hit('HIGH', 'secret-hint-text', 'placeholder/help text suggests a secret is typed here', 'review; likely remove and require credentialID', ''));
  // inline credentials object
  if (/^(credentials?|creds|auth|authentication|authdata|authconfig|authjson|authparams|authparameters|customauth)(\||$)|\|(credentials?|creds)$/.test(hay) && TEXTY.has(t) && t !== 'text-select') hits.push(hit('HIGH', 'inline-credentials', 'free-form auth/credentials object on the form', 'remove; require credentialID', CT.API));
  // headers / custom body
  if (/^(headers|customheaders|requestheaders|httpheaders|extraheaders|additionalheaders|headerparams|headerparameters|headersjson|authheaders|header)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'headers', 'free-form HTTP headers (can carry Authorization / X-Api-Key)', 'strip auth headers server-side; supply auth via credentialID; allow-list header names', CT.HDR));
  if (/^(custombody|rawbody)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'custom-body', 'free-form request body (may carry tokens/secrets)', 'keep but forbid secrets; use expression/credential references', ''));
  // env maps
  if (/^(env|envvars|envvariables|environmentvariables|envvar|extraenv|dockerenv|containerenv|envfile|dotenv|environment|envs)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'env-map', 'environment-variable map (values often hold secrets)', 'split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed)', CT.ENV));
  // base64 key material
  if (/(base64|b64)/.test(hay) && /(cert|key|pfx|pem|credential|secret)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'base64-keymaterial', 'base64 encoded key/cert material', 'remove; use CERTIFICATE credential', CT.CERT));

  // ---- MEDIUM ----
  const url = t === 'url' || t === 'uri' || /(url|uri|endpoint|hostname|host|server|proxy|webhook|domain|baseurl|apiurl|serveraddress|remoteaddress)$/.test(c) || /(url|endpoint|hostname|host|server|proxy|domain)$/.test(l);
  if (url && !isBenign && !hits.some(h => h.cat === 'connection-string')) {
    if (/https?:\/\/[^\/\s:@"]+:[^\/\s@"]+@|user:pass@|:\/\/[^\/\s]*@/i.test(f.placeholder + ' ' + f.help + ' ' + str(f.def))) hits.push(hit('HIGH', 'url-userinfo', 'URL field whose placeholder/help shows userinfo (user:pass@host)', 'reject userinfo in URL; take credentials from credentialID', CT.BASIC));
    else hits.push(hit('MEDIUM', 'ssrf-url-host', 'arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@)', 'validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible', ''));
  }
  if (/^(query|sql|sqlquery|rawsql|statement|sqlstatement|customquery|whereclause|where|orderby|rawquery|commandtext|querytext|selectquery|updatequery|insertquery|deletequery|customsql|filter)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'raw-query', 'raw query/SQL/filter text (injection risk)', 'use parameterized values; restrict to SELECT; server-side validation', ''));
  if (/^(code|script|scriptbody|jscode|javascript|pythoncode|python|functionbody|functioncode|sourcecode|snippet|shellscript|bashscript|command|cmd|commandline|shellcommand|args|arguments|entrypoint|dockerfile|initscript|userdata|startupscript|handler|lambdacode|customcode)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'code-exec', 'script/code/shell command input (code execution)', 'sandbox/trusted-execution only; allow-list commands; never run on host', ''));
  if (/^(expression|expressions|customexpression|condition|conditions)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'expression', 'expression field (server-side evaluation)', 'evaluate in sandboxed engine with no I/O', ''));
  if (/(filepath|dirpath|directory|folderpath|localpath|outputpath|inputpath|sourcepath|destinationpath|destpath|workingdirectory|workdir|filename|savepath|downloadpath|uploadpath|mountpath|hostpath|(^|\|)path$|\|path)/.test(hay) && !/(jsonpath|xpath|propertypath|fieldpath|datapath|objectpath|urlpath|apipath|resourcepath|routepath|selectorpath|keypath|nodepath|expressionpath|parentpath|folderid|fileid)/.test(hay) && !isBenign && !hits.some(h => h.cat === 'key-file-path')) hits.push(hit('MEDIUM', 'file-path', 'file system path input (path traversal / arbitrary file access)', 'constrain to a sandbox root; reject .. and absolute paths', ''));
  if (/(ignore|skip|disable|allow|accept|trustall|bypass)(ssl|tls|cert|certs|certificate|certificates|verification|verify|unauthorized|selfsigned|hostname)|rejectunauthorized|verifyssl|verifytls|verifycert|insecure|trustallcert|sslverify|strictssl|checkcertificate|unsafessl|selfsigned|allowselfsigned/.test(hay)) hits.push(hit('MEDIUM', 'tls-bypass', 'TLS verification bypass / weakening toggle (default: ' + String(f.def) + ')', 'default to verify=true; require admin permission to disable; consider removing', ''));
  if (/(skip|disable|no|bypass|without)(auth|authentication|authorization)|anonymous|allowanonymous|noauth/.test(hay)) hits.push(hit('MEDIUM', 'auth-disabled', 'flag that can disable/bypass authentication', 'remove or default to safe; require admin approval', ''));
  if (/^(auth|authentication|authtype|authmethod|authmode)(\||$)/.test(hay) && f.options.some(o => /^(none|no|anonymous|noauth)$/i.test(o))) hits.push(hit('MEDIUM', 'auth-none-option', 'authentication selector offers "none"', 'default to an authenticated mode; audit use of "none"', ''));
  if (/^(acl|publicread|ispublic|public|publicaccess|makepublic|cannedacl|accesslevel|visibility|sharingscope)(\||$)/.test(hay) && !/(email|user)/.test(hay)) hits.push(hit('MEDIUM', 'public-access', 'public-access / ACL selector (public read/exposure)', 'default private; guard public option with confirmation', ''));
  if (/(policydocument|iampolicy|rolearn|assumerole|(^|\|)permissions$|(^|\|)roles$)/.test(hay)) hits.push(hit('MEDIUM', 'iam-broad', 'IAM / permission selector (over-broad grant risk)', 'restrict to least-privilege presets', ''));
  if (/cors|alloworigin|allowedorigins|(^|\|)origins?$/.test(hay)) hits.push(hit('MEDIUM', 'cors', 'CORS origin setting (wildcard risk)', 'reject "*" with credentials; allow-list', ''));
  if (/followredirect|maxredirect|allowredirect|(^|\|)redirects$/.test(hay)) hits.push(hit('MEDIUM', 'redirects', 'redirect handling (unrestricted redirect / SSRF chaining)', 'cap redirects; re-validate target each hop', ''));
  if ((/(^|\|)(usessl|usetls|secureconnection|secure|ssl|tls|https|starttls|encrypt|encrypted|enablessl|enabletls|sslenabled|tlsenabled)(\||$)/.test(hay)) && BENIGN.has(t) && (f.def === false || f.def === 'false')) hits.push(hit('MEDIUM', 'cleartext-default', 'TLS/SSL toggle defaults to false (cleartext)', 'default to true', ''));
  if (/(^|\|)(protocol|scheme|transport)(\||$)/.test(hay) && f.options.some(o => /^(http|ftp|telnet|ws|smtp|imap|pop3|ldap)$/i.test(o))) hits.push(hit('MEDIUM', 'cleartext-protocol', 'protocol selector offers a cleartext protocol (' + f.options.filter(o => /^(http|ftp|telnet|ws|smtp|imap|pop3|ldap)$/i.test(o)).join('/') + ')', 'default to TLS variant; warn on cleartext', ''));
  if (/(^|\|)(debug|verbose|logsecrets|logrequest|logresponse|logbody|logheaders|tracing|logpayload|dumprequest|debugmode|enabledebug|verboselogging)(\||$)/.test(hay)) hits.push(hit('MEDIUM', 'debug-log', 'debug/verbose logging toggle (may log secrets/payloads)', 'ensure secrets are redacted; default off', ''));
  if (/trustedexecution/.test(hay)) hits.push(hit('MEDIUM', 'trusted-exec', 'trusted-execution-environment toggle (default: ' + String(f.def) + ')', 'default to enabled; lock for non-admins', ''));
  return { compliant: false, hits };
}

// ---------------------------------------------------------------- misc helpers
function trunc(v) { const s = String(v); return s.slice(0, 4) + '***'; }
function secretDefaults(text, fields) {
  const found = [];
  const m = text.match(new RegExp(SECRETY_LITERAL.source, 'g'));
  if (m) m.forEach(x => found.push('pattern ' + trunc(x)));
  for (const f of fields) {
    const d = f.def;
    if (typeof d !== 'string' || d.length < 16) continue;
    const c = compact(f.id + f.label);
    if (!/(password|secret|apikey|token|privatekey|mnemonic|passphrase|signingkey|accesskey|bearer|authorization|cookie|hmac|licensekey)/.test(c)) continue;
    if (/\s|\{\{|\$\{|^https?:|^\$|^<|^\*+$/.test(d)) continue;
    found.push('field ' + f.id + ' default ' + trunc(d));
  }
  return found;
}
function sqlcmd(query, outFile) {
  execFileSync('sqlcmd', ['-S', SQL_SERVER, '-d', SQL_DB, '-E', '-C', '-b', '-y', '0', '-f', '65001', '-Q', 'SET NOCOUNT ON; ' + query, '-o', outFile], { stdio: 'pipe', maxBuffer: 1 << 28 });
  return fs.readFileSync(outFile, 'utf8').replace(/^\uFEFF/, '');
}
function dbRows(name, expr, from) {
  const tmp = path.join(os.tmpdir(), 'formaudit_' + name + '.txt');
  const raw = sqlcmd("SELECT 'ROW~|~'+X FROM (SELECT " + expr + " " + from + ") T(X)", tmp);
  return raw.split(/\r?\n/).filter(l => l.startsWith('ROW~|~')).map(l => l.slice(6).split('~|~'));
}
const REPL = e => "REPLACE(REPLACE(ISNULL(" + e + ",''),CHAR(13),' '),CHAR(10),' ')";
function tryJson(s) { try { return JSON.parse(s); } catch (e) { return undefined; } }

// ---------------------------------------------------------------- main
function main() {
  const excluded = { total: 0, byKind: {}, dirs: [] };
  const files = [];
  walk(ROOT, files, excluded);
  const isTemplateScript = p => /(^|[\\/])00_DataTemplates[\\/]/.test(p) || /Sync_DataTemplates|Template_DataTemplates/.test(path.basename(p));

  // live DB
  let dbForms = [], peRows = [], palRows = [], credTypes = [], dbOk = true, dbErr = '';
  try {
    dbForms = dbRows('forms', "CAST(FormID AS varchar)+'~|~'+ISNULL(FormCode,'')+'~|~'+ISNULL(PrimaryUsage,'')+'~|~'+ISNULL(Name,'')+'~|~'+" + REPL('CAST([Schema] AS nvarchar(max))') + "+'~|~'+" + REPL("ISNULL(CAST(SampleData AS nvarchar(max)),'')+' '+ISNULL(CAST(InitialData AS nvarchar(max)),'')"), 'FROM Atlas_Forms WHERE Deleted=0');
    peRows = dbRows('pe', "CAST(ProcessElementTypeID AS varchar)+'~|~'+ISNULL(Code,'')+'~|~'+ISNULL(Name,'')+'~|~'+" + REPL('CAST(ConfigurationSchema AS nvarchar(max))'), 'FROM Process_ProcessElementTypes WHERE ConfigurationSchema IS NOT NULL');
    palRows = dbRows('pal', "CAST(DataTemplateID AS varchar)+'~|~'+ISNULL(TemplateName,'')+'~|~'+" + REPL('CAST(ContentData AS nvarchar(max))'), 'FROM Template_DataTemplates WHERE ContentData IS NOT NULL');
    credTypes = dbRows('ct', "Code+'~|~'+Name+'~|~'+ISNULL(Description,'')", 'FROM AIExt_CredentialTypes WHERE Deleted=0');
  } catch (e) { dbOk = false; dbErr = String(e.message).slice(0, 200); }
  const dbById = new Map(dbForms.map(r => [r[0], { formID: r[0], code: r[1], usage: r[2], name: r[3], schema: r[4], data: r[5] }]));
  const dbByCode = new Map(dbForms.map(r => [r[1], r[0]]));

  const stats = { scriptsTotal: files.length, formScripts: 0, nonFormScripts: 0, templateScripts: 0, literalsParsed: 0, formsParsed: 0, fieldsInspected: 0, fallbackFiles: [], noSchemaFiles: [], compliantFields: 0 };
  const units = new Map(); // key formKey -> {group,node,formID,formCode,usage,fields[],files[]}
  const secretDefaultFindings = [];
  const scriptFormIDs = new Set();

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (isTemplateScript(rel)) { stats.templateScripts++; continue; }
    let text;
    try { text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); } catch (e) { text = fs.readFileSync(file, 'latin1'); }
    if (!/Atlas_Forms/i.test(text)) { stats.nonFormScripts++; continue; }
    stats.formScripts++;
    const parts = rel.split('/');
    const group = parts[0];
    const formsIdx = parts.findIndex(p => /^forms$/i.test(p));
    let nodeParts = formsIdx > 1 ? parts.slice(1, formsIdx) : parts.slice(1, -1);
    const node = nodeParts.length ? nodeParts.join('/') : '(group-level sync script)';
    let formID = (text.match(/FormID:\s*(\d+)/i) || path.basename(file).match(/Atlas_Forms_(\d+)_/i) || text.match(/FormID\s*=\s*(\d+)/i) || [])[1] || '';
    let formCode = (text.match(/FormCode:\s*([A-Za-z0-9_\-]+)/i) || text.match(/FormCode\s*=\s*N?'([^']+)'/i) || [])[1] || '';
    if (!formID && formCode && dbByCode.has(formCode)) formID = dbByCode.get(formCode);
    const key = formID ? 'F' + formID : 'file:' + rel;
    const lits = extractLiterals(text);
    const fields = [];
    let parsed = 0, fell = false;
    for (const lit of lits) {
      const j = tryJson(lit);
      if (j !== undefined) { parsed++; stats.literalsParsed++; collectFields(j, fields); }
      else if (/"(id|name|key)"\s*:/.test(lit) && /"type"\s*:/.test(lit)) { fell = true; fallbackFields(lit, fields); }
    }
    if (!lits.length && /"controls"|"properties"/.test(text)) { fell = true; fallbackFields(text, fields); }
    if (fell) stats.fallbackFiles.push(rel);
    if (!fields.length) stats.noSchemaFiles.push(rel);
    let u = units.get(key);
    if (!u) { u = { key, group, node, formID, formCode, usage: '', fields: new Map(), files: [] }; units.set(key, u); }
    if (!u.formCode && formCode) u.formCode = formCode;
    u.files.push(rel);
    for (const f of fields) if (!u.fields.has(f.id)) u.fields.set(f.id, Object.assign({ from: 'script' }, f));
    if (formID) scriptFormIDs.add(formID);
    const sd = secretDefaults(text, fields);
    if (sd.length) secretDefaultFindings.push({ where: rel, group, node, formID, items: sd });
  }

  // DB forms: merge / add DB-only
  const dbOnly = [];
  let dbDefaultHits = [];
  for (const d of dbById.values()) {
    let u = units.get('F' + d.formID);
    const j = tryJson(d.schema);
    const fields = [];
    if (j !== undefined) collectFields(j, fields); else if (d.schema) fallbackFields(d.schema, fields);
    if (!u) {
      const g = (d.usage || d.code || 'db-only');
      u = { key: 'F' + d.formID, group: '(db-only)', node: g, formID: d.formID, formCode: d.code, usage: d.usage, fields: new Map(), files: [], dbOnly: true };
      units.set(u.key, u); dbOnly.push(d);
    }
    u.usage = d.usage; if (!u.formCode) u.formCode = d.code; u.inDB = true; u.name = d.name;
    for (const f of fields) if (!u.fields.has(f.id)) u.fields.set(f.id, Object.assign({ from: 'db' }, f));
    const sd = secretDefaults(d.data + ' ' + d.schema, fields);
    if (sd.length) dbDefaultHits.push({ where: 'DB FormID ' + d.formID + ' ' + d.code, group: u.group, node: u.node, formID: d.formID, items: sd });
  }
  const scriptOnly = [...units.values()].filter(u => u.formID && !u.dbOnly && !dbById.has(u.formID));

  // classification
  const exemptFindings = [], findings = [], compliantByNode = new Map(), reviewList = [], perNodeFields = new Map();
  stats.formsParsed = units.size;
  for (const u of units.values()) {
    const nodeKey = u.group + '/' + u.node;
    u.exempt = /credential(editor|viewer)$/i.test(u.formCode || '') || /^credential-(editor|viewer)/i.test(u.usage || '') ? 'credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI)'
      : (/^(ALL_CONTROLS|CONTROL_REF)/i.test(u.formCode || '') || /(sdk testing|control library)/i.test(u.name || '') ? 'control library / SDK test form (not a node form)' : '');
    const ctx = { group: u.group };
    const hasPw = [];
    let uHits = [];
    for (const f of u.fields.values()) {
      stats.fieldsInspected++;
      perNodeFields.set(nodeKey, (perNodeFields.get(nodeKey) || 0) + 1);
      const r = classify(f, ctx);
      if (r.compliant) { stats.compliantFields++; const c = compliantByNode.get(nodeKey) || { fields: 0, forms: new Set() }; c.fields++; c.forms.add(u.formID || u.key); compliantByNode.set(nodeKey, c); continue; }
      for (const h of r.hits) {
        const rec = { group: u.group, node: u.node, formID: u.formID || '?', formCode: u.formCode || '', fieldID: f.id, label: f.label, type: f.type + (f.sub ? ' [' + f.sub + ']' : ''), sev: h.sev, cat: h.cat, reason: h.reason, fix: h.fix, credType: h.credType, src: u.dbOnly ? 'db-only' : (f.from === 'db' ? 'db (script drift)' : 'script'), def: f.def };
        if (h.cat === 'password' || h.cat === 'password-control') hasPw.push(rec);
        uHits.push(rec);
      }
      // sensitive default (report only)
    }
    if (hasPw.length) {
      for (const f of u.fields.values()) {
        if (/^(username|user|userlogin|login|loginname|accountname|adminuser|dbuser|dbusername|smtpuser|smtpusername|serveruser|registryusername)$/.test(compact(f.id)) && BENIGN.has(f.type) === false) {
          uHits.push({ group: u.group, node: u.node, formID: u.formID || '?', formCode: u.formCode || '', fieldID: f.id, label: f.label, type: f.type, sev: 'HIGH', cat: 'username-with-password', reason: 'username collected on the same form as a password', fix: 'move username and password together into credential BASIC_AUTH', credType: CT.BASIC, src: u.dbOnly ? 'db-only' : 'script' });
        }
      }
    }
    // destructive ops without confirm guard (suggestion section)
    const opField = [...u.fields.values()].find(f => /(operation|action|mode|method|command)$/i.test(f.id) && f.options.length);
    if (opField) {
      const bad = opField.options.filter(o => /(delete|drop|truncate|remove|destroy|purge|write|update|create|alter|overwrite|terminate|revoke|transfer|send|execute|exec)/i.test(o));
      const hasConfirm = [...u.fields.values()].some(f => /(confirm|dryrun|approval|requireapproval|safemode|readonly|acknowledge)/i.test(compact(f.id)));
      if (bad.length && !hasConfirm) reviewList.push({ kind: 'unguarded-op', group: u.group, node: u.node, formID: u.formID, formCode: u.formCode, field: opField.id, ops: bad.slice(0, 8).join(', ') });
    }
    // operation-specific forms (one form per operation): destructive verb in FormCode/file name and no guard field
    if (!u.exempt && /(delete|drop|truncate|purge|destroy|remove|wipe|clear|revoke|terminate)/i.test((u.formCode || '') + ' ' + (u.files[0] || ''))) {
      const guarded = [...u.fields.values()].some(f => /(confirm|dryrun|approval|safemode|readonly|acknowledge)/i.test(compact(f.id)));
      if (!guarded) reviewList.push({ kind: 'unguarded-op', group: u.group, node: u.node, formID: u.formID, formCode: u.formCode, field: '(whole form)', ops: 'destructive operation form, no confirm/dryRun field' });
    }
    // unique dedupe
    const seen = new Set();
    for (const r of uHits) {
      const k = r.formID + '|' + r.fieldID + '|' + r.cat;
      if (seen.has(k)) continue; seen.add(k);
      if (u.exempt) { if (r.sev !== 'REVIEW' && r.sev !== 'AMBIGUOUS') exemptFindings.push(Object.assign({ exempt: u.exempt }, r)); }
      else if (r.sev === 'REVIEW' || r.sev === 'AMBIGUOUS') reviewList.push(Object.assign({ kind: r.sev.toLowerCase() }, r)); else findings.push(r);
    }
  }

  // ---- config schemas + palette
  const cfgFindings = [];
  for (const r of peRows) {
    const [id, code, name, schema] = r;
    const j = tryJson(schema); if (j === undefined) { cfgFindings.push({ src: 'ConfigurationSchema', code, id, note: 'unparseable JSON' }); continue; }
    const fields = [];
    collectFields(j, fields);
    const names = new Set();
    (function keys(n) { if (Array.isArray(n)) n.forEach(keys); else if (n && typeof n === 'object') for (const k of Object.keys(n)) { if (k === 'properties' && n[k] && typeof n[k] === 'object') Object.keys(n[k]).forEach(x => names.add(x)); keys(n[k]); } })(j);
    for (const nm of names) if (!fields.some(f => f.id === nm)) fields.push({ id: nm, type: 'string', sub: '', masked: false, label: '', placeholder: '', help: '', options: [] });
    const seen = new Set();
    for (const f of fields) {
      const res = classify(f, { group: '' });
      for (const h of res.hits) {
        if (h.sev === 'MEDIUM' && !/tls|auth-none|cleartext/.test(h.cat)) continue; // keep the cfg list focused on secrets + TLS/auth
        const k = f.id + h.cat; if (seen.has(k)) continue; seen.add(k);
        cfgFindings.push({ src: 'Process_ProcessElementTypes.ConfigurationSchema', code, id, fieldID: f.id, type: f.type, sev: h.sev, cat: h.cat });
      }
    }
    stats.cfgTypes = (stats.cfgTypes || 0) + 1;
  }
  const palFindings = [], palKeysSeen = new Map();
  for (const r of palRows) {
    const [id, tname, content] = r;
    const j = tryJson(content); if (j === undefined) { palFindings.push({ id, tname, note: 'unparseable ContentData' }); continue; }
    const fields = [];
    collectFields(j, fields);
    const names = new Set();
    (function keys(n, d) { if (d > 12) return; if (Array.isArray(n)) n.forEach(x => keys(x, d + 1)); else if (n && typeof n === 'object') for (const k of Object.keys(n)) { names.add(k); keys(n[k], d + 1); } })(j, 0);
    for (const nm of names) if (!fields.some(f => f.id === nm)) fields.push({ id: nm, type: 'string', sub: '', masked: false, label: '', placeholder: '', help: '', options: [] });
    const seen = new Set();
    for (const f of fields) {
      const res = classify(f, { group: '' });
      for (const h of res.hits) {
        if (!(h.sev === 'CRITICAL' || h.sev === 'HIGH')) continue;
        const k = f.id + h.cat; if (seen.has(k)) continue; seen.add(k);
        palFindings.push({ id, tname, fieldID: f.id, sev: h.sev, cat: h.cat });
      }
    }
    stats.palTemplates = (stats.palTemplates || 0) + 1;
  }

  // merge duplicate hits per (form, field, severity class): one row, reasons joined
  const merged = new Map();
  for (const r of findings) {
    const k = r.formID + '|' + r.fieldID + '|' + (r.sev === 'MEDIUM' ? r.cat : r.sev);
    const m = merged.get(k);
    if (!m) merged.set(k, Object.assign({}, r));
    else { if (!m.reason.includes(r.reason)) m.reason += '; ' + r.reason; if (!m.cat.includes(r.cat)) m.cat += '+' + r.cat; if (!m.credType && r.credType) m.credType = r.credType; if (m.fix !== r.fix && !m.fix.includes(r.fix)) m.fix += ' / ' + r.fix; }
  }
  findings.length = 0; merged.forEach(v => { if (!v.credType && /password-control/.test(v.cat)) v.credType = CT.API; findings.push(v); });
  return { exemptFindings, files, stats, excluded, units, findings, compliantByNode, reviewList, secretDefaultFindings, dbDefaultHits, dbOnly, scriptOnly, dbForms, dbById, cfgFindings, palFindings, credTypes, dbOk, dbErr, perNodeFields, peCount: peRows.length, palCount: palRows.length };
}

// ---------------------------------------------------------------- report
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
const esc = s => String(s === undefined ? '' : s).replace(/\|/g, '/').replace(/\r?\n/g, ' ').replace(/[^\x20-\x7E]/g, '?');
function tbl(headers, rows) { return '| ' + headers.join(' | ') + ' |\n|' + headers.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.map(esc).join(' | ') + ' |').join('\n') + '\n'; }

function buildReport(R) {
  const F = R.findings;
  const by = (arr, fn) => { const m = new Map(); arr.forEach(x => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return m; };
  const sevCount = by(F, x => x.sev);
  const formsWith = sev => new Set(F.filter(x => x.sev === sev).map(x => x.formID)).size;
  const L = [];
  L.push('# Node Config Form Secrets Audit - 2026-09-20\n');
  L.push('Status: READ-ONLY review for Binoy. No form script, code or database row was changed. Secret values are never printed (first 4 chars + `***` at most).\n');
  L.push('Company rule under test: passwords, API keys, tokens, private keys, mnemonics/seed phrases and certificates reach a node ONLY through a credential (credentialID picker); a form must never hold the secret itself.\n');

  // 1 method
  L.push('## 1. Method and scope\n');
  L.push('- Source of truth: every `.sql` under `' + ROOT + '` (excluding folders named obsolete/backup/unapproved/unsorted). JSON form schemas are pulled out of the T-SQL `N\'...\'` literals (`\'\'` undoubled), parsed with `JSON.parse`, then walked recursively; a field is any object with id/name/key + type (controls[] style) or any entry of a `properties` map (JSON-schema style). Non-input widgets (heading, divider, group, ...) are ignored.');
  L.push('- Classification is name/label/placeholder/help/type/default based (regex rules in the appendix script). Numeric/boolean/select controls whose NAME looks sensitive are downgraded to REVIEW (section 7), not counted as findings.');
  L.push('- Live DB cross-check (read-only SELECTs via sqlcmd on `' + SQL_DB + '`): `Atlas_Forms` (' + R.dbForms.length + ' non-deleted forms), `Process_ProcessElementTypes.ConfigurationSchema` (' + R.peCount + ' rows), `Template_DataTemplates.ContentData` (' + R.palCount + ' rows), `AIExt_CredentialTypes`.');
  L.push('- Forms in the DB but with NO script are also scanned from their live schema and flagged `db-only` (they are included in all counts below).' + (R.dbOk ? '' : ' **DB was not reachable: ' + R.dbErr + '**') + '\n');
  L.push(tbl(['Metric', 'Value'], [
    ['.sql files under projects root (all)', R.stats.scriptsTotal + R.excluded.total],
    ['Excluded (obsolete/backup/unapproved/unsorted) - not scanned', R.excluded.total + ' (' + Object.entries(R.excluded.byKind).map(([k, v]) => k + ' ' + v).join(', ') + ')'],
    ['In-scope .sql files', R.stats.scriptsTotal],
    ['  - DataTemplate/palette scripts (covered via DB ContentData, section 6.3)', R.stats.templateScripts],
    ['  - scripts that touch Atlas_Forms (scanned)', R.stats.formScripts],
    ['  - other scripts (no Atlas_Forms)', R.stats.nonFormScripts],
    ['JSON literals parsed cleanly', R.stats.literalsParsed],
    ['Scripts using parse-fallback (regex)', R.stats.fallbackFiles.length],
    ['Scripts where no fields were found (patch/sync scripts)', R.stats.noSchemaFiles.length],
    ['Distinct forms analysed (script FormIDs + DB-only)', R.stats.formsParsed],
    ['Fields / properties inspected', R.stats.fieldsInspected],
    ['Compliant credential-picker fields', R.stats.compliantFields],
    ['Forms in DB (non-deleted)', R.dbForms.length],
    ['DB forms with no script (db-only)', R.dbOnly.length],
    ['Script FormIDs not found in DB', R.scriptOnly.length],
    ['ConfigurationSchema rows scanned', R.peCount],
    ['Palette template ContentData rows scanned', R.palCount],
  ]));
  if (R.stats.fallbackFiles.length) L.push('\nParse-fallback scripts (first 40): ' + R.stats.fallbackFiles.slice(0, 40).map(x => '`' + x + '`').join(', ') + '\n');
  L.push('\nExcluded folders (file counts): ' + R.excluded.dirs.map(x => '`' + x + '`').join(', ') + '\n');

  // 2 summary
  L.push('## 2. Summary counts\n');
  L.push(tbl(['Severity', 'Findings (field hits)', 'Distinct forms affected'], [
    ['CRITICAL', sevCount.get('CRITICAL') || 0, formsWith('CRITICAL')],
    ['HIGH', sevCount.get('HIGH') || 0, formsWith('HIGH')],
    ['MEDIUM', sevCount.get('MEDIUM') || 0, formsWith('MEDIUM')],
    ['REVIEW / AMBIGUOUS (need decision, section 7)', R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous').length, ''],
  ]));
  const catMap = new Map(); F.forEach(x => x.cat.split('+').forEach(c => { const k = x.sev + ' / ' + c; catMap.set(k, (catMap.get(k) || 0) + 1); }));
  const cats = [...catMap.entries()].sort();
  L.push('\nBy category:\n');
  L.push(tbl(['Severity / category', 'Count'], cats));
  const grp = new Map();
  F.forEach(x => { const g = grp.get(x.group) || { CRITICAL: 0, HIGH: 0, MEDIUM: 0 }; g[x.sev]++; grp.set(x.group, g); });
  L.push('\nBy node group:\n');
  L.push(tbl(['Group', 'CRITICAL', 'HIGH', 'MEDIUM'], [...grp.entries()].sort((a, b) => (b[1].CRITICAL - a[1].CRITICAL) || (b[1].HIGH - a[1].HIGH)).map(([g, v]) => [g, v.CRITICAL, v.HIGH, v.MEDIUM])));

  // 3 main table
  L.push('\n## 3. Findings\n');
  const cr = F.filter(x => x.sev === 'CRITICAL' || x.sev === 'HIGH').sort((a, b) => (SEV_ORDER[a.sev] - SEV_ORDER[b.sev]) || (a.group + a.node).localeCompare(b.group + b.node) || (Number(a.formID) - Number(b.formID)) || a.fieldID.localeCompare(b.fieldID));
  L.push('### 3.1 CRITICAL and HIGH (every field listed)\n');
  L.push('Sorted by severity then node. `Src`: script = found in a repo script (also in DB unless noted in section 1), db-only = form has no script.\n');
  L.push(tbl(['Severity', 'Group/Node', 'FormID', 'FormCode', 'Field ID', 'Label', 'Control type', 'Reason', 'Suggested fix', 'Src'], cr.map(x => [x.sev, x.group + '/' + x.node, x.formID, x.formCode, x.fieldID, x.label, x.type, x.reason, x.fix, x.src])));
  L.push('\n### 3.2 MEDIUM (security-threat surface, aggregated per node and category)\n');
  const med = new Map();
  F.filter(x => x.sev === 'MEDIUM').forEach(x => { const k = x.group + '/' + x.node + '||' + x.cat; const m = med.get(k) || { x, forms: new Set(), fields: new Set() }; m.forms.add(x.formID); m.fields.add(x.fieldID); med.set(k, m); });
  const medRows = [...med.values()].sort((a, b) => (a.x.cat.localeCompare(b.x.cat)) || (a.x.group + a.x.node).localeCompare(b.x.group + b.x.node));
  L.push(tbl(['Category', 'Group/Node', 'Forms (FormIDs)', 'Field IDs', 'Reason', 'Suggested fix'], medRows.map(m => [m.x.cat, m.x.group + '/' + m.x.node, [...m.forms].slice(0, 12).join(', ') + (m.forms.size > 12 ? ' (+' + (m.forms.size - 12) + ')' : ''), [...m.fields].slice(0, 10).join(', ') + (m.fields.size > 10 ? ' (+' + (m.fields.size - 10) + ')' : ''), m.x.reason, m.x.fix])));

  // secret-looking defaults
  L.push('\n### 3.3 Secret-looking defaults / sample data (values NOT shown)\n');
  const sdAll = R.secretDefaultFindings.concat(R.dbDefaultHits);
  if (!sdAll.length) L.push('None found by the pattern rules (sk-, ghp_, AKIA, xox*, JWT eyJ, PEM blocks, long random defaults on secret-named fields).\n');
  else L.push(tbl(['Where', 'Group/Node', 'FormID', 'Hits (truncated)'], sdAll.map(x => [x.where, x.group + '/' + x.node, x.formID, x.items.join('; ')])));

  L.push('\n### 3.4 Excluded from counts: credential editor/viewer and control-library forms\n');
  L.push('These forms legitimately contain secret inputs (they are the credential vault UI) or are UI-control test forms. Listed for completeness; NOT counted above and NOT proposed for removal (Binoy to confirm).\n');
  const ex = new Map(); R.exemptFindings.forEach(x => { const k = x.formID + '|' + x.formCode; const m = ex.get(k) || { x, fields: new Set() }; m.fields.add(x.fieldID + ':' + x.sev); ex.set(k, m); });
  L.push(tbl(['FormID', 'FormCode', 'Why excluded', 'Flagged fields'], [...ex.values()].map(m => [m.x.formID, m.x.formCode, m.x.exempt, [...m.fields].slice(0, 14).join(', ')])));
  L.push('\n### 3.5 DB forms with no script (db-only) and script FormIDs missing from the DB\n');
  L.push('db-only forms (' + R.dbOnly.length + '): ' + R.dbOnly.map(d => d.formID + ' ' + d.code).slice(0, 140).join('; ') + (R.dbOnly.length > 140 ? ' ...' : '') + '\n');
  L.push('\nScript FormIDs not present in the DB (' + R.scriptOnly.length + '): ' + R.scriptOnly.map(u => u.formID + ' ' + (u.formCode || '') + ' [' + u.files[0] + ']').slice(0, 60).join('; ') + '\n');

  // 4 compliant
  L.push('\n## 4. Compliant pattern: credential picker fields\n');
  const nodesAll = new Set([...R.perNodeFields.keys()]);
  const critNodes = new Map();
  F.filter(x => x.sev === 'CRITICAL' || x.sev === 'HIGH').forEach(x => { const k = x.group + '/' + x.node; const m = critNodes.get(k) || { c: 0, h: 0, cred: new Set(), forms: new Set() }; if (x.sev === 'CRITICAL') m.c++; else m.h++; if (x.credType) m.cred.add(x.credType); m.forms.add(x.formID); critNodes.set(k, m); });
  L.push('Total compliant credential fields (credentialID / credential picker): **' + R.stats.compliantFields + '** across **' + R.compliantByNode.size + '** nodes (of ' + nodesAll.size + ' nodes/groups with forms).\n');
  L.push(tbl(['Group/Node', 'Credential fields', 'Forms with picker'], [...R.compliantByNode.entries()].sort((a, b) => b[1].fields - a[1].fields).map(([k, v]) => [k, v.fields, v.forms.size])));
  const needCred = [...critNodes.entries()].filter(([k]) => !R.compliantByNode.has(k));
  L.push('\n### 4.1 Nodes with CRITICAL/HIGH fields and NO credential picker yet (need a credential type wired in)\n');
  L.push(tbl(['Group/Node', 'CRITICAL', 'HIGH', 'Forms', 'Credential type(s) to use'], needCred.sort((a, b) => b[1].c - a[1].c).map(([k, v]) => [k, v.c, v.h, v.forms.size, [...v.cred].join(', ')])));
  const partial = [...critNodes.entries()].filter(([k]) => R.compliantByNode.has(k));
  L.push('\n### 4.2 Nodes that already have a credential picker but STILL have secret/credential-like fields on some form\n');
  L.push(tbl(['Group/Node', 'CRITICAL', 'HIGH', 'Forms', 'Credential fields already present'], partial.sort((a, b) => b[1].c - a[1].c).map(([k, v]) => [k, v.c, v.h, v.forms.size, R.compliantByNode.get(k).fields])));

  // 5 suggestions
  L.push('\n## 5. Suggested additional security-threat fields (recommendations, no rule matched as a secret)\n');
  const un = R.reviewList.filter(x => x.kind === 'unguarded-op');
  L.push('### 5.1 Write/delete/DDL style operations with no confirmation / dry-run guard field on the same form\n');
  L.push(un.length ? tbl(['Group/Node', 'FormID', 'FormCode', 'Operation field', 'Risky options'], un.map(x => [x.group + '/' + x.node, x.formID, x.formCode, x.field, x.ops])) : 'None.\n');
  L.push('\n### 5.2 Recommended new guard fields / server-side controls\n');
  [
    '`confirmDestructive` (boolean, default false) on every node operation that deletes, drops, truncates, overwrites or transfers value; block execution unless true or an approval node precedes it.',
    '`dryRun` / `readOnly` (boolean) on database, storage, IaaS and Kubernetes nodes.',
    '`allowedHosts` / egress allow-list (or tenant-level policy) for every arbitrary URL/host field; always resolve and block loopback, link-local (169.254.x.x), RFC1918 unless an admin enables it.',
    '`maxResponseBytes`, `timeoutSeconds`, `maxRedirects` on every HTTP-style node.',
    'Raw SQL / query fields: switch to parameterized form (`query` + `parameters[]`) and add `allowWrite` (default false).',
    'Code/script/shell nodes: force `enableTrustedExecutionEnvironment` = true and non-editable for non-admins; add `allowedCommands`.',
    'File-path fields: add `sandboxRoot` and reject `..`, absolute and UNC paths.',
    'Storage nodes: add `acl` default `private`, and require confirmation for public-read.',
    'Webhook trigger nodes: make signature/secret validation mandatory (`requireSignature` true, secret from credential), never optional.',
    'Logging: `redactSecrets` non-optional; remove any user-facing `logRequestBody`/`debug` toggles that could print headers.',
    'Blockchain nodes: `maxTransferAmount` / `allowedRecipients` guards and a mandatory approval step for value-moving operations.',
  ].forEach(x => L.push('- ' + x));

  // 6 plan
  L.push('\n## 6. Proposed remediation plan\n');
  L.push('### 6.1 Existing credential types (AIExt_CredentialTypes, non-deleted)\n');
  const real = R.credTypes.filter(r => !/^Sample Name/.test(r[1]));
  L.push(tbl(['Code', 'Name', 'Description'], real.map(r => [r[0], r[1], r[2]])));
  const samples = R.credTypes.length - real.length;
  if (samples) L.push('\n(' + samples + ' additional placeholder rows named "Sample Name ..." with codes such as AIE70948 exist and are test data, not usable types.)\n');
  L.push('\n### 6.2 Field -> credential type mapping\n');
  const m2 = new Map();
  F.filter(x => (x.sev === 'CRITICAL' || x.sev === 'HIGH') && x.credType).forEach(x => { const k = x.cat + '||' + x.credType; const m = m2.get(k) || { cat: x.cat, cred: x.credType, n: 0, nodes: new Set() }; m.n++; m.nodes.add(x.group + '/' + x.node); m2.set(k, m); });
  L.push(tbl(['Field category', 'Credential type', 'Status', 'Fields', 'Nodes'], [...m2.values()].sort((a, b) => b.n - a.n).map(m => [m.cat, m.cred, /proposed/.test(m.cred) ? 'NEW type needed' : 'exists', m.n, m.nodes.size])));
  L.push('\nProposed new types (add to AIExt_CredentialTypes with a FieldsSchema each): ' + [...new Set([...m2.values()].map(m => m.cred).filter(c => /proposed/.test(c)))].join(', ') + '. Alternative: keep to the 5 existing types and add generic `SECRET_VALUE` (single masked value) + `SECRET_FIELDS` (named masked fields) if Binoy prefers fewer types.\n');
  L.push('\n### 6.3 Node config schemas and palette templates (defining config keys)\n');
  const cf = R.cfgFindings.filter(x => x.sev);
  const pf = R.palFindings.filter(x => x.sev);
  L.push('- `Process_ProcessElementTypes.ConfigurationSchema`: ' + R.peCount + ' rows scanned, ' + cf.length + ' sensitive-name property hits in ' + new Set(cf.map(x => x.code)).size + ' node types' + (R.cfgFindings.some(x => x.note) ? ' (' + R.cfgFindings.filter(x => x.note).length + ' unparseable)' : '') + '.');
  L.push('- `Template_DataTemplates.ContentData`: ' + R.palCount + ' rows scanned, ' + pf.length + ' CRITICAL/HIGH key-name hits in ' + new Set(pf.map(x => x.id)).size + ' templates (key names only; template content is not executed).\n');
  L.push('ConfigurationSchema hits:\n');
  L.push(cf.length ? tbl(['Node code', 'ProcessElementTypeID', 'Property', 'Severity', 'Category'], cf.sort((a, b) => a.code.localeCompare(b.code)).map(x => [x.code, x.id, x.fieldID, x.sev, x.cat])) : 'None.\n');
  L.push('\nPalette template hits (grouped):\n');
  const pg = new Map(); pf.forEach(x => { const k = x.tname; const m = pg.get(k) || { id: x.id, keys: new Set() }; m.keys.add(x.fieldID + ' (' + x.sev + ')'); pg.set(k, m); });
  L.push(pf.length ? tbl(['Template', 'DataTemplateID', 'Sensitive keys'], [...pg.entries()].sort().map(([k, v]) => [k, v.id, [...v.keys].slice(0, 12).join(', ')])) : 'None.\n');
  L.push('\n### 6.4 Order of work\n');
  const rank = [...critNodes.entries()].map(([k, v]) => [k, v.c * 3 + v.h]).sort((a, b) => b[1] - a[1]);
  L.push('1. Add the missing credential types to AIExt_CredentialTypes (section 6.2) and confirm the credential picker control can be reused on every node form.');
  L.push('2. Fix nodes in this order (weight = 3 x CRITICAL + HIGH): ' + rank.slice(0, 25).map(([k, w]) => k + ' (' + w + ')').join('; ') + '.');
  L.push('3. Per node: add `credentialID` picker (if the node has none), remove the offending fields from every form of the node (all operations), remove the config keys from ConfigurationSchema, update executors to resolve secrets from the credential only, and add a Sync_ script + DevelopmentHistoryLog entry.');
  L.push('4. Then HIGH items (connection strings, headers, env maps): keep non-secret parts (host/port/db name) and move user/password into credentials.');
  L.push('5. Then MEDIUM items: URL/host validation, TLS-bypass defaults, raw SQL/code guards (section 5).');
  L.push('6. Re-run `scan-form-secrets.js` after each batch; target is zero CRITICAL and zero HIGH (except decisions in section 7).\n');

  // 7 decisions
  L.push('## 7. Needs Binoy decision (ambiguous or downgraded fields)\n');
  const rv = R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous');
  L.push('Fields whose NAME looks sensitive but the control is a toggle/select/number, blockchain fields called "token", and secret references (names/paths/ARNs rather than values):\n');
  L.push(tbl(['Kind', 'Group/Node', 'FormID', 'Field ID', 'Label', 'Type', 'Why'], rv.slice(0, 400).map(x => [x.kind, x.group + '/' + x.node, x.formID, x.fieldID, x.label, x.type, x.reason])));
  if (rv.length > 400) L.push('\n(' + (rv.length - 400) + ' more not shown; re-run the script and inspect `reviewList`.)\n');
  const sr = F.filter(x => x.cat === 'secret-reference');
  L.push('\nOther decisions:\n');
  L.push('- Connection-string fields (HIGH): is a host:port-only connection string acceptable on the form if user/password come from a credential? (Redis forms already use `host:port` patterns.)');
  L.push('- Blockchain `token` / address fields: asset selectors or auth tokens? (see AMBIGUOUS rows above).');
  L.push('- Plain `username` fields: keep on form when the credential holds only the password, or move both into the credential? (Proposal: move both.)');
  L.push('- Free-form headers/custom body: remove entirely, or keep with a server-side strip of Authorization/X-Api-Key?');
  L.push('- Secret references (name/ARN/path): allowed as references, or force a credential picker? (' + sr.length + ' fields)');

  // 8 appendix
  L.push('\n## 8. Appendix: scan script\n');
  L.push('Saved at `C:\\BizFirstGO_FI_AI\\Documentation\\Employees\\agentic-development-engineers\\workflow-development-node-forms\\audit\\scan-form-secrets.js`. Re-run: `node scan-form-secrets.js <reportPath>` (needs Node 20 and sqlcmd on PATH; read-only). Full source follows.\n');
  L.push('```javascript\n' + fs.readFileSync(SELF, 'utf8') + '\n```\n');
  return L.join('\n');
}

const R = main();
const report = buildReport(R).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, report, 'utf8');
const F = R.findings;
const cnt = s => F.filter(x => x.sev === s).length;
const nodeScore = new Map();
F.forEach(x => { if (x.sev === 'MEDIUM') return; const k = x.group + '/' + x.node; const m = nodeScore.get(k) || { c: 0, h: 0 }; if (x.sev === 'CRITICAL') m.c++; else m.h++; nodeScore.set(k, m); });
console.log(JSON.stringify({
  report: REPORT, forms: R.stats.formsParsed, fields: R.stats.fieldsInspected, scripts: R.stats.formScripts, fallback: R.stats.fallbackFiles.length,
  critical: cnt('CRITICAL'), high: cnt('HIGH'), medium: cnt('MEDIUM'), review: R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous').length,
  compliant: R.stats.compliantFields, dbForms: R.dbForms.length, dbOnly: R.dbOnly.length, scriptOnly: R.scriptOnly.length, excluded: R.excluded.total,
  top: [...nodeScore.entries()].sort((a, b) => (b[1].c * 3 + b[1].h) - (a[1].c * 3 + a[1].h)).slice(0, 12).map(([k, v]) => k + ' C' + v.c + ' H' + v.h),
}, null, 1));
