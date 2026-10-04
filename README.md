# GENFuture — propuesta del Equipo 2 (Big Data Aplicada)

Deck de cinco diapositivas para el rol de CEO, con el material del equipo: una
escena fija de 1920×1080 escalada a cualquier pantalla, controlada solo con el
teclado, con ventana del ponente, ruta de impresión, un vídeo de portada a
pantalla completa, un presupuesto por escenarios interactivo y un anexo oculto
para preguntas.

| # | Diapositiva | Estados | Contenido |
| --- | --- | ---: | --- |
| 1 | `company` | 5 | Portada con vídeo · la empresa · dónde están los costes · la propuesta · conclusión |
| 2 | `cloud` | 7 | Demanda vs. capacidad · servicios AWS · cifrado · KPIs (guion literal en las notas) |
| 3 | `budget` | 5 | CAPEX vs. OPEX · barras por escenario · escenarios interactivos · métricas unitarias |
| 4 | `hybrid` | 5 | Pilares · flujo de Confianza Cero · tiempo de implantación · conclusión |
| 5 | `why-cloud` | 4 | Reproducción de la infografía de Alex, siempre en claro |
| A | `risks` | 5 | Anexo · Riesgos: fuera del flujo, solo con la tecla `A` |

Todo el texto en pantalla está en español (España). El código, los comentarios y
los nombres de archivo están en inglés.

---

## Puesta en marcha

```bash
npm install          # una vez
npm run dev          # desarrollo en http://localhost:3000
```

### Compilar y servir sin conexión (lo que se usa el día de la presentación)

```bash
npm run build        # exportación estática -> out/
npm run serve        # sirve out/ en http://localhost:4173
```

`npm run preview` hace las dos cosas de una vez.

> **Cualquier cambio en `public/` exige volver a compilar.** `npm run serve`
> sirve `out/`, y `out/` solo recoge `public/` al ejecutar `npm run build`. Si
> añades o cambias el vídeo, una imagen o cualquier otro archivo de `public/`
> y no compilas, el deck sigue sirviendo la copia antigua (o ninguna).
> `npm run check:deck` lo detecta: falla si algún archivo de `public/` falta en
> `out/` o es distinto.

> **`file://` no funciona.** La exportación estática usa rutas absolutas y varias
> APIs del navegador que exigen un origen HTTP. El servidor estático
> (`http-server`) ya está instalado como dependencia de desarrollo, así que
> `npm run serve` funciona sin red. Copia la carpeta del proyecto entera (con
> `node_modules/`) al portátil de la presentación, o cualquier otro servidor
> estático servirá: `npx serve out`, `python -m http.server` dentro de `out/`, etc.

No hay ninguna petición de red en tiempo de ejecución: las tipografías se
descargan **en la compilación** y se sirven desde `out/_next/static/media/`.

### Comprobaciones

```bash
npm run typecheck        # tsc --noEmit (TypeScript estricto)
npm run lint             # eslint (next lint desapareció en Next.js 16)
npm run test             # vitest: presupuesto, perfil de demanda, manifiesto y navegación
npm run check:deck       # recorre el deck compilado en un navegador real
npm run screenshots      # una captura por diapositiva y paso -> screenshots/
npm run screenshots:all  # oscuro y claro, a 1920x1080 y 1280x720
npm run media:hero       # revisa (y, con ffmpeg, arregla) el vídeo de portada
npm run check            # typecheck, lint, test, build y check:deck, en orden
```

`npm run screenshots` acepta `--theme=light`, `--width=1280 --height=720`,
`--all` y `--url=…` si prefieres servir `out/` por tu cuenta.

Los dos scripts de navegador leen las diapositivas y los pasos de
`out/deck-manifest.json`, que la compilación genera a partir de
`src/data/deck.ts`: no hay ninguna lista repetida en los scripts. Usan **Google
Chrome** si está instalado (`channel: 'chrome'`), porque el Chromium que trae
Playwright no decodifica H.264 y solo mostraría la hélice; si no hay Chrome,
avisan y siguen con Chromium.

`check:deck` comprueba, entre otras cosas: que `public/` está entero en `out/`,
cada atajo, la ida y vuelta por todos los pasos, el anexo (se abre y se cierra
sin mover la posición ni la barra de progreso), que los botones de escenario no
se quedan con el teclado, que el vídeo cubre toda la ventana en una pantalla
4:3, que el margen alrededor del escenario tiene el color de la diapositiva en
los dos temas, que con todas las fuentes de vídeo rotas se queda la hélice, que
la ventana del ponente y `/print` muestran el póster y no el vídeo, y que no hay
errores ni peticiones fallidas.

