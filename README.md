# FLOW.txt

<p align="center">
  <strong>Your notes already know what needs to happen.<br>FLOW.txt helps you see it.</strong>
</p>

<p align="center">
  <a href="https://github.com/pat6okk/flow-txt/releases"><img src="https://img.shields.io/github/v/release/pat6okk/flow-txt?style=flat-square" alt="Release"></a>
  <a href="https://github.com/pat6okk/flow-txt/blob/master/LICENSE"><img src="https://img.shields.io/github/license/pat6okk/flow-txt?style=flat-square" alt="License"></a>
  <a href="https://github.com/pat6okk/flow-txt/stargazers"><img src="https://img.shields.io/github/stars/pat6okk/flow-txt?style=flat-square" alt="Stars"></a>
</p>

---

## The Idea

Every note you write is full of things in motion: tasks to complete, questions to answer, decisions pending approval, ideas evolving into facts. **FLOW.txt** makes those states visible and trackable—without changing how you write.

Just type a keyword. The plugin does the rest.

```markdown
ASK Who owns the migration?
```

Later, when you have the answer:

```markdown
FACT John owns the migration
```

That's it. No special syntax. No databases. Pure Markdown that works everywhere.

---

## Why FLOW.txt?

**Inspired by [TODO.txt](http://todotxt.org/)**, but evolved. TODO.txt gave us portable task tracking in plain text. FLOW.txt extends that philosophy to *anything with states*:

| Domain | Example Flow |
|--------|--------------|
| **Tasks** | `TODO → DOING → DONE` |
| **Questions** | `ASK → FACT` |
| **Decisions** | `PROPOSITION → ACCEPTED` or `REJECTED` |
| **Research** | `HYPOTHESIS → VALIDATED` or `INVALIDATED` |
| **Content** | `DRAFT → REVIEW → PUBLISHED` |
| **Sales** | `LEAD → CONTACTED → QUALIFIED → CLOSED` |
| **Risks** | `RISK → MITIGATED → RESOLVED` |
| **Learning** | `CONCEPT → UNDERSTOOD → APPLIED` |

You define the states. You define the flows. The plugin adapts to *your* logic.

---

## How It Works

**1. Write naturally.** Use keywords anywhere in your notes:

```markdown
## Meeting Notes - Dec 8

TODO Send proposal to client
ASK What's the budget timeline?
PROPOSITION Move deadline to January
RISK Integration might break legacy systems

- DOING Review competitor analysis
- DONE Initial research complete
```

**2. See everything.** Open the sidebar panel to view all tracked items across your vault, grouped and sorted however you want.

**3. Click to advance.** Click a keyword to move it to the next state. `TODO` becomes `DOING`. `ASK` becomes `FACT`. The change saves directly to your Markdown.

**4. Take it anywhere.** Copy your notes to email, wikis, other editors—the keywords stay readable and meaningful. No lock-in.

---

## Perfect For

- **Meeting transcripts**: Paste a transcript, ask an AI to find action items, decisions, and questions. Keywords appear. FLOW.txt tracks them.
- **Research notes**: Track hypotheses as they evolve from ideas to validated findings.
- **Project management**: Simple task tracking without the overhead of complex tools.
- **Decision logs**: Never lose track of what was proposed, accepted, or rejected.
- **Knowledge building**: Mark questions and convert them to facts as you learn.

---

## Installation

**Community Plugins** (when available):  
Settings → Community Plugins → Browse → Search "FLOW.txt" → Install → Enable

**Manual**:  
Download from [Releases](https://github.com/pat6okk/flow-txt/releases), extract to `<vault>/.obsidian/plugins/flow-txt/`, reload Obsidian.

---

## Customization

Everything is configurable in Settings → FLOW.txt:

- **Define your vocabulary**: Add any keywords you want (states, colors, tooltips)
- **Build workflows**: Connect states with custom transition rules
- **Set priorities**: `P1`, `A`, or custom tokens like `#High`
- **Add dates**: `SCHEDULED: 2025-12-15` or `DEADLINE: 2025-12-31`
  - Flexible formats: `YYYY-MM-DD`, `DD/MM/YYYY`, or `MM-DD-YYYY`
  - Natural language: "tomorrow", "next Friday"
  - **Date Picker**: Right-click on any date or badge to open the calendar UI

Default keywords work out of the box. Customize when you're ready.

---

## Examples

**Knowledge capture:**
```markdown
ASK How does the auth flow work?
FACT Auth uses OAuth2 with refresh tokens, handled by AuthService
```

**Decision tracking:**
```markdown
PROPOSITION Migrate to TypeScript strict mode
ACCEPTED Migrate to TypeScript strict mode (approved in sprint review)
```

**Research workflow:**
```markdown
HYPOTHESIS Users prefer dark mode by default
VALIDATED 85% preference in user survey (n=500)
```

**Sales pipeline:**
```markdown
LEAD Acme Corp - interested in enterprise plan
CONTACTED Sent proposal and pricing
QUALIFIED Budget confirmed, decision next week
CLOSED Contract signed 🎉
```

---

## The Vision

FLOW.txt is not a task manager. It's a **state machine for your thoughts**.

The goal: make it effortless to capture, track, and advance *anything* that moves through states—using plain text that stays portable and AI-friendly.

We're building toward:
- AI-assisted keyword detection from transcripts
- Contextual state suggestions based on content
- Outcome-aware auto-completion (detect when something is resolved)
- Multi-language keyword support

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We welcome bug fixes, performance improvements, and thoughtful feature proposals.

---

## License

[MIT](LICENSE) © 2025 Pat6okk

---

<p align="center">
  <strong>Star ⭐ if FLOW.txt helps you think clearer.</strong>
</p>
