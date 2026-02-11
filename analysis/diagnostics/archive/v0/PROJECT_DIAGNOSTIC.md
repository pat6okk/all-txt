# Diagnóstico v0 - Proyecto FLOW.txt

**Fecha:** 2026-02-10  
**Objetivo:** identificar ambigüedades e incongruencias entre documentación, tests y comportamiento ejecutable.  
**Estado del análisis:** parcial, no exhaustivo.

## Hallazgos

| ID | Severidad | Hallazgo | Evidencia | Tratamiento propuesto |
|---|---|---|---|---|
| PRJ-001 | Resuelto | Riesgo original mitigado: contrato `strict-only` aplicado en tests, UI y README; no se acepta sintaxis legacy. | `src/parser/task-parser.ts:160`, `tests/tasks.test.ts:1`, `tests/task-parser.test.ts:1`, `README.md:59`, `src/ui/view/TodoViewRoot.tsx:162` | Mantener suite y documentación alineadas al contrato estricto en cada cambio de parser.
| PRJ-002 | Resuelto | Riesgo original mitigado en runtime: bloques FLOW ahora se definen por indentación orgánica y sin delimitadores artificiales. | `src/parser/task-parser.ts:628`, `src/main.ts:154`, `src/editor/flow-block-formatter.ts:30`, `tests/parser/block-parser.test.ts:1`, `tests/task-parser.test.ts:89`, `tests/flow-block-formatter.test.ts:1` | Mantener bloque orgánico por indentación como contrato oficial y normalizar épicas históricas que aún describen delimitadores.
| PRJ-003 | Resuelto | Riesgo original mitigado: `PLAN/DUE` definidos como términos canónicos y documentación normalizada; alias legacy solo para compatibilidad temporal. | `src/settings/defaults.ts:65`, `src/settings/defaults.ts:66`, `README.md:110`, `src/parser/task-parser.ts:122`, `analysis/epics/04-METADATA_AND_PRIORITIES.md:20` | Mantener `PLAN/DUE` como única nomenclatura oficial y retirar alias legacy en una versión futura planificada.
| PRJ-004 | Resuelto | Riesgo original mitigado: documentación normalizada al identificador oficial de vista. | `src/view/task-view.tsx:19` (`flowtxt-view`), `analysis/epics/02-VISUALIZATION_AND_ORGANIZATION.md:27`, `analysis/technical/ARCHITECTURE.md:109` | Mantener `flowtxt-view` como único identificador válido en código y documentación.
| PRJ-005 | Resuelto | Riesgo original mitigado: gate de calidad de release reconciliado con suite en verde. | `.github/RELEASE_PROCESS.md:23` (`npm test` obligatorio), `.github/workflows/release.yml:28` (`Run tests`), `src/parser/task-parser.ts:249` (fix de extracción para regex de código), ejecución local 2026-02-10: `29` suites OK y `117` tests OK (`npm test -- --runInBand`) | Mantener `npm test` como gate obligatorio pre-release y monitorear regresiones en parsing dentro de bloques de código.
| PRJ-006 | Resuelto | Riesgo original mitigado: `refreshInterval` retirado del contrato activo; actualización oficial por eventos de vault y debounce. | `src/main.ts`, `src/services/task-store.ts`, `analysis/epics/07-CUSTOMIZATION.md`, `analysis/best_practices/USER_GUIDE.md`, `analysis/technical/ARCHITECTURE.md`, `analysis/roadmap/v1.1_ROADMAP.md` | Mantener modelo reactivo como verdad operativa; cualquier retorno de polling debe abrirse como iniciativa nueva y explícita.
| PRJ-007 | Resuelto | Riesgo original mitigado: `labelMode` contractual implementado y alineado entre parser, settings y UX de editor. | `src/parser/task-parser.ts:324` (free/defined), `src/ui/settings/LabelsSection.tsx:1` (gestión de labels), `src/editor/label-editor-suggest.ts:1` (autocomplete + alta rápida), `src/main.ts:82` (registro suggest y menú de inserción), `src/services/settings-service.ts:96` (normalización y orden), `tests/parser/labels.test.ts:117` | Mantener contrato `defined/free` estable, con comparación case-insensitive y visualización canónica; iterar mobile y grouping como backlog explícito.
| PRJ-008 | Resuelto | Riesgo original mitigado: arquitectura canónica versionada por hito y alineada al comportamiento vigente de runtime/parser/UI/settings. | `analysis/technical/ARCHITECTURE.md:3` (actualización 2026-02-10), `analysis/technical/ARCHITECTURE.md:9` (política de canonicidad y versionado), `analysis/technical/ARCHITECTURE.md:33` (contrato funcional vigente `v1.1`), `analysis/technical/ARCHITECTURE.md:238` (trazabilidad PRJ) | Mantener actualización de arquitectura en el mismo ciclo de cada cambio contractual/técnico y antes de cerrar cualquier `PRJ-*`.