---

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `→` `Espacio` `Intro` `AvPág` `↓` | Siguiente revelado; al final de la diapositiva, la siguiente |
| `←` `Retroceso` `RePág` `↑` | Revelado anterior; antes del paso 0, el último paso de la anterior |
| `Inicio` / `Fin` | Primera / última posición |
| `1` – `5` | Ir a esa diapositiva, paso 0 |
| `A` | Abrir o cerrar el **Anexo · Riesgos** |
| `F` | Pantalla completa |
| `B` o `.` | Pantalla en negro |
| `N` | Notas del ponente sobre la escena |
| `P` | Abrir la ventana del ponente |
| `T` | Tema claro / oscuro |
| `H` | Ocultar la barra inferior |
| `?` | Ayuda de atajos |
| `Esc` | Deshace una capa: un control enfocado, luego notas o ayuda, luego el anexo |

Los mandos de presentación envían `RePág`/`AvPág`: funcionan en las dos ventanas.

La posición va en el hash: `#/<diapositiva>/<paso>`, con la diapositiva en base 1.
Recargar mantiene el sitio; se puede enlazar a un paso concreto.

### El anexo

`A` abre el anexo de riesgos **ya revelado entero**, para responder preguntas.
No forma parte del flujo: no cuenta en «n / 5» (la barra inferior dice
«Anexo»), la barra de progreso no se mueve y el hash no cambia. Dentro, las
flechas recorren sus pasos sin salir de él; `A` o `Esc` vuelven exactamente a
donde estabas. Pulsar un número, `Inicio` o `Fin` también lo cierra.

---

## Ventana del ponente

`P` abre `?view=presenter` en una ventana nueva. Muestra la escena actual, una
vista previa del paso siguiente, las notas en grande, el cronómetro total y el de
la diapositiva, y el contador de diapositiva/paso. En la diapositiva 1 las dos
vistas previas enseñan el **póster** del vídeo, no el vídeo.

Las dos ventanas se sincronizan con `BroadcastChannel`: navegar, el anexo, el
negro y el tema viajan en los dos sentidos. Las notas, la ayuda y `H` son locales
a cada ventana, para que abrir las notas en el portátil no las proyecte.

> Los botones de escenario de la diapositiva 3 son **locales a cada ventana**:
> púlsalos en la pantalla que se proyecta, no en la del ponente. Son solo de
> ratón: no entran en el orden del tabulador y sueltan el foco al hacer clic,
> así que `Espacio` y las flechas siguen moviendo el deck.

---

## PDF de respaldo

1. Abre `http://localhost:4173/print/`.
2. Imprimir → **Guardar como PDF**, orientación **horizontal**, márgenes
   **ninguno**, y activa «Gráficos de fondo».

Cada diapositiva sale en su paso final, una por página A4 apaisada, y el anexo
va como última página. La portada usa el póster del vídeo. La ruta respeta el
tema activo (pulsa `T` en el deck antes de imprimir si prefieres el PDF en
claro); la diapositiva 1 es siempre oscura y la 5 siempre clara.

---

## Dónde se cambian las cosas

| Qué | Archivo |
| --- | --- |
| Texto y notas de cada diapositiva | `src/data/deck.ts` → `SLIDE_COMPANY`, `SLIDE_CLOUD`, `SLIDE_BUDGET`, `SLIDE_HYBRID`, `SLIDE_WHY_CLOUD`, `APPENDIX_RISKS` |
| Orden, pasos, superficie y fondo de cada diapositiva | `src/data/deck.ts` → `SLIDES` y `APPENDIX` |
| Guion literal de la diapositiva 2 (uno por paso) | `src/data/deck.ts` → `SLIDE_CLOUD.notesByStep` |
| Cifras del presupuesto | `src/data/budget-scenarios.ts` |
| Perfil de demanda compartido (diapositivas 1 y 2) | `src/data/demand-profile.ts` |
| Vídeo, póster y oscurecido de la portada | `src/data/deck.ts` → `HERO_MEDIA` |
| Fuentes y URLs completas | `src/data/sources.ts` |
| Colores, tipos y tamaños | `src/app/globals.css` (tokens en `@theme` y paletas `data-palette`) |

