# Épica 3: Gestión de Estados (Workflows)

**Descripción:** Cómo los items avanzan a través de estados configurables, incluyendo ciclos automáticos y flujos jerárquicos.

**Componentes principales:** [CONFIG] [ENGINE] [VIEW]  
**Prioridad:** Must Have / Should Have

---

## US-3.1: Definir flujos personalizados

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario con procesos complejos (ventas, investigación, publicación), quiero definir qué estados son el inicio, cuáles son intermedios y cuáles son finales, para que mi vocabulario refleje mis flujos de trabajo reales.

**Nota:** Esta US complementa US-1.4. Mientras US-1.4 define el *vocabulario* (qué keywords existen), US-3.1 define la *semántica* (qué categoría tiene cada keyword: Start/InProgress/Finished). Ambas son necesarias y trabajan juntas.

**Criterios de Aceptación:**
- ✅ Configuración visual con 3 columnas: Start / In-Progress / Finished
- ✅ Puedo añadir múltiples estados en cada categoría
- ✅ Cada estado tiene color y tooltip personalizables (via modal de edición)
- ✅ Drag-and-drop para reordenar dentro de cada categoría
- ✅ Validación: No permite keywords duplicados entre categorías

**Implementación actual:**
- ✅ Componente `VocabularySection.tsx` con 3 columnas
- ✅ Settings separados: `todoKeywords` (Start), `doingKeywords` (InProgress), `doneKeywords` (Finished)
- ✅ Modal `KeywordModal` para edición avanzada (color + descripción)
- ✅ Sincronización automática con workflows al modificar "Start" keywords

**Archivos relacionados:**
- [src/ui/settings/VocabularySection.tsx](../../src/ui/settings/VocabularySection.tsx) (Editor de columnas)
- [src/settings/keyword-modal.ts](../../src/settings/keyword-modal.ts) (Modal de edición)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Estructura de settings)

---

## US-3.2: Ciclos automáticos de transición

**Componentes:** [VIEW] [ENGINE]  
**Estado:** 🟡 Parcial (Funciona pero lógica de retorno requiere refinamiento)

**Historia:**
Como usuario que interactúa con items rastreados, quiero que al hacer clic en una keyword avance automáticamente al siguiente estado configurado en mi flujo, para no tener que editar manualmente el texto cada vez.

**Criterios de Aceptación:**
- ✅ Clic en keyword en el panel → avanza al siguiente paso del flujo
- ⚠️ Al llegar al estado final → regresa según lógica de retorno configurada
- ✅ El cambio se guarda directamente en el archivo Markdown
- ✅ El panel se actualiza automáticamente tras el cambio

**Lógica de Retorno (Refinamiento requerido):**

Actualmente el sistema tiene comportamiento simple:
- Si el keyword está en un workflow configurado → cicla al siguiente en ese workflow
- Al llegar al final del workflow → vuelve al primer keyword del mismo workflow

**Comportamiento deseado:**
- El **primer flujo** (de la lista de workflows) define el "retorno global"
- Ejemplo: Si el primer flujo es `TODO → DOING → DONE → [vuelve a TODO]`
- Entonces TODOS los flujos que terminen en `DONE` deberían volver a `TODO`
- Flujos secundarios heredan el retorno del flujo que comparten el final

**Implementación actual:**
- ✅ Método `getNextState()` en `WorkflowService` (líneas 29-60)
- ⚠️ Lógica actual: simple módulo `(index + 1) % flow.length`
- ❌ No implementa el concepto de "retorno global" del primer flujo

**Acción requerida:**
- Analizar y documentar casos de uso de retorno global
- Implementar lógica: detectar estado final común, buscar retorno en primer flujo
- Añadir tests unitarios para validar comportamiento

**Archivos relacionados:**
- [src/services/workflow-service.ts](../../src/services/workflow-service.ts) (Método `getNextState()`)
- [src/view/task-editor.ts](../../src/view/task-editor.ts) (Actualización de archivos)
- [analysis/workflow_ui_spec.md](../workflow_ui_spec.md) (Especificación del retorno global)

---

## US-3.3: Flujos jerárquicos con herencia

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Implementado

**Historia:**
Como gestor con sub-procesos comunes (ej: todos pasan por REVIEW → APPROVE), quiero que al elegir un paso intermedio compartido, se fuercen los pasos siguientes, para garantizar consistencia sin tener que copiar manualmente la misma secuencia.

**Criterios de Aceptación:**
- ✅ Si un flujo inferior elige un paso que existe en un superior, copia la "cola" restante
- ✅ Pasos heredados se bloquean en UI (dropdowns deshabilitados + tooltip)
- ✅ Cambios en flujos superiores se propagan en cascada ("Global Sync")
- ✅ Validación automática al modificar flujos

**Lógica "Smart Flow":**

