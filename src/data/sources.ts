/**
 * Every external claim on screen points at one of these.
 * Slides show `label`; the README and the data layer keep the full URL.
 */
export type Source = {
  /** Short name rendered in the on-slide sources line. */
  label: string
  url: string
  /** What this source is used for, in Spanish, for the README and notes. */
  about: string
}

export const SOURCES = {
  intuitionLabs: {
    label: 'IntuitionLabs',
    url: 'https://intuitionlabs.ai/articles/nvidia-ai-gpu-pricing-guide',
    about: 'Precio de servidores y GPUs de IA: 300.000–500.000+ $ por servidor de 8 GPUs.',
  },
  siliconAnalysts: {
    label: 'Silicon Analysts',
    url: 'https://siliconanalysts.com/analysis/nvidia-gpu-prices-double-as-ai-demand-overwhelms-supply-chain',
    about: 'Plazos de entrega de GPUs para centros de datos cercanos a un año (enero 2026).',
  },
  castAi: {
    label: 'Cast AI',
    url: 'https://cast.ai/blog/gpu-cloud-pricing/',
    about: 'Precios de GPU en la nube; subida del 15 % en H200 (enero 2026). Publica 12,29 $/h para p5.',
  },
  spheron: {
    label: 'Spheron',
    url: 'https://www.spheron.network/blog/aws-h100-pricing-2026/',
    about: 'Precio bajo demanda de AWS p5 tras la bajada de junio de 2025: 6,88 $ por GPU-hora.',
  },
  awsHealthOmics: {
    label: 'AWS HealthOmics',
    url: 'https://aws.amazon.com/healthomics/',
    about: 'Servicio gestionado de genómica: almacenamiento, flujos de trabajo y aptitud HIPAA.',
  },
  awsOutage: {
    label: 'AWS',
    url: 'https://aws.amazon.com/message/101925',
    about: 'Informe de la incidencia de us-east-1 del 19–20 de octubre de 2025 (~15 h).',
  },
  googleBatch: {
    label: 'Google Cloud',
    url: 'https://cloud.google.com/batch/docs/migrate-to-batch-from-cloud-life-sciences',
    about: 'Cierre de Cloud Life Sciences en julio de 2025 y migración a Batch.',
  },
  egressFees: {
    label: 'DataStorage',
    url: 'https://datastorage.com/articles/egress-fees-explained-the-complete-2026-guide-to-clouds-most-hated-cost/',
    about: 'Costes de salida de datos (egress) y su papel en la dependencia del proveedor.',
  },
  bioPharmaDive: {
    label: 'BioPharma Dive',
    url: 'https://www.biopharmadive.com/news/biotech-venture-capital-funding-2026-first-half/824881/',
    about: 'Capital riesgo en biotecnología, primer semestre de 2026, por modalidad terapéutica.',
  },
} as const satisfies Record<string, Source>

export type SourceId = keyof typeof SOURCES

export function sourceLabels(ids: readonly SourceId[]): string {
  return ids.map((id) => SOURCES[id].label).join(' · ')
}