Ningún componente contiene texto ni cifras: todo sale de `src/data/`.

---

## El vídeo de portada

`public/media/hero.mp4` (y, si existe, `public/media/hero.webm`) corre **a
pantalla completa**, detrás del escenario, mientras la diapositiva en pantalla
declara `backdrop: 'hero'` (la 1). En esa diapositiva el escenario y el margen
son transparentes, así que el vídeo llega de borde a borde aunque la ventana no
sea 16:9. Al cambiar de diapositiva la capa hace un fundido y el vídeo se pausa.

- **Carga:** primero se dibuja la hélice de puntos; el vídeo va encima con
  opacidad 0 y aparece con un fundido cuando empieza a reproducirse. No hay
  temporizador: solo se queda la hélice si **todas** las fuentes fallan.
- **Fuentes:** la página comprueba al compilar qué archivos existen. `hero.webm`
  va primero si está; después `hero.mp4`. Un archivo que falta simplemente no se
  lista, así que nunca hay un 404.
- **Paso 0** (portada): oscurecido ≈ 50 %. **Pasos 1–4:** el vídeo queda al
  ≈ 15 % para que el contenido se lea.
- **`prefers-reduced-motion`:** se muestra el póster fijo en lugar del vídeo.

### Codificación

`npm run media:hero` inspecciona `hero.mp4`. Debe ser **H.264 + yuv420p con
`moov` al principio** (faststart) para que cualquier navegador lo decodifique y
empiece antes de tenerlo entero. Si no lo es y `ffmpeg` está instalado, guarda el
original como `hero-original.mp4`, recodifica `hero.mp4` (libx264, CRF 20,
yuv420p, +faststart, sin audio) y genera `hero.webm` (VP9, sin audio). Sin
ffmpeg solo informa e imprime los comandos. Después: `npm run build`.

---

## El presupuesto por escenarios

`src/data/budget-scenarios.ts` recoge la tabla del equipo tal cual (USD). Sin
auditoría previa en Nueva York se modelan tres volúmenes:

| Partida (al mes) | Conservador · 300 TB | Base · 1,2 PB | Expansión · 3 PB |
| --- | ---: | ---: | ---: |
| Histórico frío (80 % del volumen) | 720 $ | 2.880 $ | 7.200 $ |
| I+D y terapias activas (20 % del volumen) | 1.200 $ | 4.800 $ | 12.000 $ |
| Bases de datos estructuradas | 500 $ | 2.500 $ | 6.250 $ |
| Cómputo IA bajo demanda y seguridad | 2.000 $ | 5.800 $ | 12.000 $ |
| **Total mensual (OPEX)** | **4.420 $** | **15.980 $** | **37.450 $** |
| Migración inicial (pago único) | 2.000 $ | 5.000 $ | 12.000 $ |

- Los **totales se calculan** a partir de las partidas; nunca se escriben dos
  veces. Cambiar una partida mueve el total, la gráfica y el panel.
- Las pruebas fijan los totales (4.420 / 15.980 / 37.450), comprueban que el
  histórico frío es 80 % × volumen × 3 $/TB y el caliente 20 % × volumen ×
  20 $/TB, que el −85 % es 1 − 0,003 / 0,020 y que los ~8,50 $/TB·mes cuadran con
  datos + bases de datos del escenario base (8,48 $).
- **Personal:** hay una partida `personal` desactivada (`enabled: false`,
  `values: null`) con un `TODO` para el equipo. Al activarla con sus valores
  entra sola en los totales, en la gráfica (como quinto segmento) y en el panel.

Las barras apilan las partidas en el mismo orden que el panel, de arriba abajo:
histórico frío (azul apagado), I+D activa (acento), bases de datos (neutro) y
cómputo (verde nube). Los colores pasan las comprobaciones de separación entre
vecinos, daltonismo y contraste del validador de paletas; el azul apagado y el
neutro quedan fuera del suelo de croma a propósito, y cada segmento lleva
etiqueta.

---

## Fuentes

