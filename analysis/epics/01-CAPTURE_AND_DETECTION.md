# Épica 1: Captura y Detección de Estados

**Descripción:** Cómo el plugin detecta y captura keywords en texto plano, contextos especiales e idioma.

**Componentes principales:** [ENGINE] [EDITOR]  
**Prioridad:** Must Have

---

## US-1.1: Strict Header (Detección Estricta)

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** � **En Implementación**

**Historia:**
Como usuario, quiero definir mis estados (TODO, DOING) como encabezados claros en mi documento, eliminando la ambigüedad de si una palabra es parte de una frase o un estado real.

**Criterios de Aceptación:**
- ✅ **Posición Estricta:** La keyword (`TODO`) debe estar al **inicio absoluto** de la línea o precedida únicamente por espacios (indentación).
- ✅ **Sin Prefijos:** NO se detectará la keyword si está precedida por viñetas (`-`, `*`), números (`1.`) o checkboxes (`- [ ]`).
    - *Válido:* `TODO Tarea principal`
    - *Válido:* `  DOING Subtarea indentada`
    - *Inválido:* `- TODO Tarea en lista` (Se ignora, es texto plano)
- ✅ El parser ignora keywords a mitad de frase.

**Justificación:**
Este cambio simplifica radicalmente el parser, elimina falsos positivos visuales y fuerza una estructura donde el Estado tiene jerarquía visual de "Título" o "Bloque".

**Implementación técnica:**
- Regex simplificado: `^(\s*)(${keywords})(.*)`
- Eliminar lógica de `BULLET_LIST_PATTERN`, etc.

**Archivos relacionados:**
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts)

---

## US-1.2: Captura de Bloque y Contenido Rico

**Componentes:** [ENGINE] [VIEW]  
**Estado:** ⚠️ **Pendiente de diseño**

**Historia:**
Como usuario, quiero poder añadir contexto, subtareas y detalles a un estado principal, y que el plugin capture todo ese bloque como una sola unidad ("Tarjeta") hasta encontrar un delimitador.

**Criterios de Aceptación:**
- ✅ **Modo Bloque:** El parser captura todo el contenido debajo de un Header (US-1.1) hasta encontrar un separador horizontal `---` (tres guiones) o el final del archivo.
- ✅ **Contenido Soportado:** Dentro del bloque se debe capturar y asociar a la tarea padre:
    - Listas de verificación (`[ ]` o `- [ ]`) como subtareas.
    - Texto plano como descripción/contexto.
    - Metadatos (ej: `DUE: 2025-10-10`) en cualquier línea del bloque.
- ✅ **Visualización:** En el panel del plugin, este bloque se renderiza unificado (el texto y subtareas pertenecen al TODO principal).

**Ejemplo de Bloque Válido:**
```markdown
TODO Refactorizar Backend
 - [ ] Tarea hija 1
 - [ ] Tarea hija 2
Nota: Aquí explicamos el contexto complejo.
DUE: 2023-12-01
---
```

**Manejo de conflictos:**
- Si no hay `---`, el bloque termina implícitamente al encontrar la siguiente Keyword de estado válido (igual nivel de indentación) o fin de archivo.
- La prioridad explícita del delimitador `---` es cerrar el contexto actual inmediatamente.

**Implementación técnica:**
- Parser necesita lógica de "Lookahead" o "Accumulation" (multiline scanning).
- Modelo de datos (`Task`) debe incluir campo `body` o `children`.

---

## US-1.3: Exclusión inteligente de contextos técnicos

**Componentes:** [ENGINE] [CONFIG]  
**Estado:** 🟢 Implementado

**Historia:**
Como desarrollador que escribe documentación técnica, quiero que el plugin ignore keywords dentro de bloques de código y fórmulas matemáticas, para evitar falsos positivos cuando menciono `TODO` en un snippet de código.

**Criterios de Aceptación:**
- ✅ No detecta keywords en bloques de código (` ```...``` `) por defecto
- ✅ No detecta keywords en matemáticas inline (`$...$`) o block (`$$...$$`)
- ✅ No detecta keywords en comentarios de Obsidian (`%%...%%`)
- ✅ Opción configurable para incluir/excluir bloques de código
- ✅ Máquina de estados robusta que rastrea contexto (dentro/fuera de bloques)

