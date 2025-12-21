# Épica 1: Captura y Detección de Estados

**Descripción:** Cómo el plugin detecta y captura keywords en texto plano, contextos especiales e idioma.

**Componentes principales:** [ENGINE] [EDITOR]  
**Prioridad:** Must Have

---

## US-1.1: Escribir estados en texto plano

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** 🟢 Implementado

**Historia:**
Como escritor de notas, quiero usar palabras clave simples (TODO, ASK, DOING) directamente en mis notas Markdown, para capturar estados sin romper mi flujo de escritura ni aprender sintaxis especial.

**Criterios de Aceptación:**
- ✅ Puedo escribir `TODO Revisar propuesta` en cualquier parte de mi nota
- ✅ El plugin detecta la keyword independientemente del contexto (párrafos, listas, citas)
- ✅ La nota sigue siendo 100% portable (legible en otros editores)
- ✅ Keywords pueden estar al inicio de línea o después de prefijos (viñetas, números, etc.)

**Implementación actual:**
- ✅ Parser detecta keywords con regex flexible
- ✅ Soporta prefijos estándar, citas y callouts
- ✅ No requiere sintaxis especial, solo texto plano

**Archivos relacionados:**
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Regex de detección)
- [src/task.ts](../../src/task.ts) (Modelo de datos)

---

## US-1.2: Detección en múltiples contextos

**Componentes:** [ENGINE]  
**Estado:** ⚠️ **En revisión**

**Historia:**
Como usuario avanzado de Markdown, quiero que las keywords funcionen dentro de listas, callouts, citas y tareas de checkbox, para no tener que adaptar mi estilo de escritura existente.

**Criterios de Aceptación:**
- ✅ Detección en listas con viñetas (`-`, `*`, `+`)
- ✅ Detección en listas numeradas y alfabéticas (`1.`, `a)`)
- ✅ Detección en listas personalizadas (`(A1)`, `(B2)`)
- ✅ Detección en blockquotes (`>`)
- ✅ Detección en callouts de Obsidian (`> [!tip]`)
- ✅ Detección en checkboxes nativos (`- [ ] TODO tarea`)
- ✅ Detección en bloques de código con comentarios (si está habilitado)

**Posicionamiento de keywords:**
- La keyword debe estar **inmediatamente después** de cualquier prefijo (lista, checkbox, cita)
- Formato correcto: `- TODO tarea` o `> TODO pregunta` o `1. TODO item`
- **No** se detecta en la lista de tareas del panel: ❌ `- Revisar el TODO de ayer` (TODO no se detecta porque no está al inicio)
- **Sí** se detecta en lista de tareas: ✅ `- TODO Revisar de ayer` (TODO está justo después del `-`)

**⚠️ Problema actual identificado:**
Si escribes `- Revisar TODO de ayer y DONE`, el highlighter del editor resalta TODO y DONE (por diseño del regex), pero **NO** se agregan a la lista del panel (comportamiento correcto del parser). Esto puede causar confusión visual.

**Solución propuesta:** Mejorar el regex del highlighter para que solo resalte keywords en posición válida, o documentar claramente esta limitación.

**Implementación actual:**
- ✅ Regex captura prefijos opcionales
- ✅ Variables `BULLET_LIST_PATTERN`, `NUMBERED_LIST_PATTERN`, etc.
- ✅ Soporte configurable para callouts y código

**Archivos relacionados:**
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Patrones de detección)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Opciones `includeCalloutBlocks`, `includeCodeBlocks`)

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

## Resumen de Épica 1

| US | Descripción | Estado |
|----|-------------|--------|
| US-1.1 | Texto plano sin sintaxis | 🟢 |
| US-1.2 | Múltiples contextos | ⚠️ |
| US-1.3 | Exclusión técnica inteligente | 🟢 |
| US-1.4 | Vocabulario personalizado | 🟢 |

**Cobertura de componentes:**
- **[ENGINE]** - 4/4 implementadas
- **[CONFIG]** - 2/4 implementadas
- **[EDITOR]** - 2/4 implementadas

**Acción requerida:** Resolver problema de detección en US-1.2 (highlighter vs. parser)
