# Épica 6: Personalización del Sistema

**Descripción:** Cómo los usuarios pueden personalizar la apariencia, funcionalidad y comportamiento del plugin.

**Componentes principales:** [CONFIG] [VIEW] [ENGINE]  
**Prioridad:** Should Have / Could Have

---

## US-6.1: Editor visual de vocabulario

**Componentes:** [CONFIG]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario no técnico, quiero añadir/editar keywords y colores desde una interfaz gráfica, para personalizar el sistema sin tocar JSON o archivos de configuración.

**Criterios de Aceptación:**
- ✅ UI con 3 columnas (Start/InProgress/Finished)
- ✅ Botones +/- para añadir/eliminar keywords
- ✅ Modal de edición avanzada (color picker RGB + presets)
- ✅ Campo de descripción/tooltip para cada keyword
- ⚠️ Reordenamiento drag-and-drop (no implementado - limitación de Obsidian Settings API)
- ✅ Preview en vivo de colores en la lista
- ✅ Validación: no permite keywords duplicados

**NOTA sobre drag-and-drop:**
No es necesario en Obsidian, pero sí puede ser muy atractivo para otros entornos. Debemos mantenerlo como idea para futuras implementaciones en diferentes entornos (apps, webapp, etc.).

**Implementación actual:**
- ✅ Componente `VocabularySection.tsx` con layout de 3 columnas
- ✅ `KeywordModal` para edición avanzada (color + descripción)
- ✅ Color picker con presets comunes y selector RGB
- ✅ Persistencia automática al cerrar modal
- ✅ Sincronización con workflows (ver US-3.5)

**Limitaciones conocidas:**
- ❌ Drag-and-drop no soportado por API nativa de Obsidian Settings
- Workaround: botones ↑/↓ para reordenar (considerado para futuro)

**Archivos relacionados:**
- [src/ui/settings/VocabularySection.tsx](../../src/ui/settings/VocabularySection.tsx) (UI principal)
- [src/settings/keyword-modal.ts](../../src/settings/keyword-modal.ts) (Modal de edición)
- [src/settings/settings.ts](../../src/settings/settings.ts) (Controlador de settings)

---

## US-6.2: Constructor visual de flujos

**Componentes:** [CONFIG]  
**Estado:** 🟢 Implementado

**Historia:**
Como usuario configurando workflows, quiero ver una representación visual de mis flujos (START → STEP1 → STEP2 → END), para entender y validar la lógica sin leer código.

**Criterios de Aceptación:**
- ✅ Tarjetas de flujo (una por cada keyword "Start")
- ✅ Nodos visualmente conectados: [START] → [ACTIVE...] → [END]
- ✅ Dropdowns filtrados (solo muestran estados válidos por categoría)
- ✅ Botón + ADD para insertar paso intermedio
- ✅ Botón 🗑️ (trash) para eliminar paso intermedio
- ✅ Summary en texto plano: `flow: START → ... → END → [RETURN]`
- ✅ Sincronización automática con vocabulario (ver US-3.5)
- ✅ Validación jerárquica (ver US-3.3)

**Implementación actual:**
- ✅ Componente `WorkflowsSection.tsx` con tarjetas de flujo
- ✅ Utilidades en `workflow-utils.ts` para validación
- ✅ Dropdowns dinámicos filtrados por categoría de keyword
- ✅ Lógica de herencia y bloqueo de pasos forzados
- ✅ Resumen visual del flujo completo con retorno

**Archivos relacionados:**
- [src/ui/settings/WorkflowsSection.tsx](../../src/ui/settings/WorkflowsSection.tsx) (UI de workflows)
- [src/ui/settings/workflow-utils.ts](../../src/ui/settings/workflow-utils.ts) (Validación y utilidades)

---

## US-6.3: Intervalo de actualización configurable

**Componentes:** [CONFIG] [ENGINE]  
**Estado:** 🟡 Parcial (Slider implementado, modo Manual no)

**Historia:**
Como usuario preocupado por el rendimiento, quiero ajustar cada cuántos segundos se escanea la bóveda, para balancear responsividad con consumo de recursos.

**Criterios de Aceptación:**
- ✅ Slider en configuración (10s - 300s)
- ✅ Guardado automático de la preferencia
- ✅ Tooltip explicando impacto en rendimiento
- ❌ Opción "Manual" (solo actualiza con comando)

**Requiere fix:** Slider no visible (ver US-6.3 en roadmap v1.1)

