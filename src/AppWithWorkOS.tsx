// App auth wrapper for all auth modes.
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { useEffect, useMemo, useState } from "react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import { client as createConvexAuthClient } from "@robelest/convex-auth/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { authMode, isWorkOSConfigured, workosConfig } from "./utils/workos";
import App from "./App";

interface AppWithWorkOSProps {
  convex: ConvexReactClient;
}

// Convex Auth wrapper component that initializes the auth client
// and waits for the initial auth state before rendering children.
function ConvexAuthWrapper({
  convex,
  children,
}: {
  convex: ConvexReactClient;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Create auth client once. This calls convex.setAuth() internally
  // to provide tokens to the Convex client.
  const authClient = useMemo(
    () => createConvexAuthClient({ convex }),
    [convex],
  );

  // Wait for initial auth state to resolve before rendering.
  // This prevents a flash of unauthenticated state on page load.
  useEffect(() => {
    // Check if already loaded
    if (!authClient.state.isLoading) {
      setIsLoading(false);
      return;
    }

    // Subscribe to auth state changes
    const unsubscribe = authClient.onChange((state) => {
      if (!state.isLoading) {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [authClient]);

  // Show nothing while auth is initializing (prevents flash)
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

export default function AppWithWorkOS({ convex }: AppWithWorkOSProps) {
  if (authMode === "convex-auth") {
    return (
      <ConvexProvider client={convex}>
        <ConvexAuthWrapper convex={convex}>
          <App />
        </ConvexAuthWrapper>
      </ConvexProvider>
    );
  }

  if (authMode === "workos" && isWorkOSConfigured) {
    return (
      <AuthKitProvider
        clientId={workosConfig.clientId}
        redirectUri={workosConfig.redirectUri}
      >
        <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithAuthKit>
      </AuthKitProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      {/* No-auth fallback mode for legacy/local development. */}
      <App />
    </ConvexProvider>
  );
}
