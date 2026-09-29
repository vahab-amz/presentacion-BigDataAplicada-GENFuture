import type { SourceId } from './sources'

/* -------------------------------------------------------------------------- */
/*  Presenters — replace these five strings with the real names                */
/* -------------------------------------------------------------------------- */

export const PRESENTERS = {
  slide1: '[Nombre 1]',
  slide2: '[Nombre 2]',
  slide3: '[Mi nombre]',
  slide4: '[Nombre 4]',
  slide5: '[Nombre 5]',
} as const

export const DECK_TITLE = 'GENFuture · Equipo 2 · Terapias'

/* -------------------------------------------------------------------------- */
/*  Shared vocabulary                                                          */
/* -------------------------------------------------------------------------- */

export const UI_TEXT = {
  illustrative: 'Ilustrativo',
  presents: 'Presenta',
  sources: 'Fuentes',
  notes: 'Notas del ponente',
  nextStep: 'Siguiente paso',
  slideOf: (slide: number, total: number) => `${slide} / ${total}`,
  liveRegion: (slide: number, total: number, step: number) =>
    `Diapositiva ${slide} de ${total}, paso ${step}`,
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
  { keys: 'F', action: 'Pantalla completa' },
  { keys: 'B · .', action: 'Pantalla en negro' },
  { keys: 'N', action: 'Notas del ponente' },
  { keys: 'P', action: 'Abrir la ventana del ponente' },
  { keys: 'T', action: 'Tema claro u oscuro' },
  { keys: 'H', action: 'Ocultar la barra inferior' },
  { keys: '?', action: 'Esta ayuda' },
  { keys: 'Esc', action: 'Cerrar superposiciones o salir de un control' },
]

/* -------------------------------------------------------------------------- */
/*  Slide 1 — La carrera                                                       */
/* -------------------------------------------------------------------------- */

export type TimelineBar = {
  label: string
  /** Months from the start of the timeline. */
  from: number
  to: number
}

export type TimelineLane = {
  name: string
  bars: readonly TimelineBar[]
  /** Month at which the first usable result lands. */
  resultAt: number
  resultLabel: string
}

