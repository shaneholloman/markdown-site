// WorkOS configuration utility
// Checks if WorkOS environment variables are set
import siteConfig from "../config/siteConfig";

const workosClientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const workosRedirectUri = import.meta.env.VITE_WORKOS_REDIRECT_URI;

export type AuthMode = "convex-auth" | "workos" | "none";

// True if both WorkOS client ID and redirect URI are configured
export const hasWorkOSEnvironment = Boolean(workosClientId && workosRedirectUri);

export const authMode: AuthMode = siteConfig.auth?.mode ?? "convex-auth";

// Legacy compatibility export used across the existing codebase.
export const isWorkOSConfigured =
  authMode === "workos" && hasWorkOSEnvironment;

// Export the values for use in AuthKitProvider
export const workosConfig = {
  clientId: workosClientId,
  redirectUri: workosRedirectUri,
};
