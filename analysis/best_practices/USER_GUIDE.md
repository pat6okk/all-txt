# Mejores Prácticas para Usuarios de FLOW.txt

**Guía para configurar y usar el plugin de manera óptima.**

---

## 1. Sistemas de Prioridad

### ❌ Errores Comunes

```markdown
❌ TODO [P1] URGENTE cocinar huevos
   └─ Dos sistemas de prioridad activos → confuso

❌ TODO [P1] [#A] Tarea importante
   └─ Múltiples tokens → ¿cuál tiene precedencia?

❌ TODO [ALTA] P1 Tarea crítica
   └─ Mixed formats → inconsistente
```

### ✅ Recomendado: UN Sistema

Elige **uno solo** basado en tu dominio:

#### Opción A: Números (P1-P3)
```markdown
TODO P1 Revisar código    → Crítico, hacer hoy
TODO P2 Mejorar UI        → Importante, esta semana
TODO P3 Documentar        → Nice-to-have, próximo mes
```
**Ventajas:** Estándar de industria, conciso, usado en Jira/Linear

#### Opción B: Palabras (ALTA, MEDIA, BAJA)
```markdown
TODO ALTA Propuesta cliente    → Urgente
TODO MEDIA Fix en dashboard    → Importante
TODO BAJA Limpiar código       → Puede esperar
```
**Ventajas:** Lenguaje natural, fácil para no-técnicos

### Configurar en FLOW.txt

1. **Settings** → FLOW.txt → Vocabulary → "In-Progress"
2. **Añade tu sistema:** `P1`, `P2`, `P3` O `ALTA`, `MEDIA`, `BAJA`
3. **Asigna colores:** Rojo (urgente) → Amarillo (medio) → Verde (bajo)
4. **Nunca mezcles** en una misma linea.

---

## 2. Diseño de Keywords

### Keywords Recomendados (Start Estados)

```markdown
# Roles técnicos (desarrollo)
TODO       → Pendiente de empezar
REVIEW     → Esperando revisión
APPROVED   → Aprobado, listo para deploy
BLOCKED    → Bloqueado por dependencia

# Roles de producto (PM/BA)
BACKLOG    → En backlog, no comenzado
PRIORITY   → Priorizado para próximo sprint
READY      → Listo para que dev comiencen
SHIPPED    → Enviado a producción
```

### Keywords a EVITAR

```markdown
❌ ASK       → Usar QUESTION mejor (ASK = verbo confuso)
❌ TASK      → Conflictúa con plugin "Tasks"
❌ REVIEW    → Conflictúa con Obsidian comments nativo
❌ NOTE      → Muy genérico, no dice estado
❌ DOING     → Mejor ser específico (CODING, WRITING)
```

### Estructura Recomendada

```markdown
Start (Pendientes):
  TODO          - Por hacer en general
  QUESTION      - Pregunta a responder
  DISCUSSION    - Tema a discutir

In-Progress (Activos):
  DOING         - Actualmente en progreso
  REVIEW        - Esperando revisión
  BLOCKED       - Depende de otro item

Finished (Completados):
  DONE          - Completado correctamente
  ABANDONED     - Decidimos no hacerlo
  DUPLICATE     - Duplicado de otro item
```

---

## 3. Estructura de Metadatos

### Fechas - Formato Recomendado

```markdown
# ✅ RECOMENDADO: Línea siguiente (más legible)
TODO Completar propuesta
SCHEDULED: 2025-12-20
DEADLINE: 2025-12-25

# ❌ NO RECOMENDADO: Misma línea (menos legible, especialmente móvil)
TODO Completar propuesta SCHEDULED: 2025-12-20 DEADLINE: 2025-12-25
```

**Razones:**
- Mejor legibilidad (metadata separada)
- Más fácil de parsear (sin regex complejo)
- Compatible con otros plugins (Tasks, Dataview)

### Prioridades - Formato Recomendado

```markdown
# ✅ Coloca la prioridad DESPUÉS del keyword, ANTES del texto
TODO P1 Revisar código de seguridad

# ❌ EVITA estos formatos
❌ P1 TODO Revisar código           (incorrecto)
❌ TODO Revisar código P1           (difícil de leer)
❌ TODO P1 URGENTE Revisar código (dos sistemas)
```

---

## 4. Workflows - Casos de Uso

### Desarrollo de Software
```markdown
TODO → REVIEW → APPROVED → DONE

- TODO Implementar login
→ REVIEW (enviado a code review)
→ APPROVED (aprobado por equipo)
→ DONE (mergeado a main)
```

