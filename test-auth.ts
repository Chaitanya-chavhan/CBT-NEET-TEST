import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);

async function test() {
  const email = "hansd3769@gmail.com";
  const pwd = "CS_" + Math.random().toString(36).slice(-10) + "!";
  
  let { data: users } = await supabaseAdmin.auth.admin.listUsers();
  let user = users.users.find((u: any) => u.email === email);
  
  if (user) {
    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: pwd });
    console.log("updateUserById result:", upErr);
  } else {
    const { error: crErr } = await supabaseAdmin.auth.admin.createUser({ email, password: pwd, email_confirm: true });
    console.log("createUser result:", crErr);
  }
  
  const { data: signInData, error: signInErr } = await supabaseAnon.auth.signInWithPassword({ email, password: pwd });
  console.log("signInWithPassword result:", { error: signInErr?.message, user: !!signInData?.user });
}

test().catch(console.error);
