# Changelog

## [0.1.0] - 2025-12-06
### Reborn
- **Architecture**: Complete rewrite of the state management system using a reactive `TaskStore`.
- **Performance**: Removed polling loops in favor of event-driven updates.
- **UI**: New localized Task View with persisted state and improved rendering.
- **Configuration**:
    - **Removed**: Legacy `additionalTaskKeywords`.
    - **Added**: Granular state management (Pending, Active, Completed).
    - **Added**: UI State persistence (Sorting, Collapsed groups).
- **Cleanup**: Massive dead code removal and optimization.
