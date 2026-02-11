# Diagnóstico v0 - Sistema de Prompting

**Fecha:** 2026-02-10  
**Objetivo:** identificar contradicciones entre instrucciones de agente y su ejecución operativa.  
**Estado del análisis:** parcial, no exhaustivo.

## Hallazgos

| ID | Severidad | Hallazgo | Evidencia | Tratamiento propuesto |
|---|---|---|---|---|
| PRM-001 | Resuelto | Riesgo original mitigado: reglas de release ya sincronizadas en el derivado `always_on`. | `AGENTS.md:82`, `.agent/rules/obsidian-expert.md:88`, `.github/workflows/agent-instructions-sync-check.yml:1` | Mantener verificación `sync:agents:check` en CI y bloquear drift en PR.
| PRM-002 | Resuelto | Riesgo original mitigado: `AGENTS.md` quedó como fuente canónica y los archivos especializados se sincronizan automáticamente. | `AGENTS.md:58`, `scripts/sync-agent-instructions.mjs:1`, `.github/copilot-instructions.md:1`, `.agent/rules/obsidian-expert.md:1`, `.github/workflows/agent-instructions-sync-check.yml:1` | Mantener edición solo en canónico y exigir `sync:agents:check` en CI para bloquear deriva.
| PRM-003 | Resuelto | Riesgo original mitigado: la skill local ahora trata `styles.css` como obligatorio para este repositorio. | `.agents/skills/obsidian/reference/submission.md:11`, `.agents/skills/obsidian/reference/submission.md:17`, `.github/workflows/release.yml:59` | Mantener nota de override del repo en la skill local y revisar cuando cambie el pipeline de release.
| PRM-004 | Resuelto | Riesgo original mitigado: referencia a `tools/create-plugin.js` quedó explícitamente marcada como externa y condicional a existencia local. | `.agents/skills/obsidian/SKILL.md:16`, `.agents/skills/obsidian/SKILL.md:23` | Mantener la regla de verificación de existencia local antes de sugerir ejecución.
| PRM-005 | Resuelto | Riesgo original mitigado: release ahora exige tags desde `main` con validación en workflow y documentación alineada. | `.github/workflows/release.yml:20`, `.github/workflows/release.yml:31`, `.github/RELEASE_PROCESS.md:90` | Mantener check de ancestry a `origin/main` como gate obligatorio de release.
| PRM-006 | Resuelto | Riesgo original mitigado: precedencia formal definida y propagada a derivados. | `AGENTS.md:58`, `AGENTS.md:66`, `.github/copilot-instructions.md:60`, `.agent/rules/obsidian-expert.md:64` | Mantener precedencia solo en canónico y regenerar derivados al cambiar reglas.
| PRM-007 | Resuelto | Riesgo original mitigado: política de idioma operativa definida con alcance completo y propagada a derivados. | `AGENTS.md:74`, `.github/copilot-instructions.md:76`, `.agent/rules/obsidian-expert.md:80` | Mantener política solo en canónico y propagar con sync en cada cambio.

## Verdades ejecutables observadas

1. El pipeline real de release exige `npm test` y `npm run build` antes de publicar (`.github/workflows/release.yml:48`, `.github/workflows/release.yml:51`).  
2. El pipeline real exige artefactos `main.js`, `manifest.json`, `styles.css` (`.github/workflows/release.yml:57`, `.github/workflows/release.yml:59`).  
3. Las reglas de release están presentes en `AGENTS.md`, `.github/copilot-instructions.md` y `.agent/rules/obsidian-expert.md`.
4. Existe validación automática de drift con `npm run sync:agents:check` en `.github/workflows/agent-instructions-sync-check.yml`.
5. La política de idioma operativa ya está formalizada en el canónico y sus derivados.
6. La skill local de submission ya está alineada con `styles.css` obligatorio en este repositorio.
7. La skill `obsidian` ya no presenta instrucción ejecutable local para scripts inexistentes sin verificación previa.
8. El release por tag se bloquea si el tag no proviene de `main`.

## Decisiones de verdad (vigentes)

| ID | Decisión propuesta | Regla operativa | Implementación sugerida |
|---|---|---|---|
| PRM-002 | `AGENTS.md` raíz es la fuente canónica única. | Ningún archivo especializado puede divergir manualmente del canónico. | Sincronización automática desde `AGENTS.md` hacia `.github/copilot-instructions.md` y `.agent/rules/obsidian-expert.md`. |
| PRM-006 | Precedencia formal en 4 capas. | 1) Instrucciones runtime/sistema, 2) `AGENTS.md` canónico, 3) derivados por agente, 4) skills (solo reglas de dominio, sin contradicción). | Añadir sección de precedencia en `AGENTS.md` y marcar derivados como `AUTO-GENERATED`. |
| PRM-007 | Política de idioma cerrada. | Conversación + documentación interna: español. Código de producción: inglés. | Añadir sección `Language Policy` en `AGENTS.md` y reflejarla en derivados. |
| PRM-001 | Se resuelve al aplicar canonicidad + sync. | Si el canónico incluye reglas de release, los derivados deben incluirlas idénticas. | Validación CI para detectar drift entre canónico y derivados. |
| PRM-003 | Para este repo, `styles.css` es obligatorio contractual. | Cualquier guía local que diga “optional” queda sobreescrita por política del repo. | Corregir referencia en skill local y dejar nota de override de proyecto. |
| PRM-004 | Referencias externas de skills deben declararse explícitamente. | No sugerir scripts/rutas inexistentes sin verificación previa de existencia. | Cambiar texto de la skill a condición explícita: “si existe en el entorno actual”. |
| PRM-005 | Política de release: solo tags creados desde `main`. | Tag fuera de `main` no es release válido. | Mantener proceso documental actual y agregar check de ancestry a `main` en workflow. |

