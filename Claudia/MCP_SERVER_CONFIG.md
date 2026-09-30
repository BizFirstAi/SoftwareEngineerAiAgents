# MCP Server Configuration

**How to connect the BizFirst MCP server to Claude for building.**

## Server Details

**Host:** `{MCP_SERVER_BASE_URL}/mcp`

**Current Configuration:** `http://40.160.138.67/mcp`

To change the server domain, update `MCP_SERVER_BASE_URL` in this file and all agent files will use the new value.

**Authentication:** Bearer token (your API key)

**Available Studios:**
- App Studio (build web apps)
- Atlas Forms (build data forms)
- Flow Studio (build workflows)
- Credentials (manage secrets)
- Servers (manage infrastructure)
- Documents (store files)
- Knowledge (manage knowledge base)

---

## Setup in Claude

### Step 1: Get API Key

You need a full developer API key with these scopes:

See [`API_KEY_SCOPES.md`](API_KEY_SCOPES.md) for the exact list.

Generate key in Passport Admin Dashboard:
https://dev.grippingly.com/passportadmindashboard/api-keys

### Step 2: Add MCP Server to Claude Settings

In Claude Code or Claude Desktop:

1. **Open Settings**
2. **Navigate to MCP Servers** or **Connectors**
3. **Add Custom Remote Server:**
   - Name: `BizFirst MCP`
   - URL: `http://40.160.138.67/mcp`
   - Authentication Type: `Bearer`
   - API Key: (paste your full key)
4. **Save and restart Claude**

### Step 3: Start New Session

After restarting Claude, start a fresh chat session. The MCP tools will now be available.

---

## Testing Connection

Once connected, any builder agent (AppAgent, FormAgent, WorkflowAgent) will:
1. ✅ Pass the preflight check (tools are available)
2. ✅ Build directly in the studio (no artifacts)
3. ✅ Use real MCP server endpoints

If an agent asks for the MCP server URL, point them to this file.

---

## Reference

- **For agents:** This is the canonical MCP server URL
- **For users:** Your API key connects you to this server
- **For debugging:** Test connectivity to `http://40.160.138.67/mcp` from your network
