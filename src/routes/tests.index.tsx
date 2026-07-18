import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Calendar, Loader2, FileText, PlayCircle, Search, LogOut } from "lucide-react";
import { listSeries } from "@/lib/public-api";
import { getPlannerSignedUrl } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Available Test Series — Consistent Squard" },
      { name: "description", content: "Browse CBT test series and practice tests from Consistent Squard." },
    ],
  }),
  component: SeriesList,
});

function SeriesList() {
  const [q, setQ] = useState("");
  const listSeriesFn = useServerFn(listSeries);
  const seriesQ = useQuery({ queryKey: ["series"], queryFn: () => listSeriesFn() });
  const getPlanner = useServerFn(getPlannerSignedUrl);

  const filtered = (seriesQ.data || []).filter((s) =>
    s.title.toLowerCase().includes(q.toLowerCase()),
  );

  async function openPlanner(path: string) {
    try {
      const { url } = await getPlanner({ data: { path } });
      window.open(url, "_blank");
    } catch (e) { toast.error((e as Error).message); }
  }

  async function handleLogout() {
    localStorage.removeItem("cs_student_auth");
    window.dispatchEvent(new Event("cs_auth_change"));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Available Test Series</h1>
        <div className="mt-1 h-px bg-border" />

        {/* Search */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-full border-2 border-primary/30 bg-card pl-10 pr-5 py-3 text-sm outline-none focus:border-primary"
            placeholder="Search test series..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Loading */}
        {seriesQ.isLoading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Series Cards */}
        <div className="mt-6 space-y-5">
          {filtered.map((s) => {
            const count = s.tests?.[0]?.count ?? 0;
            return (
              <div key={s.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="px-5 pt-5">
                  <h3 className="text-lg font-bold uppercase tracking-tight">{s.title}</h3>
                </div>
                {s.thumbnail_url ? (
                  <div className="px-5 pt-2 pb-1">
                    <img
                      src={s.thumbnail_url}
                      alt={s.title}
                      className="w-full aspect-video rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="px-5 pt-2 pb-1">
                    <div className="w-full aspect-video grid place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
                      Test Series
                    </div>
                  </div>
                )}
                <div className="px-5 pb-4 text-sm text-muted-foreground space-y-1">
                  {(s.starts_on || s.ends_on) && (
                    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Starts on{" "}
                        <span className="font-semibold text-foreground">
                          {s.starts_on ? new Date(s.starts_on).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        ● Ends on{" "}
                        <span className="font-semibold text-foreground">
                          {s.ends_on ? new Date(s.ends_on).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </span>
                    </p>
                  )}
                  <p className="pt-1 text-xs">
                    ✨ {count} test{count === 1 ? "" : "s"} available
                  </p>
                  {s.description && <p className="pt-1">{s.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 border-t p-4">
                  <button
                    onClick={() => s.planner_pdf_url ? openPlanner(s.planner_pdf_url) : toast("No planner available yet")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
                    disabled={!s.planner_pdf_url}
                  >
                    <FileText className="h-4 w-4" /> Planner
                  </button>
                  <Link
                    to="/tests/$id"
                    params={{ id: s.id }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  >
                    <PlayCircle className="h-4 w-4" /> Attempt
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {!seriesQ.isLoading && filtered.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              {q ? `No results for "${q}"` : "No test series available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
