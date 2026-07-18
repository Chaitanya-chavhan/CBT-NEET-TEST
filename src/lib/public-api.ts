import { createServerFn } from "@tanstack/react-start";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listSeries = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await getAdmin();
  const { data, error } = await sb
    .from("test_series")
    .select("*, tests(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const getSeries = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: id }) => {
    const sb = await getAdmin();
    const [{ data: series, error: se }, { data: tests, error: te }] = await Promise.all([
      sb.from("test_series").select("*").eq("id", id).single(),
      sb.from("tests").select("*, questions(count)").eq("series_id", id).order("created_at"),
    ]);
    if (se) throw se;
    if (te) throw te;
    return { series, tests: tests || [] };
  });

export const getTest = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: id }) => {
    const sb = await getAdmin();
    const { data, error } = await sb.from("tests").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  });

export const getTestQuestions = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: id }) => {
    const sb = await getAdmin();
    const { data, error } = await sb
      .from("questions")
      .select("id, image_url, correct_option, sort_order")
      .eq("test_id", id)
      .order("sort_order");
    if (error) throw error;
    return data;
  });
