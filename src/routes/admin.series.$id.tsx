import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminGetSeries, adminListTests, updateSeries, createTest, deleteTest, uploadPlanner, getPlannerSignedUrl } from "@/lib/admin.functions";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Save, FileUp, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Field, Modal, inpCls } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/series/$id")({ component: SeriesEditor });

type SeriesForm = { title: string; description: string; thumbnail_url: string; starts_on: string; ends_on: string; published: boolean };
type NewTest = { title: string; thumbnail_url: string; duration_min: number; plus_marks: number; minus_marks: number; scheduled_at: string };

function SeriesEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getSeriesFn = useServerFn(adminGetSeries);
  const listTestsFn = useServerFn(adminListTests);
  const updateFn = useServerFn(updateSeries);
  const createTestFn = useServerFn(createTest);
  const deleteTestFn = useServerFn(deleteTest);
  const uploadPlannerFn = useServerFn(uploadPlanner);
  const getPlannerFn = useServerFn(getPlannerSignedUrl);

  const sQ = useQuery({ queryKey: ["adm-series", id], queryFn: () => getSeriesFn({ data: { id } }) });
  const tQ = useQuery({ queryKey: ["adm-series-tests", id], queryFn: () => listTestsFn({ data: { seriesId: id } }) });

  const [form, setForm] = useState<SeriesForm | null>(null);
  const [newTest, setNewTest] = useState<NewTest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const s = sQ.data;

  const saveMut = useMutation({
    mutationFn: async () => updateFn({ data: { id, patch: {
      title: form!.title, description: form!.description || null, thumbnail_url: form!.thumbnail_url || null,
      starts_on: form!.starts_on || null, ends_on: form!.ends_on || null, published: form!.published,
    } } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["adm-series", id] }); qc.invalidateQueries({ queryKey: ["adm-series"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createTestMut = useMutation({
    mutationFn: async () => createTestFn({ data: {
      series_id: id,
      title: newTest!.title,
      thumbnail_url: newTest!.thumbnail_url || null,
      duration_min: newTest!.duration_min,
      plus_marks: newTest!.plus_marks,
      minus_marks: newTest!.minus_marks,
      scheduled_at: newTest!.scheduled_at || null,
    } }),
    onSuccess: () => { toast.success("Test added"); setNewTest(null); qc.invalidateQueries({ queryKey: ["adm-series-tests", id] }); qc.invalidateQueries({ queryKey: ["adm-series"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPickPlanner(file: File) {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("PDF only");
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      await uploadPlannerFn({ data: { seriesId: id, filename: file.name, base64 } });
      toast.success("Planner uploaded");
      qc.invalidateQueries({ queryKey: ["adm-series", id] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  }

  async function openPlanner() {
    if (!s?.planner_pdf_url) return;
    const { url } = await getPlannerFn({ data: { path: s.planner_pdf_url } });
    window.open(url, "_blank");
  }

  if (sQ.isLoading || !s) return (
    <div className="grid place-items-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const f = form ?? { title: s.title, description: s.description || "", thumbnail_url: s.thumbnail_url || "", starts_on: s.starts_on || "", ends_on: s.ends_on || "", published: s.published };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      {/* Series Details */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Series Details</h2>
        <div className="mt-4 space-y-3">
          <Field label="Title"><input value={f.title} onChange={(e) => setForm({ ...f, title: e.target.value })} className={inpCls} /></Field>
          <Field label="Description"><textarea value={f.description} onChange={(e) => setForm({ ...f, description: e.target.value })} rows={2} className={inpCls} /></Field>
          <Field label="Thumbnail URL (imgbb)"><input value={f.thumbnail_url} onChange={(e) => setForm({ ...f, thumbnail_url: e.target.value })} placeholder="https://i.ibb.co/..." className={inpCls} /></Field>
          {f.thumbnail_url && <img src={f.thumbnail_url} alt="" className="max-h-40 rounded-lg border" />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts on"><input type="date" value={f.starts_on || ""} onChange={(e) => setForm({ ...f, starts_on: e.target.value })} className={inpCls} /></Field>
            <Field label="Ends on"><input type="date" value={f.ends_on || ""} onChange={(e) => setForm({ ...f, ends_on: e.target.value })} className={inpCls} /></Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={f.published} onChange={(e) => setForm({ ...f, published: e.target.checked })} className="rounded" />
            Published (visible to students)
          </label>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="mt-5 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Series
        </button>
      </div>

      {/* Planner PDF */}
      <div 
        className={`mt-5 rounded-xl border p-5 shadow-sm transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'bg-card'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPickPlanner(f);
        }}
      >
        <h2 className="text-lg font-bold inline-flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Study Planner (PDF)
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Upload a study planner PDF. Students will see a "Planner" button on the series card. You can also drag and drop a file here.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {uploading ? "Uploading..." : (s.planner_pdf_url ? "Replace PDF" : "Upload PDF")}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickPlanner(f); e.target.value = ""; }} />
          </label>
          {s.planner_pdf_url && (
            <button onClick={openPlanner} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
              <ExternalLink className="h-4 w-4" /> View current
            </button>
          )}
        </div>
      </div>

      {/* Tests */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Tests in this Series</h2>
          <button
            onClick={() => setNewTest({ title: "", thumbnail_url: "", duration_min: 180, plus_marks: 4, minus_marks: 1, scheduled_at: "" })}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add Test
          </button>
        </div>
        {tQ.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-3">
            {tQ.data?.map((t: { id: string; title: string; thumbnail_url: string | null; duration_min: number; plus_marks: number; minus_marks: number; questions?: { count: number }[] }) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                {t.thumbnail_url
                  ? <img src={t.thumbnail_url} className="h-16 w-24 rounded-lg object-cover flex-shrink-0" alt="" />
                  : <div className="h-16 w-24 rounded-lg bg-muted flex-shrink-0 grid place-items-center text-xs text-muted-foreground">No image</div>
                }
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{t.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.questions?.[0]?.count ?? 0} questions · {t.duration_min}min · +{t.plus_marks}/−{t.minus_marks}</p>
                </div>
                <Link to="/admin/test/$id" params={{ id: t.id }} className="rounded-lg border px-3 py-1.5 text-sm inline-flex items-center gap-1 hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  onClick={() => { if (confirm("Delete this test?")) deleteTestFn({ data: { id: t.id } }).then(() => qc.invalidateQueries({ queryKey: ["adm-series-tests", id] })); }}
                  className="rounded-lg border px-2 py-1.5 text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {tQ.data?.length === 0 && (
              <div className="rounded-xl border border-dashed bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No tests yet. Add your first test to this series.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {newTest && (
        <Modal title="Add Test" onClose={() => setNewTest(null)} onSubmit={() => createTestMut.mutate()} loading={createTestMut.isPending}>
          <Field label="Title"><input required value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} className={inpCls} /></Field>
          <Field label="Thumbnail URL (optional)"><input value={newTest.thumbnail_url} onChange={(e) => setNewTest({ ...newTest, thumbnail_url: e.target.value })} placeholder="https://i.ibb.co/..." className={inpCls} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Duration (min)"><input type="number" value={newTest.duration_min} onChange={(e) => setNewTest({ ...newTest, duration_min: Number(e.target.value) })} className={inpCls} /></Field>
            <Field label="+ Marks"><input type="number" step="0.5" value={newTest.plus_marks} onChange={(e) => setNewTest({ ...newTest, plus_marks: Number(e.target.value) })} className={inpCls} /></Field>
            <Field label="− Marks"><input type="number" step="0.5" value={newTest.minus_marks} onChange={(e) => setNewTest({ ...newTest, minus_marks: Number(e.target.value) })} className={inpCls} /></Field>
          </div>
          <Field label="Scheduled at (optional)"><input type="datetime-local" value={newTest.scheduled_at} onChange={(e) => setNewTest({ ...newTest, scheduled_at: e.target.value })} className={inpCls} /></Field>
        </Modal>
      )}
    </div>
  );
}
