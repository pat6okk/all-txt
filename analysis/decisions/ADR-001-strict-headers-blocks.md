# ADR-001: Cambio a Strict Headers y Bloques Organicos

**Fecha:** 2026-02-02  
**Estado:** Aceptado (actualizado por PRJ-002 el 2026-02-09)  
**Decisores:** Pat (Product Owner), Antigravity (Tech Lead)

---

## Nota de vigencia

La version inicial de este ADR hablaba de delimitadores explicitos (`---`).  
Desde PRJ-002, la regla canonica en runtime es **bloque organico por indentacion** (sin delimitadores artificiales).

## Contexto

El sistema original de detección de keywords (US-1.1 y US-1.2 v1.0) permitía detectar estados (`TODO`, `DOING`) en múltiples contextos Markdown:
- Listas con viñetas (`- TODO tarea`)
- Listas numeradas (`1. TODO item`)
- Blockquotes (`> TODO nota`)
- Checkboxes (`- [ ] TODO pendiente`)

### Problemas Identificados

1. **Ambigüedad Visual:** El highlighter del editor resaltaba keywords en posiciones inválidas (ej: `- Revisar el TODO de ayer`), causando confusión porque el parser no las detectaba.

2. **Complejidad del Regex:** El parser requería múltiples patrones para manejar todos los contextos (listas, citas, callouts), dificultando el mantenimiento.

3. **Limitación de Contexto:** Cada tarea era una sola línea. No había manera de añadir subtareas, notas o contexto extendido asociado a un estado.

4. **Inconsistencia Highlighter-Parser:** Dos lógicas separadas (una en CodeMirror, otra en el parser) generaban comportamientos divergentes.

---

## Decisión

Adoptar un **sistema de "Strict Headers" con bloque organico**:

### US-1.1: Strict Header Detection
- Las keywords **solo** se detectan al inicio de línea (o con indentación de espacios).
- **NO** se permite ningún prefijo (`-`, `*`, `>`, `1.`, `[ ]`).
- Regex simplificado: `^(\s*)(KEYWORD)\s+(.*)`

### US-1.2: Block Content Capture
- El parser captura contenido desde un Header valido cuando las lineas siguientes tienen mayor indentacion que el header padre.
- El bloque termina por:
  - dedent (indentacion igual o menor al header), O
  - siguiente keyword valida al mismo nivel o menor, O
  - fin del archivo.
- Dentro del bloque se capturan:
  - Subtareas (checkboxes: `- [ ]`)
  - Metadatos (`DUE:`, `PRIORITY:`)
  - Notas y contexto en texto plano

### US-1.5: Context Menu Conversion
- Menú de click derecho para convertir texto existente a bloques FLOW.
- Facilita la adopción del nuevo sistema sin fricción.

---

## Consecuencias

### Positivas

1. **Simplicidad Técnica:**
   - Regex unificado y simple.
   - Highlighter y parser comparten la misma lógica.
   - Menor superficie de bugs.

2. **Claridad Conceptual:**
   - Un estado (`TODO`) se vuelve un "encabezado" o "título" visual, no una palabra dentro de una lista.
   - Jerarquía clara: Estados = Headers, Subtareas = Contenido del Bloque.

3. **Rich Content:**
   - Cada tarea puede llevar subtareas, notas, contexto.
   - Provee valor comparable a sistemas de gestión de tareas más complejos.

4. **Performance:**
   - Regex más simple = parsing más rápido.
   - Menos backtracking en expresiones regulares.

5. **Mantenibilidad:**
   - Código más legible.
   - Más fácil de extender (ej: soportar nuevos metadatos dentro de bloques).

### Negativas (Trade-offs)

1. **Breaking Change:**
   - Las notas existentes con `- TODO tarea` dejarán de funcionar.
   - **Mitigación:** US-1.5 (Context Menu) permite conversión rápida.

2. **Cambio de Flujo de Trabajo:**
   - Los usuarios deberán adaptar su estilo de escritura.
   - **Mitigación:** Documentación clara, ejemplos, tutoriales.

3. **Pérdida de Flexibilidad Inicial:**
   - Ya no se pueden tener TODOs "casuales" en listas.
   - **Justificación:** La ganancia en claridad y funcionalidad supera esta pérdida.

---

## Alternativas Consideradas

### Alternativa 1: Mejorar solo el Highlighter
Ajustar el regex del highlighter para que coincida exactamente con el parser.

**Descartado porque:**
- No resuelve la limitación de "una tarea = una línea".
- Mantiene la complejidad del regex multicontexto.

### Alternativa 2: Modo Híbrido con Toggle
Permitir al usuario elegir entre "Modo Flexible" (listas, etc.) y "Modo Estricto".

**Descartado porque:**
- Duplica la complejidad del código.
- Dificulta el testing (doble superficie).
- Confunde la identidad del producto.

### Alternativa 3: Bloque Jerarquico sin Delimitadores
Usar solo indentacion para delimitar bloques.

**Estado actual de esta alternativa:**
- Reevaluada y **adoptada** en PRJ-002.
- Se reemplazo el enfoque con delimitador explicito por cierre organico por indentacion.

---

## Compatibilidad con Markdown

El nuevo sistema sigue siendo **100% Markdown válido**:

```markdown
TODO Refactorizar modulo X
    - [ ] Actualizar tests
    - [ ] Documentar API
    Se requiere coordinacion con el equipo.
DUE: 2026-02-10
```

Este bloque es legible en cualquier editor Markdown. El plugin añade "superpoderes" al interpretarlo.

---

## Métricas de Éxito

Validaremos esta decisión en la v1.1 con:
- [ ] **Velocidad de parsing:** Reducción del 30% en tiempo de parsing vs. v1.0.
- [ ] **Bugs de detección:** 0 reportes de "false positives" en highlighter.
- [ ] **Adopción de bloques:** >50% de tareas creadas usando bloques con contenido.
- [ ] **Feedback de usuarios:** NPS > 8/10 en encuesta post-release.

---

## Referencias

- [Epica 1 - Captura y Deteccion](../epics/01-CAPTURE_AND_DETECTION.md)
- [Epica 2 - Visualizacion y Organizacion](../epics/02-VISUALIZATION_AND_ORGANIZATION.md)
- [Anexo historico 01.5](../epics/01.5-STRICT_BLOCKS.md)

---

**Firmado:**
- Pat (2026-02-02)
- Antigravity AI Assistant (2026-02-02)
