# Arquitectura Técnica Canónica - FLOW.txt

**Última actualización:** 10 de febrero de 2026  
**Estado:** Vigente (`v1.1`)  
**Alcance:** arquitectura activa de runtime, parser, UI, settings y calidad para desktop.

---

## 1. Política de Canonicidad y Versionado

### Documento único de arquitectura

- La arquitectura activa del proyecto vive **solo** en `analysis/technical/ARCHITECTURE.md`.
- No se permiten duplicados activos (`ARCHITECTURE_v2.md`, `ARCHITECTURE_NEW.md`, etc.).
- Si se archiva historial, debe marcarse explícitamente como **histórico no canónico**.

### Versionado por hito

| Versión | Fecha | Estado | Nota |
|---|---|---|---|
| `v1.0` | 2025-12-20 | Histórico | Documento previo con partes desalineadas al runtime actual |
| `v1.1` | 2026-02-10 | Vigente | Contrato estricto, bloques orgánicos, labels contractuales, actualización reactiva |

### Cuándo se debe actualizar este documento

- Cambios de contrato de parsing (`strict-only`, metadata, labels, bloque).
- Cambios de arquitectura runtime (eventos, store, servicios, flujo de actualización).
- Cambios estructurales en settings/UX que alteren el comportamiento del producto.
- Antes de cerrar un `PRJ-*` relacionado con arquitectura o contrato técnico.

---

## 2. Contrato Funcional Vigente (`v1.1`)

1. Parsing principal en modo **`strict-only`**: solo encabezados de estado al inicio de línea (`TODO ...`, `DOING ...`, etc.).
2. Bloques FLOW por **indentación orgánica**: una línea pertenece al bloque si su indentación es mayor que la del header padre.
3. Keywords de fecha canónicas: **`PLAN`** y **`DUE`**; aliases legacy (`SCHEDULED`/`DEADLINE`) solo como compatibilidad temporal.
4. Actualización del panel por modelo **reactivo por eventos de vault + debounce** (sin `refreshInterval` contractual).
5. `viewType` oficial único del panel: **`flowtxt-view`**.
6. Labels contractuales con `labelMode`:
   - `free`: extrae cualquier `@label` válida.
   - `defined`: extrae solo labels registradas; labels no registradas quedan como texto plano.
   - Matching case-insensitive con display canónico.

---

## 3. Arquitectura por Capas

### 3.1 Runtime del plugin (`src/main.ts`)

- Inicializa servicios (`SettingsService`, `WorkflowService`, `TaskStore`, `TaskEditor`).
- Registra vista lateral `flowtxt-view`.
- Registra extensiones de editor:
  - `keyword-highlighter`
  - `keyword-context-menu`
  - `priority-context-menu`
  - `label-context-menu`
  - `date-context-menu`
  - `label-editor-suggest` (autocomplete de labels)
- Registra menú contextual en editor para:
  - convertir selección a bloque FLOW,
  - insertar labels (nota actual / vault).
- Escucha eventos de vault (`modify`, `create`, `delete`, `rename`) y delega a `TaskStore`.

### 3.2 ENGINE (`src/parser/`, `src/services/`, `src/view/task-editor.ts`)

#### `TaskParser` (`src/parser/task-parser.ts`)

- Construye regex de estados activos y parsea tareas en formato estricto.
- Soporta parsing en bloques de código cuando está habilitado (`includeCodeBlocks`) y existe definición en `language-registry`.
- Extrae:
  - estado,
  - prioridad (`priorityQueues`),
  - labels (`labelMode` + mapa canónico),
  - metadata de fechas (`PLAN`/`DUE` + alias),
  - contenido de bloque y subtareas por indentación.

#### `TaskStore` (`src/services/task-store.ts`)

- Fuente central de tareas parseadas en memoria.
- Full scan al iniciar o cuando cambian settings estructurales.
- Reconciliación incremental por archivo en eventos de vault.
- Emite `update` con debounce (`200ms`) para evitar renders excesivos.

#### `WorkflowService` (`src/services/workflow-service.ts`)

- Resuelve transiciones de estado según workflows definidos.
- Resuelve navegación/ciclo de prioridades por grupos.
- Expone colores y utilidades de vocabulario para la UI.

#### `TaskEditor` (`src/view/task-editor.ts`)

- Actualiza líneas de tarea respetando contexto activo/inactivo:
  - Editor API para archivo activo.
  - `vault.process` para ediciones en background.
- Mantiene formato de línea, prioridad y estado final.

#### `SettingsService` (`src/services/settings-service.ts`)

- Única capa de mutación de settings.
- Normaliza labels (`definedLabels`, `labelColors`) en guardado.
- Persiste cambios y gatilla re-creación de parser + re-scan.

