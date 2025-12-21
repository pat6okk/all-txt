# Épica 4: Metadatos Temporales y Prioridades

**Descripción:** Cómo se capturan, visualizan y gestionan fechas y prioridades en los items.

**Componentes principales:** [ENGINE] [VIEW] [CONFIG]  
**Prioridad:** Should Have

---

## US-4.1: Fechas programadas y límites

**Componentes:** [ENGINE] [VIEW] [CONFIG]  
**Estado:** 🟡 Parcial (Parsing básico completo, lenguaje natural pendiente)

**Historia:**
Como planificador, quiero añadir fechas de inicio (`SCHEDULED:`) y fechas límite (`DEADLINE:`) a mis items, para gestionar compromisos temporales sin salir del Markdown.

**Criterios de Aceptación:**
- ✅ Sintaxis configurable: keywords personalizables en settings (`scheduledKeywords`, `deadlineKeywords`)
- ✅ Formato ISO (YYYY-MM-DD) reconocido y parseado correctamente
- ⚠️ Parsing de lenguaje natural opcional (parcialmente implementado con `chrono-node`)
- ✅ Ordenamiento por fecha en el panel (sortMethods: `sortByScheduled`, `sortByDeadline`)
- ✅ Visualización de fechas en cada item con iconos y colores
- ❌ Validación de fechas inválidas (actualmente silenciosamente ignora)
- ❌ Edición de fechas desde el panel (requiere editar archivo)
- ❌ Recordatorios/notificaciones de fechas próximas

**Sintaxis soportada:**
```markdown
TODO Preparar presentación
SCHEDULED: 2025-12-25
DEADLINE: 2025-12-31
```

**Formato recomendado:**

Fechas deben estar en **línea siguiente** (más legible y compatible con otros plugins):
```markdown
TODO Preparar presentación
SCHEDULED: 2025-12-25
DEADLINE: 2025-12-31
```

**Implementación actual:**
- ✅ Parser extrae fechas con `extractTaskDates()`
- ✅ `DateParser` class con soporte ISO y lenguaje natural
- ✅ Visualización en `TaskItem.tsx` con `DateUtils.formatDateForDisplay()`
- ⚠️ Lenguaje natural funciona pero necesita refinamiento (ambigüedades)

**Mejoras propuestas:**
- Validación estricta: mostrar error si formato inválido
- Editor inline de fechas (date picker en el panel)
- Soporte para rangos de fechas
- Notificaciones configurable (ej: alertar 1 día antes de deadline)

**Archivos relacionados:**
- [src/parser/date-parser.ts](../../src/parser/date-parser.ts) (Parsing de fechas)
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Extracción de fechas)
- [src/view/date-utils.ts](../../src/view/date-utils.ts) (Formato de visualización)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (Renderizado de fechas)

---

## US-4.2: Prioridades multi-cola

**Componentes:** [ENGINE] [VIEW] [CONFIG]  
**Estado:** ⚠️ **En revisión** 

**NOTA IMPORTANTE:** Debemos analizar si esto da valor, ya que puede ser redundante tener dos o más sistemas de prioridad que actúen a la vez.

**Ejemplos de ANTI-PATTERNS a evitar:**
```markdown
❌ TODO P1 URGENTE cocinar huevos  (NO TIENE SENTIDO)
❌ TODO [P1] [#A] Tarea compleja   (Confuso, ¿cuál tiene precedencia?)

✅ TODO [P1] Tarea crítica          (Un sistema de prioridad)
✅ TODO [URGENTE] Tarea crítica     (Un sistema de prioridad)
```

**RECOMENDACIÓN:** Usar UN SOLO sistema de prioridad. Opciones:
- Técnica: P1, P2, P3 (enfoque ágil)
- Empresarial: ALTA, MEDIA, BAJA (enfoque ejecutivo)
- Impacto: CRÍTICO, IMPORTANTE, NORMAL (enfoque por impacto)

**Decisión pendiente:** ¿Implementamos multi-cola o recomendamos single-system?

**Historia original:**
Como usuario con diferentes tipos de urgencia (impacto vs. esfuerzo), quiero usar múltiples sistemas de prioridad simultáneos (ej: `[P1]` y `[#A]`), para clasificar mis items según diferentes dimensiones.

