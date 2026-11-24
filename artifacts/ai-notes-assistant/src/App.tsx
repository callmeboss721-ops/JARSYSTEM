import { lazy, Suspense, useState, type FormEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Redirect, Link, useLocation, Router as WouterRouter } from "wouter";
import { Toaster } from "@workspace/jaguar-spk-design-system/components/ui/toaster";
import { TooltipProvider } from "@workspace/jaguar-spk-design-system/components/ui/tooltip";
import { Skeleton } from "@workspace/jaguar-spk-design-system/components/ui/skeleton";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { NoteSessionProvider, useNoteSession } from "@/lib/note-session";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";

const Workspace = lazy(() => import("@/pages/workspace"));

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function LoadingScreen({ label = "Opening your notebook" }: { label?: string }) {
  return (
    <main className="min-h-[100dvh] bg-background p-8" aria-label={label} data-testid="loading-workspace">
      <Skeleton className="mb-6 h-10 w-56" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </main>
  );
}

function HomeRedirect() {
  const { isLoading, authenticated } = useNoteSession();
  if (isLoading) return <LoadingScreen />;
  return authenticated ? <Redirect to="/workspace" /> : <Welcome />;
}

function WorkspaceRoute() {
  const { isLoading, authenticated, user } = useNoteSession();
  if (isLoading) return <LoadingScreen />;
  if (!authenticated) return <Redirect to="/" />;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Workspace key={user?.id ?? "signed-in"} />
    </Suspense>
  );
}

function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const { authenticated, signIn, isSubmitting } = useNoteSession();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (authenticated) return <Redirect to="/workspace" />;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await signIn(name);
      setLocation("/workspace");
    } catch {
      setError("Could not open your notebook right now. Please try again.");
    }
  };

  return (
    <main className="auth-page min-h-[100dvh] bg-background px-4 py-10 text-foreground">
      <div className="auth-page__intro">
        <Link href="/" className="brand-lockup" data-testid="link-auth-home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>stillnote</span>
        </Link>
        <p>A little room to think.</p>
      </div>
      <section className="mx-auto mt-8 w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "signup" ? "Make a little space" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Create your private notebook session."
            : "Enter a display name to continue to your private notebook."}
        </p>
        <form className="mt-5 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label htmlFor="notebook-name" className="block text-sm font-medium text-foreground">
              Display name (optional)
            </label>
            <input
              id="notebook-name"
              type="text"
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your space"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-enter-notebook">
            {isSubmitting ? "Opening…" : "Continue to notebook"}
          </Button>
        </form>
      </section>
    </main>
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
        <QueryClientProvider client={queryClient}>
          <NoteSessionProvider>
            <WouterRouter base={basePath}>
              <RoutedErrorBoundary>
                <Switch>
                  <Route path="/" component={HomeRedirect} />
                  <Route path="/sign-in/*?">{() => <AuthPage mode="signin" />}</Route>
                  <Route path="/sign-up/*?">{() => <AuthPage mode="signup" />}</Route>
                  <Route path="/workspace" component={WorkspaceRoute} />
                  <Route component={NotFound} />
                </Switch>
              </RoutedErrorBoundary>
            </WouterRouter>
          </NoteSessionProvider>
        </QueryClientProvider>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
