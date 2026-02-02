# Arquitectura del Sistema

**Última actualización:** 20 de diciembre de 2025

---

## Descripción General

El plugin FLOW.txt está organizado en **4 componentes principales** que trabajan juntos para capturar, visualizar y gestionar items de estado rastreados en Markdown.

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Vault                           │
│                 (Archivos Markdown)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
     [EDITOR]                         [ENGINE]
   CodeMirror 6                    Task Parser
   Keyword Highlighter         Workflow Service
                                  Task Store
                                 Date Parser
          │                               │
          └───────────────┬───────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
     [VIEW]                          [CONFIG]
   Todo Inline Panel              Settings Panel
   Task List                    Vocabulary Editor
   Toolbar                      Workflow Builder
```

---

## Componentes

### 1. [ENGINE] - Motor de Lógica

**Responsabilidad:** Escanear la bóveda, parsear keywords, gestionar estados y fechas.

**Subcamadas:**

#### Parser Engine (`src/parser/`)
- **task-parser.ts** - Regex patterns, state machine, keyword detection
  - Detecta keywords en múltiples contextos (listas, callouts, checkboxes)
  - Extrae prioridades y fechas
  - Máquina de estados para rastrear contexto (código, matemáticas, comentarios)

- **date-parser.ts** - ISO format parsing, natural language (experimental)
  - Parsea SCHEDULED: y DEADLINE: keywords
  - Convierte fechas a formato interno
  - Soporte para lenguaje natural (requiere validación)

- **language-registry.ts** - Language-specific comment parsing
  - Registra patrones de comentarios por lenguaje
  - Usada en parser para excluir keywords en bloques de código

#### Service Layer (`src/services/`)
- **task-store.ts** - Central data store, event emitter
  - Almacena array de todos los items detectados
  - Emite eventos 'update' para notificar a listeners
  - Se suscribe a cambios de archivo de Obsidian

- **workflow-service.ts** - State transitions, priority cycling
  - `getNextState()` - determina siguiente estado basado en workflow
  - `getNextPriority()` - cicla prioridad dentro del grupo
  - Aplica lógica de flujos personalizados

- **settings-service.ts** - Settings persistence and validation
  - Carga/guarda configuración desde Obsidian
  - Valida workflows al modificar vocabulario
  - Regenera regex cuando cambian keywords

**Data Flow:**
```
User edits Markdown
    ↓
Obsidian emits "file-changed" event
    ↓
task-store.onFileChange()
    ↓
task-parser.parseFile() [state machine]
    ↓
Extract keywords + dates + priorities
    ↓
task-store.updateTasks()
    ↓
Emit 'update' event
    ↓
React components re-render
    ↓
UI updated
```

---

### 2. [VIEW] - Visualización

**Responsabilidad:** Mostrar items en panel lateral con interacción del usuario.

**Componentes:**

#### Main Panel (`src/view/task-view.tsx`)
- Clase `TodoView` extiende `ItemView` de Obsidian
- ViewType: `todoinline-view`
- Métodos principales:
  - `transformForView()` - Aplica filtros y ordenamiento
  - `applySortToTasks()` - Implementa 4 métodos de sort
  - `getDateStatusClasses()` - Calcula clases CSS para vencimiento
  - `openTaskLocation()` - Navega a línea en editor
  - `openStateMenuAtMouseEvent()` - Menú contextual para saltar estado

#### React Components (`src/ui/view/`)
- **TodoViewRoot.tsx** - Contenedor raíz del panel
- **TodoList.tsx** - Renderiza lista de items
- **TaskItem.tsx** - Renderiza un item individual con:
  - Keyword clickeable para avanzar estado
  - Badges de prioridad y fecha
  - Click derecho para menú contextual
  - Navegación a archivo en clic

- **TodoToolbar.tsx** - Controles del panel:
  - Selector de ordenamiento (dropdown)
  - Barra de búsqueda
  - Toggles de filtro (completadas, archivo activo)
  - Contador de items

#### Date Utilities (`src/view/date-utils.ts`)
- Formatea fechas para visualización
- Calcula relativo a hoy (hoy, mañana, próxima semana, etc.)
- Convierte a zona horaria del usuario

**State Management:**
```
TaskStore (datos)
    ↓
useState en TodoViewRoot
    ↓
Props pasados a componentes
    ↓
Handlers llamados → TaskStore actualizados
    ↓