**Regla 1 - Tail Copy:**
- Si `Flujo B` selecciona un paso intermedio que existe en `Flujo A` superior
- El sistema copia automáticamente todos los pasos siguientes de `Flujo A`
- Ejemplo: `Flujo A = TODO → REVIEW → APPROVE → DONE`
- Si `Flujo B = LATER → [elige REVIEW]` → se fuerza: `LATER → REVIEW → APPROVE → DONE`

**Regla 2 - Global Sync:**
- Si se modifica un flujo superior (ej: cambiar final de DONE a CANCELED)
- Todos los flujos inferiores que comparten ese camino se actualizan automáticamente

**Regla 3 - UI Locking:**
- Pasos forzados por herencia muestran dropdown gris (disabled)
- Tooltip: "This step is enforced by a superior workflow rule"
- Botones +/- ocultos en pasos bloqueados

**Implementación actual:**
- ✅ Validado funcionalmente (Fase 6 completa)
- ✅ Lógica implementada en `WorkflowsSection.tsx` o servicio de validación
- ⚠️ Necesita revisión de código para confirmar archivos exactos

**Archivos relacionados:**
- [src/ui/settings/WorkflowsSection.tsx](../../src/ui/settings/WorkflowsSection.tsx) (UI de workflows)
- [src/ui/settings/workflow-utils.ts](../../src/ui/settings/workflow-utils.ts) (Utilidades de validación)
- [analysis/workflow_ui_spec.md](../workflow_ui_spec.md) (Especificación completa)

---

## US-3.4: Menú contextual de salto directo

**Componentes:** [VIEW]  
**Estado:** ⚠️ **En revisión** NOTA: Usuario pregunta si se puede implementar también en el editor.

**Historia:**
Como usuario que necesita flexibilidad ocasional, quiero hacer clic derecho en una keyword (en el **Todo Inline View**) y saltar a cualquier estado válido, para manejar casos excepcionales sin seguir el flujo secuencial.

**Respuesta sobre implementación en editor:**
Click derecho en editor **no** implementado (solo en panel).

**Criterios de Aceptación:**
- ✅ Menú contextual al hacer clic derecho en keyword en el panel
- ✅ Lista organizada por categorías: Pending / Active / Completed
- ✅ Estados mostrados con checkmark si es el estado actual
- ✅ Cambio se guarda directamente en archivo Markdown
- ✅ Panel se actualiza automáticamente tras el cambio
- ⚠️ Click derecho en editor: **no** implementado

**Implementación actual:**
- ✅ Método `openStateMenuAtMouseEvent()` en `task-view.tsx` (líneas 269-295)
- ✅ Usa API `Menu` de Obsidian con secciones separadas
- ✅ Prop `onContextMenu` pasada a `TaskItem` component
- ✅ Integrado con `TaskEditor` para persistir cambios

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Método `openStateMenuAtMouseEvent()`)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (Handler de onContextMenu)
- [src/view/task-editor.ts](../../src/view/task-editor.ts) (Persistencia de cambios)

---

## US-3.5: Sincronización automática vocabulario-flujos

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario configurando mi sistema, quiero que al añadir un keyword "Start", se cree automáticamente su flujo, para no tener que gestionar manualmente la sincronización entre ambos sistemas.

**Criterios de Aceptación:**
- ✅ Añadir keyword en "Start States" → crea su flujo automáticamente
- ✅ Eliminar keyword de "Start States" → destruye su flujo asociado
- ✅ No existen botones manuales "Add Flow" o "Delete Flow" (sincronización 1:1)
- ✅ Workflows se generan con estructura inicial: `[START] → [primer In-Progress] → [primer Finished]`
- ✅ Usuario puede personalizar flujos después de la creación automática

**Implementación actual:**
- ✅ Lógica de sincronización en Settings al modificar `todoKeywords`
- ✅ Workflows almacenados en `settings.workflows` (array de arrays)
- ✅ Relación estricta 1:1 entre "Start keyword" y workflow
- ✅ Validación automática al guardar settings

**Archivos relacionados:**
- [src/ui/settings/VocabularySection.tsx](../../src/ui/settings/VocabularySection.tsx) (Trigger de sincronización)
- [src/ui/settings/WorkflowsSection.tsx](../../src/ui/settings/WorkflowsSection.tsx) (Gestión de workflows)
- [src/services/settings-service.ts](../../src/services/settings-service.ts) (Lógica de validación)

---

## Resumen de Épica 3

| US | Descripción | Estado |
|----|-------------|--------|
| US-3.1 | Definir flujos personalizados | 🟢 |
| US-3.2 | Ciclos automáticos | 🟡 |
| US-3.3 | Flujos jerárquicos | 🟢 |
| US-3.4 | Menú contextual salto | ⚠️ |
| US-3.5 | Sincronización vocab-flujos | 🟢 |

**Cobertura de componentes:**
- **[CONFIG]** - 5/5 implementadas
- **[ENGINE]** - 4/5 (falta refinamiento US-3.2)
- **[VIEW]** - 3/5 implementadas

**Acciones requeridas:**
1. Implementar lógica de retorno global en US-3.2
2. Considerar implementación en editor para US-3.4
3. Añadir tests de workflow jerárquico
