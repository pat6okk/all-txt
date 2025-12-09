# ALL.txt

<p align="center">
  <strong>Keyword-driven state tracking for Obsidian. Track anything in plain Markdown.</strong><br>
  Tasks, decisions, knowledge, research, sales, legal—define your own states and workflows.
</p>

<p align="center">
  <a href="https://github.com/pat6okk/all-txt/releases"><img src="https://img.shields.io/github/v/release/pat6okk/all-txt?style=flat-square" alt="Release"></a>
  <a href="https://github.com/pat6okk/all-txt/blob/master/LICENSE"><img src="https://img.shields.io/github/license/pat6okk/all-txt?style=flat-square" alt="License"></a>
  <a href="https://github.com/pat6okk/all-txt/stargazers"><img src="https://img.shields.io/github/stars/pat6okk/all-txt?style=flat-square" alt="Stars"></a>
</p>

---

## 🎯 Overview

**ALL.txt** is a keyword-driven state machine for Obsidian. Define any states you want (TODO, DOING, DONE, ASK, FACT, PROPOSITION, ACCEPTED, etc.) and build custom workflows. All state changes persist directly in your Markdown—no database, no lock-in.

> **Inspired by TODO.txt**: Lightweight syntax, pure Markdown, fully portable. Copy/paste your notes anywhere and keep full semantics. Perfect for meeting transcripts where an AI extracts keywords to build states automatically.
>
> **Beyond Tasks**: Track decisions, knowledge, research hypotheses, sales leads, legal approvals, content pipelines, risk mitigation—anything that has states.

---

## ✨ Key Features

### 🚀 **Performance & Architecture**
- **Event-Driven Updates**: No polling loops. Tasks update instantly when files change.
- **Smart Debouncing**: Intelligent refresh throttling prevents excessive re-scans.
- **Reactive State Management**: Centralized `TaskStore` with efficient caching.

### 🎨 **Customization**
- **Custom States**: Define any keywords you want (`TODO`, `DOING`, `ASK`, `FACT`, `PROPOSITION`, `ACCEPTED`, etc.).
- **Visual Workflows**: Build state transition flows with a drag-and-drop interface (e.g., `ASK → FACT`, `LEAD → QUALIFIED → CLOSED`).
- **Color Coding**: Assign unique colors to each keyword for visual clarity.
- **Multi-Priority Queues**: Support multiple independent priority systems (`[#A]`, `[P1]`, etc.).

### 📋 **Task Management**
- **Inline Persistence**: All changes save directly to Markdown. No external database.
- **Smart Grouping**: Automatically group tasks by file, state, or priority.
- **Advanced Sorting**: Sort by priority, scheduled date, deadline, or file order.
- **Rich Metadata**: Track scheduled dates, deadlines, and priorities per task.
- **Tooling-friendly**: Compatible with AI or scripts that parse plain text to extract keywords and build task lists (e.g., meeting transcripts).

### 💡 **User Experience**
- **Unified View**: All vault tasks in one sidebar panel with live updates.
- **Quick Actions**: Click keywords to cycle states, right-click for context menu.
- **Jump to Source**: Click task text to instantly navigate to the exact line.
- **Keyboard-First**: Dedicated commands and hotkeys for power users.
- **Editor Integration**: Real-time syntax highlighting for all custom keywords.

### 🌍 **Context Support**
Detects tasks in multiple Markdown contexts:
- Plain text lines
- Bullet lists (`-`, `*`, `+`)
- Numbered lists (`1.`, `2)`)
- Alphabetic lists (`a.`, `B)`)
- Checkboxes (`- [ ]`, `- [x]`)
- Blockquotes (`>`)
- Callouts (`> [!info]`)
- Code blocks (optional)
- Works even outside Obsidian: copy/paste notes to any plain-text medium and keep task keywords intact.

---

## 📦 Installation

### Option 1: Community Plugins (Recommended)
1. Open **Settings** → **Community Plugins**
2. Disable **Safe Mode**
3. Click **Browse** and search for **"TODO inline"**
4. Click **Install** → **Enable**

