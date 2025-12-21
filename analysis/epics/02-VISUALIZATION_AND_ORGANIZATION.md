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
**Estado:** 🟡 Parcial (Ordenamiento completo, agrupación por estado pendiente)

**Historia:**
Como usuario con decenas de items rastreados, quiero ordenar/agrupar por estado, prioridad, fecha o archivo, para enfocarme en lo que importa según el contexto (hoy, urgente, por proyecto).

**Criterios de Aceptación:**
- ✅ Ordenamiento por: Archivo+Línea (default), Prioridad, Fecha programada, Fecha límite
- ✅ Dropdown de selección persistente (guardado en settings)
- ✅ Orden se mantiene entre sesiones
- ✅ Lógica de sort implementada en `applySortToTasks()`
- ⚠️ Agrupación visual por estado (secciones colapsables) pendiente de implementar
- ⚠️ Agrupación por archivo/carpeta pendiente

**Implementación actual:**
- ✅ Enum `SortMethod` con 4 opciones
- ✅ Prop `sortMethod` en `TodoToolbar` y `TodoViewRoot`
- ✅ Método `transformForView()` aplica ordenamiento antes de renderizar
- ❌ Agrupación visual (cards/secciones) no implementada aún

**Mejoras propuestas:**
- Añadir opción "Agrupar por Estado" que renderice secciones colapsables
- Añadir opción "Agrupar por Archivo" para proyectos complejos
- Implementar drag-and-drop para reordenar manualmente (futuro)

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Lógica de sort)
- [src/ui/view/TodoToolbar.tsx](../../src/ui/view/TodoToolbar.tsx) (Selector de ordenamiento)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Definición de `SortMethod`)

---

## US-2.3: Filtrado avanzado

**Componentes:** [VIEW]  
**Estado:** 🟡 Parcial (Funcionalidad básica implementada, mejoras pendientes)

**Historia:**
Como usuario con muchas tareas completadas, quiero múltiples opciones de filtrado (completadas, archivo activo, búsqueda), para mantener limpio mi espacio de trabajo y enfocarme en lo relevante.

**Criterios de Aceptación:**
- ✅ Modo "Ocultar completadas" (`viewMode: hideCompleted`)
- ✅ Modo "Mover completadas al final" (`viewMode: sortCompletedLast`)
- ✅ Toggle "Filtro por archivo activo" (muestra solo tareas de la nota actual)
- ✅ Barra de búsqueda con filtrado en tiempo real
- ⚠️ Búsqueda case-sensitive opcional (actualmente siempre case-insensitive)
- ❌ Filtro por estado específico (ej: solo TODO, solo DOING)
- ❌ Filtro por prioridad (ej: solo P1 y P2)
- ❌ Filtro por rango de fechas (ej: vencen esta semana)
- ❌ Combinación de filtros (AND/OR logic)

**Implementación actual:**
- ✅ Enum `TaskViewMode` con 3 modos
- ✅ Método `transformForView()` aplica filtros
- ✅ Búsqueda filtra por `rawText` y `path`
- ✅ UI en `TodoToolbar` con toggles y searchbar

**Mejoras propuestas (Futuro):**
- Panel de filtros avanzados con múltiples criterios combinables
- Guardar conjuntos de filtros como "vistas guardadas"
- Filtro rápido por click en badge de prioridad o estado
- Autocompletado en barra de búsqueda con sugerencias

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Lógica de filtrado)
- [src/ui/view/TodoToolbar.tsx](../../src/ui/view/TodoToolbar.tsx) (Controles UI)
- [src/task.ts](../../src/task.ts) (Definición de `TaskViewMode`)

---

## US-2.4: Resaltado visual en el editor

**Componentes:** [EDITOR]  
**Estado:** ⚠️ En revisión (Implementado pero requiere validación de rendimiento)

**Historia:**
Como escritor que necesita ver estados de un vistazo, quiero que las keywords se resalten con colores mientras escribo, para identificar visualmente qué está pendiente, en progreso o terminado sin abrir el panel.

**Criterios de Aceptación:**
- ✅ Colorización automática según el estado configurado
- ✅ Los colores respetan la configuración del usuario (`keywordColors`)
- ⚠️ No interfiere con otros plugins (necesita testing exhaustivo)
- ⚠️ Rendimiento optimizado (necesita validación en documentos grandes)

**Implementación actual:**
- ✅ Extension de CodeMirror 6 (`keyword-highlighter.ts`)
- ✅ Decoraciones dinámicas basadas en settings
- ⚠️ Necesita revisión de performance con >1000 keywords por documento

**Notas técnicas:**
- El highlighter usa `ViewPlugin` de CodeMirror
- Se actualiza reactivamente al cambiar settings
- **Pendiente**: Validar que no causa lag en documentos largos

**Archivos relacionados:**
- [src/editor/keyword-highlighter.ts](../../src/editor/keyword-highlighter.ts) (Extension de CM6)
- [src/main.ts](../../src/main.ts) (Registro del extension)

---

## Resumen de Épica 2

| US | Descripción | Estado |
|----|-------------|--------|
| US-2.1 | Panel lateral dedicado | 🟢 |
| US-2.2 | Agrupación y ordenamiento | 🟡 |
| US-2.3 | Filtrado avanzado | 🟡 |
| US-2.4 | Resaltado en editor | ⚠️ |

**Cobertura de componentes:**
- **[VIEW]** - 3/4 implementadas
- **[EDITOR]** - 1/4 en revisión
- **[ENGINE]** - 1/4 utilizado

**Acciones requeridas:**
1. Implementar agrupación visual por estado (US-2.2)
2. Validar rendimiento de highlighter en documentos grandes (US-2.4)
3. Considerar filtros avanzados para v1.2 (US-2.3)
