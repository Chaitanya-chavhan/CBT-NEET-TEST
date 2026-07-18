import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loginByEmail } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, GraduationCap, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Consistent Squard" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginFn = useServerFn(loginByEmail);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      // Server checks if email exists and returns the verified email
      const { email: verifiedEmail } = await loginFn({ data: { email: trimmed } });

      // Instantly log in using a local storage session (bypassing Supabase Auth)
      localStorage.setItem("cs_student_auth", verifiedEmail);
      
      // Dispatch an event so __root.tsx can detect the login immediately
      window.dispatchEvent(new Event("cs_auth_change"));
      toast.success("Welcome back!");
      navigate({ to: "/tests" });
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Consistent Squard</h1>
            <p className="text-sm text-muted-foreground">CBT Test Platform</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <p className="mb-5 text-center text-sm text-muted-foreground">
            Enter your registered email to sign in
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 inline-flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
          <p className="text-xs text-muted-foreground">
            Only registered emails can access.
          </p>
        </div>
      </div>
    </div>
  );
}