**Criterios de Aceptación (si decidimos mantener multi-cola):**
- ✅ Configuración de múltiples grupos de prioridad independientes (`priorityQueues`)
- ✅ Tokens personalizables por grupo (ej: P1/P2/P3, #A/#B/#C, URGENT/NORMAL/LOW)
- ✅ Detección del **primer token encontrado** en el texto del item
- ✅ Badge visual en el panel con color según nivel
- ✅ Click en badge cicla al siguiente en su grupo
- ✅ Click derecho abre menú con todos los grupos

**Respuesta sobre detección:**
**Sí, si un item tiene múltiples tokens, se toma el primero encontrado.**

Ejemplo:
```markdown
TODO [P1] Tarea urgente [#C] con múltiples prioridades
```
- Se detecta: `P1` (primer match)
- Se ignora: `#C`

Lógica:
- Regex busca todos los tokens aplanados de `priorityQueues`
- Se ordenan por longitud descendente para evitar matches parciales (P12 antes que P1)
- Se aplica al primer match encontrado (líneas 308-330 en `task-parser.ts`)

**NOTA SOBRE FORMATO:** Preferimos NO usar:
- Símbolo `#` (confunde con hashtags de Markdown y Obsidian)
- Brackets `[]` (confunde con enlaces y sintaxis Markdown)

**Formatos recomendados:**
- Palabras: `ALTA`, `MEDIA`, `BAJA`
- Números: `P1`, `P2`, `P3`
- Romanos: `I`, `II`, `III`

**Implementación actual:**
- ✅ Método `extractPriority()` en `task-parser.ts`
- ✅ Settings `priorityQueues: string[][]` (array de arrays)
- ✅ Menú contextual en `openPriorityMenuAtMouseEvent()`
- ✅ Ciclo dentro del grupo con `getNextPriority()`

**Archivos relacionados:**
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Extracción)
- [src/services/workflow-service.ts](../../src/services/workflow-service.ts) (Ciclo de prioridades)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (Badge visual)
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Definición de `priorityQueues`)

---

## US-4.3: Indicadores visuales de vencimiento

**Componentes:** [VIEW]  
**Estado:** 🟡 Parcial (Lógica implementada, umbrales hardcodeados)

**Historia:**
Como usuario con deadlines, quiero ver claramente qué items están vencidos o próximos a vencer, para priorizar sin tener que calcular fechas manualmente.

**Criterios de Aceptación:**
- ✅ Items vencidos muestran clase CSS `todo-date-overdue` (visual rojo)
- ✅ Items para hoy muestran clase `todo-date-today`
- ✅ Deadlines tienen clase adicional `todo-date-deadline` (más destacado)
- ✅ Fechas futuras muestran color neutro
- ❌ Configuración de umbrales de advertencia (actualmente hardcodeado a "hoy")
- ❌ Indicador naranja para "próximos 3 días" (no implementado)

**Implementación actual:**
- ✅ Método `getDateStatusClasses()` en `task-view.tsx`
- ✅ Calcula diferencia en días entre fecha actual y fecha del item
- ✅ Retorna array de clases CSS aplicables
- ⚠️ Umbrales fijos (no configurables desde settings)

**Mejoras propuestas:**
- Añadir setting `warningThresholdDays` (default: 3)
- Implementar clase `todo-date-soon` para próximos N días
- Color coding configurable (actualmente depende de CSS del tema)

**Archivos relacionados:**
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Método `getDateStatusClasses()`)
- [src/ui/view/TaskItem.tsx](../../src/ui/view/TaskItem.tsx) (Aplicación de clases)
- [styles.css](../../styles.css) (Definición de colores)

---

## Resumen de Épica 4

| US | Descripción | Estado |
|----|-------------|--------|
| US-4.1 | Fechas programadas y límites | 🟡 |
| US-4.2 | Prioridades multi-cola | ⚠️ |
| US-4.3 | Indicadores vencimiento | 🟡 |

**Cobertura de componentes:**
- **[ENGINE]** - 2/3 implementadas
- **[VIEW]** - 2/3 parcialmente
- **[CONFIG]** - 1/3 parcialmente

**Acciones requeridas:**
1. CRÍTICO: Decidir sobre multi-cola en US-4.2 (¿mantener o recomendar single-system?)
2. Resolver regla de "misma línea vs. línea siguiente" para fechas (US-4.1)
3. Implementar umbrales configurables en US-4.3
4. Añadir validación de fechas inválidas
