# Épica 8: Rendimiento y Experiencia

**Descripción:** Cómo optimizar el plugin para bóvedas grandes, garantizar velocidad y consumo de memoria controlado.

**Componentes principales:** [ENGINE] [VIEW]  
**Prioridad:** Could Have / CRÍTICO (US-8.3)

---

## US-8.1: Carga inicial rápida

**Componentes:** [ENGINE]  
**Estado:** 🟡 Parcial (Funciona pero no optimizado para bóvedas grandes)

**Historia:**
Como usuario con bóvedas grandes (>1000 archivos), quiero que el plugin cargue sin bloquear Obsidian al inicio, para no afectar mi experiencia de uso general.

**Criterios de Aceptación:**
- ⚠️ Carga inicial < 2 segundos en bóveda promedio (300 archivos) - necesita benchmark
- ❌ Parsing en segundo plano (actualmente bloquea hilo principal)
- ❌ Indicador de progreso si tarda > 5 segundos
- ❌ Carga incremental (escanear primero archivos abiertos/recientes)

**Implementación actual:**
- ⚠️ Escaneo completo de bóveda al iniciar plugin
- ⚠️ Todo en hilo principal (puede causar freeze)
- ❌ No hay feedback visual durante carga

**Mejoras propuestas:**
- Usar Web Workers para parsing (no disponible en Obsidian)
- Alternativa: parsing asíncrono con `requestIdleCallback`
- Implementar carga lazy: escanear solo archivos visibles/recientes primero
- Progress bar en status bar durante escaneo inicial

**Estrategia de indexación progresiva:** Planificada para v1.2 (ver roadmap)

**Archivos relacionados:**
- [src/main.ts](../../src/main.ts) (Inicialización del plugin)
- [src/services/task-store.ts](../../src/services/task-store.ts) (Escaneo de bóveda)

---

## US-8.2: Actualización incremental

**Componentes:** [ENGINE]  
**Estado:** 🟡 Parcial (Detecta cambios pero re-escanea archivo completo)

**Historia:**
Como usuario editando una nota, quiero que solo se re-escanee el archivo modificado (no toda la bóveda), para mantener el panel actualizado sin lag.

**Criterios de Aceptación:**
- ✅ Detección de cambios por archivo (eventos de Obsidian)
- ⚠️ Re-parsing selectivo (actualmente re-parsea archivo completo, no toda la bóveda)
- ⚠️ Actualización del panel < 100ms tras editar (necesita benchmark en archivos grandes)
- ✅ No bloquea escritura mientras actualiza

**Implementación actual:**
- ✅ Eventos `file-changed` de Obsidian registrados
- ✅ Solo re-parsea archivo modificado (no toda la bóveda)
- ⚠️ En archivos muy grandes (>5000 líneas) puede haber lag perceptible

**Mejoras propuestas:**
- Parsing incremental: solo re-parsear líneas modificadas (difícil de implementar)
- Debouncing: esperar 500ms de inactividad antes de re-parsear
- Cache de resultados de parsing por archivo + invalidación selectiva

**Archivos relacionados:**
- [src/main.ts](../../src/main.ts) (Registro de eventos de archivo)
- [src/parser/task-parser.ts](../../src/parser/task-parser.ts) (Método `parseFile()`)
- [src/services/task-store.ts](../../src/services/task-store.ts) (Gestión de cache)

---

## US-8.3: Optimización de memoria

**Componentes:** [ENGINE] [VIEW]  
**Estado:** ⚠️ En revisión (Implementado básico, requiere auditoría exhaustiva)

**🚨 PRIORIDAD CRÍTICA - Este US requiere atención inmediata 🚨**

**Historia:**
Como usuario con Obsidian abierto todo el día, quiero que el plugin no acumule memoria innecesariamente, para evitar reiniciar Obsidian por consumo excesivo.

**Criterios de Aceptación:**
- ✅ Limpieza de listeners al descargar plugin (`this.registerEvent`)
- ⚠️ Cache de resultados con tamaño máximo (no implementado)
- ⚠️ Garbage collection de items eliminados (necesita validación)
- ❌ Auditoría de memory leaks con Chrome DevTools

**⚠️ IMPORTANTES - Posibles memory leaks:**

Memory leaks pueden ocurrir en:
1. **Event listeners no limpiados** (al recargar plugin)
2. **Referencias cíclicas** (closures capturando objetos grandes)
3. **Cache sin límite** (crece indefinidamente)
4. **React components** (no desmontados correctamente)

**⚠️ Plan de auditoría:**

1. **Auditoría manual** - Revisar event listeners y React cleanup
2. **Testing con DevTools** - Heap snapshots antes/después de cargar/descargar plugin
3. **Mitigaciones** - Cache LRU con límite, WeakMap, cleanup explícito

**Ver roadmap v1.1 para detalles completos.**

**Implementación actual:**
- ✅ `this.registerEvent()` usado para eventos de Obsidian
- ✅ React root limpiado en `onClose()` (`task-view.tsx` línea 86-89)
- ⚠️ TaskStore mantiene array completo de tasks (puede crecer indefinidamente)
- ❌ No hay límite de cache ni LRU

**Acciones inmediatas requeridas:**
1. Programar auditoría de memory leak (máximo esta semana)
2. Añadir test de memory leak en suite de tests
3. Implementar métrica de conteo de items en memoria
4. Añadir setting `maxCachedTasks` (default: 5000)
5. Logging de memoria usada en developer console

**Archivos relacionados:**
- [src/main.ts](../../src/main.ts) (Método `onunload()` - revisar limpieza)
- [src/services/task-store.ts](../../src/services/task-store.ts) (Cache de tasks - implementar LRU)
- [src/view/task-view.tsx](../../src/view/task-view.tsx) (Limpieza de React root)

---

## Resumen de Épica 8

| US | Descripción | Estado | Prioridad |
|----|-------------|--------|-----------|
| US-8.1 | Carga inicial rápida | 🟡 | Could Have |
| US-8.2 | Actualización incremental | 🟡 | Could Have |
| US-8.3 | Optimización memoria | ⚠️ | 🚨 CRÍTICO |

**Cobertura de componentes:**
- **[ENGINE]** - 2/3 parcialmente implementadas
- **[VIEW]** - 1/3 utilizado

**Acciones requeridas (por prioridad):**
1. **INMEDIATA (Esta semana):** Auditoría de memory leaks (US-8.3)
2. **PRÓXIMA SPRINT (v1.1):** Implementar fixes de memory
3. **v1.2:** Carga progresiva (4 fases) en US-8.1
4. **v1.2:** Parsing incremental en US-8.2

**Criterios de Aceptación Revisados para v1.1:**
- Auditoría completada sin memory leaks detectados
- Test automatizado de memory leak incluido en suite
- Documentación de "Known Limitations" en README
- Recomendaciones para bóvedas >5000 archivos
