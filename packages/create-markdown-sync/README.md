# create-markdown-sync

Create a markdown-sync site with a single command.

## Quick Start

```bash
npx create-markdown-sync my-site
```

This interactive CLI will:

1. Clone the markdown-sync framework
2. Walk through configuration (site name, URL, features, etc.)
3. Install dependencies
4. Set up Convex backend
5. Run initial content sync
6. Open your site in the browser

## Usage

```bash
# Create a new project
npx create-markdown-sync my-blog

# Overwrite existing directory
npx create-markdown-sync my-blog --force

# Skip Convex setup (configure later)
npx create-markdown-sync my-blog --skip-convex

# Don't open browser after setup
npx create-markdown-sync my-blog --skip-open
```

## What You Get

A fully configured markdown-sync site with:

- Real-time content sync via Convex
- Markdown-based blog posts and pages
- Full-text and semantic search
- RSS feeds and sitemap
- AI integrations (Claude, GPT-4, Gemini)
- Newsletter subscriptions (via AgentMail)
- MCP server for AI tool integration
- Dashboard for content management
- Convex self-hosting (default) or Netlify deployment

## Default Architecture

- **Auth**: `@robelest/convex-auth` with GitHub OAuth
- **Hosting**: Convex self-hosting via `@convex-dev/self-hosting`
- **Media**: Direct Convex storage

Legacy options (WorkOS auth, Netlify hosting, ConvexFS/R2 media) are available during setup.

## Requirements

- Node.js 18 or higher
- npm, yarn, pnpm, or bun

## After Setup

```bash
cd my-site
npx convex dev        # Start Convex (required first time)
npm run sync          # Sync content (in another terminal)
npm run dev           # Start dev server at localhost:5173
npm run validate:env  # Check local setup
npm run deploy        # Deploy to Convex self-hosting
npm run verify:deploy # Verify deployed endpoints
```

## Optional Auth Setup

Authentication is deferred by default. To enable dashboard auth:

```bash
npx convex env set AUTH_GITHUB_ID "<github-oauth-app-id>"
npx convex env set AUTH_GITHUB_SECRET "<github-oauth-app-secret>"
npx convex env set DASHBOARD_ADMIN_BOOTSTRAP_KEY "<random-key>"
npx convex run authAdmin:bootstrapDashboardAdmin '{"bootstrapKey":"<key>","email":"you@example.com"}'
```

## Documentation

Full documentation at [markdown.fast/docs](https://www.markdown.fast/docs)

## License

MIT
