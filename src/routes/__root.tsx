import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Consistent Squard" },
      { name: "description", content: "Practice tests and mock exams for Consistent Squard students. Attempt full-length CBT tests with instant detailed results." },
      { property: "og:title", content: "Consistent Squard" },
      { property: "og:description", content: "Practice tests and mock exams for Consistent Squard students. Attempt full-length CBT tests with instant detailed results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Consistent Squard" },
      { name: "twitter:description", content: "Practice tests and mock exams for Consistent Squard students. Attempt full-length CBT tests with instant detailed results." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Routes that require Supabase auth (student session)
const PROTECTED_PREFIXES = ["/tests"];
// Admin route has its own separate credential-based auth
const ADMIN_PREFIX = "/admin";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useRouter().navigate;
  const pathname = useRouter().state.location.pathname;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function checkAuth() {
      const email = localStorage.getItem("cs_student_auth");
      setSession(email ? { user: { email } } : null);
      setLoading(false);
    }
    
    checkAuth();
    
    // Listen for custom auth events from login/logout
    window.addEventListener("cs_auth_change", checkAuth);
    return () => window.removeEventListener("cs_auth_change", checkAuth);
  }, []);

  useEffect(() => {
    if (loading) return;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const isAdmin = pathname.startsWith(ADMIN_PREFIX);
    const isLogin = pathname === "/login";

    // /admin has its own auth — don't touch it here
    if (isAdmin) return;

    // Protected student routes: redirect to login if no session
    if (isProtected && !session) {
      navigate({ to: "/login" });
      return;
    }

    // If already logged in and on login page, go to tests
    if (isLogin && session) {
      navigate({ to: "/tests" });
    }
  }, [session, loading, pathname]);

  if (loading && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
