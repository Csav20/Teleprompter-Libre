# Uso de inteligencia artificial y cómo citarla

Este documento declara cómo se usó IA en el desarrollo de Teleprompter Libre y explica cómo citarla en
trabajos colaborativos, según las normas editoriales y de estilo vigentes.

## 1. Qué dicen las normas

Las organizaciones de ética editorial, las revistas y los manuales de estilo coinciden en cuatro puntos:

| Principio | Fuente |
| --- | --- |
| **La IA no es autora.** La autoría implica responder por el trabajo, y una herramienta de IA no puede hacerlo, declarar conflictos de interés ni firmar cesiones de derechos. | COPE (2023); ICMJE (sección II.A.4); Nature (2023) |
| **Su uso se declara.** Si ayudó a redactar, en los agradecimientos; si intervino en datos, análisis, figuras o código, en la sección de métodos. Si no hay esas secciones, en la introducción o en una nota. | ICMJE; Nature (2023); APA (2025) |
| **Las personas responden por todo el contenido**, incluido lo generado por IA: deben revisarlo, porque puede ser incorrecto, incompleto o sesgado. | ICMJE; COPE (2023) |
| **Se cita la herramienta y su versión.** El autor de la referencia es la empresa que desarrolla el modelo. Se recomienda guardar los *prompts* y las respuestas importantes y adjuntarlos como anexo o material suplementario. | APA (2025); MLA; Chicago |

En software, lo anterior se traduce así:

- El archivo [CITATION.cff](CITATION.cff) incluye sólo autores humanos.
- La participación de la IA se declara en este documento (equivalente a la sección de métodos).
- La línea `Co-Authored-By: Claude …` de los commits es un registro de procedencia dentro de git: indica
  qué cambios se hicieron con ayuda de la IA. No es autoría académica ni reemplaza esta declaración.

## 2. Declaración de uso de IA en este proyecto

> El desarrollo del fork Teleprompter Libre (versión 0.1.0, octubre de 2026) se realizó con asistencia
> de Claude Code, el agente de programación de Anthropic, usando el modelo Claude Opus 5.5. La
> herramienta se usó para escribir y modificar código (interfaz en español, importadores de archivos,
> indicaciones, segunda pantalla, control por teclado, asistente IA y compilación offline), redactar la
> documentación y diagnosticar errores. Los cambios hechos con IA quedan marcados en el historial de git
> con la línea `Co-Authored-By: Claude`. El autor revisó, probó y aprobó todos los cambios, y es el
> responsable del contenido del repositorio.
>
> — Claudio Abarca Vargas

Aparte, la aplicación **incluye** un asistente que llama a la API de Claude con la clave del usuario (ver
[README](README.md#asistente-ia)). Si usas ese asistente para escribir o modificar un guion que vas a
publicar, declara tú también ese uso (ver la sección 3.3).

## 3. Cómo citar

### 3.1 Citar Claude (la herramienta usada en el desarrollo)

Claude Code no genera un enlace público a cada sesión. Por eso se cita la herramienta en general y no una
conversación concreta. El uso se describe en el texto, como en la sección 2.

**APA 7.ª edición (guía de APA, septiembre de 2025)**

> Anthropic. (2026). *Claude Code* (modelo Claude Opus 5.5) [Agente de programación con IA]. https://claude.com/claude-code

- Cita entre paréntesis: (Anthropic, 2026)
- Cita narrativa: Anthropic (2026)

Si citas una conversación de claude.ai que tenga enlace para compartir, usa la fecha exacta y el título
de la conversación:

> Anthropic. (2026, 7 de octubre). *Título descriptivo de la conversación* [Chat de IA generativa]. Claude Opus 5.5. https://claude.ai/share/…

**MLA 9.ª edición**

> "Descripción o texto del *prompt*" prompt. *Claude*, modelo Claude Opus 5.5, Anthropic, 7 oct. 2026, claude.com/claude-code.

**Chicago 18.ª edición (sólo nota al pie, no va en la bibliografía)**

> 1. Código y texto generados con Claude Code (Claude Opus 5.5), Anthropic, 7 de octubre de 2026, https://claude.com/claude-code.

**BibTeX**

```bibtex
@software{anthropic_claude_code_2026,
  author       = {{Anthropic}},
  title        = {Claude Code},
  version      = {Claude Opus 5.5},
  year         = {2026},
  url          = {https://claude.com/claude-code},
  note         = {Agente de programación con IA. Usado en el desarrollo de Teleprompter Libre, octubre de 2026}
}
```

> **Fecha y versión:** según APA, el año de la referencia es el de la última actualización de la
> herramienta. Si citas otro modelo o una fecha distinta, cambia el nombre del modelo y el año. Puedes
> ver la versión exacta con `/model` en Claude Code o en la configuración de claude.ai.

### 3.2 Citar Teleprompter Libre (el software)

GitHub muestra la cita a partir de [CITATION.cff](CITATION.cff), en el botón **Cite this repository**.

**APA 7.ª edición**

> Abarca Vargas, C., & Zhang, B. (2026). *Teleprompter Libre* (Versión 0.1.0) [Software]. GitHub. https://github.com/Csav20/Teleprompter-Libre

Si es pertinente, agrega la cita de Claude de la sección 3.1 y una frase sobre su uso, por ejemplo:
"Desarrollado con asistencia de Claude Code (Anthropic, 2026)".

### 3.3 Declarar el uso del asistente IA de la aplicación en tus guiones

Si publicas un guion o un video cuyo texto adaptaste, tradujiste o corregiste con el asistente, basta una
nota breve:

> Guion adaptado con la ayuda de Claude Opus 5.5 (Anthropic, 2026) mediante el asistente de Teleprompter
> Libre. El texto fue revisado y aprobado por el autor.

En un trabajo académico, pon esa declaración en los agradecimientos o en los métodos. Guarda el texto
original y el resultado del asistente por si te los piden.

## 4. Fuentes

- American Psychological Association. (2025, 9 de septiembre). *Citing generative AI in APA Style:
  Part 1—Reference formats*. APA Style Blog. https://apastyle.apa.org/blog/cite-generative-ai-references
- American Psychological Association. (2025). *Citing generative AI in APA Style: Part 3—Is AI
  "allowed" in APA Style?* APA Style Blog. https://apastyle.apa.org/blog/cite-generative-ai-allowed
- Committee on Publication Ethics. (2023). *Authorship and AI tools* [Declaración de posición].
  https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools
- International Committee of Medical Journal Editors. (s. f.). *Defining the role of authors and
  contributors* (sección II.A.4, Artificial intelligence–assisted technology). Recuperado el 7 de octubre
  de 2026, de https://www.icmje.org/recommendations/browse/roles-and-responsibilities/defining-the-role-of-authors-and-contributors.html
- Modern Language Association. (s. f.). *How do I cite generative AI in MLA style? (Updated and
  revised)*. MLA Style Center. https://style.mla.org/citing-generative-ai-updated-revised/
- Nature. (2023). Tools such as ChatGPT threaten transparent science; here are our ground rules for
  their use. *Nature, 613*, 612. https://doi.org/10.1038/d41586-023-00191-1
