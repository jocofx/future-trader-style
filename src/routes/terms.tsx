import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
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

        <h1 className="text-3xl font-bold mb-2">Términos de Uso</h1>
        <p className="text-muted-foreground text-sm mb-8">Última actualización: 1 de mayo de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y utilizar TradyncApp, aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte, no utilices el servicio.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">2. Descripción del servicio</h2>
            <p>TradyncApp es una plataforma de journal de trading que permite a los traders registrar, analizar y mejorar su operativa. El servicio incluye:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Registro manual y automático de operaciones de trading.</li>
              <li>Sincronización con MetaTrader 4/5 mediante Expert Advisors.</li>
              <li>Análisis de estadísticas y rendimiento.</li>
              <li>Journal de trading, hábitos y checklist premarket.</li>
              <li>Capital Tracker para gestión de inversiones.</li>
              <li>Coach IA basado en los datos del usuario (plan Pro).</li>
              <li>Gestor de riesgo con límites configurables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">3. Registro y cuenta</h2>
            <p>Para usar TradyncApp debes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Tener al menos 18 años.</li>
              <li>Proporcionar información veraz y actualizada.</li>
              <li>Mantener la confidencialidad de tus credenciales.</li>
              <li>Notificarnos inmediatamente si sospechas de acceso no autorizado.</li>
            </ul>
            <p className="mt-2">Eres responsable de toda la actividad que ocurra bajo tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">4. Planes y pagos</h2>
            <p>TradyncApp ofrece los siguientes planes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Free:</strong> acceso limitado sin coste.</li>
              <li><strong className="text-foreground">Basic:</strong> 9€/mes o 84€/año.</li>
              <li><strong className="text-foreground">Pro:</strong> 29€/mes o 264€/año.</li>
            </ul>
            <p className="mt-2">Los pagos se procesan de forma segura a través de Stripe. Las suscripciones se renuevan automáticamente al final de cada período. Puedes cancelar en cualquier momento desde tu perfil; el acceso se mantiene hasta el final del período pagado.</p>
            <p className="mt-2">No realizamos reembolsos una vez iniciado el período de facturación, salvo en los casos previstos por la legislación aplicable.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">5. Uso aceptable</h2>
            <p>Te comprometes a no:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Usar el servicio para actividades ilegales o fraudulentas.</li>
              <li>Intentar acceder sin autorización a sistemas o cuentas ajenas.</li>
              <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente.</li>
              <li>Utilizar el servicio para distribuir malware o contenido dañino.</li>
              <li>Revender o sublicenciar el acceso a la plataforma.</li>
              <li>Crear cuentas múltiples para eludir límites del plan gratuito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">6. Propiedad intelectual</h2>
            <p>TradyncApp y todo su contenido (código, diseño, textos, logos) son propiedad exclusiva de TradyncApp. No se concede ninguna licencia para reproducir, modificar o distribuir nuestro contenido sin autorización expresa.</p>
            <p className="mt-2">Los datos que introduces en la plataforma (operaciones, journal, etc.) son tuyos. TradyncApp no reivindica ninguna propiedad sobre ellos.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">7. Descargo de responsabilidad financiera</h2>
            <p className="font-semibold text-warning">TradyncApp es una herramienta de journal y análisis de trading. No proporciona asesoramiento financiero, de inversión ni recomendaciones de trading.</p>
            <p className="mt-2">El Coach IA y las estadísticas son herramientas de apoyo basadas en tus propios datos históricos. No garantizamos resultados futuros. El trading conlleva riesgo de pérdida de capital. Tus decisiones de inversión son tu exclusiva responsabilidad.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">8. Disponibilidad del servicio</h2>
            <p>Nos esforzamos por mantener el servicio disponible 24/7 pero no garantizamos una disponibilidad ininterrumpida. Podemos realizar mantenimientos que interrumpan temporalmente el servicio, avisando con antelación siempre que sea posible.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">9. Limitación de responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, TradyncApp no será responsable de daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del servicio. Nuestra responsabilidad total no superará el importe pagado por el usuario en los últimos 12 meses.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">10. Programa de afiliados</h2>
            <p>TradyncApp ofrece un programa de afiliados con comisiones por referidos. Las comisiones se aplican según el plan del afiliado y el volumen de referidos. Nos reservamos el derecho de modificar o cancelar el programa con previo aviso. Las comisiones fraudulentas serán anuladas.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">11. Cancelación y terminación</h2>
            <p>Puedes cancelar tu cuenta en cualquier momento desde Perfil → Facturación o contactándonos. Podemos suspender o cancelar tu cuenta si incumples estos términos, con o sin previo aviso según la gravedad.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">12. Cambios en los términos</h2>
            <p>Podemos modificar estos términos ocasionalmente. Los cambios materiales se notificarán por email con al menos 30 días de antelación. El uso continuado del servicio tras los cambios implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">13. Legislación aplicable</h2>
            <p>Estos términos se rigen por la legislación española. Para cualquier disputa, ambas partes se someten a los juzgados y tribunales competentes de España.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-3">14. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos: <a href="mailto:hola@tradyncapp.com" className="text-primary hover:underline">hola@tradyncapp.com</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 TradyncApp</span>
          <Link to="/privacy" className="hover:text-foreground transition">Política de Privacidad →</Link>
        </div>
      </div>
    </div>
  );
}