| Nombre en pantalla | URL |
| --- | --- |
| IntuitionLabs | <https://intuitionlabs.ai/articles/nvidia-ai-gpu-pricing-guide> |
| Silicon Analysts | <https://siliconanalysts.com/analysis/nvidia-gpu-prices-double-as-ai-demand-overwhelms-supply-chain> |
| Cast AI | <https://cast.ai/blog/gpu-cloud-pricing/> |
| AWS HealthOmics | <https://aws.amazon.com/healthomics/> |
| AWS (incidencia us-east-1) | <https://aws.amazon.com/message/101925> |
| Google Cloud (cierre de Cloud Life Sciences) | <https://cloud.google.com/batch/docs/migrate-to-batch-from-cloud-life-sciences> |
| DataStorage (costes de egress) | <https://datastorage.com/articles/egress-fees-explained-the-complete-2026-guide-to-clouds-most-hated-cost/> |

Las diapositivas 1, 3, 4 y 5 salen del documento del equipo
(`docs/team/ACTIVIDAD_2_CONJUNTA.pdf`); las cifras del presupuesto llevan la
etiqueta «Estimación del equipo» y los cronogramas, «Cronograma ilustrativo».

---

## Cómo está hecho

- **Next.js 16.2.4** (App Router) con `output: 'export'` → `out/`, compilado con
  Turbopack (`npm run build:webpack` sigue disponible). `src/app/page.tsx` es un
  componente de servidor que decide en la compilación qué vídeos existen;
  `src/app/deck-manifest.json/route.ts` genera el manifiesto para los scripts.
- **React 19**, **TypeScript estricto** (`noUncheckedIndexedAccess`,
  `noUnusedLocals`, `verbatimModuleSyntax`).
- **Tailwind CSS v4** como plugin de PostCSS, con los tokens en `@theme` dentro de
  `src/app/globals.css`. No hay `tailwind.config.*`.
- **Motion for React** (`motion/react`), con `MotionConfig reducedMotion="user"`.
- **Sin librería de gráficas.** Cada gráfica es SVG escrito a mano para animar
  cada elemento por paso; `d3-shape` genera las curvas. El cronograma de la
  diapositiva 4 es el componente `Timeline` de la antigua diapositiva de la
  carrera, generalizado (`src/components/chart/Timeline.tsx`).
- Tipografías **Source Serif 4** e **Inter** vía `next/font/google`, autoalojadas.

### El motor

- El estado es `{ slide, step }` más el paso del anexo (`null` si está cerrado).
  Las funciones de navegación de `src/deck/deck-state.ts` son puras y tienen
  pruebas.
- `<Reveal at={n}>` (y `until` para lo que sale, como el título de portada)
  compara con el paso actual y anima solo opacidad y transformada. Ir hacia atrás
  es otro estado, y saltar a un paso lo pinta ya resuelto.
- **Paletas:** el tema `T` fija la raíz, y cualquier elemento puede fijar la suya
  con `data-palette` (`dark`, `light` o `paper`). Cada diapositiva, el margen y la
  barra inferior llevan la suya, así que una diapositiva conserva sus colores
  mientras sale y el margen siempre coincide con la que está en pantalla.
  `surface: 'light'` (diapositiva 5) usa `paper`, el blanco frío de la
  infografía de Alex; la 1 lleva `surface: 'dark'` porque es una portada con
  vídeo; el resto sigue a `T`.
- El mismo componente sirve para la escena, las vistas previas del ponente y
  `/print`; solo cambia el modo de render.

### Accesibilidad

- `aria-live` anuncia «Diapositiva X de 5, paso Y» (o el anexo).
- Foco visible en todo control (contorno azul de 3 px).
- Ninguna serie se identifica solo por color: todas llevan etiqueta directa.
- Con `prefers-reduced-motion` no hay desplazamientos: solo fundidos, las
  cifras aparecen ya contadas y la portada muestra el póster.

---

## Qué hay que revisar a mano

1. **El vídeo de portada:** hoy es H.264 High, yuv420p, 1280×720, pero con
   `moov` al final y pista de audio (se reproduce silenciado). Sin ffmpeg no se
   ha recodificado; con ffmpeg instalado, `npm run media:hero` y `npm run build`.
2. **La partida de personal** del presupuesto (`TODO` en
   `src/data/budget-scenarios.ts`).
3. **Los plazos de las fases** del cronograma de la diapositiva 4: los extremos
   (90 días, 6 meses, 12–18 meses, 15) son del equipo; la duración de cada fase
   intermedia es ilustrativa.
4. **El proyector:** si lava los colores, pulsa `T` para el tema claro.
5. **El PDF de respaldo**, generado una vez con la configuración de arriba.
