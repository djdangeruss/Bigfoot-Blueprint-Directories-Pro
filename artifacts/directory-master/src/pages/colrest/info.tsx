import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Scale, Send, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n";

export type InfoPageKey = "about" | "methodology" | "privacy" | "terms" | "owner-terms" | "accessibility" | "corrections";

type Section = { heading: string; paragraphs?: string[]; bullets?: string[] };
type PageCopy = { eyebrow: string; title: string; intro: string; sections: Section[] };

const EN: Record<InfoPageKey, PageCopy> = {
  about: {
    eyebrow: "About the directory",
    title: "A better way to find Colombian food",
    intro: "Colombian Restaurant Near Me is an independent bilingual discovery directory built to help diners find useful restaurant information and help legitimate owners control and improve their pages.",
    sections: [
      { heading: "What we are building", paragraphs: ["The long-term goal is a trusted national map of Colombian restaurants: neighborhood institutions, bakeries, cafés, food halls, regional kitchens and new concepts. Coverage begins in South Florida and expands only as listing details can be grounded and reviewed."] },
      { heading: "What makes the directory different", bullets: ["Consumer usefulness comes before paid placement.", "Ratings remain attributed to their original public sources.", "Claimed status means ownership was reviewed; it does not mean the directory endorses the restaurant.", "Owners can add current hours, menus, licensed photos and their own story without rewriting the source history.", "Unverified details, scraped photos and unsupported claims are not treated as publication-ready content."] },
      { heading: "Independent, not official", paragraphs: ["The directory is not affiliated with Google, Yelp, TripAdvisor or the restaurants it lists unless a relationship is expressly disclosed. Restaurant names and third-party platform names remain the property of their respective owners."] },
    ],
  },
  methodology: {
    eyebrow: "Trust & transparency",
    title: "How ratings and discovery work",
    intro: "The directory is designed to make public reputation signals easier to compare without pretending they are our own customer reviews or a continuously live official feed.",
    sections: [
      { heading: "Source attribution", paragraphs: ["When available, a listing shows each platform score separately and names its source. Source links are included where the underlying record contains an attributable URL. A platform name does not imply sponsorship, endorsement or an official integration."] },
      { heading: "Directory summary score", paragraphs: ["When more than one source is present, the displayed directory score is a review-count-weighted summary: each available rating is multiplied by its recorded review count, those values are added, and the result is divided by the total recorded reviews. If counts are unavailable, a simple average is used."], bullets: ["It is not a new review submitted to this directory.", "It is not published as first-party aggregateRating structured data.", "It can become stale between source checks.", "Visitors should open the named source before making a time-sensitive decision."] },
      { heading: "Discovery collections and sorting", paragraphs: ["Highest-rated and highly-reviewed views use the stored source-attributed score and review volume. A minimum review threshold may be used to prevent tiny samples from dominating a collection. Alphabetical and newest sorting do not use reputation. Paid or featured status must be labeled and does not silently change the underlying rating score."] },
      { heading: "Verification and freshness", paragraphs: ["Verified means the directory reviewed an ownership or management claim. It is not a quality award. Listing pages show their last update when available. Owners and visitors can submit corrections; material disputes may cause a field or page to be limited while evidence is reviewed."] },
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy policy",
    intro: "Effective July 18, 2026. This policy explains the information the directory receives, why it is used and the choices available to visitors and restaurant owners.",
    sections: [
      { heading: "Information we receive", bullets: ["Basic server and security logs, such as request time, route, device/browser information and network identifiers.", "Search, language and interface interactions when analytics is enabled.", "Language and theme preferences stored in your browser.", "Owner claim information, including name, business email, phone, verification context and a password stored only as a secure hash.", "Owner-provided listing content, licensed photos, menu links and upgrade requests.", "Information submitted through correction or takedown requests."] },
      { heading: "How information is used", bullets: ["Operate, secure and improve the directory.", "Review ownership claims and listing corrections.", "Maintain audit records of owner-controlled changes.", "Measure useful directory interactions without selling personal information.", "Respond to abuse, fraud, legal requests and security incidents."] },
      { heading: "Service providers and third parties", paragraphs: ["Infrastructure, database, analytics, email, storage and security providers may process limited information on our behalf. Restaurant websites, maps and reputation-source links have their own privacy practices. We do not control those third-party destinations."] },
      { heading: "Retention and security", paragraphs: ["Information is retained only as long as reasonably needed for directory operations, claim history, dispute resolution, security and legal obligations. Reasonable technical and organizational safeguards are used, but no internet service can promise absolute security."] },
      { heading: "Your choices", bullets: ["You can avoid optional analytics through applicable browser or consent controls.", "You can clear locally stored language/theme preferences in your browser.", "Owners may update their controlled listing data through the dashboard.", "Anyone may request correction, access or deletion review through the corrections page. Some records may be retained where required for fraud prevention, legal compliance or claim-history integrity."] },
      { heading: "Children", paragraphs: ["The directory is a general-audience service and is not directed to children under 13. We do not knowingly request personal information from children."] },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of use",
    intro: "Effective July 18, 2026. By using the public directory, you agree to these terms. Restaurant owners using claim or dashboard features also agree to the Owner Terms.",
    sections: [
      { heading: "Informational directory", paragraphs: ["Listings are provided for discovery and informational purposes. Details may be incomplete, disputed, owner-updated or stale. Confirm hours, prices, menus, accessibility, dietary suitability, availability and other time-sensitive information directly with the restaurant."] },
      { heading: "Ratings and third-party services", paragraphs: ["Named platform ratings remain attributed to their source and are not reviews collected by this directory. The directory is not sponsored or endorsed by those platforms. External links are provided for convenience and are governed by the destination's terms."] },
      { heading: "Acceptable use", bullets: ["Do not scrape, overload, reverse engineer or disrupt the service except as permitted by law and published crawler controls.", "Do not impersonate an owner, submit false claims, manipulate ratings or upload content you do not have permission to use.", "Do not use the directory to harass, discriminate, defraud or violate another party's rights."] },
      { heading: "Intellectual property and corrections", paragraphs: ["The directory interface, original copy, code and branding are protected by applicable law. Restaurant and platform marks belong to their respective owners. Rights holders may submit a correction or takedown request with enough detail for review."] },
      { heading: "No warranty", paragraphs: ["The service is provided on an as-available basis to the maximum extent permitted by law. We do not guarantee completeness, uninterrupted availability, restaurant quality, reservation availability, food safety or a particular business result."] },
      { heading: "Limitation and changes", paragraphs: ["To the maximum extent permitted by law, the directory operator is not liable for indirect or consequential losses arising from reliance on listings or third-party destinations. Features and these terms may change; material changes will be dated on this page. If you do not agree, stop using the service."] },
    ],
  },
  "owner-terms": {
    eyebrow: "Restaurant owners",
    title: "Owner claim and listing terms",
    intro: "These terms apply when a person claims, verifies, edits or purchases services for a restaurant listing.",
    sections: [
      { heading: "Authority to act", paragraphs: ["You represent that you are an owner, authorized manager or authorized agent of the restaurant. The directory may request domain, phone, document or manual evidence and may reject, pause or reverse a claim when authority is uncertain or disputed."] },
      { heading: "Accurate and lawful content", bullets: ["Keep hours, contact details, menus and material business information current.", "Upload only photos, logos and copy you own or are authorized to publish.", "Do not submit deceptive offers, fabricated credentials, manipulated reviews or discriminatory/illegal content.", "Disclose material restrictions, expiration dates and paid relationships where required."] },
      { heading: "Directory control and moderation", paragraphs: ["Claiming a page does not transfer ownership of the directory record or source history. The directory may preserve attributed public facts, label owner-provided content, correct formatting, remove unsafe material, investigate disputes and limit a page when necessary to protect users or the integrity of the service."] },
      { heading: "Plans and placement", paragraphs: ["Free and paid features may change as the product develops. Any paid placement will be labeled. A plan does not guarantee traffic, leads, rankings, reservations or revenue. Pricing, renewal, cancellation and refund terms must be shown before a charge is accepted; the current upgrade-request flow does not charge a card."] },
      { heading: "Account security and termination", paragraphs: ["Keep credentials confidential and notify the directory through the corrections process if access is compromised. Access may be suspended for false claims, abuse, nonpayment, legal risk or violations of these terms. Legitimate owners may request an appeal with supporting evidence."] },
    ],
  },
  accessibility: {
    eyebrow: "Accessibility",
    title: "Accessibility statement",
    intro: "We want Colombian Restaurant Near Me to be usable by as many people as possible, including people who navigate with keyboards, screen readers, zoom or reduced-motion preferences.",
    sections: [
      { heading: "Our current approach", bullets: ["Semantic headings, landmarks and skip navigation.", "Keyboard-operable search, filters, language controls and owner flows.", "Visible focus states and touch targets designed for mobile use.", "Reduced-motion behavior for automatic discovery rails and decorative movement.", "Responsive layouts tested for horizontal overflow.", "Automated accessibility checks supplemented by browser review."] },
      { heading: "Known limitations", paragraphs: ["Third-party restaurant websites, maps, menus and reputation sources are outside our control. Owner-provided documents or images may not always meet the same standard. We continue to improve labels, contrast, language coverage and assistive-technology behavior as the product evolves."] },
      { heading: "Request help", paragraphs: ["Use the corrections and accessibility request form and select Accessibility. Include the page, device, browser, assistive technology and the barrier you encountered. We will review practical fixes and respond through the contact information you provide."] },
    ],
  },
  corrections: {
    eyebrow: "Corrections & takedowns",
    title: "Help us keep the directory accurate",
    intro: "Restaurant owners should claim their page for ongoing control. Diners, rights holders and accessibility users can use the form below to report a specific factual error, rights concern, safety issue or access barrier.",
    sections: [
      { heading: "What to include", bullets: ["The exact listing or page URL.", "The field or material you believe is wrong or should be removed.", "The correct information and a reliable supporting source.", "Your relationship to the restaurant or content, if relevant.", "A working email so the review team can request clarification."] },
      { heading: "What happens next", paragraphs: ["Submissions are reviewed, not automatically published. Materially disputed details may be limited while evidence is checked. A correction request does not guarantee removal when the information is lawfully published, independently supported or needed to preserve claim and fraud history."] },
    ],
  },
};

const ES: Record<InfoPageKey, PageCopy> = {
  about: { eyebrow: "Acerca del directorio", title: "Una mejor forma de encontrar comida colombiana", intro: "Colombian Restaurant Near Me es un directorio bilingüe e independiente creado para ayudar a los comensales a encontrar información útil y a los dueños legítimos a controlar y mejorar sus páginas.", sections: [
    { heading: "Lo que estamos construyendo", paragraphs: ["La meta es un mapa nacional confiable de restaurantes colombianos: instituciones de barrio, panaderías, cafés, plazoletas, cocinas regionales y conceptos nuevos. La cobertura comienza en el sur de Florida y crece cuando los datos pueden sustentarse y revisarse."] },
    { heading: "Qué nos hace diferentes", bullets: ["La utilidad para el comensal está antes que la ubicación pagada.", "Las calificaciones siguen atribuidas a sus fuentes originales.", "Verificado significa que revisamos la propiedad; no es un respaldo a la calidad.", "Los dueños pueden agregar horarios, menús, fotos autorizadas y su historia.", "No publicamos fotos extraídas ni afirmaciones sin sustento como si fueran autorizadas."] },
    { heading: "Independiente, no oficial", paragraphs: ["El directorio no está afiliado con Google, Yelp, TripAdvisor ni con los restaurantes listados, salvo que una relación se informe expresamente. Los nombres y marcas pertenecen a sus respectivos dueños."] },
  ] },
  methodology: { eyebrow: "Confianza y transparencia", title: "Cómo funcionan las calificaciones y el descubrimiento", intro: "Organizamos señales públicas de reputación sin presentarlas como reseñas propias ni como una integración oficial en tiempo real.", sections: [
    { heading: "Atribución de fuentes", paragraphs: ["Cuando están disponibles, mostramos cada puntuación por separado y nombramos su fuente. Incluimos enlaces cuando el registro contiene una URL atribuible. Nombrar una plataforma no implica patrocinio, respaldo ni integración oficial."] },
    { heading: "Puntuación resumida", paragraphs: ["Cuando hay más de una fuente, la puntuación del directorio se pondera por cantidad de reseñas: cada calificación se multiplica por su número registrado de reseñas, se suman los valores y se dividen por el total. Si no hay conteos, se usa un promedio simple."], bullets: ["No es una nueva reseña enviada al directorio.", "No se publica como aggregateRating propio en datos estructurados.", "Puede quedar desactualizada entre verificaciones.", "Para decisiones sensibles al tiempo, visita la fuente nombrada."] },
    { heading: "Colecciones y orden", paragraphs: ["Las vistas por calificación o volumen usan la puntuación almacenada y atribuida. Puede exigirse un mínimo de reseñas para evitar que muestras pequeñas dominen. La ubicación pagada se identifica y no altera silenciosamente la puntuación."] },
    { heading: "Verificación y vigencia", paragraphs: ["Verificado significa que revisamos un reclamo de propiedad o administración. No es un premio de calidad. Los dueños y visitantes pueden enviar correcciones y los datos disputados pueden limitarse mientras se revisa la evidencia."] },
  ] },
  privacy: { eyebrow: "Privacidad", title: "Política de privacidad", intro: "Vigente desde el 18 de julio de 2026. Esta política explica la información que recibe el directorio, para qué se utiliza y qué opciones tienen visitantes y dueños.", sections: [
    { heading: "Información que recibimos", bullets: ["Registros básicos del servidor y seguridad.", "Búsquedas e interacciones cuando las analíticas están activas.", "Preferencias de idioma y tema guardadas en el navegador.", "Datos de reclamos, verificación y contraseñas almacenadas únicamente como hash seguro.", "Contenido, fotos autorizadas, menús y solicitudes enviados por dueños.", "Información enviada en solicitudes de corrección o retiro."] },
    { heading: "Cómo se utiliza", bullets: ["Operar, proteger y mejorar el directorio.", "Revisar reclamos y correcciones.", "Mantener auditoría de cambios controlados por dueños.", "Medir interacciones útiles sin vender información personal.", "Responder a fraude, abuso, solicitudes legales e incidentes."] },
    { heading: "Proveedores y terceros", paragraphs: ["Proveedores de infraestructura, base de datos, analítica, correo, almacenamiento y seguridad pueden procesar información limitada por nuestra cuenta. Los sitios externos tienen sus propias políticas."] },
    { heading: "Retención y seguridad", paragraphs: ["Conservamos información el tiempo razonablemente necesario para operar, resolver disputas, prevenir fraude y cumplir obligaciones. Aplicamos salvaguardas razonables, pero ningún servicio de internet puede prometer seguridad absoluta."] },
    { heading: "Tus opciones", bullets: ["Puedes evitar analíticas opcionales mediante controles aplicables.", "Puedes borrar preferencias locales en tu navegador.", "Los dueños pueden actualizar datos desde su panel.", "Cualquier persona puede solicitar revisión de acceso, corrección o eliminación; ciertos registros pueden conservarse por seguridad, ley o integridad del historial."] },
    { heading: "Menores", paragraphs: ["El directorio es para público general y no está dirigido a menores de 13 años. No solicitamos deliberadamente información personal de menores."] },
  ] },
  terms: { eyebrow: "Legal", title: "Términos de uso", intro: "Vigentes desde el 18 de julio de 2026. Al usar el directorio aceptas estos términos. Los dueños también aceptan los Términos para Dueños.", sections: [
    { heading: "Directorio informativo", paragraphs: ["Las páginas sirven para descubrimiento e información. Confirma directamente con el restaurante horarios, precios, menús, accesibilidad, restricciones alimentarias y disponibilidad."] },
    { heading: "Calificaciones y terceros", paragraphs: ["Las calificaciones nombradas siguen atribuidas a su fuente y no son reseñas recolectadas por este directorio. Los enlaces externos se rigen por los términos del destino."] },
    { heading: "Uso aceptable", bullets: ["No sobrecargues, extraigas masivamente, reviertas ni interrumpas el servicio fuera de lo permitido por ley y controles publicados.", "No suplantes dueños, presentes reclamos falsos, manipules puntuaciones ni subas contenido sin derechos.", "No uses el directorio para fraude, acoso, discriminación ni violación de derechos."] },
    { heading: "Propiedad intelectual y correcciones", paragraphs: ["La interfaz, código, texto original y marca están protegidos. Las marcas de restaurantes y plataformas pertenecen a sus dueños. Los titulares pueden solicitar corrección o retiro con información suficiente."] },
    { heading: "Sin garantía", paragraphs: ["El servicio se ofrece según disponibilidad y hasta donde lo permita la ley. No garantizamos integridad, disponibilidad ininterrumpida, calidad, seguridad alimentaria, reservas ni resultados comerciales."] },
    { heading: "Limitación y cambios", paragraphs: ["Hasta donde lo permita la ley, el operador no responde por pérdidas indirectas derivadas de confiar en páginas o sitios externos. Las funciones y términos pueden cambiar; los cambios materiales llevarán nueva fecha."] },
  ] },
  "owner-terms": { eyebrow: "Dueños de restaurantes", title: "Términos para reclamar y administrar páginas", intro: "Aplican cuando una persona reclama, verifica, edita o compra servicios para una página.", sections: [
    { heading: "Autoridad", paragraphs: ["Declaras ser dueño, administrador autorizado o agente autorizado. Podemos solicitar evidencia de dominio, teléfono, documentos o revisión manual, y pausar o revertir reclamos dudosos."] },
    { heading: "Contenido exacto y lícito", bullets: ["Mantén actualizados horarios y datos materiales.", "Sube solo fotos, logos y texto que puedas publicar.", "No envíes ofertas engañosas, credenciales fabricadas ni reseñas manipuladas.", "Informa restricciones, vencimientos y relaciones pagadas cuando corresponda."] },
    { heading: "Control y moderación", paragraphs: ["Reclamar no transfiere propiedad del registro ni de su historial. Podemos preservar hechos atribuidos, etiquetar contenido del dueño, corregir formato, retirar material inseguro e investigar disputas."] },
    { heading: "Planes y ubicación", paragraphs: ["Las funciones gratuitas y pagadas pueden cambiar. Toda ubicación pagada se identificará. Ningún plan garantiza tráfico, clientes, rankings, reservas o ingresos. El flujo actual de mejora no cobra una tarjeta."] },
    { heading: "Seguridad y suspensión", paragraphs: ["Protege tus credenciales. El acceso puede suspenderse por reclamos falsos, abuso, incumplimiento, riesgo legal o falta de pago. Los dueños legítimos pueden apelar con evidencia."] },
  ] },
  accessibility: { eyebrow: "Accesibilidad", title: "Declaración de accesibilidad", intro: "Queremos que el directorio sea útil para personas que navegan con teclado, lector de pantalla, ampliación o preferencias de movimiento reducido.", sections: [
    { heading: "Nuestro enfoque", bullets: ["Encabezados, regiones y enlace para saltar al contenido.", "Búsqueda, filtros, idioma y flujos de dueño operables con teclado.", "Foco visible y objetivos táctiles aptos para móvil.", "Movimiento automático desactivado cuando el usuario lo prefiere.", "Diseño responsive probado contra desbordamiento horizontal.", "Pruebas automáticas complementadas con revisión en navegador."] },
    { heading: "Limitaciones conocidas", paragraphs: ["Sitios externos, mapas, menús y fuentes de reputación están fuera de nuestro control. Documentos o imágenes enviados por dueños pueden no cumplir el mismo estándar."] },
    { heading: "Pedir ayuda", paragraphs: ["Usa el formulario de correcciones, selecciona Accesibilidad e incluye página, dispositivo, navegador, tecnología asistiva y la barrera encontrada."] },
  ] },
  corrections: { eyebrow: "Correcciones y retiros", title: "Ayúdanos a mantener el directorio preciso", intro: "Los dueños deben reclamar su página para control continuo. Comensales, titulares de derechos y usuarios de accesibilidad pueden reportar errores, derechos, seguridad o barreras.", sections: [
    { heading: "Qué incluir", bullets: ["La URL exacta.", "El dato o material que consideras incorrecto.", "La corrección y una fuente confiable.", "Tu relación con el restaurante o contenido, si aplica.", "Un correo funcional para aclaraciones."] },
    { heading: "Qué sucede después", paragraphs: ["Las solicitudes se revisan y no se publican automáticamente. Los datos disputados pueden limitarse mientras verificamos evidencia. Solicitar una corrección no garantiza retiro cuando la información es lícita, sustentada o necesaria para integridad antifraude."] },
  ] },
};

function CorrectionForm() {
  const { lang } = useI18n();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const labels = lang === "es" ? {
    type: "Tipo de solicitud", listing: "URL de la página", name: "Tu nombre", email: "Tu correo", phone: "Teléfono (opcional)", message: "Qué debemos revisar", submit: "Enviar para revisión", sending: "Enviando…", sent: "Recibimos tu solicitud. Nuestro equipo la revisará.", error: "No pudimos enviar la solicitud. Inténtalo de nuevo.",
  } : {
    type: "Request type", listing: "Page or listing URL", name: "Your name", email: "Your email", phone: "Phone (optional)", message: "What should we review?", submit: "Submit for review", sending: "Sending…", sent: "We received your request. Our team will review it.", error: "We could not submit the request. Please try again.",
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending"); setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/public/corrections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Submission failed");
      setStatus("sent"); event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.error); setStatus("error");
    }
  };

  if (status === "sent") return <div role="status" className="mt-8 rounded-2xl border border-secondary/25 bg-secondary/8 p-6 text-secondary"><CheckCircle2 className="mb-3 h-7 w-7" /><p className="font-bold">{labels.sent}</p></div>;

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5 rounded-[1.5rem] border border-card-border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-7">
      <label className="text-sm font-bold">{labels.type}<select name="requestType" required className="legal-input mt-2"><option>Listing correction</option><option>Rights or takedown</option><option>Accessibility</option><option>Privacy request</option><option>Other</option></select></label>
      <label className="text-sm font-bold">{labels.listing}<input name="listingUrl" type="url" required defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("listing") || "" : ""} className="legal-input mt-2" /></label>
      <label className="text-sm font-bold">{labels.name}<input name="fullName" required maxLength={120} autoComplete="name" className="legal-input mt-2" /></label>
      <label className="text-sm font-bold">{labels.email}<input name="email" type="email" required maxLength={200} autoComplete="email" className="legal-input mt-2" /></label>
      <label className="text-sm font-bold">{labels.phone}<input name="phone" type="tel" maxLength={60} autoComplete="tel" className="legal-input mt-2" /></label>
      <label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="text-sm font-bold sm:col-span-2">{labels.message}<textarea name="message" required minLength={20} maxLength={3000} rows={6} className="legal-input mt-2 resize-y" /></label>
      {status === "error" && <p role="alert" className="flex items-center gap-2 text-sm text-destructive sm:col-span-2"><AlertCircle className="h-4 w-4" />{error || labels.error}</p>}
      <div className="sm:col-span-2"><button disabled={status === "sending"} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4" />{status === "sending" ? labels.sending : labels.submit}</button></div>
    </form>
  );
}

