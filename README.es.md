# FLOW.txt

<p align="center">
  <strong>Tus notas ya saben qué debe pasar.<br>FLOW.txt te ayuda a verlo.</strong>
</p>

<p align="center">
  <a href="https://github.com/pat6okk/flow-txt/releases"><img src="https://img.shields.io/github/v/release/pat6okk/flow-txt?style=flat-square" alt="Release"></a>
  <a href="https://github.com/pat6okk/flow-txt/blob/master/LICENSE"><img src="https://img.shields.io/github/license/pat6okk/flow-txt?style=flat-square" alt="License"></a>
  <a href="https://github.com/pat6okk/flow-txt/stargazers"><img src="https://img.shields.io/github/stars/pat6okk/flow-txt?style=flat-square" alt="Stars"></a>
</p>

---

## La Idea

Cada nota que escribes está llena de cosas en movimiento: tareas por completar, preguntas por responder, decisiones pendientes de aprobación, ideas evolucionando hacia hechos. **FLOW.txt** hace esos estados visibles y rastreables—sin cambiar cómo escribes.

Solo escribe una palabra clave. El plugin hace el resto.

```markdown
ASK ¿Quién se encarga de la migración?
```

Más tarde, cuando tengas la respuesta:

```markdown
FACT John se encarga de la migración
```

Eso es todo. Sin sintaxis especial. Sin bases de datos. Markdown puro que funciona en cualquier lugar.

---

## Por qué FLOW.txt?

