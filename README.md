# GENFuture — presentación de la propuesta cloud (Equipo 2 · Terapias)

Deck de cinco diapositivas para el rol de CEO: una escena fija de 1920×1080 escalada
a cualquier pantalla, controlada solo con el teclado, con ventana del ponente,
ruta de impresión y un modelo de costes editable que recalcula en directo.

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

> **`file://` no funciona.** La exportación estática usa rutas absolutas y varias
> APIs del navegador que exigen un origen HTTP. El servidor estático
> (`http-server`) ya está instalado como dependencia de desarrollo, así que
> `npm run serve` funciona sin red. Copia la carpeta del proyecto entera (con
> `node_modules/`) al portátil de la presentación, o cualquier otro servidor
> estático servirá: `npx serve out`, `python -m http.server` dentro de `out/`, etc.

No hay ninguna petición de red en tiempo de ejecución: las dos tipografías se
descargan **en la compilación** y se sirven desde `out/_next/static/media/`.

### Comprobaciones

```bash
npm run typecheck    # tsc --noEmit (TypeScript estricto)
npm run lint         # eslint (next lint desapareció en Next.js 16)
npm run test         # vitest: 29 pruebas del modelo de costes
npm run check:deck   # recorre el deck en un navegador headless
npm run screenshots  # una captura por diapositiva y paso -> screenshots/
npm run check        # todo lo anterior, en orden
```

`npm run screenshots` acepta `--theme=light`, `--width=1280 --height=720` y
`--url=…` si prefieres servir `out/` por tu cuenta.

---

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `→` `Espacio` `Intro` `AvPág` `↓` | Siguiente revelado; al final de la diapositiva, la siguiente |
| `←` `Retroceso` `RePág` `↑` | Revelado anterior; antes del paso 0, el último paso de la anterior |
| `Inicio` / `Fin` | Primera / última posición |
| `1` – `5` | Ir a esa diapositiva, paso 0 |
| `F` | Pantalla completa |
| `B` o `.` | Pantalla en negro |
| `N` | Notas del ponente sobre la escena |
| `P` | Abrir la ventana del ponente |
| `T` | Tema claro / oscuro |
| `H` | Ocultar la barra inferior |
| `?` | Ayuda de atajos |
| `Esc` | Cerrar superposiciones; si hay un control enfocado, devolver el teclado al deck |

Los mandos de presentación envían `RePág`/`AvPág`: funcionan en las dos ventanas.

Mientras un deslizador o un campo tiene el foco, el deck **ignora** sus teclas
(las flechas mueven el deslizador, no la diapositiva). `Esc` devuelve el foco.
Los deslizadores además se desenfocan solos al soltar el ratón.

La posición va en el hash: `#/<diapositiva>/<paso>`, con la diapositiva en base 1.
Recargar mantiene el sitio; se puede enlazar a un paso concreto.

---

## Ventana del ponente

`P` abre `?view=presenter` en una ventana nueva. Muestra la escena actual, una
vista previa del paso siguiente, las notas en grande, el cronómetro total y el de
la diapositiva, y el contador de diapositiva/paso.

Las dos ventanas se sincronizan con `BroadcastChannel`: navegar, el negro y el
tema viajan en los dos sentidos. Las notas, la ayuda y `H` son locales a cada
ventana, para que abrir las notas en el portátil no las proyecte.

> Los deslizadores de la diapositiva 4 son **locales a cada ventana**: muévelos
> en la pantalla que se proyecta, no en la del ponente.

---

## PDF de respaldo

1. Abre `http://localhost:4173/print/`.
2. Imprimir → **Guardar como PDF**, orientación **horizontal**, márgenes
   **ninguno**, y activa «Gráficos de fondo».

Cada diapositiva sale en su paso final, una por página A4 apaisada. La ruta
respeta el tema activo: pulsa `T` en el deck antes de imprimir si prefieres el
PDF en claro.

---

## Dónde se cambian las cosas

| Qué | Archivo |
| --- | --- |
| Nombres de quien presenta | `src/data/deck.ts` → `PRESENTERS` (cinco cadenas, arriba del todo) |
| Todo el texto en pantalla | `src/data/deck.ts` → `SLIDE_1` … `SLIDE_5` |
| Notas del ponente | `src/data/deck.ts`, dentro de cada `SLIDE_n` (`notes`, y `notesByStep` en la 3) |
| Número de pasos por diapositiva | `src/data/deck.ts` → `SLIDES[].steps` |
| Fuentes y URLs completas | `src/data/sources.ts` |
| Supuestos económicos | `src/data/cost-model.ts` → `ASSUMPTIONS` |
| Perfil de demanda compartido | `src/data/cost-model.ts` → `DEMAND_PROFILE` |
| Rangos de los deslizadores | `src/data/cost-model.ts` → `INPUT_RANGES` |
| Colores, tipos y tamaños | `src/app/globals.css` (tokens en `@theme`) |

