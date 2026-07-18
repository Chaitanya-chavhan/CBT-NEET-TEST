import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Admin panel is open (no auth). Server functions here use the service-role
// client to bypass RLS for writes. Access is via a hidden route only.

// ---------------- Auth: email-only instant login (no email sent) ----------------

export const loginByEmail = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // 1. Check if the user exists in the registrations table
    const { data: user, error: ue } = await (supabaseAdmin as any)
      .from("registrations")
      .select("email")
      .ilike("email", data.email.trim())
      .maybeSingle();
      
    if (ue || !user) {
      throw new Error("This email is not registered. Contact your admin.");
    }
    
    // Return the email directly for local session — we completely bypass Supabase Auth 
    // because the user's Supabase project Auth settings are disabled/failing.
    return { ok: true, email: (user as any).email };
  });

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------------- Series ----------------

const seriesSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  planner_pdf_url: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export const createSeries = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof seriesSchema>) => seriesSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: row, error } = await sb.from("test_series").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSeries = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; patch: Partial<z.infer<typeof seriesSchema>> }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("test_series").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSeries = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("test_series").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Tests ----------------

const testSchema = z.object({
  series_id: z.string(),
  title: z.string().min(1),
  thumbnail_url: z.string().nullable().optional(),
  duration_min: z.number().int().positive().default(180),
  plus_marks: z.number().default(4),
  minus_marks: z.number().default(1),
  scheduled_at: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export const createTest = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof testSchema>) => testSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: row, error } = await sb.from("tests").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTest = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; patch: Partial<z.infer<typeof testSchema>> }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("tests").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTest = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("tests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Questions ----------------

const qSchema = z.object({
  test_id: z.string(),
  image_url: z.string().url(),
  correct_option: z.enum(["A", "B", "C", "D"]),
  sort_order: z.number().int().optional(),
});

export const createQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof qSchema>) => qSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: row, error } = await sb.from("questions").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; patch: { image_url?: string; correct_option?: "A"|"B"|"C"|"D"; sort_order?: number } }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("questions").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Planner PDF upload ----------------

export const uploadPlanner = createServerFn({ method: "POST" })
  .inputValidator((d: { seriesId: string; filename: string; base64: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const clean = data.base64.replace(/^data:application\/pdf;base64,/, "");
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
    const path = `${data.seriesId}/${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await sb.storage.from("planners").upload(path, bytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (error) throw new Error(error.message);
    await sb.from("test_series").update({ planner_pdf_url: path }).eq("id", data.seriesId);
    return { path };
  });

export const getPlannerSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((d: { path: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: r, error } = await sb.storage.from("planners").createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: r.signedUrl };
  });

// ---------------- Admin reads ----------------

export const adminListSeries = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await getAdmin();
  const { data, error } = await sb.from("test_series").select("*, tests(count)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
});

export const adminListTests = createServerFn({ method: "GET" })
  .inputValidator((d: { seriesId: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: rows, error } = await sb.from("tests").select("*, questions(count)").eq("series_id", data.seriesId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows;
  });

export const adminGetTest = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const [{ data: test, error: te }, { data: qs, error: qe }] = await Promise.all([
      sb.from("tests").select("*").eq("id", data.id).single(),
      sb.from("questions").select("*").eq("test_id", data.id).order("sort_order"),
    ]);
    if (te) throw new Error(te.message);
    if (qe) throw new Error(qe.message);
    return { test, questions: qs || [] };
  });

export const adminGetSeries = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { data: row, error } = await sb.from("test_series").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return row;
  });
