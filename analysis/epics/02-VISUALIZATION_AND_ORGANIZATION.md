# Epica 2: Visualizacion y Organizacion

**Descripcion:** Como se visualizan, organizan y filtran los items en el panel lateral "FLOW.txt View".

**Componentes principales:** [VIEW] [ENGINE]  
**Prioridad:** Must Have / Should Have

---

## US-2.1: Panel lateral dedicado (FLOW.txt View)

**Componentes:** [VIEW]  
**Estado:** Completado

**Historia:**
Como gestor de proyectos con multiples notas activas, quiero ver todos mis flujos en un panel lateral unico para tener vision global sin navegar manualmente.

**Criterios de Aceptacion:**
- Panel accesible desde ribbon icon o comando.
- Agregacion automatica de tasks en toda la boveda.
- Actualizacion automatica al modificar archivos.
- Contador de items totales vs. filtrados.

**Implementacion actual:**
- `TodoView` extiende `ItemView`.
- `viewType` oficial: `flowtxt-view`.
- Renderizado con React via `TodoViewRoot`.
- Suscripcion a eventos de `TaskStore`.

**Archivos relacionados:**
- `src/view/task-view.tsx`
- `src/ui/view/TodoViewRoot.tsx`
- `src/services/task-store.ts`

---

## US-2.2: Agrupacion y ordenamiento flexible

**Componentes:** [VIEW] [ENGINE]  
**Estado:** Completado

**Historia:**
Como usuario con muchos items, quiero ordenar y agrupar por estado, prioridad, fecha o archivo para enfocarme en lo relevante.

**Criterios de Aceptacion:**
- Ordenamiento por default, prioridad, fecha programada y fecha limite.
- Agrupacion por estado y por archivo.
- Persistencia de preferencia entre sesiones.

**Implementacion actual:**
- `SortMethod` y `GroupingMethod` en settings.
- Ordenamiento aplicado en `transformForView()` y `applySortToTasks()`.
- Secciones colapsables por grupo con `TaskGroup`.

**Archivos relacionados:**
- `src/view/task-view.tsx`
- `src/ui/view/TodoViewRoot.tsx`
- `src/ui/view/TodoToolbar.tsx`
- `src/settings/defaults.ts`

---

## US-2.3: Filtrado avanzado

**Componentes:** [VIEW]  
**Estado:** Completado

**Historia:**
Como usuario con muchas tareas, quiero filtros combinables para reducir ruido y trabajar solo en lo importante.

**Criterios de Aceptacion:**
- Modo ocultar completadas y mover completadas al final.
- Filtro por archivo activo.
- Busqueda en tiempo real.
- Filtros avanzados por estado, prioridad, labels y fecha.
- Indicador de filtros activos y accion de reset.

**Implementacion actual:**
- `AdvancedFilters` y `DateFilterMode`.
- `applyAdvancedFilters()` con logica combinada.
- `TodoToolbar` + `AdvancedFiltersPanel`.

**Archivos relacionados:**
- `src/view/task-view.tsx`
- `src/ui/view/TodoToolbar.tsx`
- `src/ui/view/AdvancedFiltersPanel.tsx`
- `src/settings/defaults.ts`

---

## US-2.4: Resaltado visual en el editor

**Componentes:** [EDITOR]  
**Estado:** Completado

**Historia:**
Como escritor, quiero ver keywords resaltadas mientras edito para identificar estados rapidamente sin abrir el panel.

**Criterios de Aceptacion:**
- Colorizacion automatica por keyword activa.
- Respeta colores configurados por el usuario.
- Procesamiento enfocado en viewport para rendimiento.
- Sin duplicacion de decoraciones.

**Implementacion actual:**
- Extension CodeMirror 6 con `ViewPlugin`.
- Decoraciones para estados, prioridades y labels.
- Rebuild reactivo ante cambios de settings.

**Archivos relacionados:**
- `src/editor/keyword-highlighter.ts`
- `src/main.ts`

---

## US-2.5: Tarjeta FLOW expandible en el panel

**Componentes:** [VIEW] [ENGINE]  
**Estado:** Completado

**Historia:**
Como usuario, quiero ver el bloque completo (contexto y subtareas) dentro del item del panel y poder colapsarlo para ahorrar espacio visual.

**Criterios de Aceptacion:**
- Cuando existe `blockContent` o `subtasks`, el item muestra flecha de expandir/colapsar.
- El bloque expandido muestra notas y subtareas asociadas al header padre.
- El bloque respeta metadata de fechas fuera de `blockContent`.
- El comportamiento funciona con bloque organico por indentacion (sin delimitadores).

**Implementacion actual:**
- Estado local `expanded` por item.
- Flecha visible solo cuando el task tiene contenido de bloque real.
- Render de notas y subtareas dentro de `TaskItem`.
- `TaskParser` llena `blockContent`, `subtasks` y `blockEndLine` desde indentacion.

**Archivos relacionados:**
- `src/ui/view/TaskItem.tsx`
- `src/parser/task-parser.ts`
- `tests/parser/block-parser.test.ts`

---

## Resumen de Epica 2

| US | Descripcion | Estado |
|----|-------------|--------|
| US-2.1 | Panel lateral dedicado | Completado |
| US-2.2 | Agrupacion y ordenamiento | Completado |
| US-2.3 | Filtrado avanzado | Completado |
| US-2.4 | Resaltado en editor | Completado |
| US-2.5 | Tarjeta FLOW expandible | Completado |

**Cobertura de componentes:**
- [VIEW] completa para panel, agrupacion, filtros y bloques expandibles.
- [EDITOR] completa para resaltado contextual.
- [ENGINE] integrada via parser/ordenamiento/metadata.

**Estado final:** Completada al 100%.
