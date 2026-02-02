# Épica 2: Visualización y Organización

**Descripción:** Cómo se visualizan, organizan y filtran los items en el panel lateral "Todo Inline View".

**Componentes principales:** [VIEW] [ENGINE]  
**Prioridad:** Must Have / Should Have

---

## US-2.1: Panel lateral dedicado (Todo Inline View)

**Componentes:** [VIEW]  
**Estado:** 🟢 Implementado

**Historia:**
Como gestor de proyectos con múltiples notas activas, quiero ver todas mis tareas/estados en un único panel lateral llamado **"Todo Inline View"**, para tener una visión global de lo que está en movimiento sin navegar manualmente.

**Criterios de Aceptación:**
- ✅ Panel accesible desde ribbon icon (📋 list-todo) o comando
- ✅ Agregación automática de todas las keywords en la bóveda
- ✅ Actualización automática al modificar archivos
- ✅ Muestra contador de items totales vs. filtrados
- ✅ Diseño responsivo que respeta tema de Obsidian

**Implementación actual:**
- ✅ Clase `TodoView` extiende `ItemView` de Obsidian
- ✅ ViewType único: `todoinline-view`
- ✅ Renderizado con React (`TodoViewRoot.tsx`)
- ✅ Suscripción a eventos del `TaskStore` para actualizaciones

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Componente principal del panel)
- [src/ui/view/TodoViewRoot.tsx](../../src/ui/view/TodoViewRoot.tsx) (UI React)
- [src/services/task-store.ts](../../src/services/task-store.ts) (Almacenamiento y eventos)

---

## US-2.2: Agrupación y ordenamiento flexible

**Componentes:** [VIEW] [ENGINE]  
**Estado:** � Completado

**Historia:**
Como usuario con decenas de items rastreados, quiero ordenar/agrupar por estado, prioridad, fecha o archivo, para enfocarme en lo que importa según el contexto (hoy, urgente, por proyecto).

**Criterios de Aceptación:**
- ✅ Ordenamiento por: Archivo+Línea (default), Prioridad, Fecha programada, Fecha límite
- ✅ Dropdown de selección persistente (guardado en settings)
- ✅ Orden se mantiene entre sesiones
- ✅ Lógica de sort implementada en `applySortToTasks()`
- ✅ Agrupación visual por estado (secciones colapsables) implementada
- ✅ Agrupación por archivo implementada

**Implementación actual:**
- ✅ Enum `SortMethod` con 4 opciones
- ✅ Enum `GroupingMethod` con 3 opciones (none, byState, byFile)
- ✅ Prop `sortMethod` y `groupingMethod` en `TodoToolbar` y `TodoViewRoot`
- ✅ Método `transformForView()` aplica ordenamiento antes de renderizar
- ✅ Componente `TaskGroup` para secciones colapsables
- ✅ Lógica de agrupación implementada en `TodoViewRoot.groupTasks()`

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Lógica de sort y métodos getGroupingMethod)
- [src/ui/view/TodoViewRoot.tsx](../../src/ui/view/TodoViewRoot.tsx) (Lógica de agrupación y componente TaskGroup)
- [src/ui/view/TodoToolbar.tsx](../../src/ui/view/TodoToolbar.tsx) (Selectores de ordenamiento y agrupación)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Definición de `SortMethod` y `GroupingMethod`)

---

## US-2.3: Filtrado avanzado

**Componentes:** [VIEW]  
**Estado:** � Completado

**Historia:**
Como usuario con muchas tareas completadas, quiero múltiples opciones de filtrado (completadas, archivo activo, búsqueda), para mantener limpio mi espacio de trabajo y enfocarme en lo relevante.