## Mecanismo de sincronización canónica

1. Crear un script de sync (ejemplo: `scripts/sync-agent-instructions.mjs`).
2. Fuente: `AGENTS.md`.
3. Salidas:
   - `.github/copilot-instructions.md` = copia textual.
   - `.agent/rules/obsidian-expert.md` = frontmatter + copia textual.
4. Agregar verificación en CI:
   - ejecutar sync en modo `--check`;
   - fallar si hay diferencias.

## Comandos oficiales de sincronización

- `npm run sync:agents`: regenera archivos derivados desde `AGENTS.md`.
- `npm run sync:agents:check`: verifica drift sin escribir cambios.

## Política de idioma (texto final sugerido)

- Regla 1: toda conversación con agentes AI se realiza en español.
- Regla 2: documentación interna del proyecto se redacta en español.
- Regla 3: código de producción se escribe en inglés (identificadores, comentarios técnicos y mensajes técnicos).
- Regla 4: README oficial único en `README.md` y en español.

## Acciones tomadas

- [x] Se definió el modelo de verdad para `PRM-002`, `PRM-006` y `PRM-007`.
- [x] Se fijó `AGENTS.md` como fuente canónica en este diagnóstico.
- [x] Se unificó README oficial en español (`README.md`) y se eliminó duplicidad de referencia en diagnósticos.
- [x] Se implementó script de sincronización canónica (`scripts/sync-agent-instructions.mjs`).
- [x] Se añadieron comandos de mantenimiento `sync:agents` y `sync:agents:check` en `package.json`.
- [x] Se regeneraron derivados de agente con marca `AUTO-GENERATED`.
- [x] Se formalizó precedencia por capas en `AGENTS.md` y se propagó a derivados (`PRM-006`).
- [x] Se agregó workflow de CI para validar drift de instrucciones (`PRM-001`).
- [x] Se formalizó política de idioma operativa en `AGENTS.md` y derivados (`PRM-007`).
- [x] Se cerró `PRM-002` con sincronización canónica obligatoria desde `AGENTS.md`.
- [x] Se alineó la skill local de submission con `styles.css` obligatorio por política del repo (`PRM-003`).
- [x] Se corrigió referencia externa de scaffolding en skill `obsidian` con regla condicional de existencia (`PRM-004`).
- [x] Se aplicó enforcement de tags desde `main` en release workflow y documentación (`PRM-005`).

## Checklist de normalización PRM

### PRM-001
- [x] Sincronizar reglas de release en todos los derivados de agente.
- [x] Agregar verificación automática de drift en CI.
- Resumen checkpoint terminado:
- Completado: release unificado en derivados y drift validado por workflow dedicado.

### PRM-002
- [x] Implementar script de sincronización desde `AGENTS.md`.
- [x] Marcar archivos derivados como `AUTO-GENERATED`.
- [x] Documentar comando oficial de sync para mantenimiento.
- Resumen checkpoint terminado:
- Completado: sincronización canónica implementada y validada con `--check`.

### PRM-003
- [x] Corregir skill local para que `styles.css` sea obligatorio en este repo.
- [x] Añadir nota explícita de override por política del proyecto.
- Resumen checkpoint terminado:
- Completado: guía local alineada con CI/release real del repositorio.

### PRM-004
- [x] Corregir referencias a scripts externos no disponibles localmente.
- [x] Declarar condición de existencia antes de recomendar ejecución.
- Resumen checkpoint terminado:
- Completado: referencia a scaffolding marcada como externa y condicionada por existencia local.

### PRM-005
- [x] Definir enforcement en workflow para tags provenientes de `main`.
- [x] Alinear texto final entre proceso documental y CI.
- Resumen checkpoint terminado:
- Completado: workflow y proceso documental aplican la misma regla de release desde `main`.

### PRM-006
- [x] Añadir bloque de precedencia formal en `AGENTS.md`.
- [x] Reflejar precedencia en derivados del canónico.
- Resumen checkpoint terminado:
- Completado: precedencia formal implementada en canónico y derivados sincronizados.

### PRM-007
- [x] Añadir política de idioma final en `AGENTS.md`.
- [x] Propagar política de idioma a derivados.
- Resumen checkpoint terminado:
- Completado: política operativa implementada en canónico y derivados.

## Registro resumido de checkpoints

- 2026-02-08: Se aprobaron decisiones de verdad v1 para `PRM-002`, `PRM-006`, `PRM-007`.
- 2026-02-08: Se estableció README oficial único en español para el proyecto.
- 2026-02-08: `PRM-002` implementado con sync automático desde `AGENTS.md` hacia derivados de agente.
- 2026-02-08: `PRM-006` implementado con modelo de precedencia formal en `AGENTS.md`.
- 2026-02-08: `PRM-001` implementado con check automático de drift en CI.
- 2026-02-08: `PRM-007` implementado con política de idioma operativa y propagación a derivados.
- 2026-02-08: `PRM-003` implementado alineando la skill local con `styles.css` obligatorio.
- 2026-02-08: `PRM-004` implementado declarando recursos de scaffolding como externos/condicionales.
- 2026-02-08: `PRM-005` implementado con enforcement de tags desde `main` en workflow y documentación.