**Inspirado en [TODO.txt](http://todotxt.org/)**, pero evolucionado. TODO.txt nos dio seguimiento de tareas portátil en texto plano. FLOW.txt extiende esa filosofía a *cualquier cosa con estados*:

| Dominio | Flujo de Ejemplo |
|---------|------------------|
| **Tareas** | `TODO → DOING → DONE` |
| **Preguntas** | `ASK → FACT` |
| **Decisiones** | `PROPOSITION → ACCEPTED` o `REJECTED` |
| **Investigación** | `HYPOTHESIS → VALIDATED` o `INVALIDATED` |
| **Contenido** | `DRAFT → REVIEW → PUBLISHED` |
| **Ventas** | `LEAD → CONTACTED → QUALIFIED → CLOSED` |
| **Riesgos** | `RISK → MITIGATED → RESOLVED` |
| **Aprendizaje** | `CONCEPT → UNDERSTOOD → APPLIED` |

Tú defines los estados. Tú defines los flujos. El plugin se adapta a *tu* lógica.

---

## Cómo Funciona

**1. Escribe naturalmente.** Usa palabras clave donde quieras en tus notas:

```markdown
## Notas de Reunión - 8 Dic

TODO Enviar propuesta al cliente
ASK ¿Cuál es la línea de tiempo del presupuesto?
PROPOSITION Mover deadline a enero
RISK La integración podría romper sistemas legacy

- DOING Revisar análisis de competencia
- DONE Investigación inicial completa
```

**2. Visualiza todo.** Abre el panel lateral para ver todos los items rastreados en tu bóveda, agrupados y ordenados como quieras.

**3. Haz clic para avanzar.** Haz clic en una palabra clave para moverla al siguiente estado. `TODO` se convierte en `DOING`. `ASK` se convierte en `FACT`. El cambio se guarda directamente en tu Markdown.

**4. Llévalo a donde sea.** Copia tus notas a email, wikis, otros editores—las palabras clave siguen siendo legibles y significativas. Sin lock-in.

---

## Perfecto Para

- **Transcripciones de reuniones**: Pega una transcripción, pídele a una IA que encuentre acciones, decisiones y preguntas. Aparecen palabras clave. FLOW.txt las rastrea.
- **Notas de investigación**: Rastrea hipótesis mientras evolucionan de ideas a hallazgos validados.
- **Gestión de proyectos**: Seguimiento de tareas simple sin la complejidad de herramientas pesadas.
- **Registro de decisiones**: Nunca pierdas el rastro de lo que fue propuesto, aceptado o rechazado.
- **Construcción de conocimiento**: Marca preguntas y conviértelas en hechos a medida que aprendes.

---

## Instalación

**Community Plugins** (cuando esté disponible):  
Settings → Community Plugins → Browse → Buscar "FLOW.txt" → Install → Enable

**Manual**:  
Descarga desde [Releases](https://github.com/pat6okk/flow-txt/releases), extrae en `<vault>/.obsidian/plugins/flow-txt/`, recarga Obsidian.

---

## Personalización

Todo es configurable en Settings → FLOW.txt:

- **Define tu vocabulario**: Añade las palabras clave que quieras (estados, colores, tooltips)
- **Construye workflows**: Conecta estados con reglas de transición personalizadas
- **Configura prioridades/labels**: `P1`, `A`, o tokens personalizados como `#Urgente`
- **Añade fechas**: `SCHEDULED: 25/12/2025` o `DEADLINE: 2025-12-31`
  - Formatos flexibles: `DD/MM/YYYY`, `YYYY-MM-DD`, o `MM-DD-YYYY`
  - Lenguaje natural: "mañana", "next Friday" (en inglés por ahora)
  - **Date Picker**: Click derecho en cualquier fecha o badge para abrir el calendario nativo.

Las palabras clave por defecto funcionan desde el inicio. Personaliza cuando estés listo.

---

## Ejemplos

**Captura de conocimiento:**
```markdown
ASK ¿Cómo funciona el flujo de autenticación?
FACT La autenticación usa OAuth2 con refresh tokens, gestionado por AuthService
```

**Seguimiento de decisiones:**
```markdown
PROPOSITION Migrar a TypeScript strict mode
ACCEPTED Migrar a TypeScript strict mode (aprobado en sprint review)
```

**Flujo de investigación:**
```markdown
HYPOTHESIS Los usuarios prefieren modo oscuro por defecto
VALIDATED 85% de preferencia en encuesta de usuarios (n=500)
```

**Pipeline de ventas:**
```markdown
LEAD Acme Corp - interesado en plan enterprise
CONTACTED Propuesta y pricing enviados
QUALIFIED Presupuesto confirmado, decisión la próxima semana
CLOSED Contrato firmado 🎉
```

### Bloques de Contenido Estricto

FLOW.txt captura automáticamente el contexto de tus items. Ahora puedes controlar explícitamente dónde termina una tarea usando **Delimitadores de Bloque**:

```markdown
TODO Tarea compleja
- Paso 1
- Paso 2
> Nota importante
END-FLOW

Texto normal que ya no pertenece a la tarea...
```

**Configuración:**
En **Settings > Block Delimiters**, puedes:
- Elegir entre presets como `END-FLOW`, `FIN`, `---`, `:::`.
- Crear tus propios delimitadores personalizados.
- Asignarles color para que destaquen visualmente en tu editor.

---

## La Visión

FLOW.txt no es un gestor de tareas. Es una **máquina de estados para tus pensamientos**.

El objetivo: hacer que sea fácil capturar, rastrear y avanzar *cualquier cosa* que se mueva a través de estados—usando texto plano que se mantiene portable y amigable con IA.

Estamos construyendo hacia:
- Detección de palabras clave asistida por IA desde transcripciones
- Sugerencias de estados contextuales basadas en contenido
- Auto-completado consciente de resultados (detectar cuándo algo está resuelto)
- Soporte multi-idioma para palabras clave

---

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Damos la bienvenida a correcciones de bugs, mejoras de rendimiento y propuestas de funcionalidades bien pensadas.

---

## Licencia

[MIT](LICENSE) © 2025 Pat6okk

---

<p align="center">
  <strong>Dale ⭐ si FLOW.txt te ayuda a pensar con más claridad.</strong>
</p>
