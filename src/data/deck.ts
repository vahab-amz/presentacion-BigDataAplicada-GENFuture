import { formatUsd } from '@/lib/format'
import { DEFAULT_SCENARIO, ONE_OFF, monthlyTotal, scenarioById } from './budget-scenarios'
import type { SourceId } from './sources'

export const DECK_TITLE = 'GENFuture · Propuesta del Equipo 2'
export const DECK_DESCRIPTION =
  'Propuesta cloud para GENFuture: la empresa, los servicios en la nube, el presupuesto por escenarios, la alternativa híbrida y por qué cloud.'

/* -------------------------------------------------------------------------- */
/*  Shared vocabulary                                                          */
/* -------------------------------------------------------------------------- */

export const UI_TEXT = {
  illustrative: 'Ilustrativo',
  sources: 'Fuentes',
  notes: 'Notas del ponente',
  nextStep: 'Siguiente paso',
  slideOf: (slide: number, total: number) => `${slide} / ${total}`,
  appendix: 'Anexo',
  liveRegion: (slide: number, total: number, step: number) =>
    `Diapositiva ${slide} de ${total}, paso ${step}`,
  liveRegionAppendix: (name: string, step: number) => `${name}, paso ${step}`,
  appendixReturn: 'Al cerrar el anexo (A o Esc)',
  blackout: 'Pantalla en negro. Pulsa B para volver.',
  helpTitle: 'Atajos de teclado',
  totalTimer: 'Tiempo total',
  slideTimer: 'En esta diapositiva',
  presenterTitle: 'Vista del ponente',
  onPrem: 'On-premise',
  cloud: 'Nube',
} as const

export const SHORTCUTS: readonly { keys: string; action: string }[] = [
  { keys: '→ · Espacio · Intro · AvPág', action: 'Siguiente paso o diapositiva' },
  { keys: '← · Retroceso · RePág', action: 'Paso anterior' },
  { keys: 'Inicio · Fin', action: 'Primera o última diapositiva' },
  { keys: '1 – 5', action: 'Ir a esa diapositiva' },
  { keys: 'A', action: 'Anexo · Riesgos (A o Esc para volver)' },
  { keys: 'F', action: 'Pantalla completa' },
  { keys: 'B · .', action: 'Pantalla en negro' },
  { keys: 'N', action: 'Notas del ponente' },
  { keys: 'P', action: 'Abrir la ventana del ponente' },
  { keys: 'T', action: 'Tema claro u oscuro' },
  { keys: 'H', action: 'Ocultar la barra inferior' },
  { keys: '?', action: 'Esta ayuda' },
  { keys: 'Esc', action: 'Cerrar superposiciones, salir del anexo o de un control' },
]

/* -------------------------------------------------------------------------- */
/*  Cover video (slide 1)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Files in `public/media/`. The WebM is optional: the page only lists it when
 * the file exists at build time, so a missing WebM never costs a 404.
 */
export const HERO_MEDIA = {
  poster: '/media/hero-poster.jpg',
  webm: '/media/hero.webm',
  mp4: '/media/hero.mp4',
  /**
   * Opacity of the dark scrim over the video. Step 0 of a hero slide is the
   * cover (≈ 50 %); from step 1 the video steps back to ≈ 15 % so the content
   * reads cleanly.
   */
  overlay: { cover: 0.5, dimmed: 0.85 },
} as const

export function heroOverlay(step: number): number {
  return step === 0 ? HERO_MEDIA.overlay.cover : HERO_MEDIA.overlay.dimmed
}

/* -------------------------------------------------------------------------- */
/*  Timelines (slide 4)                                                        */
/* -------------------------------------------------------------------------- */

export type TimelineBar = {
  label: string
  /** Months from the start of the timeline. */
  from: number
  to: number
  /** Short note at the end of the bar, e.g. "día 30". */
  endLabel?: string
  /** Drawn as an outline: time spent waiting rather than working. */
  muted?: boolean
}

export type TimelineLane = {
  name: string
  bars: readonly TimelineBar[]
  result?: {
    /** Month the marker sits on. */
    at: number
    /** Optional uncertainty band around the marker, in months. */
    range?: readonly [number, number]
    label: string
  }
}

