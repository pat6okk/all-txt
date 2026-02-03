# Épica 5: Sistema de Etiquetas (Labels) Multi-dimensionales

**Descripción:** Sistema de clasificación complementario a las prioridades que permite múltiples etiquetas por tarea para categorización, filtrado y agrupación.

**Componentes principales:** [ENGINE] [VIEW] [CONFIG]  
**Prioridad:** Should Have  
**Estado:** ✅ IMPLEMENTADO (2026-02-03)

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
| Tests Unitarios | ✅ | `tests/parser/labels.test.ts` (9 tests) |

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

### US-5.1: Parsing de Labels ✅ COMPLETADO

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

### US-5.2: Visualización de Labels ✅ COMPLETADO

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

### US-5.3: Filtrado por Labels ✅ COMPLETADO

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

### US-5.4: Context Menu para Labels ✅ COMPLETADO

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

### US-5.5: Gestión de Labels en Settings 📋 PENDIENTE

**Componentes:** [CONFIG]  
**Estado:** 📋 Pendiente

**Pendiente:**
- [ ] Sección "Labels" en SettingsTab
- [ ] Añadir/eliminar labels predefinidos
- [ ] Asignar color a cada label
- [ ] Toggle: modo libre vs definido

---

### US-5.6: Autocompletado de Labels 🔮 FUTURO

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** 🔮 Futuro

**Pendiente:**
- Menú de autocompletado al escribir `@` en editor
- Requiere EditorSuggest de Obsidian API

---

## Archivos Modificados/Creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/task.ts` | ✅ Modificado | Campo `labels: string[]` |
| `src/parser/task-parser.ts` | ✅ Modificado | Método `extractLabels()` |
| `src/settings/defaults.ts` | ✅ Modificado | `labelMode`, `definedLabels`, `labelColors` |
| `src/editor/keyword-highlighter.ts` | ✅ Modificado | Decoración visual labels |
| `src/editor/label-context-menu.ts` | ✅ Creado | Context menu en editor |
| `src/ui/view/TaskItem.tsx` | ✅ Modificado | Badges + context menu |
| `src/ui/view/AdvancedFiltersPanel.tsx` | ✅ Modificado | Filtro por labels |
| `src/ui/view/TodoList.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TaskGroup.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TodoViewRoot.tsx` | ✅ Modificado | Props propagadas |
| `src/ui/view/TodoToolbar.tsx` | ✅ Modificado | availableLabels prop |
| `src/view/task-view.tsx` | ✅ Modificado | Context menu + filter logic |
| `src/main.ts` | ✅ Modificado | Registro labelContextMenu |
| `tests/parser/labels.test.ts` | ✅ Creado | 9 tests unitarios |

---

## Tests

```bash
npm test -- tests/parser/labels.test.ts

# Resultado: 9 passed, 9 total
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
