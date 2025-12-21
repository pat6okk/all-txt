# Épica 8: Integración con Ecosistema

**Descripción:** Cómo el plugin se integra con otros plugins, sistemas y plataformas.

**Componentes principales:** [MULTI]  
**Prioridad:** Could Have / Won't Have (futuro)

---

## US-8.1: Compatibilidad con plugins populares

**Componentes:** [ENGINE] [EDITOR]  
**Estado:** 🟡 Parcial (No testeado exhaustivamente)

**Historia:**
Como usuario de Dataview, Tasks u otros plugins, quiero que ALL.txt coexista sin conflictos, para combinar funcionalidades sin errores.

**Criterios de Aceptación:**
- ⚠️ No interfiere con sintaxis de Dataview (`TASK`, `DUE`) - necesita testing
- ⚠️ No sobrescribe atajos de teclado de otros plugins - necesita validación
- ❌ Documentación de posibles conflictos conocidos
- ❌ Testing de integración con plugins top 10 más populares

**Plugins prioritarios para testing:**
1. **Dataview** - Query language para notas
2. **Tasks** - Gestor de tareas avanzado
3. **Calendar** - Vista de calendario
4. **Templater** - Sistema de templates
5. **Kanban** - Boards estilo Trello

**Conflictos potenciales conocidos:**
- Si usuario tiene keyword `TASK` y usa Dataview, puede haber confusión
- Resaltado en editor puede conflictuar con syntax highlighting de otros plugins
- Hotkeys si se implementan en el futuro

**Plan de testing:**
- Crear bóveda de prueba con plugins populares instalados
- Documentar interacciones y conflictos encontrados
- Crear FAQ con workarounds

**Archivos relacionados:**
- [README.md](../../README.md) (Sección "Compatibilidad" - a crear)
- [src/editor/keyword-highlighter.ts](../../src/editor/keyword-highlighter.ts) (Posible conflicto con otros highlighters)

---

## US-8.2: Exportación a formatos estándar

**Componentes:** [VIEW] [ENGINE]  
**Estado:** 🔵 Futuro (Requiere rediseño de criterios)

**NOTA:** Esta característica no es prioritaria y está planificada para v2.0.

**Historia original:**
Como usuario que necesita analizar datos o integrar con herramientas externas, quiero exportar mi lista de items rastreados a formatos estructurados (CSV, JSON, Markdown), para procesarlos con scripts, hojas de cálculo o sistemas externos.

**Casos de uso reales a validar:**
1. **Reportes de sprint**: Exportar items completados de la última semana
2. **Migración de datos**: Mover tareas a otro sistema (Notion, Todoist)
3. **Análisis cuantitativo**: Calcular estadísticas (tiempo promedio en cada estado)
4. **Backup estructurado**: Guardar snapshot de estado actual

**Criterios de Aceptación (Rediseñados para v2.0):**
- ❌ Comando "Export Current View" (respeta filtros/ordenamiento actuales)
- ❌ Formatos: CSV, JSON, Markdown table
- ❌ Selección de campos a exportar (estado, prioridad, fechas, archivo, línea)
- ❌ Opciones de formato CSV (delimitador, encoding)
- ❌ JSON con estructura anidada opcional (agrupar por archivo/estado)
- ❌ Exportación automática periódica (snapshot diario/semanal)

**Ejemplo de output deseado:**

Ver especificación completa en issue correspondiente cuando se implemente v2.0.

**Implementación propuesta:** Ver issue de v2.0 para detalles.

**Archivos relacionados:**
- *(No implementado aún)*
- Futuro: [src/services/export-service.ts](../../src/services/export-service.ts) (a crear)

---

## US-8.3: API para integración con IA

**Componentes:** [ENGINE] [MULTI]  
**Estado:** 🔵 Futuro (Visionário - Requiere diseño completo)

**NOTA:** Esta es una funcionalidad visión futura. Requiere investigación y diseño completo.

**Historia original:**
Como usuario de asistentes IA (ChatGPT, Claude), quiero que mi asistente pueda leer/escribir keywords automáticamente en mis notas, para automatizar capturas desde transcripciones o análisis de contenido.

**Casos de uso:** Extracción de transcripciones, análisis de progreso, sugerencias contextuales.  
**Ver roadmap v2.0+ para especificación completa.**

**Criterios de Aceptación (v2.0+):**
- Read API: `list_tasks(filters)` retorna JSON
- Write API: `add_task()`, `update_task()`
- Smart Suggestions: `suggest_keywords(text)`

**Ver roadmap v2.0+ para arquitectura y seguridad.**

**Archivos relacionados:** Ver repositorio separado en v2.0+ (MCP server)

---

## US-8.4: Sincronización móvil (Obsidian Mobile)

**Componentes:** [VIEW] [EDITOR] [CONFIG]  
**Estado:** ⚠️ En revisión (No testeado exhaustivamente en móvil)

**Historia:**
Como usuario de Obsidian en móvil, quiero que el plugin funcione con las mismas capacidades, para revisar y actualizar estados desde cualquier dispositivo.

**Criterios de Aceptación:**
- ⚠️ Panel accesible en móvil (necesita testing en iOS/Android)
- ⚠️ Interacción táctil funcional (tap para cambiar estado, long-press para menú)
- ✅ Sincronización automática con versión desktop (Markdown es portable)
- ❌ UI adaptada a pantallas pequeñas (botones más grandes, menos columnas)
- ❌ Resaltado en editor móvil (depende de CodeMirror móvil)

**Consideraciones específicas móvil:**

**1. Performance:**
- Dispositivos móviles tienen menos RAM
- Escaneo de bóveda debe ser más conservador
- Considerar deshabilitar resaltado en tiempo real en móvil

**2. UI/UX:**
- Panel lateral puede ser difícil de usar en pantalla pequeña
- Considerar modo "fullscreen" para el panel en móvil
- Gestos: swipe para cambiar estado, long-press para menú

**3. Testing requerido:**
- iOS (iPhone, iPad)
- Android (teléfonos, tablets)
- Diferentes tamaños de pantalla

**Implementación actual:**
- ⚠️ Plugin compilado es compatible con Obsidian Mobile
- ⚠️ No hay adaptaciones específicas para móvil
- ⚠️ UI puede ser difícil de usar en pantallas pequeñas

**Acción requerida:**
- Testing exhaustivo en dispositivos reales
- Documentar limitaciones conocidas
- Considerar toggle "Mobile Mode" con UI simplificada

**Archivos relacionados:**
- [manifest.json](../../manifest.json) (Flag `isDesktopOnly: false`)
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (UI que necesita adaptación)
- [styles.css](../../styles.css) (Media queries para móvil)

---

## Resumen de Épica 8

| US | Descripción | Estado | Versión |
|----|-------------|--------|---------|
| US-8.1 | Compatibilidad plugins | 🟡 | v1.x |
| US-8.2 | Exportación | 🔵 | v2.0 |
| US-8.3 | API para IA | 🔵 | v2.0+ |
| US-8.4 | Sincronización móvil | ⚠️ | v1.x |

**Cobertura de componentes:**
- **[ENGINE]** - 2/4 utilizadas
- **[VIEW]** - 2/4 utilizadas
- **[CONFIG]** - 1/4 utilizado
- **[FUTURO]** - 2/4 visión futura

**Acciones requeridas:**
1. Crear matriz de testing para US-8.1 (plugins populares)
2. Documentar conflictos conocidos en FAQ
3. Planificar roadmap de IA (US-8.3) para v2.0
4. Testing móvil exhaustivo para US-8.4 (próximo sprint)
5. Evaluar Exportación (US-8.2) feedback usuario
