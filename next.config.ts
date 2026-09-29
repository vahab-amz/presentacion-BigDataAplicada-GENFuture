import type { NextConfig } from 'next'

/**
 * Static export: `next build` emits a fully static site into `out/`.
 * The deck must run offline on presentation day, so there is no server,
 * no image optimisation endpoint and no runtime network access.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // No optimisation server exists in a static export.
  images: { unoptimized: true },
  // Emits `out/print/index.html` instead of `out/print.html`, so a plain
  // static file server resolves `/print` without extension rewriting rules.
  trailingSlash: true,
}

export default nextConfig
