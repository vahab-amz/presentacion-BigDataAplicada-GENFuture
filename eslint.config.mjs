import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// `next lint` was removed in Next.js 16; eslint-config-next ships native flat
// config arrays, so ESLint is invoked directly (`npm run lint`).
const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'screenshots/**',
      'next-env.d.ts',
    ],
  },
  ...coreWebVitals,
  ...typescript,
]

export default config