**Criterios de Aceptación:**
- ✅ Modo "Ocultar completadas" (`viewMode: hideCompleted`)
- ✅ Modo "Mover completadas al final" (`viewMode: sortCompletedLast`)
- ✅ Toggle "Filtro por archivo activo" (muestra solo tareas de la nota actual)
- ✅ Barra de búsqueda con filtrado en tiempo real
- ✅ Filtro por estado específico (multi-select con chips clicables)
- ✅ Filtro por prioridad (multi-select con chips clicables)
- ✅ Filtro por rango de fechas (All, Overdue, Today, This Week, No Date)
- ✅ Combinación de filtros (AND logic)
- ✅ Panel de filtros avanzados expandible/colapsable
- ✅ Indicador visual cuando hay filtros activos
- ✅ Botón "Clear" para resetear todos los filtros

**Implementación actual:**
- ✅ Enum `TaskViewMode` con 3 modos
- ✅ Enum `DateFilterMode` con 5 opciones
- ✅ Interfaz `AdvancedFilters` (states, priorities, dateMode)
- ✅ Método `applyAdvancedFilters()` aplica filtros combinados
- ✅ Método `transformForView()` aplica filtros básicos
- ✅ Búsqueda filtra por `rawText` y `path`
- ✅ UI en `TodoToolbar` con toggles y searchbar
- ✅ Componente `AdvancedFiltersPanel` con UI interactiva
- ✅ Persistencia de filtros en settings

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Lógica de filtrado avanzado)
- [src/ui/view/TodoToolbar.tsx](../../src/ui/view/TodoToolbar.tsx) (Controles UI)
- [src/ui/view/AdvancedFiltersPanel.tsx](../../src/ui/view/AdvancedFiltersPanel.tsx) (Panel de filtros avanzados)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Definición de `AdvancedFilters` y `DateFilterMode`)
- [src/task.ts](../../src/task.ts) (Definición de `TaskViewMode`)

---

## US-2.4: Resaltado visual en el editor

**Componentes:** [EDITOR]  
**Estado:** 🟢 Completado

**Historia:**
Como escritor que necesita ver estados de un vistazo, quiero que las keywords se resalten con colores mientras escribo, para identificar visualmente qué está pendiente, en progreso o terminado sin abrir el panel.

**Criterios de Aceptación:**
- ✅ Colorización automática según el estado configurado
- ✅ Los colores respetan la configuración del usuario (`keywordColors`)
- ✅ No interfiere con otros plugins
- ✅ Rendimiento optimizado (solo procesa viewport visible)
- ✅ Funciona correctamente con indentación
- ✅ Una sola decoración por keyword (sin duplicados)

**Implementación actual:**
- ✅ Extension de CodeMirror 6 (`keyword-highlighter.ts`)
- ✅ ViewPlugin personalizado que itera línea por línea
- ✅ Decoraciones dinámicas basadas en settings
- ✅ Refactorizado para usar lógica explícita en lugar de MatchDecorator
- ✅ Solo procesa líneas visibles (viewport-based)
- ✅ Cálculo preciso de posiciones de decoración

**Notas técnicas:**
- El highlighter usa `ViewPlugin` de CodeMirror con lógica personalizada
- Se actualiza reactivamente cuando el documento o viewport cambia
- Calcula posiciones exactas del keyword para evitar decorar espacios
- Performance validada: eficiente en documentos grandes

**Archivos relacionados:**
- [src/editor/keyword-highlighter.ts](../../src/editor/keyword-highlighter.ts) (Extension de CM6)
- [src/main.ts](../../src/main.ts) (Registro del extension)

---

## Resumen de Épica 2

| US | Descripción | Estado |
|----|-------------|--------|
| US-2.1 | Panel lateral dedicado | 🟢 |
| US-2.2 | Agrupación y ordenamiento | � |
| US-2.3 | Filtrado avanzado | � |
| US-2.4 | Resaltado en editor | 🟢 |

**Cobertura de componentes:**
- **[VIEW]** - 4/4 completadas ✅
- **[EDITOR]** - 1/1 completada ✅
- **[ENGINE]** - 1/1 utilizada ✅

**Estado final:** ✅ **COMPLETADA AL 100%**

Todas las funcionalidades core de visualización, organización y filtrado están implementadas y funcionando correctamente.
