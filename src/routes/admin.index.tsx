import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListSeries, createSeries, deleteSeries } from "@/lib/admin.functions";
import { Loader2, Plus, Pencil, Trash2, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Field, Modal, inpCls } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const qc = useQueryClient();
  const listSeries = useServerFn(adminListSeries);
  const createSeriesFn = useServerFn(createSeries);
  const delSeriesFn = useServerFn(deleteSeries);

  const seriesQ = useQuery({ queryKey: ["adm-series"], queryFn: () => listSeries() });

  const [newSeries, setNewSeries] = useState<null | { title: string; description: string; thumbnail_url: string; starts_on: string; ends_on: string }>(null);

  const createSeriesMut = useMutation({
    mutationFn: async () => createSeriesFn({ data: {
      title: newSeries!.title,
      description: newSeries!.description || null,
      thumbnail_url: newSeries!.thumbnail_url || null,
      starts_on: newSeries!.starts_on || null,
      ends_on: newSeries!.ends_on || null,
    } }),
    onSuccess: () => { toast.success("Series created"); setNewSeries(null); qc.invalidateQueries({ queryKey: ["adm-series"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold inline-flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Test Series
          </h2>
          <button
            id="new-series-btn"
            onClick={() => setNewSeries({ title: "", description: "", thumbnail_url: "", starts_on: "", ends_on: "" })}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New Series
          </button>
        </div>

        {seriesQ.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-3">
            {seriesQ.data?.map((s: { id: string; title: string; thumbnail_url: string | null; starts_on: string | null; ends_on: string | null; tests?: { count: number }[] }) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                {s.thumbnail_url
                  ? <img src={s.thumbnail_url} className="h-16 w-24 rounded-lg object-cover flex-shrink-0" alt="" />
                  : <div className="h-16 w-24 rounded-lg bg-muted flex-shrink-0 grid place-items-center text-xs text-muted-foreground">No image</div>
                }
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{s.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {s.starts_on || "—"} → {s.ends_on || "—"}
                    · {s.tests?.[0]?.count ?? 0} test(s)
                  </p>
                </div>
                <Link
                  to="/admin/series/$id"
                  params={{ id: s.id }}
                  className="rounded-lg border px-3 py-1.5 text-sm inline-flex items-center gap-1 hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  onClick={() => {
                    if (confirm("Delete this series and all its tests?")) {
                      delSeriesFn({ data: { id: s.id } }).then(() => qc.invalidateQueries({ queryKey: ["adm-series"] }));
                    }
                  }}
                  className="rounded-lg border px-2 py-1.5 text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {seriesQ.data?.length === 0 && (
              <div className="rounded-xl border border-dashed bg-card p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No series yet. Create your first test series to get started.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {newSeries && (
        <Modal onClose={() => setNewSeries(null)} title="New Test Series" onSubmit={() => createSeriesMut.mutate()} loading={createSeriesMut.isPending}>
          <Field label="Title"><input required value={newSeries.title} onChange={(e) => setNewSeries({ ...newSeries, title: e.target.value })} className={inpCls} /></Field>
          <Field label="Description"><textarea value={newSeries.description} onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })} rows={2} className={inpCls} /></Field>
          <Field label="Thumbnail URL (imgbb)"><input value={newSeries.thumbnail_url} onChange={(e) => setNewSeries({ ...newSeries, thumbnail_url: e.target.value })} placeholder="https://i.ibb.co/..." className={inpCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts on"><input type="date" value={newSeries.starts_on} onChange={(e) => setNewSeries({ ...newSeries, starts_on: e.target.value })} className={inpCls} /></Field>
            <Field label="Ends on"><input type="date" value={newSeries.ends_on} onChange={(e) => setNewSeries({ ...newSeries, ends_on: e.target.value })} className={inpCls} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
