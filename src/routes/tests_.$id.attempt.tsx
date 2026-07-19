import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, Grid3x3, Loader2, LogOut, FileText, CheckCircle2, XCircle, MinusCircle, X, BookOpen } from "lucide-react";
import { getTest, getTestQuestions } from "@/lib/public-api";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/tests_/$id/attempt")({
  head: () => ({ meta: [{ title: "Attempt Test — Consistent Squard" }] }),
  component: Attempt,
});

type Answer = { option?: "A" | "B" | "C" | "D"; marked?: boolean; visited?: boolean };
type Summary = { score: number; total: number; correct: number; wrong: number; unattempted: number; timeTakenSec: number };

function Attempt() {
  const { id } = Route.useParams();
  const getTestFn = useServerFn(getTest);
  const getTestQuestionsFn = useServerFn(getTestQuestions);
  const testQ = useQuery({ queryKey: ["test", id], queryFn: () => getTestFn({ data: id }) });
  const qsQ = useQuery({ queryKey: ["test-qs", id], queryFn: () => getTestQuestionsFn({ data: id }) });

  const [started, setStarted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const [submitted, setSubmitted] = useState<Summary | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const startTsRef = useRef<number>(0);

  const questions = qsQ.data || [];
  const test = testQ.data;

  useEffect(() => {
    if (test && !started && secondsLeft === 0) setSecondsLeft(test.duration_min * 60);
  }, [test, started, secondsLeft]);

  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { doSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitted]);

  useEffect(() => {
    if (started && questions[current]) {
      setAnswers((a) => ({ ...a, [questions[current].id]: { ...a[questions[current].id], visited: true } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, started, questions.length]);

  function startTest() {
    startTsRef.current = Date.now();
    setStarted(true);
  }

  function pickOption(opt: "A" | "B" | "C" | "D") {
    if (reviewMode || submitted) return;
    const q = questions[current];
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], option: opt, visited: true, marked: false } }));
  }

  function toggleMark() {
    const q = questions[current];
    setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], marked: !a[q.id]?.marked, visited: true } }));
  }

  function saveNext() { setCurrent((c) => Math.min(c + 1, questions.length - 1)); }

  function doSubmit() {
    if (submitted) return;
    let correct = 0, wrong = 0, unattempted = 0;
    const currentAnswers = answersRef.current;
    for (const q of questions) {
      const a = currentAnswers[q.id];
      if (!a?.option) unattempted++;
      else if (a.option === q.correct_option) correct++;
      else wrong++;
    }
    const plus = Number(test!.plus_marks);
    const minus = Number(test!.minus_marks);
    const score = correct * plus - wrong * minus;
    const total = questions.length * plus;
    const timeTakenSec = Math.floor((Date.now() - startTsRef.current) / 1000);
    setSubmitted({ score, total, correct, wrong, unattempted, timeTakenSec });
  }

  const timeStr = useMemo(() => fmtTime(secondsLeft), [secondsLeft]);

  if (testQ.isLoading || qsQ.isLoading) return <div className="min-h-screen grid place-items-center bg-neutral-950 text-white"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (testQ.error || qsQ.error) return (
    <div className="min-h-screen grid place-items-center bg-neutral-950 text-white p-6 text-center">
      <div>
        <p className="text-destructive font-semibold">Failed to load test.</p>
        <p className="mt-1 text-sm text-neutral-400">{((testQ.error || qsQ.error) as Error)?.message || "Please check your connection and try again."}</p>
        <button onClick={() => { testQ.refetch(); qsQ.refetch(); }} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
        <Link to="/tests" className="mt-2 block text-primary underline text-sm">Back to tests</Link>
      </div>
    </div>
  );

  if (!test || questions.length === 0) return (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
      <div>
        <p className="text-muted-foreground">No questions in this test yet.</p>
        <Link to="/tests" className="mt-4 inline-block text-primary underline">Back to tests</Link>
      </div>
    </div>
  );

  const isFuture = test.scheduled_at && new Date(test.scheduled_at) > new Date();
  if (isFuture) return (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
      <div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning mb-4">
          <Clock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Test Scheduled</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          This test is scheduled for <b>{new Date(test.scheduled_at).toLocaleString()}</b> and cannot be attempted yet.
        </p>
        <Link to="/tests" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Go Back
        </Link>
      </div>
    </div>
  );

  const q = questions[current];
  const ans = answers[q?.id ?? ""] || {};
  const showResultBadge = (submitted !== null) || reviewMode;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{test.title}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online Test</p>
        </div>
        {!submitted && !reviewMode && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 border border-destructive/30 px-2.5 py-1 text-destructive font-semibold">
            <Clock className="h-4 w-4" /> <span className="tabular-nums">{timeStr}</span>
          </div>
        )}
        {reviewMode && (
          <span className="rounded-lg bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">Review Mode</span>
        )}
      </div>

      {/* Controls row */}
      {!reviewMode && (
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => { if (confirm("Leave the test? Your progress will be lost.")) window.history.back(); }}
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive inline-flex items-center justify-center gap-1"
          >
            <LogOut className="h-4 w-4" /> Leave Test
          </button>
          <button
            onClick={() => setShowGrid(true)}
            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white inline-flex items-center justify-center gap-1"
          >
            <Grid3x3 className="h-4 w-4" /> Question Grid
          </button>
          <button
            onClick={() => setShowInstructions(true)}
            className="rounded-lg border px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-1 hover:bg-muted"
          >
            <FileText className="h-4 w-4" /> Instructions
          </button>
          <button
            onClick={() => { if (confirm("Submit the test?")) doSubmit(); }}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Submit Test
          </button>
        </div>
      )}

      {reviewMode && (
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowGrid(true)}
            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white inline-flex items-center justify-center gap-1"
          >
            <Grid3x3 className="h-4 w-4" /> Grid
          </button>
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to Result
          </button>
        </div>
      )}

      {/* Question meta */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">{current + 1}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Marks: +{test.plus_marks} -{test.minus_marks}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Type: Single</span>
        {showResultBadge && (
          ans.option === q.correct_option ? (
            <span className="rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-semibold text-success">Correct</span>
          ) : ans.option ? (
            <span className="rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive">Wrong</span>
          ) : (
            <span className="rounded-full bg-muted border px-3 py-1 text-xs font-semibold text-muted-foreground">Not attempted</span>
          )
        )}
      </div>

      {/* Question card */}
      <div className="px-2 md:px-4">
        <div className="rounded-xl border bg-white dark:bg-card p-2 md:p-4 shadow-sm flex items-center justify-center overflow-hidden">
          <img src={q.image_url} alt={`Question ${current + 1}`} className="max-w-full h-auto object-contain rounded-md" style={{ maxHeight: '65vh' }} />
        </div>
      </div>

      {/* Options */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const active = ans.option === opt;
          const isCorrect = q.correct_option === opt;
          let cls = "border-border hover:border-primary/50 hover:bg-primary/5";
          if (showResultBadge) {
            if (isCorrect) cls = "border-success bg-success/10";
            else if (active) cls = "border-destructive bg-destructive/10";
            else cls = "border-border opacity-50";
          } else if (active) cls = "border-primary bg-primary/10 ring-1 ring-primary";
          
          return (
            <button
              key={opt}
              onClick={() => pickOption(opt)}
              disabled={showResultBadge}
              className={`w-full rounded-xl border px-4 py-4 sm:py-5 text-left flex items-center gap-3 disabled:cursor-default transition-all duration-200 ${cls}`}
            >
              <span className={`grid h-5 w-5 sm:h-6 sm:w-6 shrink-0 place-items-center rounded-full border-2 transition-colors
                ${showResultBadge && isCorrect ? "border-success bg-success" : active ? "border-primary bg-primary" : "border-muted-foreground/30"}
              `}>
                {(active || (showResultBadge && isCorrect)) && <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white" />}
              </span>
              <span className="font-medium text-base sm:text-lg">{opt}</span>
              {showResultBadge && isCorrect && (
                <span className="ml-auto text-[10px] sm:text-xs font-semibold text-success uppercase tracking-wider hidden sm:inline-block">Correct</span>
              )}
            </button>
          );
        })}
      </div>

      {!reviewMode && !submitted && (
        <>
          <div className="px-4 mt-6 border-t pt-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={!!ans.marked} onChange={toggleMark} className="h-4.5 w-4.5 accent-warning rounded" />
              <span className="text-muted-foreground font-medium">Mark for Review</span>
            </label>
          </div>
          <div className="px-4 mt-4 grid grid-cols-3 gap-3">
            <button onClick={() => setCurrent((c) => Math.min(c + 1, questions.length - 1))} className="rounded-xl border px-3 py-3 text-sm font-medium hover:bg-muted transition-colors">Skip</button>
            <button onClick={() => setCurrent((c) => Math.max(c - 1, 0))} disabled={current === 0} className="rounded-xl border px-3 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <button onClick={saveNext} className="rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-transform active:scale-95">Save &amp; Next</button>
          </div>
        </>
      )}

      {reviewMode && (
        <div className="px-4 mt-6 grid grid-cols-2 gap-2">
          <button onClick={() => setCurrent((c) => Math.max(c - 1, 0))} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">Previous</button>
          <button onClick={() => setCurrent((c) => Math.min(c + 1, questions.length - 1))} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Next</button>
        </div>
      )}

      {/* Start overlay */}
      {!started && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-xl">
            <div className="bg-primary px-5 py-4">
              <h2 className="font-bold text-primary-foreground">{test.title}</h2>
            </div>
            <div className="p-5 text-sm space-y-2">
              <p className="font-medium">Welcome to your test. Please read before starting:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Total questions: <b className="text-foreground">{questions.length}</b></li>
                <li>Total time: <b className="text-foreground">{test.duration_min} min</b></li>
                <li>Each correct: <b className="text-success">+{test.plus_marks}</b>, incorrect: <b className="text-destructive">-{test.minus_marks}</b></li>
                <li>Use the Question Grid to jump between questions</li>
                <li>Do not refresh or close the tab during the test</li>
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <Link to="/tests" className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Go Back</Link>
                <button onClick={startTest} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start Test</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {showInstructions && started && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setShowInstructions(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Instructions</h3>
              <button onClick={() => setShowInstructions(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Total time: {test.duration_min} min</li>
              <li>Each correct: +{test.plus_marks}, incorrect: -{test.minus_marks}</li>
              <li>Use the Question Grid to jump between questions</li>
              <li>Do not refresh/close the tab during the test</li>
            </ul>
          </div>
        </div>
      )}

      {/* Grid overlay */}
      {showGrid && (
        <div className="fixed inset-0 z-40 grid place-items-end sm:place-items-center bg-black/40 p-2 sm:p-4" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b shrink-0">
              <h3 className="font-bold">Question Grid</h3>
              <button onClick={() => setShowGrid(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto">
              <div className="flex flex-wrap gap-2 text-xs mb-4">
                {showResultBadge ? (
                  <>
                    <span className="rounded bg-success/20 border border-success/40 px-2 py-0.5 text-success">Correct</span>
                    <span className="rounded bg-destructive/20 border border-destructive/40 px-2 py-0.5 text-destructive">Wrong</span>
                    <span className="rounded bg-muted border px-2 py-0.5 text-muted-foreground">Skipped</span>
                  </>
                ) : (
                  <>
                    <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-primary">Current</span>
                    <span className="rounded bg-success/20 border border-success/40 px-2 py-0.5 text-success">Answered</span>
                    <span className="rounded bg-warning/20 border border-warning/40 px-2 py-0.5 text-warning-foreground">Marked</span>
                    <span className="rounded bg-muted border px-2 py-0.5 text-muted-foreground">Not visited</span>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {questions.map((qq, i) => {
                  const a = answers[qq.id];
                  let cls = "bg-muted border-border text-muted-foreground";
                  if (showResultBadge) {
                    if (!a?.option) cls = "bg-muted border-border text-muted-foreground";
                    else if (a.option === qq.correct_option) cls = "bg-success text-success-foreground border-success";
                    else cls = "bg-destructive text-white border-destructive";
                  } else {
                    if (a?.marked) cls = "bg-warning text-warning-foreground border-warning";
                    else if (a?.option) cls = "bg-success text-success-foreground border-success";
                    else if (a?.visited) cls = "bg-destructive/20 border-destructive text-destructive";
                  }
                  if (i === current) cls += " ring-2 ring-primary ring-offset-1";
                  return (
                    <button key={qq.id} onClick={() => { setCurrent(i); setShowGrid(false); }} className={`aspect-square rounded-md border text-sm font-semibold hover:opacity-80 transition-opacity ${cls}`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results overlay */}
      {submitted && !reviewMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-auto">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-5 my-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Test Results</h3>
              <Link to="/tests" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Link>
            </div>

            {/* Score */}
            <div className="mt-4 rounded-xl bg-primary p-5 text-primary-foreground text-center shadow-lg shadow-primary/20">
              <div className="text-4xl font-extrabold tabular-nums">
                {submitted.score.toFixed(2)} <span className="text-xl font-medium opacity-80">/ {submitted.total}</span>
              </div>
              <div className="mt-1 text-sm opacity-90">
                {((submitted.score / (submitted.total || 1)) * 100).toFixed(2)}% Score
              </div>
            </div>

            {/* Stats grid */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-primary/5 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{questions.length}</div>
                <div className="mt-1 text-xs text-muted-foreground">Total Questions</div>
              </div>
              <div className="rounded-xl border bg-success/5 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                <div className="text-2xl font-bold text-success">{submitted.correct}</div>
                <div className="mt-1 text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="rounded-xl border bg-destructive/5 p-4 text-center">
                <XCircle className="mx-auto h-5 w-5 text-destructive" />
                <div className="text-2xl font-bold text-destructive">{submitted.wrong}</div>
                <div className="mt-1 text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="rounded-xl border bg-muted p-4 text-center">
                <MinusCircle className="mx-auto h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{submitted.unattempted}</div>
                <div className="mt-1 text-xs text-muted-foreground">Unattempted</div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Attempted" value={`${submitted.correct + submitted.wrong} / ${questions.length}`} />
              <Row label="Accuracy" value={`${(((submitted.correct) / ((submitted.correct + submitted.wrong) || 1)) * 100).toFixed(2)}%`} />
              <Row label="Positive Marks" value={<span className="text-success">+{(submitted.correct * Number(test.plus_marks)).toFixed(2)}</span>} />
              <Row label="Negative Marks" value={<span className="text-destructive">-{(submitted.wrong * Number(test.minus_marks)).toFixed(2)}</span>} />
              <Row label="Time Taken" value={fmtTime(submitted.timeTakenSec)} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                onClick={() => { setReviewMode(true); setCurrent(0); }}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-1"
              >
                <BookOpen className="h-4 w-4" /> Solutions
              </button>
              <button
                onClick={() => { setSubmitted(null); setAnswers({}); setStarted(false); setSecondsLeft(test.duration_min * 60); }}
                className="rounded-lg border bg-accent/50 px-4 py-2.5 text-center text-sm font-semibold hover:bg-accent"
              >
                Re-attempt
              </button>
              <Link to="/tests" className="rounded-lg border px-4 py-2.5 text-center text-sm font-semibold hover:bg-muted">Close</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function fmtTime(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
