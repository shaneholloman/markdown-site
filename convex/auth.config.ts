// Legacy WorkOS JWT configuration.
// Default auth mode now uses @robelest/convex-auth in convex/auth.ts.
// Keep this file for backwards compatibility when auth.mode === "workos".
const clientId = process.env.WORKOS_CLIENT_ID;
const convexSiteUrl = process.env.CONVEX_SITE_URL;

const authConfig = {
  providers: [
    // Convex Auth JWT provider for @robelest/convex-auth sessions.
    ...(convexSiteUrl
      ? [
          {
            domain: convexSiteUrl,
            applicationID: "convex",
          },
        ]
      : []),
    // Legacy WorkOS JWT providers, enabled only when client ID is configured.
    ...(clientId
      ? [
          {
            type: "customJwt",
            issuer: `https://api.workos.com/`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
            applicationID: clientId,
          },
          {
            type: "customJwt",
            issuer: `https://api.workos.com/user_management/${clientId}`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
          },
        ]
      : []),
  ],
};

export default authConfig;
