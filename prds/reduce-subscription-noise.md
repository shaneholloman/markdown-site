# Reduce Convex subscription noise in production

## Problem

Production Convex logs show 20+ query evaluations per second, creating noisy logs and unnecessary server work. While most results are `(cached)` (near zero compute), the volume comes from two root causes:

1. **Duplicate subscriptions across components.** Multiple components subscribe to the same Convex queries independently. When any mutation fires (auth token refresh, heartbeat, page view), Convex re-evaluates all active subscriptions in a burst.

2. **Subscriptions that never get skipped.** Layout subscribes to docs queries on every page even when docs are disabled. FeaturedCards fetches `getAllPosts`/`getAllPages` even when using frontmatter mode (the default). Home subscribes to `isCurrentUserAuthenticated` unconditionally even though it is only needed when a `?dashboardNotice=not-admin` query param is present.

## Auth cycling verdict: not a bug

The `auth:signIn` (Action) + `auth:store` (Mutation) pairs appearing every 300ms in logs are **not** a convex-auth bug. This is the normal token refresh cycle from `@robelest/convex-auth`:

- On page load, the browser client calls `hydrateFromStorage()` to load the stored JWT
- Convex calls `fetchAccessToken({ forceRefreshToken: true })` which triggers `auth:signIn` to exchange the refresh token for a new JWT
- The server stores the session via `auth:store`
- Multiple pairs in close succession indicate multiple visitors or tabs, not a loop

The real amplifier is that each `auth:store` mutation invalidates all active subscriptions, triggering a burst of cached re-evaluations. Fewer subscriptions = smaller burst.

## Subscription audit

### Home page (worst case: 11 subscriptions)

| Component | Query | Needed? |
|-----------|-------|---------|
| Layout | `pages.getAllPages` | Yes (nav) |
| Layout | `authAdmin.isCurrentUserDashboardAdmin` | Yes (nav) |
| Layout | `pages.getDocsPages` | Only if docs enabled |
| Layout | `posts.getDocsPosts` | Only if docs enabled |
| Home | `posts.getAllPosts` | Conditional (config) |
| Home | `posts.getFeaturedPosts` | Yes |
| Home | `pages.getFeaturedPages` | Yes |
| Home | `pages.getPageBySlug("home-intro")` | Yes |
| Home | `pages.getPageBySlug("footer")` | Yes |
| Home | `authAdmin.isCurrentUserAuthenticated` | Only if dashboardNotice param |
| FeaturedCards | `posts.getFeaturedPosts` | Duplicate of Home |
| FeaturedCards | `pages.getFeaturedPages` | Duplicate of Home |
| FeaturedCards | `posts.getAllPosts` | Legacy mode only |
| FeaturedCards | `pages.getAllPages` | Legacy mode only |

**After fix: 7 subscriptions on home (down from 11-15)**

## Proposed fixes

### Fix 1: FeaturedCards accepts props instead of re-fetching

FeaturedCards currently always subscribes to `getFeaturedPosts`, `getFeaturedPages`, `getAllPosts`, and `getAllPages`. The frontmatter mode (default) only needs the featured queries, and Home already has those results.

**Change:** Accept optional `featuredPosts` and `featuredPages` props. When provided, skip the `useQuery` calls. Always skip `getAllPosts`/`getAllPages` when in frontmatter mode.

**Files:** `src/components/FeaturedCards.tsx`, `src/pages/Home.tsx`

### Fix 2: Layout skips docs queries when disabled

Layout subscribes to `getDocsPages` and `getDocsPosts` on every route to detect if the current page is in the docs section. When `siteConfig.docsSection?.enabled` is false, these queries are wasted.

**Change:** Use `"skip"` when docs section is disabled.

**Files:** `src/components/Layout.tsx`

### Fix 3: Home skips auth query when not needed

`isCurrentUserAuthenticated` is only used to show/hide the "Sign out" button on the dashboard access notice. That notice only appears when `?dashboardNotice=not-admin` is in the URL.

**Change:** Use `"skip"` when the query param is absent.

**Files:** `src/pages/Home.tsx`

## Verification

1. Open the Convex production dashboard logs
2. Load the home page with a single tab
3. Count the query subscriptions in the burst
4. Confirm reduced from ~11-15 to ~7
5. Confirm no regressions: nav still works, featured cards display, docs detection works

## Edge cases

- **Legacy items mode in FeaturedCards:** Still works because `getAllPosts`/`getAllPages` are only skipped in frontmatter mode. When `items` prop is passed with `useFrontmatter=false`, the queries still fire.
- **Multiple tabs:** Auth refresh still triggers bursts, but each burst is smaller.
- **Docs section toggled on:** Queries activate immediately when config changes.