export const SLIDE_1 = {
  kicker: 'Propuesta del Equipo 2 · Terapias',
  title: 'Cada mes sin capacidad de IA es un mes que gana la competencia.',
  timeline: {
    tag: 'Cronograma ilustrativo',
    axisLabel: 'Meses desde la decisión',
    months: 12,
    onPrem: {
      name: 'On-premise',
      bars: [
        { label: 'Aprobación y compra', from: 0, to: 1.5 },
        { label: 'Plazo de entrega de GPUs', from: 1.5, to: 10 },
        { label: 'Instalación y contratación', from: 10, to: 12 },
      ],
      resultAt: 12,
      resultLabel: 'Primer resultado',
    } satisfies TimelineLane,
    cloud: {
      name: 'Nube',
      bars: [
        { label: 'Cuenta, seguridad y llaves', from: 0, to: 0.5 },
        { label: 'Piloto con un proyecto real', from: 0.5, to: 1.5 },
        { label: 'Producción', from: 1.5, to: 3 },
      ],
      resultAt: 3,
      resultLabel: 'Primer resultado',
    } satisfies TimelineLane,
  },
  bracket: '≈ 9 meses de ventaja',
  callout: {
    text: 'Los plazos de entrega de GPUs para centros de datos se acercan a un año.',
    attribution: 'Silicon Analysts, enero de 2026',
  },
  sources: ['siliconAnalysts'] as const satisfies readonly SourceId[],
  notes: [
    'Esto es una carrera, no una compra: el competidor que analice antes sus datos publicará antes.',
    'En terapia génica el coste de llegar tarde es mayor que la diferencia de precio entre las dos opciones.',
    'Nueve meses de ventaja son dos campañas de secuenciación completas. Paso a qué tipo de empresa somos.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 2 — Qué tipo de empresa somos                                        */
/* -------------------------------------------------------------------------- */

export const SLIDE_2 = {
  title: 'Somos una biotech: cada dólar parado en servidores es un dólar que no va a I+D.',
  cards: [
    {
      heading: 'I+D por proyectos',
      body: 'La demanda llega a picos, no en línea recta.',
    },
    {
      heading: 'Ingresos lejanos',
      body: 'El efectivo es el recurso crítico, no el activo.',
    },
    {
      heading: 'Capital escaso',
      body: 'La terapia génica compite por una bolsa que no crece.',
    },
  ],
  bigNumber: {
    value: '≈ 2.000 M$',
    lede:
      'Lo que levanta en capital riesgo, en un año, todo el sector de terapia celular y génica: prácticamente el mismo nivel desde 2022.',
    footnote:
      'Solo en el primer semestre de 2026, biológicos y moléculas pequeñas levantaron más de 2.000 M$ cada uno.',
    attribution: 'BioPharma Dive, julio de 2026',
  },
  cashProfile: {
    title: 'Perfil de caja, primeros 12 meses',
    subtitle: 'Salida de caja mensual con los supuestos por defecto del modelo',
  },
  takeaway: 'Convertir CAPEX en OPEX protege el runway de I+D.',
  sources: ['bioPharmaDive'] as const satisfies readonly SourceId[],
  notes: [
    'No somos una empresa de infraestructura: nuestro balance debe estar en ensayos, no en racks.',
    'El capital de terapia génica lleva cuatro años plano; cada dólar inmovilizado se nota en el runway.',
    'La forma de la caja importa tanto como el total: on-premise pide 770.000 $ el primer mes.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 3 — Servicios y plataformas en la Nube                               */
/* -------------------------------------------------------------------------- */

export const SLIDE_3 = {
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
    'Señor director, empiezo con una pregunta de inversión. Si hoy tuviera que invertir medio millón de dólares, ¿compraría un activo cuyo precio está en máximos, que tarda casi un año en llegar y que pierde más de la mitad de su valor en pocos años? (pausa) Eso es comprar hoy servidores de inteligencia artificial. Un solo servidor con ocho GPUs de última generación cuesta entre 300.000 y más de 500.000 dólares. La memoria, que es cerca de la mitad del coste de estos chips, ha llegado a duplicar su precio. Y una GPU H100 que costaba hasta 40.000 dólares hoy se revende por entre 12.000 y 18.000.',
    'Esta línea es cómo trabaja de verdad I+D: picos cuando llega un proyecto grande de secuenciación, y valles entre proyecto y proyecto.',
    'Esta línea roja es la propuesta on-premise: una capacidad fija, comprada por adelantado.',
    'Y aquí está el problema. Todo lo rojo es dinero parado: máquinas pagadas que no hacen nada. Y en los picos, los proyectos hacen cola, justo cuando estamos en una carrera. No es teoría: en un análisis de más de 23.000 clústeres, el uso medio de las GPUs fue de solo un 5 %.',
    'La nube sigue la demanda. Si mañana necesitamos analizar diez mil genomas, la capacidad crece; cuando terminamos, se apaga y deja de cobrar.',
    'En concreto, proponemos tres bloques en AWS. Datos: Amazon S3 y HealthOmics guardan los genomas, y los datos antiguos pasan solos a un almacenamiento de archivo muy barato. Cómputo: AWS HealthOmics, un servicio creado específicamente para genómica, que escala a más de 100.000 procesadores a la vez con un coste por muestra predecible. Inteligencia artificial: SageMaker AI para entrenar nuestros propios modelos y Bedrock para usar modelos ya entrenados, con GPUs que pagamos solo por hora de uso.',
    'Sé cuál es la gran preocupación: ¿quién controla nuestros datos genéticos? Nosotros. Todo va cifrado con llaves que controla GENFuture, y si queremos, esas llaves pueden estar incluso fuera de Amazon. La caja fuerte es de Amazon; la única llave es nuestra. Además, HealthOmics es apto para HIPAA, la normativa sanitaria de Estados Unidos.',
    'En resumen: cero dólares en hardware inicial, resultados en semanas y no en meses, y un coste por muestra que se puede planificar. La nube no es un gasto: es una opción. Y como usted sabe mejor que nadie, una opción vale más cuanto más incierto es el futuro. Mi compañero le mostrará ahora cuánto cuesta exactamente.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 4 — Presupuesto a 3 años                                             */
/* -------------------------------------------------------------------------- */

export const SLIDE_4 = {
  title: 'Presupuesto a 3 años: dimensionamos para la media, no para el pico.',
  cumulativeChart: {
    title: 'Coste acumulado a 36 meses',
    xLabel: 'Mes',
    yLabel: 'Coste acumulado',
    onPremLabel: 'On-premise',
    cloudLabel: 'Nube',
  },
  categoryChart: {
    title: 'Total a 36 meses por categoría',
    note: 'Los servicios de AWS se contabilizan en Software.',
  },
  controls: {
    title: 'Ajusta los supuestos',
    serversLabel: 'Servidores necesarios',
    utilisationLabel: 'Utilización media',
    crossoverFound: (month: number) => `Punto de equilibrio: mes ${month}`,
    crossoverNote: 'Con uso alto y constante, lo revisamos cada año.',
    crossoverNone: 'Sin punto de equilibrio en 36 meses',
    crossoverNoneNote: 'La nube sigue por debajo en todo el rango.',
  },
  kpis: {
    month0: 'Caja en el mes 0',
    total: 'Total a 3 años',
    perGenome: 'Coste por genoma',
    savingsLabel: 'Diferencia a favor de la nube',
    onPremColumn: 'On-premise',
    cloudColumn: 'Nube',
  },
  footer: 'Modelo ilustrativo — sustituir por las cifras del equipo',
  sources: ['intuitionLabs', 'spheron', 'awsHealthOmics', 'castAi'] as const satisfies readonly SourceId[],
  notes: [
    'Dimensionar para el pico multiplica el hardware por más de dos y deja las GPUs al 26 % de uso.',
    'La diferencia no está solo en el total: son 710.000 $ de caja que no salen el primer mes.',
    'Los controles son reales: si el CEO nos da sus volúmenes, recalculamos delante de él.',
  ],
} as const

/* -------------------------------------------------------------------------- */
/*  Slide 5 — Riesgos resueltos y decisión                                     */
/* -------------------------------------------------------------------------- */

export type RiskRow = {
  risk: string
  answer: string
  evidence: string
  source?: SourceId
}

export const SLIDE_5 = {
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

export type SlideMeta = {
  id: string
  /** Short name for the presenter view and the print route. */
  name: string
  presenter: string
  /** Number of reveal states, including step 0. */
  steps: number
  sources: readonly SourceId[]
  notes: SlideNotes
}

export const SLIDES: readonly SlideMeta[] = [
  {
    id: 'race',
    name: 'La carrera',
    presenter: PRESENTERS.slide1,
    steps: 4,
    sources: SLIDE_1.sources,
    notes: { bullets: SLIDE_1.notes },
  },
  {
    id: 'company',
    name: 'Qué tipo de empresa somos',
    presenter: PRESENTERS.slide2,
    steps: 5,
    sources: SLIDE_2.sources,
    notes: { bullets: SLIDE_2.notes },
  },
  {
    id: 'cloud',
    name: 'Servicios y plataformas en la Nube',
    presenter: PRESENTERS.slide3,
    steps: 8,
    sources: SLIDE_3.sources,
    notes: { byStep: SLIDE_3.notesByStep },
  },
  {
    id: 'budget',
    name: 'Presupuesto a 3 años',
    presenter: PRESENTERS.slide4,
    steps: 5,
    sources: SLIDE_4.sources,
    notes: { bullets: SLIDE_4.notes },
  },
  {
    id: 'risks',
    name: 'Riesgos resueltos y decisión',
    presenter: PRESENTERS.slide5,
    steps: 5,
    sources: SLIDE_5.sources,
    notes: { bullets: SLIDE_5.notes },
  },
]

export const SLIDE_COUNT = SLIDES.length
