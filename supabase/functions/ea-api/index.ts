// Supabase Edge Function — EA API
// Receives data from MT4/MT5 EA → saves to Supabase
// Serves risk config and commands back to EA

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type,x-auth-token",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function getUser(token: string): Promise<string | null> {
  const { data } = await supabase
    .from("api_keys").select("user_id").eq("token", token).maybeSingle();
  return data?.user_id ?? null;
}

async function getEAId(userId: string, token: string, body: Record<string,unknown> = {}): Promise<string | null> {
  const { data: ex } = await supabase
    .from("ea_instances").select("id").eq("token", token).maybeSingle();
  if (ex?.id) return ex.id;

  const { data } = await supabase.from("ea_instances").insert({
    user_id: userId, token,
    platform:       body.platform ?? "MT5",
    account_number: String(body.account_number ?? ""),
    broker:         body.broker ?? null,
    server:         body.server ?? null,
    currency:       body.currency ?? "USD",
    leverage:       body.leverage ?? null,
    account_type:   body.account_type ?? "demo",
    status:         "active",
    connected_at:   new Date().toISOString(),
  }).select("id").single();
  return data?.id ?? null;
}

async function pendingCmds(eaId: string) {
  const { data } = await supabase
    .from("ea_commands").select("id,type,payload")
    .eq("ea_instance_id", eaId).eq("executed", false);
  if (data?.length) {
    await supabase.from("ea_commands")
      .update({ executed: true, executed_at: new Date().toISOString() })
      .in("id", data.map((c:any) => c.id));
  }
  return data ?? [];
}

async function riskConfig(eaId: string) {
  const { data } = await supabase.from("ea_instances")
    .select("max_ops_dia,limite_perdida,limite_ganancia,hora_inicio,hora_fin,modo_restrictivo,status")
    .eq("id", eaId).single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url   = new URL(req.url);
  const path  = url.pathname.replace(/.*\/ea-api/, "") || "/";
  const token = req.headers.get("x-auth-token") ?? url.searchParams.get("token") ?? "";

  if (!token) return json({ error: "Token requerido" }, 401);
  const userId = await getUser(token);
  if (!userId) return json({ error: "Token inválido" }, 401);

  try {
    const body: Record<string,unknown> = req.method === "POST"
      ? await req.json().catch(() => ({})) : {};

    // ── /mt-register ─────────────────────────────────────────────
    if (path === "/mt-register") {
      const eaId = await getEAId(userId, token, body);
      if (!eaId) return json({ error: "Error creando instancia" }, 500);
      await supabase.from("ea_instances").update({
        platform: body.platform ?? "MT5",
        account_number: String(body.account_number ?? ""),
        broker: body.broker ?? null, server: body.server ?? null,
        balance: body.balance ?? null, status: "active",
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", eaId);
      const cfg = await riskConfig(eaId);
      console.log(`✓ Register: user=${userId} ea=${eaId}`);
      return json({ ok: true, ea_id: eaId, risk_config: cfg });
    }

    // ── /mt-sync ──────────────────────────────────────────────────
    if (path === "/mt-sync") {
      const eaId = await getEAId(userId, token, {});
      if (!eaId) return json({ ok: true });
      await supabase.from("ea_instances")
        .update({ last_ping: new Date().toISOString(), status: "active", updated_at: new Date().toISOString() })
        .eq("id", eaId);
      const cmds = await pendingCmds(eaId);
      return json({ ok: true, commands: cmds.map((c:any) => c.type) });
    }

    // ── /mt-trade ─────────────────────────────────────────────────
    if (path === "/mt-trade") {
      const ticket = String(body.ticket ?? "");
      if (ticket) {
        const { data: dup } = await supabase.from("operaciones")
          .select("id").eq("user_id", userId).eq("mt_ticket", ticket).maybeSingle();
        if (dup) return json({ ok: true, duplicate: true });
      }
      await supabase.from("operaciones").insert({
        user_id: userId,
        instrumento: body.symbol ?? "UNKNOWN",
        tipo: body.type ?? "BUY", direccion: body.type ?? "BUY",
        fecha: ((body.close_time ?? new Date().toISOString()) as string).slice(0, 10),
        entrada: body.open_price ?? null, tp: body.close_price ?? null, sl: null,
        contratos: body.volume ?? null, resultado: body.profit ?? null,
        estado: "Cerrada", mt_ticket: ticket || null,
        mt_sincronizada: true, plataforma: body.platform ?? "MT5",
        cuenta: body.account ? String(body.account) : null,
      });
      console.log(`✓ Trade: user=${userId} ${body.symbol} profit=${body.profit}`);
      return json({ ok: true });
    }

    // ── /mt-score ─────────────────────────────────────────────────
    if (path === "/mt-score") {
      const eaId = await getEAId(userId, token, {});
      if (!eaId) return json({ ok: true });
      await supabase.from("ea_instances").update({
        score: body.score ?? 0, perfil: body.perfil ?? "Disciplinado",
        disciplina: body.disciplina ?? 100, violaciones_hoy: body.violaciones_hoy ?? 0,
        balance: body.balance ?? null, equity: body.equity ?? null,
        pnl_dia: body.pnl_dia ?? 0,
        last_ping: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("id", eaId);
      const [cfg, cmds] = await Promise.all([riskConfig(eaId), pendingCmds(eaId)]);
      return json({ ok: true, risk_config: cfg, commands: cmds.map((c:any) => c.type) });
    }

    // ── /mt-commands (GET) ────────────────────────────────────────
    if (path === "/mt-commands") {
      const eaId = await getEAId(userId, token, {});
      if (!eaId) return json({ commands: [], risk_config: null });
      await supabase.from("ea_instances")
        .update({ last_ping: new Date().toISOString() }).eq("id", eaId);
      const [cfg, cmds] = await Promise.all([riskConfig(eaId), pendingCmds(eaId)]);
      return json({ commands: cmds, risk_config: cfg });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("EA API error:", err);
    return json({ error: String(err) }, 500);
  }
});