**Implementación actual:**
- ✅ State machine en `parseFile()`
- ✅ Regex `CODE_BLOCK_REGEX`, `MATH_BLOCK_REGEX`, `COMMENT_BLOCK_REGEX`
- ✅ Variables `inBlock` y `blockMarker` controlan el contexto
- ✅ Setting `includeCodeBlocks` permite override para casos de uso avanzados

**Archivos relacionados:**
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Máquina de estados)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Toggle `includeCodeBlocks`)

---

## US-1.4: Vocabulario personalizado

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario con necesidades específicas, quiero definir keywords personalizados que respondan a mis flujos de trabajo (idiomáticos: PENDIENTE, EN_CURSO, HECHO; académicos: INVESTIGAR, ESCRIBIR, REVISAR; ventas: LEAD, QUALIFIED, CLOSED), para trabajar con terminología natural a mi dominio sin fricciones.

**Criterios de Aceptación:**
- ✅ Puedo añadir/editar/eliminar keywords desde la interfaz de configuración
- ✅ No hay límite en la cantidad de keywords (solo restricciones de memoria)
- ✅ El sistema mantiene consistencia visual (colores, tooltips) independientemente del idioma
- ✅ Los keywords se organizan en 3 categorías: Start, In-Progress, Finished
- ✅ Cada keyword tiene color y descripción/tooltip personalizables

**Implementación actual:**
- ✅ Editor visual en Settings con 3 columnas (`SettingsView.tsx`)
- ✅ Keywords almacenados en `settings.todoKeywords`, `doingKeywords`, `doneKeywords`
- ✅ Regeneración automática de regex al cambiar vocabulario
- ✅ Soporte completo UTF-8 (emojis, caracteres especiales)

**Archivos relacionados:**
- [src/ui/settings/VocabularySection.tsx](../../src/ui/settings/VocabularySection.tsx) (Editor de keywords)
- [src/settings/keyword-modal.ts](../../src/settings/keyword-modal.ts) (Modal de edición avanzada)
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Método `escapeKeywords()`)

---

## US-1.5: Conversión rápida desde menú contextual

**Componentes:** [EDITOR] [CONFIG]  
**Estado:** 🔴 **Pendiente**

**Historia:**
Como usuario, quiero transformar rápidamente bloques de texto existentes o notas rápidas en "Tareas FLOW" estructuradas usando el clic derecho, para no tener que escribir manualmente la sintaxis de bloque.

**Criterios de Aceptación:**
- ✅ Al seleccionar texto en el editor y hacer click derecho, aparece el menú `FLOW: Convert to...`.
- ✅ Se muestra un submenú con las Keywords configuradas (ej: TODO, ASK, IDEA).
- ✅ Al seleccionar una opción:
    - Se inserta la Keyword seleccionada al inicio de la primera línea (respetando indentación existente).
    - Se añade el delimitador `---` en una nueva línea al final de la selección.
- ✅ Si no hay texto seleccionado, se inserta una plantilla vacía (`TODO \n ---`) en la posición del cursor.
- ✅ Mantiene el formato interno del bloque (listas, notas) sin cambios destructivos.

---

## Resumen de Épica 1

| US | Descripción | Estado |
|----|-------------|--------|
| US-1.1 | Strict Header (Detección Estricta) | � |
| US-1.2 | Captura de Bloque (Delimited) | ⚠️ |
| US-1.3 | Exclusión técnica inteligente | 🟢 |
| US-1.4 | Vocabulario personalizado | 🟢 |
| US-1.5 | Conversión Menú Contextual | 🔴 |

**Cobertura de componentes:**
- **[ENGINE]** - 4/5 requeridas
- **[CONFIG]** - 3/5 requeridas
- **[EDITOR]** - 3/5 requeridas

**Acción requerida:** Resolver problema de detección en US-1.2 (highlighter vs. parser)
