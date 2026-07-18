import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Timer, BarChart3, Play, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">CS</div>
            <div>
              <h1 className="text-base font-bold leading-tight">Consistent Squard</h1>
              <p className="text-xs text-muted-foreground leading-tight">CBT Test Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link to="/tests" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Tests</Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Login</Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12 md:py-20 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium">
          <GraduationCap className="h-3.5 w-3.5" /> Built for serious aspirants
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Practice. Attempt. Improve.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Attempt full-length mock tests with a real exam interface — timer, section-wise index, instant detailed results.
        </p>
        <Link
          to={session ? "/tests" : "/login"}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          <Play className="h-4 w-4" /> Take a Test
        </Link>

        <div className="mt-16 grid gap-4 md:grid-cols-3 text-left">
          {[
            { icon: Timer, title: "Real exam timer", desc: "3-hour default duration, configurable per attempt." },
            { icon: BarChart3, title: "Detailed results", desc: "Section-wise breakdown with accuracy and marks." },
            { icon: GraduationCap, title: "Mock test series", desc: "Curated practice papers for serious aspirants." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Consistent Squard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
