import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getSeries } from "@/lib/public-api";

export const Route = createFileRoute("/tests_/$id/")({
  head: () => ({ meta: [{ title: "Tests — Consistent Squard" }] }),
  component: SeriesDetail,
});

function SeriesDetail() {
  const { id } = Route.useParams();
  const getSeriesFn = useServerFn(getSeries);
  const { data, isLoading, error } = useQuery({ queryKey: ["series", id], queryFn: () => getSeriesFn({ data: id }) });

  if (isLoading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
  if (error) return (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center text-muted-foreground">
      Failed to load. Please try again.
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-5">
        <Link
          to="/tests"
          className="mb-5 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All Tests
        </Link>

        <h1 className="mt-2 text-2xl font-bold">{data?.series?.title}</h1>
        {data?.series?.description && (
          <p className="mt-1 text-sm text-muted-foreground">{data.series.description}</p>
        )}

        <div className="mt-6 space-y-4">
          {data?.tests.map((t: any) => {
            const qcount = t.questions?.[0]?.count ?? 0;
            const marks = qcount * Number(t.plus_marks || 0);
            const isPast = t.scheduled_at && new Date(t.scheduled_at) < new Date();
            const isFuture = t.scheduled_at && new Date(t.scheduled_at) > new Date();

            return (
              <div key={t.id} className="rounded-2xl border bg-card shadow-sm p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  {isFuture ? (
                    <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                      Upcoming
                    </span>
                  ) : isPast ? (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      Missed
                    </span>
                  ) : null}
                </div>

                {t.thumbnail_url && (
                  <img src={t.thumbnail_url} alt="" className="mt-3 aspect-video w-full rounded-lg object-cover" />
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-y py-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary">{qcount}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Questions</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{marks}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Marks</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{t.duration_min}m</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Time</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {t.scheduled_at ? (
                      <>
                        Schedule:<br />
                        <span className="font-semibold text-foreground">
                          {new Date(t.scheduled_at).toLocaleString(undefined, {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </>
                    ) : (
                      <span>Anytime</span>
                    )}
                  </div>
                  {isFuture ? (
                    <button disabled className="inline-flex items-center gap-1 rounded-lg bg-muted px-5 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                      Locked
                    </button>
                  ) : (
                    <Link
                      to="/tests/$id/attempt"
                      params={{ id: t.id }}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      <PlayCircle className="h-4 w-4" /> Start
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {data?.tests.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">No tests in this series yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