## Línea base técnica observada

1. `build` compila correctamente (`npm run build` OK).  
2. `test` está en verde y alineado al contrato actual (`npm test`: `29/29` suites, `117/117` tests).  
3. El parser actual opera en modo estricto y con cierre orgánico de bloque por indentación.
4. `PRJ-001` ya está alineado a `strict-only` en parser/tests/UI/README.
5. `PRJ-003` ya está alineado a defaults canónicos `PLAN/DUE` con compatibilidad temporal de alias legacy.
6. `PRJ-006` ya está alineado al modelo reactivo por eventos (sin `refreshInterval` activo).

## Decisiones mínimas para establecer VERDAD

1. Contrato de parsing oficial: **strict-only**.  
2. Bloques FLOW oficiales: cierre orgánico por indentación; delimitadores artificiales fuera del contrato activo.  
3. Keywords de fecha oficiales por defecto: `PLAN/DUE` (aliases legacy solo como compatibilidad temporal).  
4. `flowtxt-view` es el único `viewType` oficial documentado.  
5. Release formalmente bloqueado sin `npm test` en verde.  
6. `labelMode` es feature contractual (`free/defined`) con backlog explícito para grouping y mobile.

## Decisiones de gobierno transversales

Estas decisiones aplican al diagnóstico de proyecto y al diagnóstico de prompting:

1. Fuente canónica de instrucciones: `AGENTS.md` en raíz.
2. Modelo de precedencia: runtime/sistema > `AGENTS.md` > derivados por agente > skills.
3. Política de idioma: conversación y documentación interna en español; código de producción en inglés.
4. Sincronización obligatoria entre archivos especializados de agentes para evitar drift documental.

## Decisiones de verdad (propuesta v1)

| ID | Decisión propuesta | Regla operativa | Implementación sugerida |
|---|---|---|---|
| PRJ-001 | Contrato de parsing oficial: `strict-only`. | No se acepta sintaxis legacy (`- TODO`) en el contrato principal. | Alinear parser, tests legacy, empty-state UI y README al modo estricto. |
| PRJ-002 | Cierre de bloque orgánico por indentación (sin delimitadores artificiales). | Una línea pertenece al bloque si su indentación es mayor que la del header; el bloque termina por dedent, siguiente header hermano/padre o EOF. | Mantener parser y comando de conversión alineados; retirar gradualmente referencias/configuración legacy de delimitadores. |
| PRJ-003 | Defaults canónicos de fecha: `PLAN` y `DUE`. | `SCHEDULED/DEADLINE` solo como alias de compatibilidad documentado (si aplica). | Actualizar README + arquitectura e incluir estrategia de migración o alias explícito. |
| PRJ-004 | `flowtxt-view` es el único `viewType` oficial. | No se admite nomenclatura previa en documentos activos. | Normalizar nomenclatura en épicas, arquitectura y guías internas. |
| PRJ-005 | Gate de release restablecido con suite en verde. | Sin `npm test` en verde no hay release válido. | Mantener verificación de suite completa en cada cambio de parser/sintaxis y antes de publicar. |
| PRJ-006 | Contrato oficial de actualización: reactivo por eventos (sin `refreshInterval`). | No se expone polling configurable mientras no exista implementación explícita y justificada. | Mantener docs/roadmap sin slider de refresh y documentar modelo por eventos + debounce. |
| PRJ-007 | `labelMode` es contractual (`free/defined`) con matching case-insensitive y display canónico. | En modo `defined`, labels no registradas se mantienen como texto plano. | Mantener sección de labels en settings, autocomplete con alta rápida y menú contextual de inserción ordenada. |
| PRJ-008 | Arquitectura se versiona por hito y estado real. | Ningún documento técnico puede describir comportamiento no vigente sin etiqueta de versión. | Actualizar `ARCHITECTURE.md` al estado actual o partirlo por versiones. |

## Acciones tomadas

