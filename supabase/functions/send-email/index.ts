// Supabase Edge Function — envío de emails por Resend
//
// Uso interno: solo la llaman otras funciones del servidor (stripe-webhook),
// que se identifican con la clave de servicio. Desplegar con verify_jwt = false;
// la comprobación se hace aquí.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FROM_EMAIL     = "TradyncApp <hola@tradyncapp.com>";
const APP_URL        = "https://tradyncapp.com";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Texto del usuario dentro de HTML
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const nameOf = (d: { name?: unknown }) => esc(d?.name || "Trader");

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,sans-serif}
  .wrap{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:#111118;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#6d28d9,#4f46e5);padding:28px;text-align:center}
  .logo{font-size:20px;font-weight:700;color:white}
  .body{padding:28px}
  .title{font-size:22px;font-weight:700;color:#f8f8ff;margin:0 0 12px}
  .text{font-size:14px;color:#8b8ba8;line-height:1.6;margin:0 0 16px}
  .btn{display:inline-block;background:linear-gradient(135deg,#6d28d9,#4f46e5);color:white!important;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px}
  .stat{background:#0d0d1a;border:1px solid #1e1e2e;border-radius:10px;padding:16px;margin:8px 0}
  .stat-label{font-size:11px;color:#5a5a7a;text-transform:uppercase;letter-spacing:.1em}
  .stat-value{font-size:24px;font-weight:700;color:#f8f8ff;font-family:monospace}
  .green{color:#22c55e}.red{color:#ef4444}
  hr{border:none;border-top:1px solid #1e1e2e;margin:20px 0}
  .footer{text-align:center;padding:16px;font-size:11px;color:#3a3a5a}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header"><div class="logo">TradyncApp</div></div>
  <div class="body">${content}</div>
</div>
<div class="footer">© ${new Date().getFullYear()} TradyncApp · <a href="${APP_URL}" style="color:#5a5a7a">tradyncapp.com</a></div>
</div></body></html>`;
}

const TEMPLATES: Record<string, (d: any) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "¡Bienvenido a TradyncApp! 🚀",
    html: baseTemplate(`
      <h1 class="title">Hola ${nameOf(d)} 👋</h1>
      <p class="text">Tu cuenta está lista. Empieza registrando tu primera operación.</p>
      <ul style="color:#8b8ba8;font-size:14px;line-height:2">
        <li>📊 Analiza tus operaciones con estadísticas avanzadas</li>
        <li>✍️ Lleva un diario de trading</li>
        <li>💪 Sigue tus hábitos diarios</li>
        <li>🤖 Conecta MT4/MT5 con el Gestor EA</li>
      </ul><br>
      <a href="${APP_URL}/app" class="btn">Ir al dashboard →</a>`),
  }),
  trial_ending: (d) => ({
    subject: "⏰ Tu prueba gratuita termina en 3 días",
    html: baseTemplate(`
      <h1 class="title">Tu prueba termina pronto</h1>
      <p class="text">Hola ${nameOf(d)}, tu prueba gratuita termina en <strong style="color:#f8f8ff">3 días</strong>.</p>
      <p class="text">Al terminar, tu plan se renovará con la tarjeta que indicaste. Si no quieres continuar, puedes cancelarlo antes desde tu perfil.</p><br>
      <a href="${APP_URL}/app/perfil" class="btn">Gestionar mi plan →</a>
      <p class="text" style="font-size:12px;margin-top:16px">Basic 9€/mes · Pro 29€/mes · Cancela cuando quieras</p>`),
  }),
  payment_failed: (d) => ({
    subject: "⚠️ Problema con tu pago — TradyncApp",
    html: baseTemplate(`
      <h1 class="title">No hemos podido procesar tu pago</h1>
      <p class="text">Ha habido un problema al renovar tu suscripción. Actualiza tu método de pago.</p><br>
      <a href="${APP_URL}/app/perfil" class="btn">Actualizar método de pago →</a>
      <p class="text" style="font-size:12px;margin-top:16px">En tu perfil, pulsa «Gestionar o cancelar» para abrir el portal de pago.</p>`),
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!SERVICE_KEY || req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  try {
    const { type, to, data } = await req.json() as { type: string; to: string; data: Record<string,unknown> };
    if (!type || !to)        return json({ error: "Missing type or to" }, 400);
    if (!RESEND_API_KEY)     return json({ error: "RESEND_API_KEY not configured" }, 500);
    const template = TEMPLATES[type];
    if (!template)           return json({ error: `Unknown template: ${type}` }, 400);
    const { subject, html }  = template(data ?? {});
    const result             = await sendEmail(to, subject, html);
    console.log(`✓ Email: type=${type} to=${to} id=${result.id}`);
    return json({ ok: true, id: result.id });
  } catch (err) {
    console.error("send-email error:", err);
    return json({ error: String(err) }, 500);
  }
});
