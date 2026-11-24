import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Route, Switch, Redirect, Link, useLocation, Router as WouterRouter } from "wouter";
import { Toaster } from "@workspace/jaguar-spk-design-system/components/ui/toaster";
import { TooltipProvider } from "@workspace/jaguar-spk-design-system/components/ui/tooltip";
import { Skeleton } from "@workspace/jaguar-spk-design-system/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";

const Workspace = lazy(() => import("@/pages/workspace"));

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function getClerkAppearance(isDark: boolean) {
  return {
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: isDark ? "#E9EAEC" : "#1F2937",
      colorForeground: isDark ? "#E9EAEC" : "#1F2937",
      colorMutedForeground: isDark ? "#9DA2AB" : "#667085",
      colorDanger: isDark ? "#F97066" : "#B42318",
      colorBackground: isDark ? "#14171C" : "#FFFFFF",
      colorInput: isDark ? "#0B0D10" : "#FFFFFF",
      colorInputForeground: isDark ? "#E9EAEC" : "#1F2937",
      colorNeutral: isDark ? "#E9EAEC" : "#1F2937",
      fontFamily: '"Inter", "Noto Sans Thai", sans-serif',
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: "bg-card text-card-foreground rounded-xl w-full max-w-lg overflow-hidden border border-border",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "font-semibold tracking-tight text-foreground",
      headerSubtitle: "text-muted-foreground",
      socialButtonsBlockButtonText: "font-medium text-foreground",
      formFieldLabel: "font-medium text-foreground",
      footerActionLink: "font-medium text-foreground underline underline-offset-4",
      footerActionText: "text-muted-foreground",
      dividerText: "text-muted-foreground",
      identityPreviewEditButton: "text-foreground",
      formFieldSuccessText: "text-foreground",
      alertText: "text-foreground",
      logoBox: "mx-auto",
      logoImage: "max-h-10 object-contain",
      socialButtonsBlockButton: "border border-border bg-background hover:bg-muted",
      formButtonPrimary: "bg-foreground text-background hover:opacity-90",
      formFieldInput: "border-border bg-background text-foreground",
      footerAction: "text-muted-foreground",
      dividerLine: "bg-border",
      alert: "border border-border bg-muted text-foreground",
      otpCodeFieldInput: "border-border bg-background text-foreground",
      formFieldRow: "gap-2",
      main: "text-foreground",
    },
  };
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/workspace" /></Show>
      <Show when="signed-out"><Welcome /></Show>
    </>
  );
}

function WorkspaceRoute() {
  const { user } = useUser();
  return (
    <>
      <Show when="signed-in">
        <Suspense fallback={<main className="min-h-[100dvh] bg-background p-8" aria-label="Opening your notebook" data-testid="loading-workspace"><Skeleton className="mb-6 h-10 w-56" /><Skeleton className="h-32 w-full rounded-xl" /></main>}>
          <Workspace key={user?.id ?? "signed-in"} />
        </Suspense>
      </Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function SignInPage() {
  return (
    <main className="auth-page min-h-[100dvh] bg-background px-4 py-10 text-foreground">
      <div className="auth-page__intro">
        <Link href="/" className="brand-lockup" data-testid="link-auth-home"><span className="brand-mark" aria-hidden="true"><span /></span><span>stillnote</span></Link>
        <p>A little room to think.</p>
      </div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="auth-page min-h-[100dvh] bg-background px-4 py-10 text-foreground">
      <div className="auth-page__intro">
        <Link href="/" className="brand-lockup" data-testid="link-auth-home"><span className="brand-mark" aria-hidden="true"><span /></span><span>stillnote</span></Link>
        <p>A little room to think.</p>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </main>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        client.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={getClerkAppearance(theme === "dark")}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Your thoughts are right where you left them." } },
        signUp: { start: { title: "Make a little space", subtitle: "Create your private notebook." } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/workspace" component={WorkspaceRoute} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
