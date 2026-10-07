# Teleprompter Libre

> Español · [English (proyecto original)](README.en.md) · [中文](README.zh-CN.md)

Teleprompter web libre (MIT) que funciona en el navegador, sin instalar nada ni crear cuenta. Sirve para
grabar a cámara, dar clases en línea, transmitir en vivo o presentar con un segundo monitor.

Es un fork de [zhang-brook/web-teleprompter](https://github.com/zhang-brook/web-teleprompter) (Vue 3 +
TypeScript). Conserva todo lo del original y agrega lo que hace falta para usarlo en más situaciones.

## Qué hace

| Función | Origen |
|---|---|
| Avance a **velocidad fija** o **siguiendo la voz** (reconocimiento de voz del navegador) | Original |
| Línea de lectura arrastrable, palabra actual resaltada y texto leído atenuado | Original |
| Espejo horizontal y vertical, rotación de 0 a 359° | Original |
| Ventana flotante, ventana completa, pantalla completa | Original |
| Fuente, tamaño, interlineado, espaciado y colores; todo se guarda en el navegador | Original |
| **Interfaz en español** y reconocimiento de voz en es-ES, es-MX, es-CL, es-AR, pt-BR e it-IT | Fork |
| **Importar** `.txt`, `.md`, `.docx` (Word), `.srt`/`.vtt` (subtítulos) y `.html` | Fork |
| **Indicaciones entre [corchetes]**: se ven atenuadas, no se leen y la voz las ignora | Fork |
| **Duración estimada** según palabras por minuto | Fork |
| **Teclado y punteros de presentación**: avanzar o retroceder por párrafo, pausa, velocidad | Fork |
| **Segunda pantalla** sincronizada (monitor externo, atril con vidrio, fuente de navegador en OBS) | Fork |
| **Control externo**: otra página o script puede manejarlo con mensajes | Fork |
| **Asistente IA (Claude)** con tu propia API key: adaptar el guion, ajustarlo a una duración, traducir… | Fork |
| **Versión offline** de un solo archivo HTML | Fork |

## Uso

