import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminGetTest, updateTest, createQuestion, updateQuestion, deleteQuestion } from "@/lib/admin.functions";
import { ArrowLeft, Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/test/$id")({ component: TestEditor });

const inp = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

function TestEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetTest);
  const updTestFn = useServerFn(updateTest);
  const addQFn = useServerFn(createQuestion);
  const updQFn = useServerFn(updateQuestion);
  const delQFn = useServerFn(deleteQuestion);

  const { data, isLoading } = useQuery({ queryKey: ["adm-test", id], queryFn: () => getFn({ data: { id } }) });

  const [form, setForm] = useState<any>(null);
  const [newQ, setNewQ] = useState({ image_url: "", correct_option: "A" as "A" | "B" | "C" | "D" });

  const saveTestMut = useMutation({
    mutationFn: async () => updTestFn({ data: { id, patch: {
      title: form.title, thumbnail_url: form.thumbnail_url || null,
      duration_min: Number(form.duration_min), plus_marks: Number(form.plus_marks), minus_marks: Number(form.minus_marks),
      scheduled_at: form.scheduled_at || null, published: form.published,
    } } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["adm-test", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addQMut = useMutation({
    mutationFn: async () => {
      const order = data?.questions.length ?? 0;
      return addQFn({ data: { test_id: id, image_url: newQ.image_url, correct_option: newQ.correct_option, sort_order: order } });
    },
    onSuccess: () => { toast.success("Question added"); setNewQ({ image_url: "", correct_option: "A" }); qc.invalidateQueries({ queryKey: ["adm-test", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) return (
    <div className="grid place-items-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const f = form ?? {
    title: data.test.title,
    thumbnail_url: data.test.thumbnail_url || "",
    duration_min: data.test.duration_min,
    plus_marks: data.test.plus_marks,
    minus_marks: data.test.minus_marks,
    scheduled_at: data.test.scheduled_at || "",
    published: data.test.published,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      {/* Test Details */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Test Details</h2>
        <div className="mt-4 space-y-3">
          <Field label="Title"><input value={f.title} onChange={(e) => setForm({ ...f, title: e.target.value })} className={inp} /></Field>
          <Field label="Thumbnail URL (optional)"><input value={f.thumbnail_url} onChange={(e) => setForm({ ...f, thumbnail_url: e.target.value })} placeholder="https://i.ibb.co/..." className={inp} /></Field>
          {f.thumbnail_url && <img src={f.thumbnail_url} className="max-h-40 rounded-lg border" alt="" />}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Duration (min)"><input type="number" value={f.duration_min} onChange={(e) => setForm({ ...f, duration_min: e.target.value })} className={inp} /></Field>
            <Field label="+ Marks"><input type="number" step="0.5" value={f.plus_marks} onChange={(e) => setForm({ ...f, plus_marks: e.target.value })} className={inp} /></Field>
            <Field label="− Marks"><input type="number" step="0.5" value={f.minus_marks} onChange={(e) => setForm({ ...f, minus_marks: e.target.value })} className={inp} /></Field>
          </div>
          <Field label="Scheduled at (optional)">
            <input
              type="datetime-local"
              value={f.scheduled_at ? new Date(f.scheduled_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => setForm({ ...f, scheduled_at: e.target.value })}
              className={inp}
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={f.published} onChange={(e) => setForm({ ...f, published: e.target.checked })} className="rounded" />
            Published (visible to students)
          </label>
        </div>
        <button
          onClick={() => saveTestMut.mutate()}
          disabled={saveTestMut.isPending}
          className="mt-5 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saveTestMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Test
        </button>
      </div>

      {/* Questions */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">Questions ({data.questions.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload question images to <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-primary underline">imgbb.com</a>, then paste the direct image link below.
        </p>

        {/* Add Question */}
        <div className="mt-3 rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">Add a new question</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={newQ.image_url}
              onChange={(e) => setNewQ({ ...newQ, image_url: e.target.value })}
              placeholder="https://i.ibb.co/... (image URL of the question)"
              className={inp}
            />
            <select
              value={newQ.correct_option}
              onChange={(e) => setNewQ({ ...newQ, correct_option: e.target.value as any })}
              className={inp}
            >
              {(["A", "B", "C", "D"] as const).map((o) => (
                <option key={o} value={o}>Correct: {o}</option>
              ))}
            </select>
            <button
              disabled={!newQ.image_url || addQMut.isPending}
              onClick={() => addQMut.mutate()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 inline-flex items-center gap-1"
            >
              {addQMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </button>
          </div>
          {newQ.image_url && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-muted-foreground">Preview:</p>
              <img src={newQ.image_url} className="max-h-52 rounded-lg border bg-muted object-contain" alt="Preview" />
            </div>
          )}
        </div>

        {/* Question Grid */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.questions.map((q: any, i: number) => (
            <QCard
              key={q.id}
              q={q}
              index={i}
              onDelete={() => confirm("Delete this question?") && delQFn({ data: { id: q.id } }).then(() => qc.invalidateQueries({ queryKey: ["adm-test", id] }))}
              onChange={(opt) => updQFn({ data: { id: q.id, patch: { correct_option: opt } } }).then(() => qc.invalidateQueries({ queryKey: ["adm-test", id] }))}
            />
          ))}
        </div>

        {data.questions.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No questions yet. Add your first question above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QCard({ q, index, onDelete, onChange }: { q: any; index: number; onDelete: () => void; onChange: (o: "A" | "B" | "C" | "D") => void }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Q{index + 1}</span>
        <button onClick={onDelete} className="text-destructive hover:opacity-70">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <img src={q.image_url} className="mt-2 max-h-52 w-full rounded-lg border bg-muted object-contain" alt="" />
      <div className="mt-3">
        <p className="mb-1 text-xs text-muted-foreground">Correct answer</p>
        <div className="flex gap-1">
          {(["A", "B", "C", "D"] as const).map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`h-8 w-8 rounded text-sm font-semibold transition-colors ${
                q.correct_option === o
                  ? "bg-success text-success-foreground"
                  : "border hover:bg-muted"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
