# Épica 6: Sistema de Etiquetas (Labels) Multi-dimensionales

**Descripción:** Sistema de clasificación complementario a las prioridades que permite múltiples etiquetas por tarea para categorización, filtrado y agrupación.

**Componentes principales:** [ENGINE] [VIEW] [CONFIG]  
**Prioridad:** Should Have  
**Estado:** ✅ IMPLEMENTADO (actualizado 2026-02-10)

---

## Resumen de Implementación

### ✅ Funcionalidades Completadas

| Feature | Estado | Archivos |
|---------|--------|----------|
| Parsing de Labels | ✅ | `src/parser/task-parser.ts` |
| Modelo Task con Labels | ✅ | `src/task.ts` |
| Configuración de Labels | ✅ | `src/settings/defaults.ts` |
| Decoración en Editor | ✅ | `src/editor/keyword-highlighter.ts` |
| Context Menu Editor | ✅ | `src/editor/label-context-menu.ts` |
| Badges en Panel Lateral | ✅ | `src/ui/view/TaskItem.tsx` |
| Filtro por Labels | ✅ | `src/ui/view/AdvancedFiltersPanel.tsx` |
| Context Menu Panel | ✅ | `src/view/task-view.tsx` |
| Gestión de Labels en Settings | ✅ | `src/ui/settings/LabelsSection.tsx` |
| Autocompletado + alta rápida | ✅ | `src/editor/label-editor-suggest.ts` |
| Inserción contextual de Labels | ✅ | `src/main.ts` |
| Tests Unitarios | ✅ | `tests/parser/labels.test.ts`, `tests/labels-utils.test.ts` |

---

## Sintaxis Implementada

```markdown
TODO P1 Implementar login @Backend @Urgente
DOING Revisar código @Frontend @TeamA
DONE Documentar API @Backend
```

### Reglas de Parsing:
- Prefijo: `@`
- Caracteres válidos: `[A-Za-z][A-Za-z0-9_-]*`
- No confunde emails: `user@example.com` NO es un label
- Labels se extraen del texto y se almacenan en `task.labels: string[]`

---

## Contexto y Motivación

### Problema Actual
El sistema actual confunde dos conceptos distintos:
- **Prioridades**: Valor único para ordenamiento (P1, P2, ALTA, BAJA)
- **Clasificaciones adicionales**: Intento de usar múltiples prioridades para categorizar

### Anti-patterns Identificados (ref: US-4.2)
```markdown
❌ TODO P1 URGENTE cocinar huevos     (Confuso: ¿qué tiene precedencia?)
❌ TODO P1 #A Tarea compleja          (Mezcla sistemas incompatibles)
```

### Solución Implementada
Separar completamente **Prioridades** de **Labels**:

| Concepto | Cantidad | Propósito | Sintaxis |
|----------|----------|-----------|----------|
| Priority | 0-1 | Urgencia/Ordenamiento | `P1`, `ALTA` (token suelto) |
| Labels | 0-N | Categorización/Filtrado | `@contexto` |

---

## Decisiones de Diseño

### DD-1: Sintaxis de Labels

**✅ Decisión: Sintaxis `@label`**

Razones:
1. No conflicta con sintaxis Markdown (`#` es heading, `[]` es link)
2. Distinguible de tags nativos de Obsidian (`#tag`)
3. Intuitivo (similar a menciones en redes sociales)
4. Compatible con regex simple: `@[A-Za-z][A-Za-z0-9_-]*`

---

### DD-2: Almacenamiento en Modelo Task

```typescript
export interface Task {
    // ... campos existentes
    priority: string | null;    // Ordenamiento principal
    priorityLabel: string;      // Reconstrucción de texto
    
    // Sistema de Labels
    labels: string[];           // Array de etiquetas extraídas
}
```

---

### DD-3: Configuración de Labels

```typescript
export interface TodoTrackerSettings {
    // Labels System
    labelMode: 'free' | 'defined';    // Modo de operación
    definedLabels: string[];          // Labels conocidos
    labelColors: Record<string, string>;  // label -> color hex
}
```

---

## Historias de Usuario

### US-6.1: Parsing de Labels ✅ COMPLETADO

**Componentes:** [ENGINE]  
**Estado:** ✅ Completado

**Implementación:**
- Método `extractLabels()` en `TaskParser`
- Integrado en flujo de parsing después de prioridades
- Labels se almacenan en `task.labels`
- Texto se limpia de labels

**Archivos:**
- `src/parser/task-parser.ts` (líneas 285-325)

---

### US-6.2: Visualización de Labels ✅ COMPLETADO