### Publicación de Contenido
```markdown
IDEA → DRAFT → EDIT → PUBLISH → DONE

- IDEA Blog post sobre ML
→ DRAFT (primer borrador)
→ EDIT (revisado por editor)
→ PUBLISH (publicado)
→ DONE (promocionado)
```

---

## 5. Performance - Bóvedas Grandes

### ¿Cuándo empieza a lag?

| Tamaño | Síntoma | Solución |
|--------|---------|----------|
| < 500 archivos | Rápido | Configuración default OK |
| 500-2000 archivos | Lag ocasional | Aumentar `refreshInterval` a 120s |
| 2000-5000 archivos | Lag notable | Usar 180-300s + filtro "active file" |
| > 5000 archivos | Lag severo | Considerar dividir bóveda o modo "Manual" (v1.2) |

### Optimizaciones

#### 1. Aumentar Intervalo de Refresh
**Settings** → Refresh Interval → aumentar de 60s a 120s o más
- Menos escaneos = menos CPU
- Trade-off: Items se actualizan más lentamente

#### 2. Usar Filtro "Active File"
**En Todo Inline panel** → Click toggle "Active File"
- Muestra solo items del archivo actual
- Mucho más rápido
- Ideal para trabajo enfocado

#### 3. Excluir Carpetas de Escaneo
Edit `settings.json` manualmente:
```json
{
  "excludePaths": [
    "node_modules/",
    "archive/",
    "drafts/broken/"
  ]
}
```
(Feature a implementar en v1.2)

#### 4. Limitar por Archivo
Evita tener archivos > 5000 líneas:
```markdown
❌ all-notes.md (15000 líneas)
   └─ Muy lento

✅ notes-2025.md (2000 líneas)
   ✅ notes-2024.md (2000 líneas)
   └─ Más rápido
```

---

## 6. Uso en Equipos

### Recomendación: Standarizar Vocabulario

Crea un documento compartido en tu bóveda (ej: `Standards/FLOW.txt.md`):

```markdown
# FLOW.txt Vocabulary Standard

## Keywords Permitidos

### Start Estado (TODO)
- TODO: Tarea pendiente general
- QUESTION: Pregunta a responder
- DISCUSSION: Tema a discutir en reunión

### In-Progress (DOING)
- DOING: Actualmente en curso
- REVIEW: Esperando revisión
- BLOCKED: Depende de otro item

### Finished (DONE)
- DONE: Completado
- ABANDONED: Decisión de no hacerlo
- DUPLICATE: Duplicado (referencia a otro)

## Prioridades (En In-Progress)
- P1: Crítico, hacer hoy
- P2: Importante, esta semana
- P3: Nice-to-have, próximo mes

## Ejemplos

✅ Correcto:
- TODO P1 Revisar seguridad
  DEADLINE: 2025-12-20

❌ Incorrecto:
- TODO URGENT Revisar seguridad (doble prioridad)
- REVIEW P1 P2 Revisar (ambiguo)
```

### Sincronización

Como archivos son plain Markdown:
1. ✅ Git/sync funciona perfectamente
2. ✅ Editable en cualquier editor
3. ✅ Portable entre dispositivos
4. ✅ Versionable y auditale

---

## 7. Troubleshooting

### Problema: Items no aparecen en panel

**Checklist:**
1. ¿Está el panel visible? (Ribbon icon → Todo Inline)
2. ¿El keyword está en la configuración? (Settings → Vocabulary)
3. ¿El keyword está exactamente después del prefijo?
   ```markdown
   ✅ - TODO tarea
   ❌ - Revisar TODO tarea  (TODO no está al inicio)
   ```
4. ¿El archivo está excluido? (Busca en settings)

### Problema: Colores muy oscuros (ilegibles)

**Solución:**
1. Settings → Vocabulary
2. Click en keyword
3. Choose color → color más claro
4. Recomendación: Validar contraste (v1.2)

### Problema: Lag en editor

**Checklist:**
1. Aumentar `refreshInterval` (Settings)
2. Usar filtro "Active File"
3. Si archivo > 5000 líneas, considerar dividir
4. Desactivar highlighter si muy lento

---

## 8. Migración desde "Tasks" Plugin

```markdown
# Tasks format
- [ ] Fix bug #234
  due: 2025-12-20

# FLOW.txt format
TODO Fix bug #234
DEADLINE: 2025-12-20
```

**Ventajas:** Workflows personalizables, prioridades, sintaxis más limpia.

---

**Última actualización:** 20 de diciembre, 2025  
**Contribuciones:** Bienvenidas (abre issue)
