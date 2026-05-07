import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">TradyncApp</span>
          </Link>
        </div>

        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground text-sm mb-8">Última actualización: 1 de mayo de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">1. Responsable del tratamiento</h2>
            <p>TradyncApp es el responsable del tratamiento de los datos personales recogidos a través de esta plataforma. Para cualquier consulta relacionada con tu privacidad, puedes contactarnos en <a href="mailto:hola@tradyncapp.com" className="text-primary hover:underline">hola@tradyncapp.com</a>.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">2. Datos que recopilamos</h2>
            <p>Recopilamos los siguientes datos cuando utilizas TradyncApp:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Datos de cuenta:</strong> email, nombre, foto de perfil (si usas Google OAuth).</li>
              <li><strong className="text-foreground">Datos de trading:</strong> operaciones, cuentas de broker, métricas de rendimiento que introduces manualmente o a través del Gestor EA.</li>
              <li><strong className="text-foreground">Datos de uso:</strong> journal de trading, hábitos, checklist premarket, Capital Tracker.</li>
              <li><strong className="text-foreground">Datos de pago:</strong> procesados exclusivamente por Stripe. No almacenamos datos de tarjetas.</li>
              <li><strong className="text-foreground">Datos técnicos:</strong> dirección IP, navegador, dispositivo, para garantizar la seguridad del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Prestarte el servicio de journal de trading y análisis de rendimiento.</li>
              <li>Sincronizar tus operaciones desde MetaTrader 4/5 mediante el Gestor EA.</li>
              <li>Proporcionar el servicio de Coach IA personalizado basado en tus datos de trading.</li>
              <li>Gestionar tu suscripción y procesar los pagos.</li>
              <li>Enviarte comunicaciones del servicio (recordatorios, resúmenes, notificaciones push) si así lo configuras.</li>
              <li>Mejorar la plataforma y detectar errores técnicos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">4. Base legal</h2>
            <p>El tratamiento de tus datos se basa en:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Ejecución de contrato:</strong> para prestarte el servicio contratado.</li>
              <li><strong className="text-foreground">Interés legítimo:</strong> para mejorar la seguridad y el funcionamiento de la plataforma.</li>
              <li><strong className="text-foreground">Consentimiento:</strong> para el envío de notificaciones push y emails de recordatorio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">5. Conservación de datos</h2>
            <p>Conservamos tus datos mientras mantengas una cuenta activa en TradyncApp. Si cancelas tu cuenta, eliminaremos tus datos personales en un plazo máximo de 30 días, salvo que la ley nos obligue a conservarlos durante más tiempo.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">6. Terceros y transferencias</h2>
            <p>Compartimos datos mínimos necesarios con los siguientes proveedores:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Supabase:</strong> base de datos y autenticación (servidores en la UE).</li>
              <li><strong className="text-foreground">Stripe:</strong> procesamiento de pagos (cumple PCI DSS).</li>
              <li><strong className="text-foreground">Anthropic:</strong> procesamiento de mensajes del Coach IA (solo usuarios Pro).</li>
              <li><strong className="text-foreground">Resend:</strong> envío de emails transaccionales.</li>
              <li><strong className="text-foreground">Vercel:</strong> hosting de la aplicación.</li>
            </ul>
            <p className="mt-2">No vendemos tus datos a terceros ni los usamos para publicidad.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">7. Tus derechos</h2>
            <p>Conforme al RGPD, tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Acceso:</strong> obtener una copia de tus datos personales.</li>
              <li><strong className="text-foreground">Rectificación:</strong> corregir datos incorrectos.</li>
              <li><strong className="text-foreground">Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong className="text-foreground">Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
              <li><strong className="text-foreground">Oposición:</strong> oponerte al tratamiento en determinadas circunstancias.</li>
            </ul>
            <p className="mt-2">Para ejercer tus derechos, escríbenos a <a href="mailto:hola@tradyncapp.com" className="text-primary hover:underline">hola@tradyncapp.com</a>.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">8. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS/TLS), autenticación segura, Row Level Security en base de datos y acceso restringido al personal.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">9. Cookies</h2>
            <p>TradyncApp utiliza únicamente cookies técnicas necesarias para el funcionamiento del servicio (sesión de usuario). No utilizamos cookies de seguimiento ni publicitarias.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">10. Cambios en esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos por email si los cambios son significativos. La fecha de última actualización siempre aparece al inicio del documento.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">11. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad: <a href="mailto:hola@tradyncapp.com" className="text-primary hover:underline">hola@tradyncapp.com</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 TradyncApp</span>
          <Link to="/terms" className="hover:text-foreground transition">Términos de uso →</Link>
        </div>
      </div>
    </div>
  );
}
