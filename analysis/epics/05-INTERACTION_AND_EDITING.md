# Épica 5: Interacción y Edición

**Descripción:** Cómo los usuarios interactúan con los items (navegación, edición rápida, edición en lote).

**Componentes principales:** [VIEW] [ENGINE]  
**Prioridad:** Must Have

---

## US-5.1: Navegación directa desde el panel

**Componentes:** [VIEW]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario revisando tareas en el panel, quiero hacer clic en el texto del item y que me lleve exactamente a esa línea en la nota, para editar contexto o añadir detalles sin buscar manualmente.

**Criterios de Aceptación:**
- ✅ Clic en texto → abre archivo y salta a línea exacta
- ✅ Mantiene contexto (el panel no se cierra)
- ✅ Funciona en archivos largos (scroll automático a línea)
- ✅ Soporta Ctrl/Cmd+Click para abrir en nueva pestaña
- ✅ Cursor se posiciona al inicio de la línea

**Implementación actual:**
- ✅ Método `openTaskLocation()` en `task-view.tsx`
- ✅ Usa `app.workspace.getLeaf()` con detección de modificadores
- ✅ Abre con `eState: { line: task.line }` para posicionar cursor
- ✅ Verifica que sea `MarkdownView` antes de scrollear
- ✅ Usa `editor.scrollIntoView()` para scroll suave

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Método `openTaskLocation()`)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (Handler onClick en texto)

---

## US-5.2: Edición rápida de estado

**Componentes:** [VIEW] [ENGINE]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario ejecutando mi día, quiero cambiar estados directamente desde el panel (sin abrir la nota), para mantener mi flujo sin interrupciones.

**Criterios de Aceptación:**
- ✅ Clic en keyword → avanza al siguiente estado en el flujo
- ✅ Clic derecho en keyword → menú contextual para saltar a cualquier estado (ver US-3.4)
- ✅ Clic en checkbox → marca como DONE instantáneamente
- ✅ Cambios se guardan en archivo automáticamente
- ✅ Panel se actualiza automáticamente vía eventos del TaskStore
- ✅ No requiere refrescar manualmente

**Nota sobre click derecho:** Esta funcionalidad está implementada y documentada en detalle en **US-3.4** (Menú contextual de salto directo).

**Implementación actual:**
- ✅ Prop `onToggle` llama a `workflowService.getNextState()`
- ✅ Prop `onUpdateState` persiste cambio vía `TaskEditor`
- ✅ Click derecho implementado en `onContextMenu`
- ✅ TaskStore emite evento 'update' que re-renderiza el panel

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Handlers de eventos)
- [src/view/task-editor.ts](../../src/view/task-editor.ts) (Persistencia en archivos)
- [src/services/task-store.ts](../../src/services/task-store.ts) (Sistema de eventos)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (UI de keywords clickeables)

---

## US-5.3: Edición en lote (PAUSADO)

**Componentes:** [VIEW] [ENGINE]  
**Estado:** 🔵 Futuro (En pausa - Utilidad no validada)

**Historia:**
Como usuario con múltiples items similares, quiero seleccionar varios y cambiarles el estado simultáneamente, para ahorrar tiempo en operaciones repetitivas.

**Criterios de Aceptación (Propuestos):**
- ❌ Selección múltiple con checkboxes en cada item
- ❌ Toolbar de acciones masivas (aparece al seleccionar >1 item)
- ❌ Acciones: cambiar estado, añadir/quitar prioridad, eliminar
- ❌ Confirmación antes de aplicar cambios masivos
- ❌ Deshacer masivo (undo)

**Razones para pausa:**
- ⚠️ Utilidad real no validada con usuarios
- ⚠️ Complejidad de UI/UX considerable
- ⚠️ Casos borde: archivos con conflictos de merge, archivos externos modificados
- ⚠️ Prioridad baja vs. otras funcionalidades pendientes

**Validación requerida antes de implementar:**
- Entrevistas con usuarios para confirmar necesidad
- Análisis de casos de uso reales (¿cuántos items se editan simultáneamente?)
- Prototipo UI para testing de usabilidad

**Archivos relacionados:**
- *(No implementado aún)*

---

## Resumen de Épica 5

| US | Descripción | Estado |
|----|-------------|--------|
| US-5.1 | Navegación directa | 🟢 |
| US-5.2 | Edición rápida de estado | 🟢 |
| US-5.3 | Edición en lote | 🔵 |

**Cobertura de componentes:**
- **[VIEW]** - 2/3 implementadas
- **[ENGINE]** - 2/3 implementadas
- **[FUTURO]** - 1/3 en validación

**Acciones requeridas:**
1. Validar utilidad de edición en lote antes de implementar
2. Considerar para v2.0 si hay demanda de usuarios