Ningún componente contiene texto ni cifras: todo sale de `src/data/`.

### Vídeo de portada

Coloca `public/media/hero.mp4` y `public/media/hero-poster.jpg`. Si no están (o
si el navegador no puede reproducirlos), la diapositiva 1 dibuja sola una doble
hélice de puntos que gira despacio. No hay que tocar nada.

---

## El modelo de costes

`src/data/cost-model.ts` es una función pura: `computeCostModel(inputs, params)`.
Cada cifra lleva su origen — o `source` (una URL de `sources.ts`) o
`illustrative: true`. Las ilustrativas llevan en pantalla una etiqueta
«Ilustrativo».

Un único perfil de demanda de 12 multiplicadores con media exactamente 1,0
alimenta las diapositivas 2, 3 y 4:

```
0,45  0,55  1,75  2,20  0,70  0,45  0,50  1,60  2,00  0,80  0,45  0,55
```

### Resultados por defecto

Entradas: **5.000 genomas/año**, **1.500 horas de GPU/mes (media)**. Horizonte 36 meses.

| Concepto | On-premise | Nube (AWS) |
| --- | ---: | ---: |
| Caja que sale en el mes 0 | 770.333 $ | 60.511 $ |
| Total a 36 meses | 2.596.000 $ | 1.660.131 $ |
| — Hardware | 940.000 $ | 0 $ |
| — Software | 180.000 $ | 816.945 $ |
| — Personal | 1.008.000 $ | 756.000 $ |
| — Otros | 468.000 $ | 87.186 $ |
| Coste por genoma (15.000 genomas) | 173,07 $ | 110,68 $ |
| Servidores de 8 GPUs comprados | 1 | 0 |
| Utilización media de esas GPUs | 25,7 % | — |
| Punto de equilibrio | no existe dentro de los 36 meses | |
| **Diferencia a favor de la nube** | **935.869 $** | |

### Extremos del rango de los deslizadores

| Genomas/año | Horas GPU/mes | Servidores | Utilización | On-premise | Nube | Equilibrio |
| ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| 1.000 | 500 | 1 | 9 % | 2.077.600 $ | 1.013.830 $ | ninguno |
| 1.000 | 1.500 | 1 | 26 % | 2.077.600 $ | 1.278.847 $ | ninguno |
| 1.000 | 6.000 | 3 | 34 % | 3.297.600 $ | 2.471.427 $ | ninguno |
| 5.000 | 500 | 1 | 9 % | 2.596.000 $ | 1.395.114 $ | ninguno |
| 5.000 | 1.500 | 1 | 26 % | 2.596.000 $ | 1.660.131 $ | ninguno |
| 5.000 | 6.000 | 3 | 34 % | 3.816.000 $ | 2.852.710 $ | ninguno |
| 20.000 | 500 | 1 | 9 % | 4.540.000 $ | 2.824.928 $ | ninguno |
| 20.000 | 1.500 | 1 | 26 % | 4.540.000 $ | 3.089.945 $ | ninguno |
| 20.000 | 6.000 | 3 | 34 % | 5.760.000 $ | 4.282.525 $ | ninguno |

**Con estos supuestos no hay punto de equilibrio en ningún punto del rango.** Lo
que lo impide es el dimensionado al pico (×2,2) más los 2 FTE, las licencias y el
mantenimiento del on-premise. El deck lo dice tal cual en pantalla en vez de
insinuar un cruce que no existe. Si el equipo cambia un supuesto y aparece un
cruce, la diapositiva 4 lo marca sola en la gráfica y en el panel.

Las pruebas cubren ese caso: `cost-model.test.ts` fuerza un escenario con la nube
carísima y comprueba que el cruce se detecta en el mes correcto.

### Reparto por categorías

Cada partida cae en una sola categoría:

| | Hardware | Software | Personal | Otros |
| --- | --- | --- | --- | --- |
| **On-premise** | Servidores de GPU, cabinas de almacenamiento | Licencias | 2 FTE | Adecuación de CPD, electricidad y refrigeración, mantenimiento |
| **Nube** | — (no se compra equipo) | HealthOmics, S3 y Glacier, horas de GPU | 1,5 FTE | Puesta en marcha, soporte AWS |

