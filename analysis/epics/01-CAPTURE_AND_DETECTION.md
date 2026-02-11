# Epica 1: Captura y Deteccion de Estados

**Descripcion:** Como el plugin detecta y captura keywords en texto plano, contextos especiales e idioma.

**Componentes principales:** [ENGINE] [EDITOR]  
**Prioridad:** Must Have

---

## US-1.1: Strict Header (Deteccion Estricta)

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** Completado

**Historia:**
Como usuario, quiero definir mis estados (TODO, DOING) como encabezados claros en mi documento, eliminando la ambiguedad de si una palabra es parte de una frase o un estado real.

**Criterios de Aceptacion:**
- La keyword (`TODO`) debe estar al inicio absoluto de la linea o precedida unicamente por espacios.
- No se detecta la keyword si esta precedida por vinetas, numeros o checkboxes.
- El parser ignora keywords a mitad de frase.

**Implementacion actual:**
- Regex estricto en parser: `^(\\s*)(${keywords})\\s+(.+)$`.
- No se usan prefijos legacy de listas para detectar tareas.

**Archivos relacionados:**
- `src/parser/task-parser.ts`
- `tests/parser/strict-header.test.ts`

---

## US-1.2: Captura de Bloque Organico por Indentacion

**Componentes:** [ENGINE]  
**Estado:** Completado

**Historia:**
Como usuario, quiero anadir contexto y subtareas debajo del estado principal sin delimitadores artificiales, para que el flujo se integre de forma natural en el texto.

**Criterios de Aceptacion:**
- El bloque comienza despues del header cuando la siguiente linea no vacia tiene mayor indentacion.
- Una linea pertenece al bloque solo si su indentacion es mayor que la del header padre.
- El bloque termina por dedent (indentacion igual o menor), siguiente header hermano/padre o fin de archivo.
- Se capturan subtareas checkbox dentro del bloque.
- Las lineas de metadata de fecha (`PLAN`/`DUE`) no forman parte del `blockContent`.

**Ejemplo valido:**
```markdown
TODO cocinar la cena
    La cena consiste en huevos con arroz:
    - 2 huevos
    - [ ] romper huevos
    - [ ] cocinar arroz
    De esta manera tenemos que comer.

TODO Esto es otra tarea.
```

**Implementacion actual:**
- Scanner de bloque por profundidad de indentacion.
- Extraccion de `subtasks` durante el recorrido del bloque.

**Archivos relacionados:**
- `src/parser/task-parser.ts`
- `tests/parser/block-parser.test.ts`
- `tests/task-parser.test.ts`

**Nota de alcance:**
- La visualizacion del bloque en panel (expandir/colapsar) se documenta en `analysis/epics/02-VISUALIZATION_AND_ORGANIZATION.md` (US-2.5).

---

## US-1.3: Exclusion inteligente de contextos tecnicos

**Componentes:** [ENGINE] [CONFIG]  
**Estado:** Completado

**Historia:**
Como desarrollador que escribe documentacion tecnica, quiero que el plugin ignore keywords dentro de bloques de codigo y formulas matematicas, para evitar falsos positivos cuando menciono `TODO` en un snippet.

**Criterios de Aceptacion:**
- No detecta keywords en bloques de codigo por defecto.
- No detecta keywords en bloques matematicos ni comentarios de Obsidian.
- Existe opcion configurable para incluir/excluir bloques de codigo.

**Implementacion actual:**
- State machine en `parseFile()`.
- Regex `CODE_BLOCK_REGEX`, `MATH_BLOCK_REGEX`, `COMMENT_BLOCK_REGEX`.
- Toggle `includeCodeBlocks` en settings.

**Archivos relacionados:**
- `src/parser/task-parser.ts`
- `src/settings/defaults.ts`

---

## US-1.4: Vocabulario personalizado

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** Completado

**Historia:**
Como usuario con necesidades especificas, quiero definir keywords personalizados que respondan a mis flujos de trabajo para usar terminologia natural de mi dominio.

**Criterios de Aceptacion:**
- Se pueden anadir/editar/eliminar keywords desde settings.
- No hay limite practico de keywords en la configuracion.
- Los keywords se organizan en Start, In-Progress y Finished.
- Cada keyword puede tener color y descripcion.

**Implementacion actual:**
- Editor visual en settings.
- Regeneracion del parser cuando cambia el vocabulario.

**Archivos relacionados:**
- `src/ui/settings/VocabularySection.tsx`
- `src/settings/keyword-modal.ts`
- `src/parser/task-parser.ts`

---

## US-1.5: Conversion rapida desde menu contextual

**Componentes:** [EDITOR] [ENGINE]  
**Estado:** Completado

**Historia:**
Como usuario, quiero transformar texto existente en un flujo estructurado usando click derecho, para no tener que reescribir manualmente la sintaxis.

**Criterios de Aceptacion:**
- Con texto seleccionado, aparece `Convert to flow block...`.
- Se muestra submenu con estados iniciales configurados (workflow start keywords).
- Al elegir un estado:
  - se inserta la keyword en la primera linea;
  - el resto del bloque se indenta de forma canonica;
  - no se inserta delimitador artificial.
- Sin seleccion, convierte la linea actual (si no esta vacia).
- Se preserva el contenido interno (listas, checkboxes, texto).

**Implementacion actual:**
- Formateador dedicado para conversion de seleccion a bloque organico.
- Menu dinamico alimentado por workflows + keywords de inicio.

**Archivos relacionados:**
- `src/main.ts`
- `src/editor/flow-block-formatter.ts`
- `tests/flow-block-formatter.test.ts`

---

## Resumen de Epica 1

| US | Descripcion | Estado |
|----|-------------|--------|
| US-1.1 | Strict Header | Completado |
| US-1.2 | Captura de bloque organico | Completado |
| US-1.3 | Exclusion de contextos tecnicos | Completado |
| US-1.4 | Vocabulario personalizado | Completado |
| US-1.5 | Conversion contextual | Completado |

**Cobertura de componentes:**
- [ENGINE] completa para captura/deteccion.
- [EDITOR] completa para resaltado y conversion.
- [CONFIG] completa para vocabulario y comportamiento de parsing.

**Accion requerida:**
- Mantener sincronizados parser/tests/docs ante cambios de contrato.
