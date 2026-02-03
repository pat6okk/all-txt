# Roadmap Técnico y Futuras Funcionalidades

Este documento consolida análisis de factibilidad y propuestas técnicas para funcionalidades avanzadas que van más allá del alcance actual, pero para las cuales la arquitectura del plugin ya está siendo preparada.

## 1. Sistema de Etiquetas (Labels) Multi-dimensionales

### Contexto
Actualmente, el plugin soporta "Prioridades" (`priority`), que es un campo único por tarea. Existe una necesidad de soportar múltiples etiquetas (ej: `#Trabajo`, `#Urgente`, `#EquipoA`) en una misma tarea sin conflicto.

### Análisis Técnico
- **Limitación Actual**: La interfaz `Task` define `priority` como `string | null` (valor único). El `TaskParser` detiene la búsqueda tras encontrar el primer token de prioridad y lo elimina del texto "limpio".
- **Riesgo**: Reutilizar el campo `priority` para una lista rompería la lógica de ordenamiento y agrupación actual.

### Propuesta de Implementación
Tratar "Labels" como una entidad completamente separada de "Prioridades".

1. **Extensión de Modelo (`src/task.ts`)**:
   ```typescript
   export interface Task {
       // ... campos existentes
       priority: string | null; // Mantiene compatibilidad para ordenamiento principal
       labels: string[];        // NUEVO: Array de etiquetas adicionales
   }
   ```

2. **Parsing Aditivo**:
   - El parser primero extrae la `priority` (si existe).
   - Luego, escanea el texto restante buscando otros tokens definidos en `Settings`.
   - Estos tokens se extraen al array `labels`.

3. **UI**:
   - Renderizar los labels como badges visuales adicionales en `TaskItem`.
   - Permitir filtrado por labels en `TodoViewRoot`.

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
Potencial para visualizar tareas con fecha (`SCHEDULED`, `DEADLINE`) en una vista de calendario mensual/semanal.
