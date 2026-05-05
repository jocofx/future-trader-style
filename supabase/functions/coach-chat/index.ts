// Supabase Edge Function — Coach Chat
// Proxies requests to Anthropic API
// - Pro users: uses app's API key (ANTHROPIC_API_KEY secret)
// - Other users: uses user-provided key (x-user-api-key header)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type,x-user-api-key",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user session
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // Check plan
    const { data: sub } = await supabase
      .from("suscripciones")
      .select("plan,activa")
      .eq("user_id", user.id)
      .eq("activa", true)
      .maybeSingle();

    const plan = sub?.plan ?? "free";
    const isPro = plan === "pro";

    // Determine API key to use
    const userApiKey = req.headers.get("x-user-api-key");
    const appApiKey  = Deno.env.get("ANTHROPIC_API_KEY");

    const apiKey = isPro ? (appApiKey ?? userApiKey) : userApiKey;
    if (!apiKey) {
      return json({
        error: isPro
          ? "Anthropic API key not configured on server. Contact support."
          : "API key required. Add your Anthropic API key in the Coach settings.",
        requires_key: !isPro,
      }, 402);
    }

    // Check Pro message quota (simple: count messages today)
    if (isPro && appApiKey) {
      // Monthly quota key (YYYY-MM)
    const today = new Date().toISOString().slice(0, 7);
      const { count } = await supabase
        .from("configuracion")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("clave", `coach_msg_month_${today}`);

      // Get current count
      const { data: quota } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("user_id", user.id)
        .eq("clave", `coach_msg_month_${today}`)
        .maybeSingle();

      const used = (quota?.valor as number) ?? 0;
      if (used >= 150) return json({ error: "Has alcanzado el límite de 150 mensajes/mes del plan Pro." }, 429);

      // Increment counter
      await supabase.from("configuracion").upsert({
        user_id: user.id,
        clave: `coach_msg_month_${today}`,
        valor: used + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,clave" });
    }

    const body = await req.json();

    // Call Anthropic
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return json({ error: (err as any).error?.message ?? `Anthropic error ${response.status}` }, 502);
    }

    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error("coach-chat error:", err);
    return json({ error: String(err) }, 500);
  }
});
