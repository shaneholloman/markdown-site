# Agent ready mobile widget update

## Problem

`@waynesutton/agent-ready@0.2.0` added mobile collapse props for the React widget. The app already depends on `^0.2.0`, but the mounted widget does not explicitly opt into or document the new mobile behavior.

## Root cause

The existing `AgentReadyWidget` mount was added before the mobile collapse feature shipped. Package version drift means the dependency supports the behavior, but the host app still reads like the older integration.

## Fix

Update `src/App.tsx` so the widget uses the new mobile collapse props:

- `mobileCollapse={true}`
- `mobileBreakpoint={480}`
- `defaultMobileCollapsed={true}`

This keeps the desktop widget unchanged and makes phones start with a compact tab strip.

## Files to change

- `src/App.tsx`
- `TASK.md`
- `changelog.md`
- `files.md`

## Edge cases

- Desktop behavior should stay unchanged.
- Phones narrower than 480px should show the collapsed mobile widget first.
- Existing URL resolution should stay unchanged so production links keep using `https://www.markdown.fast`.

## Verification

1. Run TypeScript typecheck.
2. Confirm the dependency remains on `@waynesutton/agent-ready@^0.2.0`.
3. Review the widget mount for the new mobile props.