### Option 2: Manual Installation
1. Download the latest release from [Releases](https://github.com/pat6okk/todo-inline/releases)
2. Extract `main.js`, `manifest.json`, `styles.css` to:
   ```
   <vault>/.obsidian/plugins/todo-inline/
   ```
3. Reload Obsidian
4. Enable the plugin in **Settings** → **Community Plugins**

### Option 3: Build from Source
```bash
git clone https://github.com/pat6okk/todo-inline.git
cd todo-inline
npm install
npm run build
```
Copy `main.js`, `manifest.json`, `styles.css` to your vault's plugin folder.

---

## 🚀 Quick Start

### 1. Define Tasks in Your Notes

**Basic Task:**
```markdown
TODO Write project documentation
```

**With Checkbox:**
```markdown
- [ ] TODO Implement authentication
```

**With Priority:**
```markdown
TODO [#A] Critical bug fix
```

**With Dates:**
```markdown
TODO Review pull requests
PLAN: <2025-12-10>
DUE: <2025-12-15>
```

**In Lists:**
```markdown
- TODO Morning standup
* DOING Code review session
+ DONE Sprint planning
```

**In Callouts:**
```markdown
> [!tip] TODO
> Remember to commit your changes
```

### 2. Open the Task View

- Click the **📋 icon** in the left ribbon, or
- Use command palette: `Ctrl/Cmd+P` → "Show TODO tasks"

### 3. Interact with Tasks

| Action | Behavior |
|--------|----------|
| **Click Keyword** | Cycle to next state in workflow |
| **Right-Click Keyword** | Open context menu (jump to any state) |
| **Click Task Text** | Navigate to source file/line |
| **Toggle Checkbox** | Mark as `DONE` or revert to `TODO` |

---

## ⚙️ Configuration

Access settings via **Settings** → **TODO inline**

### 🎨 **Vocabulary (Keywords)**

Define your task states in three categories:

| Category | Default Keywords | Purpose |
|----------|------------------|---------|
| **Start States** | `TODO`, `LATER`, `WAIT` | Initial/pending tasks |
| **In-Progress States** | `DOING`, `NOW`, `IN-PROGRESS` | Active work |
| **Finished States** | `DONE`, `CANCELED`, `CANCELLED` | Completed tasks |

**Custom Configuration:**
- Add/remove keywords per category
- Assign unique colors (RGB/Hex picker)
- Set custom tooltips

### 🔄 **Workflows (State Transitions)**

Build custom state cycles with visual flow builder:

```
TODO → DOING → REVIEW → DONE → TODO
       ↓
     BLOCKED → TODO
```

**Features:**
- Drag-and-drop state ordering
- Hierarchical flow inheritance
- Automatic cycle completion (finished states return to start)

### 📊 **Priorities**

Configure multiple priority queues:

**Date Keywords (defaults):**
```
PLAN  → Scheduled date
DUE   → Deadline date
```
You can change these keywords in settings.

**Default (numeric queue):**
```
[P1] → Critical
[P2] → Important
[P3] → Normal
[P4] → Low
```

**Custom (letter-based example):**
```
[#A] → High
[#B] → Medium  
[#C] → Low
```

### 🎛️ **Advanced Options**

- **Include Callouts**: Parse tasks inside callout blocks
- **Include Code Blocks**: Detect tasks in code (useful for TODO comments)
- **Refresh Interval**: Manual scan frequency (10-300s)

---

## 📖 Examples

### Project Management Workflow

```markdown
# Project: Website Redesign

TODO [#A] Define requirements
PLAN: <2025-12-08>

DOING Wireframe homepage
DUE: <2025-12-10>

REVIEW Backend API integration
PLAN: <2025-12-12>

DONE Initial mockups approved
```

### Daily Tasks with Context

```markdown
## Morning Routine

- [ ] TODO Morning standup (15 min)
- [ ] DOING Review yesterday's PRs
- [x] DONE Send weekly report

> [!warning] High Priority
> TODO [#A] Fix production bug #447
> DUE: <2025-12-08>
```

### Multi-State Workflow

```markdown
TODO Research competitors → 
DOING Draft proposal → 
REVIEW Stakeholder feedback → 
APPROVE Final sign-off → 
DONE Project launched
```

---

## 🛠️ Development

### Tech Stack
- **TypeScript** (strict mode)
- **React 19** (UI components)
- **Obsidian Plugin API** (v0.16.0+)
- **esbuild** (bundling)
- **Jest** (testing)

### Project Structure
```
src/
├── main.ts                 # Plugin entry point
├── task.ts                 # Task interface/types
├── parser/
│   ├── task-parser.ts      # Core parsing engine
│   ├── date-parser.ts      # Date extraction
│   └── language-registry.ts # Multi-language support
├── services/
│   ├── task-store.ts       # Centralized task cache
│   ├── workflow-service.ts # State transition logic
│   └── settings-service.ts # Configuration management
├── view/
│   ├── task-view.tsx       # Main React view
│   └── task-editor.ts      # Markdown editor integration
├── ui/
│   ├── view/               # React components (list, toolbar)
│   └── settings/           # Settings UI components
└── editor/
    └── keyword-highlighter.ts # Syntax highlighting
```

### Build Commands

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Version bump
npm run version
```

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (what is accepted, tests, privacy, governance).

Quick flow:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests/build: `npm test` and `npm run build`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push and open a PR

---

## 📝 Roadmap

- [ ] Mobile-optimized touch gestures
- [ ] Improve performance in large vaults
- [ ] Use AI to build key phrases


---

## 🐛 Known Issues

- Large vaults (>1000 files) may experience initial scan delay
- Code block task detection may conflict with syntax highlighters

Report bugs via [GitHub Issues](https://github.com/pat6okk/all-txt/issues).

---

## 📄 License

[MIT License](LICENSE) © 2025 Pat6okk

---

## 🙏 Acknowledgments

- Inspired by the original **TodoSeq** plugin
- Built with ❤️ for the Obsidian community
- Thanks to all contributors and testers

---

<p align="center">
  <strong>Star ⭐ this repo if you find it useful!</strong>
</p>
