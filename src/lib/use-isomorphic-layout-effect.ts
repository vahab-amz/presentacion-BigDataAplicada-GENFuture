import { useEffect, useLayoutEffect } from 'react'

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * The deck needs to read the URL hash and paint the right slide *before* the
 * browser paints, otherwise reloading on slide 4 flashes slide 1. React warns
 * about `useLayoutEffect` during server rendering, hence the swap.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