export default function ColrestInfoPage({ page }: { page: InfoPageKey }) {
  const { lang } = useI18n();
  const copy = useMemo(() => (lang === "es" ? ES : EN)[page], [lang, page]);
  const help = lang === "es" ? {
    title: "¿Preguntas, correcciones o necesidades de accesibilidad?",
    body: "Envía una solicitud específica con la URL y detalles de respaldo.",
    cta: "Abrir formulario",
  } : {
    title: "Questions, corrections or accessibility needs?",
    body: "Send a specific request with the page URL and supporting details.",
    cta: "Open request form",
  };
  const icon = page === "privacy" ? ShieldCheck : page === "terms" || page === "owner-terms" ? Scale : FileText;
  const Icon = icon;
  return (
    <div>
      <section className="legal-hero border-b border-border/70">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{copy.intro}</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-12">
          {copy.sections.map(section => (
            <section key={section.heading} className="legal-section grid gap-4 border-b border-border/70 pb-10 md:grid-cols-[15rem_1fr] md:gap-10">
              <h2 className="font-display text-2xl font-semibold">{section.heading}</h2>
              <div className="space-y-4 text-[1.02rem] leading-7 text-foreground/78">
                {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul className="space-y-3">{section.bullets.map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-secondary" /><span>{item}</span></li>)}</ul>}
              </div>
            </section>
          ))}
        </div>
        {page === "corrections" && <CorrectionForm />}
        {page !== "corrections" && (
          <div className="mt-12 rounded-[1.4rem] bg-muted/65 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div><h2 className="font-display text-xl font-semibold">{help.title}</h2><p className="mt-1 text-sm text-muted-foreground">{help.body}</p></div>
            <Link href="/corrections" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground sm:mt-0">{help.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