Requiere Node 22.18+ o 24.12+ y [pnpm](https://pnpm.io) (`npx pnpm@10` sirve sin instalarlo).

```bash
pnpm install
pnpm dev             # desarrollo en http://localhost:5173
pnpm build           # sitio estático en dist/ (lo publica .github/workflows/deploy.yml en GitHub Pages)
pnpm build:offline   # dist-offline/index.html: un solo archivo que se abre con doble clic
```

La versión offline funciona sin internet, salvo el asistente IA (llama a la API) y, según el
navegador, el seguimiento por voz. La **segunda pantalla** necesita abrirse por `http://` (por ejemplo
con `pnpm dev`, `pnpm preview` o desde GitHub Pages): los navegadores no comunican de forma confiable
dos páginas abiertas como `file://`.

## Escribir el guion

- **Un párrafo por bloque de lectura**, separados por una línea en blanco. Los saltos con el teclado o el
  puntero van de párrafo en párrafo.
- **Indicaciones entre corchetes**: `[pausa]`, `[mirar a cámara]`, `[clic]`, `[respirar]`. Se muestran en
  cursiva y atenuadas, no cuentan para la duración y el seguimiento por voz no las espera.

```
Hay algo que suele sorprender: en realidad, no medimos el VO₂. [pausa]

Lo que medimos son fenómenos físicos —presión, flujo, concentraciones de gases—
y a partir de ellos lo estimamos. [mirar a cámara]
```

## Teclas

| Tecla | Acción |
|---|---|
| Espacio | Iniciar / pausar / continuar |
| Esc | Detener |
| AvPág o → | Párrafo siguiente |
| RePág o ← | Inicio del párrafo actual; si ya estás ahí, el anterior |
| ↑ / ↓ | Más rápido / más lento (velocidad fija) |
| + / − | Tamaño de letra |
| M | Espejo horizontal |

Los punteros de presentación (los que tienen botones de avance y retroceso) envían AvPág y RePág, así que
funcionan sin configurar nada. En el modo «seguir la voz», saltar de párrafo también mueve el punto desde
donde se sigue escuchando.

## Segunda pantalla

El botón **Pantalla** abre una ventana que sólo muestra el texto y sigue a la ventana principal. Puedes
llevarla a un monitor frente a ti, a un atril con vidrio reflectante o agregarla en OBS como fuente de
navegador (`…/?pantalla`).

El texto, la fuente y los colores vienen de la ventana principal. El **tamaño de letra, el espejo y la
rotación son propios de cada pantalla** y se ajustan en ella con `+`, `−` y `M`; `F` activa la pantalla
completa. La posición se sincroniza por carácter, no por píxel: ambas ventanas muestran la misma palabra en
la línea de lectura aunque tengan distinto tamaño o letra.

## Control externo

Cualquier página del mismo sitio puede manejar el teleprompter, por ejemplo un sistema de diapositivas
que avance el guion al cambiar de lámina:

```js
const tp = new BroadcastChannel('teleprompter-libre')
tp.postMessage({ type: 'cmd', cmd: 'next' })
```

Si el teleprompter está en un `<iframe>` o en una ventana abierta con `window.open`, también acepta
`ventana.postMessage({ type: 'cmd', cmd: 'next' }, '*')`.

Comandos: `start`, `stop`, `pause`, `next`, `prev`, `faster`, `slower`, `bigger`, `smaller`, `mirror`.

## Asistente IA

En **Ajustes → Asistente IA (Claude)** pegas tu API key de Anthropic, eliges una acción y el resultado
aparece en una vista previa. Desde ahí decides si reemplaza el guion o se agrega al final. **Deshacer**
recupera el guion anterior.

| Acción | Qué hace |
|---|---|
| Adaptar para leer en voz alta | Frases cortas y fáciles de pronunciar, sin cambiar el contenido |
| Ajustar a una duración | Acorta o desarrolla el guion para que dure N minutos a tu velocidad de lectura |
| Agregar indicaciones | Inserta `[pausa]`, `[respirar]`, `[énfasis]`, `[mirar a cámara]` |
| Corregir | Ortografía, gramática y puntuación para las pausas |
| Traducir | A otro idioma, en registro hablado |
| Resumir en tarjetas | Notas breves para hablar sin leer |
| Instrucción libre | Lo que le pidas |

Se le indica al modelo que no invente datos, cifras ni citas, pero **revisa siempre el resultado** antes
de usarlo.

Modelos disponibles: Claude Opus 5.5 (predeterminado), Claude Sonnet 5.5 y Claude Haiku 4.5. El costo
lo cobra Anthropic en tu cuenta, según el largo del guion.

**Sobre la API key:**

- Se usa sólo para llamar directamente a `api.anthropic.com` desde tu navegador. No pasa por ningún
  servidor intermedio.
- Por defecto se guarda en la sesión y se borra al cerrar la pestaña. Con «Recordar en este navegador»
  queda en el almacenamiento local.
- Nunca se incluye en la configuración exportada.
- Cualquier script que corra en la página podría leerla. Usa una clave con **límite de gasto** y no la
  guardes en un computador compartido.

## Limitaciones

- **Seguir la voz** funciona en Chrome y Edge. Según el navegador y el idioma, el reconocimiento puede
  procesarse en servidores externos y necesitar internet. Reconoce un solo idioma a la vez y se
  desorienta con silencios largos o improvisación; para presentaciones con preguntas del público
  conviene la velocidad fija con el teclado o el puntero.
- El **control desde el teléfono** (otro dispositivo) todavía no existe: la sincronización actual es
  entre ventanas del mismo navegador. Está en la hoja de ruta.
- Las acciones del asistente IA están escritas en español. Funcionan con guiones en otros idiomas, que
  el modelo conserva salvo cuando le pides traducir.

## Hoja de ruta

1. Control desde el teléfono en la misma red Wi-Fi (servidor local mínimo con WebSocket).
2. Integración con presentaciones: que el guion avance con las láminas mediante el control externo.
3. Cuenta regresiva por párrafo o sección con alerta de tiempo.
4. Aplicar la IA sólo al texto seleccionado.

## Créditos y licencia

- Proyecto original: [web-teleprompter](https://github.com/zhang-brook/web-teleprompter) de Brook Zhang (MIT).
- Fork: Claudio Abarca Vargas.
- Licencia MIT; ver [LICENSE](LICENSE).