Evento 'update' → Re-render
```

---

### 3. [EDITOR] - Resaltado en Editor

**Responsabilidad:** Colorizar keywords mientras el usuario escribe.

**Componentes:**

#### CodeMirror Extension (`src/editor/keyword-highlighter.ts`)
- ViewPlugin de CodeMirror 6
- Mantiene DecorationSet de keywords coloreados
- Se actualiza reactivamente al:
  - Cambiar configuración de keywords
  - Editar documento
  - Cambiar tema de Obsidian

**Implementación:**
```typescript
ViewPlugin.create((view) => {
  return {
    update(update) {
      if (update.docChanged || settingsChanged) {
        redecorate();
      }
    },
    destroy() {
      // Cleanup
    }
  }
})
```

**⚠️ Problema Conocido:**
- Resalta keywords en posiciones inválidas
- Ejemplo: `- Revisar TODO de ayer` → resalta TODO pero parser no lo detecta
- Solución propuesta: Mejorar regex del highlighter para validar posición

---

### 4. [CONFIG] - Configuración

**Responsabilidad:** UI para que usuario configure vocabulario, workflows y opciones.

**Componentes:**

#### Settings Panel (`src/settings/settings.ts`)
- Extiende `PluginSettingTab`
- Controla qué secciones mostrar
- Delega a componentes especializados

#### Secciones (`src/ui/settings/`)
- **VocabularySection.tsx** - Editor de 3 columnas:
  - Start / In-Progress / Finished
  - Botones +/- para CRUD
  - Click en keyword abre modal

- **WorkflowsSection.tsx** - Constructor visual de flujos:
  - Tarjetas por keyword "Start"
  - Dropdowns para pasos intermedios
  - Lógica de herencia y validación

- **MetadataSection.tsx** - Opciones de fechas/prioridades
  - Toggles para features experimentales
  - Configuración de keywords especiales

- **KeywordModal.tsx** - Edición avanzada:
  - Color picker (RGB + presets)
  - Campo de descripción/tooltip
  - Preview en vivo

#### Settings Data (`src/settings/defaults.ts`)
```typescript
interface TodoTrackerSettings {
  todoKeywords: string[];        // Keywords "Start"
  doingKeywords: string[];       // Keywords "In-Progress"
  doneKeywords: string[];        // Keywords "Finished"
  
  workflows: string[][];         // Array of workflows
  priorityQueues: string[][];    // Multi-cola de prioridades
  
  keywordColors: Record<string, string>; // Color por keyword
  
  includeCodeBlocks: boolean;
  includeCalloutBlocks: boolean;
  
  refreshInterval: number;       // Ms entre escaneos
  sortMethod: SortMethod;        // Ordenamiento default
  viewMode: TaskViewMode;        // Modo visualización
}
```

---

## Flujo de Datos Completo

### Escritura de nuevo TODO

```
User edits: "- TODO Revisar código"
  → CodeMirror change event
  → keyword-highlighter resalta
  → Obsidian vault:modify event
  → task-store listener → parseFile()
  → State machine valida contexto
  → Extrae Task object
  → updateTasks() → emit 'update'
  → React re-render
  → UI muestra item coloreado
```

### Click en keyword (transición de estado)

```
User clicks keyword en panel
  → TaskItem.onToggle()
  → workflowService.getNextState()
  → task-editor.updateTaskLine()
  → Archivo modificado
  → vault:modify → re-parse
  → emit 'update'
  → UI actualiza estado y color
```

---

## Patrones de Diseño Usados

- **Observer:** TaskStore emite 'update', React components se suscriben
- **State Machine:** Parser rastrea contexto (bloques de código, matemáticas)
- **Decorator:** Highlighter colorea sin modificar contenido
- **Factory:** parseFile() crea Task objects normalizados
- **Strategy:** SortMethod define diferentes estrategias de ordenamiento

---

## Dependencias Externas

**Core:** obsidian, react (18.x), @codemirror/view (6.x), typescript

---

## Performance Considerations

### Parsing
- ⚠️ Re-parsea archivo completo cuando cambia
- ✅ Solo re-parsea archivo modificado (no toda bóveda)
- ⚠️ En archivos >5000 líneas puede haber lag

### Rendering
- ✅ React virtualiza lista (react-window compatible)
- ✅ Memoización de componentes para evitar re-renders innecesarios
- ⚠️ Highlighter puede causar lag con >1000 keywords por documento

### Memory
- ⚠️ TaskStore crece indefinidamente
- ⚠️ No hay límite de cache
- ⚠️ Posibles memory leaks en listeners

**Acciones necesarias:**
- Implementar LRU cache con límite 1000 items
- Auditoría de memory leaks (v1.1 CRÍTICO)
- Carga progresiva para bóvedas >1000 archivos

---

## Extension Points

### Agregar nuevo keyword type

1. Editar `defaults.ts` - agregar nueva array al interface
2. Editar `VocabularySection.tsx` - agregar columna UI
3. Editar `task-parser.ts` - incluir en regex generation
4. Agregar tests correspondientes

### Extender parser para nuevos contextos

Editar state machine en `task-parser.ts` método `parseFile()` agregando condiciones de bloque.

---

## Testing

**Cobertura:** ~60% actual, meta >80% v1.1  
**Ubicación:** `tests/` - parser, workflows, date utils

---

## Versioning

**Semantic Versioning:** MAJOR.MINOR.PATCH  
Ver [RELEASE_PROCESS.md](../../.github/RELEASE_PROCESS.md) para detalles.

---

## Referencias Relacionadas

- [Épicas y US](../epics/) - Documentación funcional
- [RELEASE_PROCESS.md](../../.github/RELEASE_PROCESS.md) - Procedimiento de release
