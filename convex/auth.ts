import { Auth, Portal } from "@robelest/convex-auth/component";
import password from "@robelest/convex-auth/providers/password";
import { OAuth } from "@robelest/convex-auth/providers";
import { GitHub } from "arctic";
import { components } from "./_generated/api";

// Convex Auth is the default auth path for new deployments.
// We keep WorkOS JWT config in auth.config.ts for legacy compatibility.
const githubClientId = process.env.AUTH_GITHUB_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET;
const oauthBaseUrl =
  process.env.CUSTOM_AUTH_SITE_URL ||
  process.env.CONVEX_SITE_URL ||
  process.env.SITE_URL;

const providers = [
  password(),
  ...(githubClientId && githubClientSecret
    ? [
        OAuth(
          new GitHub(
            githubClientId,
            githubClientSecret,
            oauthBaseUrl ? `${oauthBaseUrl}/api/auth/callback/github` : null,
          ),
          {
          scopes: ["user:email"],
          profile: async (tokens) => {
            const userResponse = await fetch("https://api.github.com/user", {
              headers: { Authorization: `Bearer ${tokens.accessToken()}` },
            });
            const userData = await userResponse.json();

            let email: string | undefined = userData.email ?? undefined;
            if (!email) {
              const emailsResponse = await fetch(
                "https://api.github.com/user/emails",
                {
                  headers: { Authorization: `Bearer ${tokens.accessToken()}` },
                },
              );
              const emailsData = (await emailsResponse.json()) as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
              }>;
              const primaryVerified = emailsData.find(
                (item) => item.primary && item.verified,
              );
              email = primaryVerified?.email;
            }

            return {
              id: String(userData.id),
              email,
              name: userData.name ?? userData.login ?? undefined,
            };
          },
          },
        ),
      ]
    : []),
];

const auth = new Auth(
  components.auth as unknown as ConstructorParameters<typeof Auth>[0],
  {
    providers,
  },
);

export { auth };
export const { signIn, signOut, store } = auth;
export const { portalQuery, portalMutation, portalInternal } = Portal(auth);