/* -------------------------------------------------------------------------- */
/*  Slide 1 — La empresa                                                       */
/* -------------------------------------------------------------------------- */

export type BenefitIcon = 'cloud' | 'shift' | 'scale'

export const SLIDE_COMPANY = {
  cover: {
    kicker: 'Big Data Aplicada · Propuesta del Equipo 2',
    title: 'Cada mes sin capacidad de IA es un mes que gana la competencia.',
  },
  title: 'GENFuture: biotecnología que vive de sus datos',
  facts: [
    { value: 'Biotecnología', label: 'investigación genética y terapias génicas' },
    { value: '10 años', label: 'de experiencia' },
    { value: 'Nueva York', label: 'sede central' },
    { value: 'IA + Big Data', label: 'actualización tecnológica en curso' },
  ],
  costs: {
    title: 'Dónde se concentran los costes',
    tiles: [
      { label: 'I+D' },
      { label: 'Personal altamente especializado' },
      { label: 'Equipamiento y materiales de investigación' },
      {
        label: 'Gestión y análisis de grandes volúmenes de datos',
        highlight: 'Lo que proponemos transformar',
      },
    ] as readonly { label: string; highlight?: string }[],
  },
  proposal: {
    title: 'Nuestra propuesta: servicios en la nube',
    benefits: [
      { icon: 'cloud', text: 'Servicios avanzados de proveedores externos' },
      { icon: 'shift', text: 'De inversión inicial a gasto operativo (CAPEX → OPEX)' },
      { icon: 'scale', text: 'Escalar según las necesidades de investigación' },
    ] as readonly { icon: BenefitIcon; text: string }[],
    graphic: {
      tag: 'Conceptual',
      capex: { name: 'CAPEX', note: 'todo en el mes 0' },
      opex: { name: 'OPEX', note: 'según la demanda' },
      ariaLabel:
        'Esquema conceptual: una única inversión grande en el mes 0 frente a pagos mensuales pequeños que siguen la demanda',
    },
  },
  takeaway: 'El gasto se adapta al crecimiento de la empresa.',
  sources: [] as readonly SourceId[],
  notes: [
    'GENFuture es una biotecnológica de investigación genética y terapias génicas, con diez años de experiencia.',
    'Estamos en plena actualización tecnológica: incorporar IA y Big Data a la investigación y al análisis.',
    'Necesitamos personal muy especializado y una gran capacidad de procesamiento y almacenamiento.',
    'Los costes se concentran en I+D, personal, equipamiento y materiales, y gestión de grandes volúmenes de datos: esta última es la que proponemos transformar.',
    'Propuesta: contratar servicios en la nube. Servicios avanzados de proveedores externos, menos inversión inicial (CAPEX → OPEX) y recursos que escalan con la investigación.',
    'Cierre: el gasto se adapta al crecimiento de la empresa. Mi compañero explica ahora qué servicios contratar.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 2 — Servicios y plataformas en la Nube                               */
/* -------------------------------------------------------------------------- */

export const SLIDE_CLOUD = {
  title: 'Pagar por lo que usamos, no por lo que tenemos parado',
  subtitle: 'Servicios cloud · AWS como proveedor principal',
  chart: {
    title: 'Demanda real vs. capacidad',
    xLabel: 'Ene – Dic',
    yLabel: 'Capacidad de cómputo',
    demandLabel: 'Demanda real de I+D',
    capacityLabel: 'Capacidad on-premise (comprada)',
    /** Bought capacity as a multiple of mean demand. */
    capacityMultiple: 1.4,
    /** The red capacity line follows the demand line by this much, in seconds. */
    capacityDelay: 0.6,
    idleLabel: 'Dinero parado',
    queueLabel: 'Proyectos en cola',
    cloudLabel: 'Nube: capacidad = demanda',
  },
  platformCards: [
    {
      kicker: 'Datos',
      services: 'Amazon S3 + AWS HealthOmics',
      body: 'Los datos antiguos pasan solos a archivo.',
    },
    {
      kicker: 'Cómputo',
      services: 'AWS HealthOmics + AWS Batch',
      body: 'Escala a más de 100.000 procesadores.',
    },
    {
      kicker: 'IA',
      services: 'Amazon SageMaker AI + Amazon Bedrock',
      body: 'Modelos propios y ya entrenados, por hora.',
    },
  ],
  encryption: 'Cifrado con llaves de GENFuture',
  kpis: [
    { value: '0 $', label: 'en hardware inicial' },
    { value: 'Semanas', label: 'no meses' },
    { value: 'Predecible', label: 'coste por muestra' },
  ],
  sources: ['intuitionLabs', 'siliconAnalysts', 'castAi', 'awsHealthOmics'] as const satisfies readonly SourceId[],
  /** Verbatim script, attached to the step that is on screen. */
  notesByStep: [
    'Como ha explicado mi compañero, nuestro recurso crítico es la caja. Por eso empiezo con una pregunta de inversión: si hoy tuviera que invertir medio millón de dólares, ¿compraría un activo cuyo precio está en máximos, que tarda casi un año en llegar y que pierde más de la mitad de su valor en pocos años? (pausa) Eso es comprar hoy servidores de inteligencia artificial: un solo servidor con ocho GPUs de última generación cuesta entre 300.000 y más de 500.000 dólares.',
    'Esta línea es la demanda real de I+D, con picos y valles; la roja es la capacidad fija on-premise.',
    'Y aquí está el problema. Todo lo rojo es dinero parado: máquinas pagadas que no hacen nada. Y en los picos, los proyectos hacen cola, justo cuando estamos en una carrera. En un análisis de más de 23.000 clústeres, el uso medio de las GPUs fue de solo un 5 %.',
    'La nube sigue la demanda. Si mañana necesitamos analizar diez mil genomas, la capacidad crece; cuando terminamos, se apaga y deja de cobrar.',
    'En concreto, proponemos tres bloques en AWS. Datos: Amazon S3 y HealthOmics guardan los genomas. Cómputo: AWS HealthOmics, un servicio creado específicamente para genómica, que escala a más de 100.000 procesadores a la vez con un coste por muestra predecible. Inteligencia artificial: SageMaker AI para entrenar nuestros propios modelos y Bedrock para usar modelos ya entrenados.',
    'Y todo va cifrado con llaves que controla GENFuture. Más adelante veremos cómo protegemos los datos más sensibles.',
    'En resumen: cero dólares en hardware inicial, resultados en semanas y no en meses, y un coste por muestra que se puede planificar. La nube no es un gasto: es una opción. Y como usted sabe mejor que nadie, una opción vale más cuanto más incierto es el futuro. Mi compañero le mostrará ahora cuánto cuesta exactamente.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 3 — Presupuesto por escenarios                                       */
/* -------------------------------------------------------------------------- */

const BASE_NAME = scenarioById(DEFAULT_SCENARIO).name

export const SLIDE_BUDGET = {
  title: 'Presupuesto por escenarios: el gasto sigue al volumen real',
  subtitle: 'Sin auditoría previa en Nueva York, modelamos tres volúmenes posibles.',
  contrast: {
    capex: {
      title: 'Modelo físico (CAPEX)',
      points: [
        'Compra de hardware por adelantado',
        'Capacidad ociosa',
        'Falta de GPUs para IA',
      ],
    },
    opex: {
      title: 'Cloud (OPEX)',
      points: [
        'Cero inversión en discos',
        'Gasto 100 % variable y deducible',
        'GPUs que solo facturan en horas de análisis',
      ],
    },
    footer: 'Plataformas certificadas HIPAA y GDPR, con cifrado integral.',
  },
  chart: {
    title: 'Gasto mensual por escenario',
    tag: 'Estimación del equipo',
    perMonth: '/mes',
    oneOff: (amount: string) => `+ ${amount} una vez`,
    ariaLabel:
      'Barras apiladas del gasto mensual de los tres escenarios, por partida: histórico frío, I+D y terapias activas, bases de datos y cómputo IA',
  },
  detail: {
    heading: (name: string) => `Escenario ${name}`,
    total: 'Total mensual (OPEX)',
    oneOff: 'Migración inicial · pago único',
    choose: 'Elige un escenario',
  },
  kpis: {
    perTb: {
      label: 'por TB al mes (datos + bases de datos, escenario base)',
    },
    perSample: {
      label: 'de cómputo por muestra (0 $ si ese mes no hay ensayos)',
    },
    archive: {
      label: 'archivos sin abrir 6 meses pasan de 0,020 a 0,003 $/GB·mes',
      unit: '$/GB·mes',
    },
  },
  sources: [] as readonly SourceId[],
  notes: [
    'El problema del modelo físico: servidores locales en Nueva York obligan a comprar hardware por adelantado, dejan capacidad ociosa y frenan la IA por falta de GPUs de alto rendimiento.',
    'La solución cloud: cero inversión en discos, gasto operativo 100 % variable y deducible, y clústeres de GPUs que solo se encienden y facturan durante las horas de análisis.',
    'Seguridad y cumplimiento: plataformas certificadas HIPAA (EE. UU.) y GDPR, con cifrado integral para blindar patentes y datos genéticos.',
    'Sin auditoría previa en Nueva York, presupuestamos tres escenarios: 300 TB, 1,2 PB y 3 PB.',
    `Escenario ${BASE_NAME.toLowerCase()}: unos ${formatUsd(monthlyTotal(DEFAULT_SCENARIO))} al mes de OPEX y ${formatUsd(ONE_OFF.values[DEFAULT_SCENARIO])} de migración inicial, una sola vez.`,
    'Custodiar 1 TB cuesta de media unos 8,50 $ al mes; procesar una muestra con IA, entre 15 y 30 $, y 0 $ si ese mes no hay ensayos.',
    'Cada archivo que pasa 6 meses sin abrirse baja solo de 0,020 a 0,003 $ por GB: un 85 % menos.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 4 — Alternativa híbrida                                              */
/* -------------------------------------------------------------------------- */

export const SLIDE_HYBRID = {
  title: 'Alternativa: híbrido escalonado con Confianza Cero',
  subtitle:
    'Para los datos más sensibles: ni un centro de datos propio, ni exponerlo todo desde el primer día.',
  pillars: [
    {
      title: 'Seguridad selectiva',
      body: 'Datos genéticos crudos y propiedad intelectual en nube privada o servidor local mínimo.',
    },
    {
      title: 'Potencia bajo demanda',
      body: 'IA y Big Data en la nube pública con datos anonimizados o cifrados.',
    },
    {
      title: 'Mitigación de riesgo',
      body: 'Ni la apuesta rígida de un data center propio ni una migración total inicial.',
    },
  ],
  flow: {
    stages: [
      { title: 'Datos genéticos sensibles', zone: 'Local / privado', tone: 'private' },
      { title: 'Cifrado de extremo a extremo', zone: 'Salida cifrada', tone: 'transit' },
      { title: 'Procesamiento IA en la nube pública', zone: 'Nube pública', tone: 'public' },
      { title: 'Retorno seguro de resultados', zone: 'Vuelta cifrada', tone: 'transit' },
      { title: 'Almacenamiento local seguro', zone: 'Local / privado', tone: 'private' },
    ] as readonly { title: string; zone: string; tone: 'private' | 'transit' | 'public' }[],
    /** Index of the stage that carries the lock glyph. */
    lockStage: 1,
    quote: 'No pedimos confianza ciega, sino verificación matemática.',
    subline: 'HIPAA y GDPR: certificaciones que nos costaría millones replicar internamente.',
    ariaLabel:
      'Flujo de Confianza Cero en cinco etapas: datos sensibles en local, cifrado de extremo a extremo, procesamiento de IA en la nube pública, retorno seguro de resultados y almacenamiento local seguro',
  },
  timeline: {
    tag: 'Cronograma ilustrativo',
    axisLabel: 'Meses desde la decisión',
    months: 18,
    tickEvery: 3,
    hybrid: {
      name: 'Híbrido',
      bars: [
        { label: 'Piloto', from: 0, to: 1, endLabel: 'día 30' },
        { label: 'Integración', from: 1, to: 2, endLabel: 'día 60' },
        { label: 'IA operativa', from: 2, to: 3, endLabel: 'día 90' },
        { label: 'Despliegue completo', from: 3, to: 6, endLabel: 'mes 6' },
      ],
    } satisfies TimelineLane,
    onPrem: {
      name: 'On-premise',
      bars: [
        { label: 'Compra de hardware', from: 0, to: 6 },
        { label: 'Montaje de infraestructura', from: 6, to: 9 },
        { label: 'Desarrollo a medida', from: 9, to: 12 },
        { label: 'Pruebas y validación', from: 12, to: 14 },
        { label: 'Puesta en marcha', from: 14, to: 15 },
      ],
      result: { at: 15, range: [12, 18], label: 'Operativo · mes 12–18' },
    } satisfies TimelineLane,
    bracket: { from: 0, to: 3, label: 'IA operativa en 90 días' },
    ariaLabel:
      'Cronograma comparado de 0 a 18 meses: el modelo híbrido tiene la IA operativa en 90 días y el despliegue completo en el mes 6; el on-premise queda operativo entre los meses 12 y 18',
  },
  band: 'Convertimos un CAPEX masivo y de depreciación rápida en un OPEX escalonado y deducible.',
  sources: [] as readonly SourceId[],
  notes: [
    'Alternativa a las dos propuestas base: un modelo híbrido escalonado con arquitectura de Confianza Cero.',
    'Seguridad selectiva: los datos genéticos crudos y la propiedad intelectual más sensible, en nube privada o en un servidor local mínimo.',
    'Potencia bajo demanda: el procesamiento pesado de IA y Big Data va a la nube pública (AWS, Azure o GCP) con datos anonimizados o cifrados, y solo escala cuando hace falta.',
    'Mitigación de riesgo: evitamos la apuesta rígida de un data center propio (Equipo 1) y la exposición total de migrarlo todo desde el primer día.',
    'No pedimos confianza ciega, sino verificación matemática: Confianza Cero y cifrado de extremo a extremo. Los grandes proveedores ya cumplen HIPAA y GDPR; replicarlo nos costaría millones.',
    'La carrera por la IA no espera: el Equipo 1 tardaría de 12 a 18 meses en licitar, comprar e instalar; con el híbrido, entornos de IA operativos en 90 días.',
    'En resumen: convertimos un CAPEX masivo, inmediato y de depreciación rápida en un OPEX escalonado y deducible.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 5 — ¿Por qué Cloud? (infografía de Alex)                             */
/* -------------------------------------------------------------------------- */

export type WhyCloudCardIcon = 'coins' | 'growth' | 'stopwatch'
export type WhyCloudColumnIcon = 'piggy' | 'cloudUp' | 'shield' | 'bars'

export const SLIDE_WHY_CLOUD = {
  brand: {
    strong: 'GEN',
    light: 'Future',
    tagline: ['SCIENCE TODAY', 'A HEALTHIER TOMORROW'],
  },
  swoosh: ['LA TECNOLOGÍA', 'AL SERVICIO', 'DE UN FUTURO MÁS SANO'],
  title: {
    lines: [
      [
        { text: '¿Por qué ' },
        { text: 'Cloud', highlight: true },
        { text: ' es la mejor decisión' },
      ],
      [{ text: 'para GENFuture?' }],
    ] as readonly (readonly { text: string; highlight?: boolean }[])[],
    plain: '¿Por qué Cloud es la mejor decisión para GENFuture?',
  },
  subtitle: 'Más valor. Menos costes. Mayor impacto.',
  seriesLabels: { own: 'Infraestructura propia', cloud: 'Cloud' },
  cards: [
    {
      id: 'cost',
      tint: 'blue',
      icon: 'coins',
      title: 'Coste inicial',
      subtitle: 'Menor inversión, mayor eficiencia',
      own: 100,
      cloud: 30,
    },
    {
      id: 'flex',
      tint: 'green',
      icon: 'growth',
      title: 'Flexibilidad',
      subtitle: 'Nos adaptamos a tus necesidades',
      own: 30,
      cloud: 100,
    },
    {
      id: 'time',
      tint: 'peach',
      icon: 'stopwatch',
      title: 'Tiempo de implantación',
      subtitle: 'Resultados más rápidos',
      own: 80,
      cloud: 20,
    },
  ] as readonly {
    id: string
    tint: 'blue' | 'green' | 'peach'
    icon: WhyCloudCardIcon
    title: string
    subtitle: string
    own: number
    cloud: number
  }[],
  indexCaption: 'Índice relativo',
  columns: [
    {
      icon: 'piggy',
      tone: 'navy',
      title: 'Menor inversión inicial',
      body: 'Preservamos tu capital para lo que realmente importa: la investigación.',
    },
    {
      icon: 'cloudUp',
      tone: 'green',
      title: 'Escalabilidad inmediata',
      body: 'Aumenta o reduce recursos en minutos, según tus proyectos.',
    },
    {
      icon: 'shield',
      tone: 'navy',
      title: 'Seguridad empresarial',
      body: 'Cifrado, control de accesos, copias de seguridad y monitorización continua.',
    },
    {
      icon: 'bars',
      tone: 'green',
      title: 'Decisiones basadas en datos',
      body: 'Comenzamos con un proyecto piloto. Medimos coste, rendimiento y seguridad.',
    },
  ] as readonly {
    icon: WhyCloudColumnIcon
    tone: 'navy' | 'green'
    title: string
    body: string
  }[],
  banner: {
    lines: ['GENFuture no necesita', 'más servidores.'],
    accent: 'Necesita más descubrimientos.',
    pillLead: ['No invertimos primero', 'y esperamos resultados.'],
    pillStrong: 'Probamos, medimos y escalamos.',
    motto: ['MÁS CIENCIA.', 'MÁS VIDA.', 'UN FUTURO REAL.'],
  },
  images: {
    lab: { src: '/media/why-cloud/header-lab.png', width: 185, height: 112 },
    mountain: { src: '/media/why-cloud/banner-mountain.png', width: 188, height: 173 },
  },
  sources: [] as readonly SourceId[],
  notes: [
    'Objetivo: convencer al CEO. Prefiere gráficos, así que dejamos que la infografía hable.',
    'Coste inicial: la infraestructura propia exige el 100 % por adelantado; cloud, un 30 %.',
    'Flexibilidad: cloud se adapta al 100 % a las necesidades de investigación; la infraestructura propia, a un 30 %.',
    'Tiempo de implantación: 80 frente a 20. Resultados más rápidos.',
    'Cuatro razones: menor inversión inicial, escalabilidad inmediata, seguridad empresarial y decisiones basadas en datos, empezando por un piloto.',
    'Cierre: GENFuture no necesita más servidores, necesita más descubrimientos. No invertimos primero y esperamos resultados: probamos, medimos y escalamos.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Anexo — Riesgos (fuera del flujo de cinco diapositivas)                    */
/* -------------------------------------------------------------------------- */

export type RiskRow = {
  risk: string
  answer: string
  evidence: string
  source?: SourceId
}

export const APPENDIX_RISKS = {
  kicker: 'Anexo',
  title: 'Los riesgos del cloud ya tienen respuesta.',
  tableHeadings: { risk: 'Riesgo', answer: 'Respuesta', evidence: 'Dato' },
  rows: [
    {
      risk: 'Soberanía de los datos',
      answer: 'Llaves propias (AWS KMS + External Key Store)',
      evidence: 'La caja fuerte es de Amazon; la única llave es nuestra.',
    },
    {
      risk: 'Caída del proveedor',
      answer: 'Arquitectura multizona y multirregión',
      evidence: 'us-east-1, 19–20 oct 2025: ~15 h de incidencia.',
      source: 'awsOutage',
    },
    {
      risk: 'Subida de precios',
      answer: 'Savings Plans a precio fijo',
      evidence: 'AWS subió un 15 % las H200 en enero de 2026.',
      source: 'castAi',
    },
    {
      risk: 'Dependencia del proveedor',
      answer: 'Estándares abiertos (Nextflow, WDL, contenedores)',
      evidence: 'UE: sin costes de cambio de proveedor desde el 12/01/2027 (Data Act).',
      source: 'egressFees',
    },
    {
      risk: 'Servicio discontinuado',
      answer: 'Flujos portables',
      evidence: 'Google cerró Cloud Life Sciences en julio de 2025; sus usuarios migraron a Batch.',
      source: 'googleBatch',
    },
  ] as const satisfies readonly RiskRow[],
  roadmap: {
    title: 'Plan de 90 días',
    phases: [
      {
        window: 'Días 0–30',
        body: 'Cuenta, seguridad, llaves y piloto con un proyecto real.',
      },
      {
        window: 'Días 30–60',
        body: 'Pipelines en HealthOmics y control de costes (FinOps).',
      },
      {
        window: 'Días 60–90',
        body: 'Producción e informe de coste por muestra real → decisión.',
      },
    ],
  },
  closing: {
    ask: 'Lo que pedimos hoy: aprobar un piloto de 90 días.',
    line: 'La nube no es un gasto: es una opción.',
  },
  sources: ['awsOutage', 'castAi', 'googleBatch', 'egressFees'] as const satisfies readonly SourceId[],
  notes: [
    'Anexo para preguntas: se abre con A y se cierra con A o Esc.',
    'Ninguno de estos riesgos es nuevo: los cinco tienen una respuesta contractual o arquitectónica.',
    'La respuesta a la soberanía es la llave, no la ubicación: KMS con External Key Store fuera de AWS.',
    'No pedimos una migración: pedimos 90 días y una cifra real de coste por muestra para decidir.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Deck manifest — the engine reads only this                                 */
/* -------------------------------------------------------------------------- */

export type SlideNotes = {
  /** Shown on every step of the slide. */
  bullets?: readonly string[]
  /** Shown only while the matching step index is on screen. */
  byStep?: readonly string[]
}

export type SlideId = 'company' | 'cloud' | 'budget' | 'hybrid' | 'why-cloud' | 'risks'

export type SlideMeta = {
  id: SlideId
  /** Short name for the presenter view and the print route. */
  name: string
  /** Number of reveal states, including step 0. */
  steps: number
  /**
   * Pins the slide's colours regardless of the T theme; omit to follow it.
   * `light` is the cool paper white of Alex's infographic, and the letterbox
   * and the chrome take the same colours, so no box shows around the stage.
   */
  surface?: 'dark' | 'light'
  /** `hero`: the full-viewport cover video runs behind this slide. */
  backdrop?: 'hero'
  sources: readonly SourceId[]
  notes: SlideNotes
}

export const SLIDES: readonly SlideMeta[] = [
  {
    id: 'company',
    name: 'La empresa y nuestra propuesta',
    steps: 5,
    // A video cover: it stays dark in both themes so the title always reads.
    surface: 'dark',
    backdrop: 'hero',
    sources: SLIDE_COMPANY.sources,
    notes: { bullets: SLIDE_COMPANY.notes },
  },
  {
    id: 'cloud',
    name: 'Servicios y plataformas en la Nube',
    steps: 7,
    sources: SLIDE_CLOUD.sources,
    notes: { byStep: SLIDE_CLOUD.notesByStep },
  },
  {
    id: 'budget',
    name: 'Presupuesto por escenarios',
    steps: 5,
    sources: SLIDE_BUDGET.sources,
    notes: { bullets: SLIDE_BUDGET.notes },
  },
  {
    id: 'hybrid',
    name: 'Alternativa híbrida',
    steps: 5,
    sources: SLIDE_HYBRID.sources,
    notes: { bullets: SLIDE_HYBRID.notes },
  },
  {
    id: 'why-cloud',
    name: '¿Por qué Cloud?',
    steps: 4,
    surface: 'light',
    sources: SLIDE_WHY_CLOUD.sources,
    notes: { bullets: SLIDE_WHY_CLOUD.notes },
  },
]

/** Hidden backup slide: opened only with A, never counted in "n / 5". */
export const APPENDIX: SlideMeta = {
  id: 'risks',
  name: 'Anexo · Riesgos',
  steps: 5,
  sources: APPENDIX_RISKS.sources,
  notes: { bullets: APPENDIX_RISKS.notes },
}

export const SLIDE_COUNT = SLIDES.length
