# TODO inline

**TODO inline** is a high-performance, reactive task manager for Obsidian that lives right inside your notes. It scans for tasks using customizable keywords and presents them in a unified, interactive view without disrupting your Markdown workflow.

> **Note:** This project is a highly optimized, personalized evolution of the original *TodoSeq* plugin, rebuilt for performance and flexibility.

## Features

- **Reactive Architecture**: Instant updates. No polling. Zero lag.
- **Custom Workflow**: Define your own state cycles (e.g., `TODO` -> `DOING` -> `REVIEW` -> `DONE`).
- **Inline Persistence**: All state changes are saved directly to your Markdown files.
- **Smart Grouping**: Tasks are automatically grouped by file and persisted state.
- **Advanced Sorting**: Sort by Priority (`[#A]`), Scheduled Date, Deadline, or File order.
- **Keyboard First**: Optimised for speed with dedicated commands and hotkeys.
- **Editor Integration**: Syntax highlighting for all your custom keywords.

## Installation

This is a private development build.

1. Clone into `.obsidian/plugins/todo-inline`.
2. `npm install`
3. `npm run build`
4. Enable in Obsidian Community Plugins.

## Usage

### Task Format
Standard Keyword:
```markdown
TODO Write documentation
```

Checkbox Style (auto-synced):
```markdown
- [ ] TODO Write documentation
```

### Attributes
- **Priority**: `TODO [#A] High priority task`
- **Scheduled**: `SCHEDULED: <2025-12-25>`
- **Deadline**: `DEADLINE: <2025-12-31>`

### View
- **Click Keyword**: Cycle to next state.
- **Right Click**: Open context menu.
- **Click Text**: Jump to file location.
