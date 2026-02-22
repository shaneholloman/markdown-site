# Convex first: new defaults for markdown.fast

> Self-hosted static files, built-in auth, and one-command deploys. No external services required.

---
Type: post
Date: 2026-02-21
Reading time: 4 min read
Tags: convex, deployment, auth, architecture
---

# Convex first: new defaults for markdown.fast

The markdown.fast framework has a new default architecture. Everything runs on Convex. No Netlify. No WorkOS. One backend for database, auth, and static file hosting.

## What changed

Three defaults flipped:

| Feature | Old default                 | New default           |
| ------- | --------------------------- | --------------------- |
| Hosting | Netlify with edge functions | Convex self-hosting   |
| Auth    | WorkOS AuthKit              | @robelest/convex-auth |
| Media   | ConvexFS with Bunny CDN     | Convex storage        |

The old defaults still work. Set `hosting.mode: "netlify"` and `auth.mode: "workos"` in your config to use them.

## Why this matters

Fewer moving parts. The previous setup required three services: Convex for the database, Netlify for hosting and edge functions, and WorkOS for authentication. Each service had its own dashboard, API keys, and billing.

Now you configure one project in the Convex dashboard. Deploy with one command. Manage users in one place.

## Deploy in three commands

```bash
npx @convex-dev/self-hosting setup
npx convex dev --once
npm run deploy
```

The `setup` command configures your project for static hosting. The `dev --once` command pushes the backend schema. The `deploy` command builds your React app and uploads it to Convex storage.

Your site is live at `your-project.convex.site`. Point a custom domain in the Convex dashboard.

## Auth without external services

The new auth uses `@robelest/convex-auth` with GitHub OAuth. Sessions live in your Convex database. No third-party auth service required.

Set up GitHub OAuth in two steps:

1. Create an OAuth app at github.com/settings/developers
2. Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in Convex env vars

The callback URL is `https://your-project.convex.site/api/auth/callback/github`.

Dashboard admin access works through a bootstrap command. Run it once after setting up OAuth:

```bash
npx convex run authAdmin:bootstrapDashboardAdmin \
  '{"bootstrapKey":"your-secret","email":"you@example.com"}'
```

## What about RSS and sitemap

HTTP endpoints moved from Netlify edge functions to Convex HTTP actions. Same URLs, same output:

- `/rss.xml` and `/rss-full.xml` for RSS feeds
- `/sitemap.xml` for search engines
- `/api/posts` and `/api/post` for JSON API
- `/raw/{slug}.md` for raw markdown

The Netlify edge functions still exist for legacy mode. They proxy requests to Convex when `hosting.mode: "netlify"` is set.

## Legacy mode

Existing sites on Netlify and WorkOS keep working. Set these in `siteConfig.ts`:

```typescript
auth: { mode: "workos" },
hosting: { mode: "netlify" },
```

Or in `fork-config.json`:

```json
{
  "auth": { "mode": "workos" },
  "hosting": { "mode": "netlify" }
}
```

The codebase detects the mode and routes requests accordingly. Both paths are tested in CI.

## Media storage

The default media provider is now `convex`. Images upload directly to Convex storage. Good for most sites.

For high-traffic sites, set `media.provider: "convexfs"` and configure Bunny CDN. The dashboard upload flow adapts automatically.

## Migration path

Existing forks do not need to migrate. The new defaults apply to fresh forks and `npx create-markdown-sync` projects.

To migrate an existing site:

1. Run `npx @convex-dev/self-hosting setup`
2. Set up GitHub OAuth (or keep WorkOS)
3. Update `siteConfig.ts` with new mode settings
4. Run `npm run deploy`

The [deployment docs](/docs-deployment) have the full steps.

## One less service

The pattern here applies beyond this framework. Convex can host your entire app: database, backend functions, file storage, and static assets. When you need auth, add it to the same backend.

External services add complexity. DNS, API keys, environment variables across multiple dashboards. Each service is another thing that can break at 2am.

This release removes two of those things. Ship faster.