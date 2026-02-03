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
**Estado:** � Completado

**Historia:**
Como usuario que interactúa con items rastreados, quiero que al hacer clic en una keyword avance automáticamente al siguiente estado configurado en mi flujo, para no tener que editar manualmente el texto cada vez.

**Criterios de Aceptación:**
- ✅ Clic en keyword en el panel → avanza al siguiente paso del flujo
- ✅ Al llegar al estado final → regresa según lógica de retorno global (US-3.2)
- ✅ El cambio se guarda directamente en el archivo Markdown
- ✅ El panel se actualiza automáticamente tras el cambio

**Lógica de Retorno Global (Implementada):**
- El **primer flujo** (de la lista de workflows) que comparte el mismo estado final define el "retorno global".
- Ejemplo: Si el primer flujo es `TODO → DOING → DONE → [vuelve a TODO]`
- Entonces TODOS los flujos que terminen en `DONE` vuelven a `TODO`.

**Implementación actual:**
- ✅ Método `getNextState()` en `WorkflowService` con lógica de retorno global.
- ✅ Los flujos hijos heredan el comportamiento de retorno del flujo maestro que comparte su final.

**Archivos relacionados:**
- [src/services/workflow-service.ts](../../src/services/workflow-service.ts) (Lógica de `getNextState()`)
- [src/view/task-editor.ts](../../src/view/task-editor.ts) (Actualización de archivos)

---

## US-3.3: Flujos jerárquicos con herencia

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Completado

**Historia:**
Como gestor con sub-procesos comunes (ej: todos pasan por REVIEW → APPROVE), quiero que al elegir un paso intermedio compartido, se fuercen los pasos siguientes, para garantizar consistencia sin tener que copiar manualmente la misma secuencia.

**Criterios de Aceptación:**
- ✅ Si un flujo inferior elige un paso que existe en un superior, copia la "cola" restante
- ✅ Pasos heredados se bloquean en UI (dropdowns deshabilitados + tooltip)
- ✅ Cambios en flujos superiores se propagan en cascada ("Global Sync")
- ✅ Validación automática al modificar flujos

**Lógica "Smart Flow":**
- ✅ **Tail Copy:** Los flujos inferiores copian automáticamente la secuencia final de flujos superiores compartidos.
- ✅ **Global Sync:** Cambios en maestros se propagan a esclavos.
- ✅ **UI Locking:** Los pasos heredados se muestran bloqueados en la configuración.

**Implementación actual:**
- ✅ Validado funcionalmente.
- ✅ Lógica implementada en `WorkflowsSection.tsx` y `workflow-utils.ts`.

**Archivos relacionados:**
- [src/ui/settings/WorkflowsSection.tsx](../../src/ui/settings/WorkflowsSection.tsx) (UI de workflows)
- [src/ui/settings/workflow-utils.ts](../../src/ui/settings/workflow-utils.ts) (Utilidades de validación)

---

## US-3.4: Menú contextual de salto directo

**Componentes:** [VIEW] [EDITOR]  
**Estado:** 🟢 Completado

**Historia:**
Como usuario que necesita flexibilidad ocasional, quiero hacer clic derecho en una keyword (en el panel o en el editor) y saltar a cualquier estado válido, para manejar casos excepcionales sin seguir el flujo secuencial.

**Criterios de Aceptación:**
- ✅ Menú contextual al hacer clic derecho en keyword en el panel.
- ✅ Menú contextual al hacer clic derecho en keyword en el editor (Editor Extension).
- ✅ Lista organizada por categorías: Pending / Active / Completed.
- ✅ Estados mostrados con checkmark si es el estado actual.
- ✅ Cambio se guarda directamente en archivo Markdown y el panel se actualiza.

**Implementación actual:**
- ✅ Método `openStateMenuAtMouseEvent()` en `TodoView`.
- ✅ Extensión de CodeMirror `keywordContextMenu` para interactividad en el editor.
- ✅ Integrado con `TaskEditor` para persistir cambios desde ambas fuentes.

**Archivos relacionados:**
- [src/editor/keyword-context-menu.ts](../../src/editor/keyword-context-menu.ts) (Interactividad en editor)
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Menú en panel)
- [src/main.ts](../../src/main.ts) (Registro de la extensión del editor)

---

## US-3.5: Sincronización automática vocabulario-flujos

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟢 Completado

**Historia:**
Como usuario configurando mi sistema, quiero que al añadir un keyword "Start", se cree automáticamente su flujo, para no tener que gestionar manualmente la sincronización entre ambos sistemas.

**Criterios de Aceptación:**
- ✅ Añadir keyword en "Start States" → crea su flujo automáticamente.
- ✅ Eliminar keyword de "Start States" → destruye su flujo asociado.
- ✅ Sincronización transparente 1:1.

**Implementación actual:**
- ✅ Lógica en `SettingsService.syncWorkflowsWithStartKeywords()`.

---

## Resumen de Épica 3

| US | Descripción | Estado |
|----|-------------|--------|
| US-3.1 | Definir flujos personalizados | 🟢 |
| US-3.2 | Ciclos automáticos (Retorno Global) | � |
| US-3.3 | Flujos jerárquicos | 🟢 |
| US-3.4 | Menú contextual (Panel + Editor) | 🟢 |
| US-3.5 | Sincronización vocab-flujos | 🟢 |

**Cobertura de componentes:**
- **[CONFIG]** - 5/5 completadas ✅
- **[ENGINE]** - 5/5 completadas ✅
- **[VIEW]** - 5/5 completadas ✅
- **[EDITOR]** - 1/1 completada ✅

**Estado final:** ✅ **COMPLETADA AL 100%**

La gestión de estados y workflows es ahora robusta, con herencia inteligente, ciclos consistentes y acceso rápido desde cualquier parte de la interfaz.
