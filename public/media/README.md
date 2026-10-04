# Medios de la diapositiva 1

- `hero.mp4` — vídeo de portada, silenciado y en bucle (16:9). Debe ser H.264 +
  yuv420p con `moov` al principio (faststart). `npm run media:hero` lo revisa y,
  si ffmpeg está instalado, lo arregla y genera `hero.webm`.
- `hero.webm` — opcional (VP9). Si existe, el deck lo prueba primero.
- `hero-poster.jpg` — fotograma fijo: lo usan la ventana del ponente, `/print` y
  el modo de movimiento reducido.

Si no hay vídeo, o el navegador no puede reproducir ninguna fuente, la
diapositiva 1 dibuja sola una doble hélice de puntos que gira despacio.

**Después de cambiar cualquier archivo de esta carpeta, `npm run build`.** El
deck se sirve desde `out/`, que solo recoge `public/` al compilar;
`npm run check:deck` falla si `out/` se ha quedado atrás.

`why-cloud/` contiene los dos recortes fotográficos de la infografía de Alex
(diapositiva 5).
