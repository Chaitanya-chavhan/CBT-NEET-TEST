import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { LayoutDashboard, ExternalLink, LogOut, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Consistent Squard" }, { name: "robots", content: "noindex" }] }),
  component: AdminShell,
});

const ADMIN_KEY = "cs_admin_auth";
const ADMIN_ID = "AdminConsistantSquad";
const ADMIN_PASS = "ConsistantSquad26";

function AdminShell() {
  const [authed, setAuthed] = useState(false);
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ADMIN_KEY) === "true") {
      setAuthed(true);
    }
  }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (id === ADMIN_ID && pass === ADMIN_PASS) {
      localStorage.setItem(ADMIN_KEY, "true");
      setAuthed(true);
      setError("");
    } else {
      setError("Invalid admin ID or password.");
    }
  }

  function logout() {
    localStorage.removeItem(ADMIN_KEY);
    setAuthed(false);
    setId("");
    setPass("");
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Consistent Squard</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <form onSubmit={login} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Admin ID</label>
                <input
                  id="admin-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder="Enter admin ID"
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Sign In to Admin
              </button>
            </form>
          </div>
          <div className="text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="inline-flex items-center gap-2 font-bold">
            <LayoutDashboard className="h-4 w-4 text-primary" /> CS Admin
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