**Componentes:** [VIEW] [EDITOR]  
**Estado:** ✅ Completado

**Implementación:**
- Decoración visual en editor con color `#BD93F9` (púrpura)
- Badges en panel lateral con estilo distintivo
- Bordes redondeados para diferenciar de prioridades

**Archivos:**
- `src/editor/keyword-highlighter.ts` (decoración editor)
- `src/ui/view/TaskItem.tsx` (badges panel)

---

### US-6.3: Filtrado por Labels ✅ COMPLETADO

**Componentes:** [VIEW] [CONFIG]  
**Estado:** ✅ Completado

**Implementación:**
- Sección "Labels" en AdvancedFiltersPanel
- Multi-selección de labels (lógica OR)
- Labels disponibles se descubren automáticamente de tareas
- Filtro aplicado en `task-view.tsx`

**Archivos:**
- `src/ui/view/AdvancedFiltersPanel.tsx`
- `src/view/task-view.tsx`

---

### US-6.4: Context Menu para Labels ✅ COMPLETADO

**Componentes:** [EDITOR] [VIEW]  
**Estado:** ✅ Completado

**Implementación:**
- Click derecho en `@label` en editor o panel lateral
- Opciones: Change to, Remove Label, Copy Label
- Detecta automáticamente todos los labels del documento/vault

**Archivos:**
- `src/editor/label-context-menu.ts` (editor)
- `src/view/task-view.tsx` (panel lateral)

---

### US-6.5: Gestión de Labels en Settings ✅ COMPLETADO

**Componentes:** [CONFIG]  
**Estado:** ✅ Completado

**Implementación:**
- Sección dedicada "Labels" en SettingsTab
- Alta/baja/renombrado de labels predefinidos
- Reordenamiento manual de labels
- Selector de color por label
- Toggle contractual `labelMode`: `free` / `defined`

**Archivos:**
- `src/ui/settings/LabelsSection.tsx`
- `src/ui/settings/SettingsView.tsx`
- `src/services/settings-service.ts`

---

### US-6.6: Autocompletado de Labels ✅ COMPLETADO

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** ✅ Completado

**Implementación:**
- Menú de autocompletado al escribir `@` en editor
- Navegación con teclado (flechas + enter)
- Alta rápida de label al registro global desde el popup
- Scope por defecto en nota actual, con opción de expandir a labels del vault

**Archivos:**
- `src/editor/label-editor-suggest.ts`
- `src/main.ts`
- `src/labels/label-utils.ts`

---

## Archivos Modificados/Creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/task.ts` | ✅ Modificado | Campo `labels: string[]` |
| `src/parser/task-parser.ts` | ✅ Modificado | Método `extractLabels()` |
| `src/settings/defaults.ts` | ✅ Modificado | `labelMode`, `definedLabels`, `labelColors` |
| `src/editor/keyword-highlighter.ts` | ✅ Modificado | Decoración visual labels |
| `src/editor/label-context-menu.ts` | ✅ Creado | Context menu en editor |
| `src/editor/label-editor-suggest.ts` | ✅ Creado | Autocompletado de labels en editor |
| `src/ui/view/TaskItem.tsx` | ✅ Modificado | Badges + context menu |
| `src/ui/settings/LabelsSection.tsx` | ✅ Creado | Gestión de labels en settings |
| `src/ui/view/AdvancedFiltersPanel.tsx` | ✅ Modificado | Filtro por labels |
| `src/ui/view/TodoList.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TaskGroup.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TodoViewRoot.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TodoToolbar.tsx` | ✅ Modificado | availableLabels prop |
| `src/view/task-view.tsx` | ✅ Modificado | Context menu + filter logic |
| `src/main.ts` | ✅ Modificado | Registro de suggest + inserción contextual |
| `tests/parser/labels.test.ts` | ✅ Modificado | Cobertura de `labelMode` contractual |
| `tests/labels-utils.test.ts` | ✅ Creado | Tests de normalización y orden canónico |

---

## Tests

```bash
npm test -- tests/parser/labels.test.ts

# Resultado: labels parser + utils en verde
```

**Tests implementados:**
- should parse single label from task text
- should parse multiple labels from task text
- should parse labels with priority
- should handle labels with underscores and dashes
- should not parse email-like patterns as labels
- should not parse labels starting with numbers
- should handle task with no labels
- should handle labels at the beginning of text
- should handle labels in the middle of text
- should keep unknown labels as plain text in defined mode
- should normalize case to canonical label display when defined
- should canonicalize labels in free mode when a defined match exists
