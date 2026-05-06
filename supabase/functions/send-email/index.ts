// Supabase Edge Function — Email sender via Resend
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = "TradyncApp <hola@tradyncapp.com>";
const APP_URL        = "https://tradyncapp.com";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

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
<div class="footer">© 2025 TradyncApp · <a href="${APP_URL}" style="color:#5a5a7a">tradyncapp.com</a></div>
</div></body></html>`;
}

const TEMPLATES: Record<string, (d: any) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "¡Bienvenido a TradyncApp! 🚀",
    html: baseTemplate(`
      <h1 class="title">Hola ${d.name ?? "Trader"} 👋</h1>
      <p class="text">Tu cuenta está lista. Empieza registrando tu primera operación.</p>
      <ul style="color:#8b8ba8;font-size:14px;line-height:2">
        <li>📊 Analiza tus operaciones con estadísticas avanzadas</li>
        <li>✍️ Lleva un diario de trading</li>
        <li>💪 Sigue tus hábitos diarios</li>
        <li>🤖 Conecta MT4/MT5 con el Gestor EA</li>
      </ul><br>
      <a href="${APP_URL}/app" class="btn">Ir al dashboard →</a>`),
  }),
  daily_summary: (d) => ({
    subject: `📊 Resumen del ${d.fecha ?? "hoy"} — TradyncApp`,
    html: baseTemplate(`
      <h1 class="title">Resumen del día</h1>
      <p class="text">${d.fecha ?? new Date().toLocaleDateString("es")}</p><hr>
      <div class="stat"><div class="stat-label">P&L del día</div>
        <div class="stat-value ${(d.pnl??0)>=0?"green":"red"}">${(d.pnl??0)>=0?"+":"-"}$${Math.abs(d.pnl??0).toFixed(2)}</div></div>
      <div class="stat"><div class="stat-label">Operaciones</div><div class="stat-value">${d.ops??0}</div></div>
      <div class="stat"><div class="stat-label">Win Rate</div><div class="stat-value">${d.wr??0}%</div></div><br>
      <a href="${APP_URL}/app/estadisticas" class="btn">Ver estadísticas →</a>`),
  }),
  trial_ending: (d) => ({
    subject: "⏰ Tu prueba gratuita termina en 3 días",
    html: baseTemplate(`
      <h1 class="title">Tu prueba termina pronto</h1>
      <p class="text">Hola ${d.name??"Trader"}, tu prueba gratuita termina en <strong style="color:#f8f8ff">3 días</strong>.</p>
      <p class="text">Activa tu plan para seguir con acceso completo.</p><br>
      <a href="${APP_URL}/app/perfil?tab=facturacion" class="btn">Activar mi plan →</a>
      <p class="text" style="font-size:12px;margin-top:16px">Basic 9€/mes · Pro 29€/mes · Cancela cuando quieras</p>`),
  }),
  payment_failed: (d) => ({
    subject: "⚠️ Problema con tu pago — TradyncApp",
    html: baseTemplate(`
      <h1 class="title">No hemos podido procesar tu pago</h1>
      <p class="text">Ha habido un problema al renovar tu suscripción. Actualiza tu método de pago.</p><br>
      <a href="https://billing.stripe.com" class="btn">Actualizar método de pago →</a>`),
  }),
  reminder_diario: (d) => ({
    subject: "✍️ ¿Has escrito tu diario hoy?",
    html: baseTemplate(`
      <h1 class="title">Reflexión del día</h1>
      <p class="text">Hola ${d.name??"Trader"}, recuerda escribir tu reflexión de hoy.</p><br>
      <a href="${APP_URL}/app/diario" class="btn">Abrir el diario →</a>`),
  }),
  reminder_habitos: (d) => ({
    subject: "💪 ¿Has registrado tus hábitos?",
    html: baseTemplate(`
      <h1 class="title">Hábitos del día</h1>
      <p class="text">Hola ${d.name??"Trader"}, no olvides registrar tus hábitos de hoy.</p><br>
      <a href="${APP_URL}/app/habitos" class="btn">Registrar hábitos →</a>`),
  }),
  reminder_premarket: (d) => ({
    subject: "📋 Pre-market checklist — TradyncApp",
    html: baseTemplate(`
      <h1 class="title">¿Listo para la sesión?</h1>
      <p class="text">Hola ${d.name??"Trader"}, completa tu checklist antes de operar.</p><br>
      <a href="${APP_URL}/app/premarket" class="btn">Abrir checklist →</a>`),
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
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