### 3.3 VIEW (`src/view/`, `src/ui/view/`)

- `TodoView` (ItemView) actúa como adaptador entre `TaskStore` y React.
- `TodoViewRoot` + `TodoList` + `TaskItem` renderizan tareas, filtros y acciones.
- Filtros avanzados (`state`, `priority`, `labels`, `date`) con matching case-insensitive para labels.
- Menús contextuales desde panel para estado, prioridad, fecha y labels.

### 3.4 EDITOR (`src/editor/`)

- `keyword-highlighter` aplica decoraciones visuales para estados, prioridades y labels.
- Menús contextuales en editor para keywords, prioridad, labels y fechas.
- `label-editor-suggest`:
  - popup al escribir `@`,
  - navegación por teclado,
  - alta rápida de label global,
  - toggle de scope entre labels de nota actual y labels del vault.

### 3.5 CONFIG (`src/settings/`, `src/ui/settings/`)

- Settings en React por secciones:
  - vocabulario,
  - workflows,
  - metadata,
  - labels.
- `LabelsSection` gestiona:
  - `labelMode` (`free`/`defined`),
  - alta/baja/renombrado,
  - orden manual,
  - color por label.

---

## 4. Flujo de Datos (Operación)

### 4.1 Captura y actualización reactiva

```text
Vault event (modify/create/delete/rename)
  -> TaskStore handler
  -> parse incremental del archivo afectado (o full scan según contexto)
  -> actualización de tasks en memoria
  -> emit('update') con debounce
  -> TodoView re-render (React)
```

### 4.2 Interacción de usuario (panel)

```text
Click en estado/prioridad/fecha/label
  -> handler de TodoView
  -> TaskEditor o edición de archivo
  -> evento de vault
  -> TaskStore re-parse
  -> UI actualizada
```

### 4.3 Interacción de usuario (editor)

```text
Escritura con @
  -> LabelEditorSuggest (nota por defecto)
  -> selección por teclado/mouse
  -> inserción de label o creación rápida
  -> contenido actualizado en editor
```

---

## 5. Modelo de Configuración Activo

Contrato relevante de `TodoTrackerSettings` (`src/settings/defaults.ts`):

```ts
interface TodoTrackerSettings {
  todoKeywords: string[];
  doingKeywords: string[];
  doneKeywords: string[];
  scheduledKeywords: string[]; // defaults: PLAN
  deadlineKeywords: string[];  // defaults: DUE
  priorityQueues: string[][];
  workflows: string[][];

  includeCalloutBlocks: boolean;
  includeCodeBlocks: boolean;

  sortMethod: 'default' | 'sortByScheduled' | 'sortByDeadline' | 'sortByPriority';
  groupingMethod: 'none' | 'byState' | 'byFile';

  labelMode: 'free' | 'defined';
  definedLabels: string[];
  labelColors: Record<string, string>; // clave normalizada

  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
}
```

Notas de compatibilidad:

- `priorityKeywords` permanece como campo deprecated para compatibilidad de carga.
- `blockKeywords` / `blockDelimiterPresets` se mantienen por compatibilidad histórica; no definen el contrato principal de bloques orgánicos.

---

## 6. Performance y Escalabilidad (Estado Actual)

- Modelo reactivo por eventos (sin polling configurable).
- Debounce de actualización del store (`200ms`).
- Full scan en init y en cambios estructurales de settings; incremental por archivo para eventos comunes.
- Riesgos actuales:
  - full scans repetidos en cambios frecuentes de configuración,
  - costo de parsing en archivos muy grandes,
  - necesidad de validar UX móvil para labels avanzadas.

---

## 7. Calidad y Gate de Release

- Build: `npm run build`.
- Tests: `npm test`.
- Gate formal de release: sin tests en verde no hay release válido (`.github/RELEASE_PROCESS.md`).
- Línea base vigente (2026-02-10): `29/29` suites, `117/117` tests.

---

## 8. Backlog Arquitectónico Declarado

1. Labels grouping (no implementado aún; solo orden).
2. Validación y UX mobile para flujo de labels (desktop-first vigente).
3. Retiro planificado de compatibilidades legacy (`SCHEDULED/DEADLINE`, configuración histórica de delimitadores) en hito mayor.

---

## 9. Trazabilidad con Diagnóstico PRJ

- `PRJ-001`: strict-only parser
- `PRJ-002`: bloques orgánicos por indentación
- `PRJ-003`: `PLAN/DUE` canónicos
- `PRJ-004`: `flowtxt-view` único
- `PRJ-005`: gate de calidad en verde
- `PRJ-006`: actualización reactiva sin `refreshInterval`
- `PRJ-007`: labels contractuales (`free/defined`) con UX editor/settings
- `PRJ-008`: este documento versionado y alineado al runtime vigente
