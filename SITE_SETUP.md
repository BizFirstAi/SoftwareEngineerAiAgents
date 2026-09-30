# Hosting Claudia Documentation Online

This guide explains how to host the Claudia documentation on your own website.

## Requirements

1. **Serve plain markdown files** - No JavaScript rendering required
2. **Allow all crawlers** - robots.txt permits all access
3. **No authentication** - All files publicly accessible
4. **Content-Type headers** - Serve .md files as text/plain or text/markdown

## Quick Hosting Options

### Option 1: GitHub Pages (Easiest)

1. Ensure repo is public
2. Go to repo Settings → Pages
3. Select "Deploy from branch" → main branch
4. Files served at: `https://yourusername.github.io/SoftwareEngineerAiAgents/`
5. Markdown files automatically served

```
Example URLs:
https://yourusername.github.io/SoftwareEngineerAiAgents/Claudia/index.md
https://yourusername.github.io/SoftwareEngineerAiAgents/Claudia/AGENTS.md
```

### Option 2: Cloudflare Pages

1. Connect GitHub repo
2. Build settings: Framework = None
3. Deploy
4. Files served at: `https://your-project.pages.dev/`

### Option 3: Vercel

1. Import GitHub repo
2. Framework = Other
3. Deploy
4. Files served at: `https://your-project.vercel.app/`

### Option 4: Self-Hosted (Apache/Nginx)

**Apache (.htaccess)**
```
AddType text/markdown .md
<Files "robots.txt">
    Header set Content-Type "text/plain"
</Files>
```

**Nginx (nginx.conf)**
```
location ~ \.md$ {
    add_header Content-Type text/plain;
}

location = /robots.txt {
    add_header Content-Type text/plain;
}
```

## File Structure After Hosting

Once hosted, the following URLs will work:

```
/README.md                              - Main overview
/Claudia/index.md                      - Complete index
/Claudia/AGENTS.md                     - Agent list
/Claudia/Knowledge/[topic]/[file].md   - Reference docs
/Claudia/Procedure/[topic]/[file].md   - Step-by-step guides
/robots.txt                            - Crawler permissions
/sitemap.txt                           - File listing
```

## For AI Tools

Once hosted, AI tools can:

1. **Fetch index**: GET `/Claudia/index.md`
2. **Read sitemap**: GET `/sitemap.txt`
3. **Fetch individual files**: GET `/Claudia/[path].md`
4. **No authentication required**
5. **No JavaScript needed**

## Content-Type Headers

Ensure your hosting correctly serves these types:

```
.md files  → text/plain or text/markdown
.txt files → text/plain
robots.txt → text/plain
```

## Security Checklist

Before going public:

- [ ] All API keys removed from files
- [ ] No credentials or tokens in content
- [ ] robots.txt exists and allows crawlers
- [ ] sitemap.txt exists and is complete
- [ ] No sensitive internal URLs exposed
- [ ] index.md is comprehensive and accurate

## Testing Access

Once hosted, test with:

```bash
# Fetch index
curl https://your-domain.com/Claudia/index.md

# Fetch specific file
curl https://your-domain.com/Claudia/AGENTS.md

# Check robots.txt
curl https://your-domain.com/robots.txt
```

## Maintenance

To update files:
1. Push changes to GitHub
2. Website automatically updates (most platforms)
3. No rebuilds or deployments needed

## Support

For hosting questions:
- GitHub Pages: https://docs.github.com/en/pages
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Vercel: https://vercel.com/docs
- Nginx: https://nginx.org/en/docs/