**Respuesta sobre modo Manual:**

Modo Manual significaría:
- Desactivar escaneo automático periódico
- Usuario debe ejecutar comando manualmente (ej: "Refresh Todo List") para actualizar
- Útil para bóvedas muy grandes (>5000 archivos) donde escaneo continuo impacta rendimiento
- También útil para usuarios que prefieren control total sobre cuándo actualizar

**¿Es necesario?**
- ⚠️ Requiere validación con usuarios de bóvedas grandes
- ⚠️ Alternativa: detectar automáticamente tamaño de bóveda y ajustar intervalo
- ⚠️ Puede crear confusión (¿por qué no se actualiza?)
- ✅ Sí útil para power users con necesidades específicas

**Implementación propuesta (si se decide implementar):**
- Toggle "Auto-refresh" (On/Off)
- Si Off: mostrar botón "Refresh Now" en toolbar del panel
- Comando de teclado: "Todo Inline: Refresh"

**Implementación actual:**
- ✅ Setting `refreshInterval` (default: 60s)
- ✅ Intervalo configurable en settings
- ❌ No hay opción para desactivar completamente

**Archivos relacionados:**
- [src/settings/defaults.ts](../../src/settings/defaults.ts) (Setting `refreshInterval`)
- [src/main.ts](../../src/main.ts) (Lógica de polling)

---

## US-6.4: Temas y estilos visuales

**Componentes:** [VIEW] [EDITOR] [CONFIG]  
**Estado:** 🟡 Parcial (Implementado básico, necesita refinamiento)

**Historia:**
Como usuario con preferencias estéticas, quiero que el plugin respete los colores de mi tema de Obsidian, para mantener coherencia visual en mi workspace.

**Criterios de Aceptación:**
- ✅ CSS usa variables de tema de Obsidian (`--text-normal`, `--background-primary`, etc.)
- ⚠️ Los colores de keywords son personalizables pero no siempre respetan contraste
- ✅ Modo oscuro/claro se adaptan automáticamente (variables CSS nativas)
- ❌ Validación de contraste mínimo (WCAG AA) al elegir colores
- ❌ Preview en settings con tema activo del usuario

**Investigación requerida:**

**1. Variables CSS de Obsidian:**
```css
/* Principales variables disponibles */
--text-normal
--text-muted
--text-faint
--background-primary
--background-secondary
--interactive-accent
--interactive-hover
```

**2. Problema de contraste:**
- Usuario puede elegir color amarillo claro en tema oscuro (ilegible)
- Solución: Calcular luminosidad y forzar mínimo contraste
- Implementar función `ensureContrast(color, background)` que ajusta automáticamente

**3. Implementación propuesta:**
```typescript
// En keyword-modal.ts
function validateColorContrast(color: string, bgColor: string): boolean {
  const contrast = calculateContrast(color, bgColor);
  return contrast >= 4.5; // WCAG AA standard
}
```

**4. Preview en settings:**
- Mostrar keywords con colores elegidos sobre fondo del tema actual
- Warning visual si contraste < 4.5

**Implementación actual:**
- ✅ `styles.css` usa variables CSS de Obsidian
- ✅ Método `getContrastColor()` básico (solo blanco/negro)
- ❌ No valida contraste al guardar color en settings

**Archivos relacionados:**
- [styles.css](../../styles.css) (Variables CSS)
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Función `getContrastColor()`)
- [src/settings/keyword-modal.ts](../../src/settings/keyword-modal.ts) (Selector de color)

**Acción requerida:**
- Implementar validación de contraste WCAG AA
- Añadir preview en modal de edición
- Documentar recomendaciones de colores por tema

---

## Resumen de Épica 6

| US | Descripción | Estado |
|----|-------------|--------|
| US-6.1 | Editor visual vocabulario | 🟢 |
| US-6.2 | Constructor visual flujos | 🟢 |
| US-6.3 | Intervalo actualización | 🟡 |
| US-6.4 | Temas y estilos | 🟡 |

**Cobertura de componentes:**
- **[CONFIG]** - 4/4 implementadas (2 completas, 2 parciales)
- **[VIEW]** - 2/4 utilizadas
- **[ENGINE]** - 1/4 utilizado

**Acciones requeridas:**
1. Auditar por qué slider en US-6.3 no es visible
2. Implementar modo Manual en US-6.3 (considerado para v1.2)
3. Implementar validación de contraste WCAG AA en US-6.4
4. Considerar drag-and-drop para otras plataformas (futuro)