Los servicios de AWS se contabilizan en **Software** porque son servicios
contratados, no activos. Eso deja el Hardware de la nube en cero, que es
exactamente el argumento de la diapositiva 3.

---

## Fuentes

| Nombre en pantalla | URL |
| --- | --- |
| IntuitionLabs | <https://intuitionlabs.ai/articles/nvidia-ai-gpu-pricing-guide> |
| Silicon Analysts | <https://siliconanalysts.com/analysis/nvidia-gpu-prices-double-as-ai-demand-overwhelms-supply-chain> |
| Cast AI | <https://cast.ai/blog/gpu-cloud-pricing/> |
| Spheron | <https://www.spheron.network/blog/aws-h100-pricing-2026/> |
| AWS HealthOmics | <https://aws.amazon.com/healthomics/> |
| AWS (incidencia us-east-1) | <https://aws.amazon.com/message/101925> |
| Google Cloud (cierre de Cloud Life Sciences) | <https://cloud.google.com/batch/docs/migrate-to-batch-from-cloud-life-sciences> |
| DataStorage (costes de egress) | <https://datastorage.com/articles/egress-fees-explained-the-complete-2026-guide-to-clouds-most-hated-cost/> |
| BioPharma Dive | <https://www.biopharmadive.com/news/biotech-venture-capital-funding-2026-first-half/824881/> |

Antes de presentar conviene verificar los tres precios marcados como «verificar»
en `ASSUMPTIONS`: HealthOmics por genoma, S3 Standard y Glacier Deep Archive.

---

## Cómo está hecho

- **Next.js 16.2.4** (App Router) con `output: 'export'` → `out/`. La compilación
  por defecto con **Turbopack funciona**; no hace falta `--webpack` (queda
  disponible como `npm run build:webpack` por si acaso).
- **React 19**, **TypeScript estricto** (`noUncheckedIndexedAccess`,
  `noUnusedLocals`, `verbatimModuleSyntax`).
- **Tailwind CSS v4** como plugin de PostCSS, con los tokens en `@theme` dentro de
  `src/app/globals.css`. No hay `tailwind.config.*`.
- **Motion for React** (`motion`, importado de `motion/react`), con
  `MotionConfig reducedMotion="user"`.
- **Sin librería de gráficas.** Cada gráfica es SVG escrito a mano para poder
  animar cada elemento por paso; `d3-scale` y `d3-shape` solo generan escalas y
  rutas.
- Tipografías **Source Serif 4** (títulos y cifras) e **Inter** (texto y
  etiquetas) vía `next/font/google`, autoalojadas, con `display: 'block'` para que
  no haya destello de tipografía de reserva. Las cifras son tabulares en las dos
  (comprobado midiendo en el navegador: Inter aplica `tnum`; Source Serif 4 ya
  trae las cifras de ancho fijo por defecto), así que un número que cuenta hacia
  arriba nunca baila.

### El motor

- El estado es `{ slide, step }` y nada más. Las funciones de navegación de
  `src/deck/deck-state.ts` son puras.
- `<Reveal at={n}>` compara con el paso actual y anima solo opacidad y
  transformada, con `initial={false}`: ir hacia atrás es simplemente otro estado,
  y saltar a un paso cualquiera lo pinta ya resuelto, sin animación.
- Los elementos ocultos siguen ocupando su sitio, así que revelar algo nunca
  mueve nada.
- El mismo componente de diapositiva sirve para la escena, la vista previa del
  ponente y `/print`: solo cambia el modo de render.

### Accesibilidad

- `aria-live` anuncia «Diapositiva X de 5, paso Y».
- Foco visible en todo control (contorno azul de 3 px).
- Contraste comprobado en los dos temas; la paleta de datos pasa los cinco
  controles del validador de paletas (banda de luminosidad, suelo de croma,
  separación para daltonismo, suelo de visión normal y contraste sobre el fondo).
- Ninguna serie se identifica solo por color: todas llevan etiqueta directa.
- Con `prefers-reduced-motion` no hay desplazamientos: solo fundidos, y las
  cifras aparecen ya contadas.

---

## Qué hay que revisar a mano

1. **Los cinco nombres** en `PRESENTERS`.
2. **Los tres precios a verificar** de `ASSUMPTIONS` (HealthOmics, S3, Glacier).
3. **El vídeo de portada**, si lo vais a usar.
4. **El proyector**: si lava los colores, pulsa `T` para el tema claro, que
   aguanta mucho mejor un proyector flojo.
5. **El PDF de respaldo**, generado una vez con la configuración de impresión de
   arriba.
