# Roadmap Técnico y Futuras Funcionalidades

Este documento consolida análisis de factibilidad y propuestas técnicas para funcionalidades avanzadas que van más allá del alcance actual, pero para las cuales la arquitectura del plugin ya está siendo preparada.

## 1. Sistema de Etiquetas (Labels) Multi-dimensionales

> **📋 Estado:** En planificación activa  
> **📄 Especificación:** [Épica 6: Labels System](./epics/06-LABELS_SYSTEM.md)

### Contexto
Sistema de clasificación complementario a las prioridades que permite múltiples etiquetas (`@Trabajo`, `@Urgente`, `@EquipoA`) por tarea para categorización, filtrado y agrupación.

### Decisión Clave
**Separar completamente Prioridades de Labels:**
- **Priority** (0-1): Valor único para ordenamiento → `P1`, `ALTA`
- **Labels** (0-N): Múltiples etiquetas para categorización → `@contexto`, `@equipo`

### Sintaxis Propuesta
```markdown
TODO P1 Preparar demo @Trabajo @EquipoAlpha
TODO ALTA Revisar código @Backend @Dev
```

### Plan de Implementación
1. **Fase 1 - Core Engine**: Extender Task interface, implementar parsing
2. **Fase 2 - UI Básica**: Renderizar badges, estilos
3. **Fase 3 - Filtrado**: Filtros por labels en panel
4. **Fase 4 - Settings**: Configuración de labels definidos

Ver especificación completa en [Épica 6](./epics/06-LABELS_SYSTEM.md).

---

## 2. Vista Kanban (Kanban Board View)

### Contexto
Visualizar el flujo de trabajo (`TODO -> DOING -> DONE`) como un tablero de columnas interactivas con funcionalidad arrastrar y soltar (Drag & Drop).

### Análisis de Factibilidad
**Veredicto: ALTA FACTIBILIDAD.** La arquitectura actual basada en estados y transiciones (`WorkflowService`) es el backend ideal para un Kanban.

### Arquitectura Propuesta

1. **Nueva Vista (`KanbanView`)**:
   - Crear una nueva clase `KanbanView extends ItemView` paralela a la lista actual.
   - Compartiría el mismo `TaskStore` para asegurar que los datos estén siempre sincronizados.

2. **Columnas Dinámicas**:
   - Las columnas se generarían automáticamente leyendo los `Workflows` configurados.
   - **Mapeo**: 
     - Columna 1: Keywords de estado "TODO" / Iniciales.
     - Columna 2..N: Keywords de estados intermedios ("DOING", "REVIEW").
     - Columna Final: Keywords de estado "DONE".

3. **Interacción (Drag & Drop)**:
   - Utilizar librería React como `dnd-kit` o `react-beautiful-dnd`.
   - **Evento Drop**: Al soltar una tarjeta en una columna nueva:
     1. Detectar el nuevo estado asociado a la columna.
     2. Invocar `TaskEditor.updateTaskState(task, newState)`.
     3. El archivo Markdown se actualiza automáticamente.

4. **Ventajas sobre otros Kanbans**:
   - **Text-First**: La fuente de la verdad sigue siendo el texto inline. No crea archivos JSON ocultos ni metadatos extraños.
   - **Multi-Workflow**: Posibilidad de tener "Swimlanes" (carriles) horizontales para diferentes tipos de tareas (ej: carril de Bugs, carril de Features) si se detectan múltiples flujos.

---

## 3. Integración de Calendario (Calendar View)

*Pendiente de análisis detallado.*
Potencial para visualizar tareas con fecha (`PLAN`, `DUE`) en una vista de calendario mensual/semanal.