- [x] Se consolidaron propuestas de verdad v1 para `PRJ-001` a `PRJ-008`.
- [x] Se estableció formato único de seguimiento por checklist y checkpoint.
- [x] Se alineó este diagnóstico con el patrón usado en `PROMPTING_SYSTEM_DIAGNOSTIC.md`.
- [x] Se implementó `strict-only` para `PRJ-001` en tests principales, UI de empty-state y README.
- [x] Se implementó `PRJ-002` con bloques orgánicos por indentación y conversión por clic derecho sin delimitador.
- [x] Se normalizó documentación activa de épicas para `PRJ-002` y se archivó `01.5-STRICT_BLOCKS.md` como histórico no canónico.
- [x] Se cerró `PRJ-006` retirando `refreshInterval` del contrato documental y consolidando modelo reactivo por eventos.
- [x] Se eliminó la nomenclatura previa del panel y se normalizó a `flowtxt-view` (`PRJ-004`).
- [x] Se normalizó terminología de fechas a `PLAN/DUE` y se dejó compatibilidad temporal para alias legacy (`PRJ-003`).
- [x] Se cerró `PRJ-005` recuperando la suite completa (`29/29` suites, `117/117` tests) tras corregir parsing en bloques de código.
- [x] Se cerró `PRJ-007` con contrato funcional de labels (`free/defined`), UI dedicada y autocomplete contextual en editor.
- [x] Se cerró `PRJ-008` versionando arquitectura por hito y alineando `ARCHITECTURE.md` al comportamiento vigente.

## Checklist de normalización PRJ

### PRJ-001
- [x] Definir y aprobar contrato final `strict-only`.
- [x] Eliminar expectativas legacy (`- TODO`) de tests/documentación/UI.
- Resumen checkpoint terminado:
- Completado: contrato estricto aplicado en parser/tests/UI/README.

### PRJ-002
- [x] Confirmar semántica contractual de cierre orgánico por indentación.
- [x] Eliminar delimitador artificial del comando de conversión de selección.
- [x] Normalizar épicas históricas que aún describían delimitadores legacy.
- Resumen checkpoint terminado:
- Completado: parser/comando/documentación activa alineados al bloque orgánico por indentación.

### PRJ-003
- [x] Confirmar defaults canónicos de fecha (`PLAN/DUE`).
- [x] Documentar alias/migración con regla explícita de compatibilidad.
- Resumen checkpoint terminado:
- Completado: documentación y defaults alineados a `PLAN/DUE`; alias legacy acotados a compatibilidad temporal.

### PRJ-004
- [x] Confirmar `flowtxt-view` como único `viewType` oficial.
- [x] Eliminar referencias de nomenclatura previa en la documentación activa.
- Resumen checkpoint terminado:
- Completado: documentación normalizada y libre de nomenclatura anterior.

### PRJ-005
- [x] Definir plan de recuperación de tests con metas verificables.
- [x] Mantener release bloqueado hasta cumplir gate de calidad.
- Resumen checkpoint terminado:
- Completado: suite en verde (`29/29` suites, `117/117` tests) y gate de release nuevamente cumplido.

### PRJ-006
- [x] Decidir `refreshInterval`: retirar de roadmap/documentación activa.
- [x] Aplicar decisión en épicas, guía, arquitectura y roadmap.
- Resumen checkpoint terminado:
- Completado: modelo oficial reactivo por eventos; sin `refreshInterval` activo en el contrato del producto.

### PRJ-007
- [x] Definir contrato funcional mínimo para `labelMode`.
- [x] Reflejar estado (experimental/contractual) en parser, UI y docs.
- Resumen checkpoint terminado:
- Completado: `labelMode` contractual con parser case-insensitive, settings de labels, autocomplete con alta rápida y menú de inserción ordenada.

### PRJ-008
- [x] Definir política de versionado de arquitectura por hito.
- [x] Actualizar `ARCHITECTURE.md` a comportamiento vigente.
- Resumen checkpoint terminado:
- Completado: `ARCHITECTURE.md` quedó como documento único canónico, versionado por hito (`v1.0` histórico, `v1.1` vigente) y trazabilidad explícita con PRJ.

## Registro resumido de checkpoints

- 2026-02-08: Se creó estructura de normalización del diagnóstico de proyecto (`decisiones v1 + checklist PRJ`).
- 2026-02-08: `PRJ-001` implementado con contrato `strict-only` y eliminación de sintaxis legacy en superficies principales.
- 2026-02-09: `PRJ-002` implementado con cierre orgánico por indentación y conversión de selección sin delimitadores.
- 2026-02-09: `PRJ-002` completado en documentación activa; `01.5-STRICT_BLOCKS.md` archivado como referencia histórica.
- 2026-02-08: `PRJ-003` implementado con normalización canónica `PLAN/DUE` y alias legacy temporales.
- 2026-02-08: `PRJ-004` implementado eliminando la nomenclatura previa y normalizando a `flowtxt-view`.
- 2026-02-09: `PRJ-006` completado; `refreshInterval` retirado del scope activo y documentación alineada al modelo reactivo.
- 2026-02-09: `PRJ-005` completado; suite de tests restablecida en verde tras corrección de parsing en bloques de código.
- 2026-02-10: `PRJ-007` completado; labels contractuales (`free/defined`) con UI de gestión y UX de editor (autocomplete + inserción contextual).
- 2026-02-10: `PRJ-008` completado; arquitectura canónica versionada por hito y alineada al estado real del producto.
