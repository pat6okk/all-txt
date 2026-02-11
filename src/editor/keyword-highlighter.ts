import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { TodoTrackerSettings } from "../settings/defaults";
import { normalizeLabelKey } from "../labels/label-utils";

export function keywordHighlighter(getSettings: () => TodoTrackerSettings): Extension {
    const settings = getSettings();
    const keywordMap = new Map<string, string>();
    const priorityMap = new Map<string, string>();

    // 1. Identify ONLY active keywords
    // We ignore orphaned colors in settings.keywordColors that are not in these lists
    const activeKeywords = new Set([
        ...(settings.todoKeywords || []),
        ...(settings.doingKeywords || []),
        ...(settings.doneKeywords || [])
    ]);

    // 2. Build map and assign colors
    activeKeywords.forEach(k => {
        if (!k) return;
        const upperK = k.toUpperCase();

        // Priority 1: Explicit user color
        if (settings.keywordColors && settings.keywordColors[k]) {
            keywordMap.set(upperK, settings.keywordColors[k]);
        }
        // Priority 2: Default grey if active but no color set (fallback)
        else {
            keywordMap.set(upperK, '#888888');
        }
    });

    // 3. Load priority keywords and their colors
    const priorityQueues = settings.priorityQueues || [];
    const allPriorities: string[] = priorityQueues.flat();

    allPriorities.forEach(p => {
        const upperP = p.toUpperCase();
        if (settings.keywordColors && settings.keywordColors[p]) {
            priorityMap.set(upperP, settings.keywordColors[p]);
        } else {
            priorityMap.set(upperP, '#888888');
        }
    });

    if (keywordMap.size === 0 && priorityMap.size === 0) return [];

    // 4. Build Regex for state keyword matching
    const escapedKeywords = Array.from(keywordMap.keys())
        .filter(k => k && k.length > 0)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    const keywordRegex = escapedKeywords
        ? new RegExp(`\\b(${escapedKeywords})\\b`, 'i')
        : null;

    // 5. Build Regex for priority matching (anywhere in line, after state)
    const escapedPriorities = Array.from(priorityMap.keys())
        .filter(k => k && k.length > 0)
        // Sort by length descending to match longer tokens first (P12 before P1)
        .sort((a, b) => b.length - a.length)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    const priorityRegex = escapedPriorities
        ? new RegExp(`(?:^|\\s)(${escapedPriorities})(?=\\s|$)`, 'gi')
        : null;

    // 6. Build Regex for label matching (@label syntax) - Épica 5
    // Matches @word tokens (alphanumeric + underscores/dashes)
    const labelRegex = /(?:^|\s)(@[A-Za-z][A-Za-z0-9_-]*)(?=\s|$|[.,;:!?])/g;

    // Load label colors from settings
    const labelColors = settings.labelColors || {};

    // Default label color (purple-ish for visual distinction)
    const defaultLabelColor = '#BD93F9';

    // 4. Helper for contrast color
    const getContrastColor = (hexcolor: string): string => {
        try {
            const hex = hexcolor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'black' : 'white';
        } catch (e) {
            return 'white';
        }
    };

    // 7. ViewPlugin that decorates keywords (now reactive to settings changes)
    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;
        // Cache current maps and regex (will be rebuilt when settings change)
        keywordMap: Map<string, string>;
        priorityMap: Map<string, string>;
        keywordRegex: RegExp | null;
        priorityRegex: RegExp | null;
        labelColors: Record<string, string>;
        settingsHash: string;

        constructor(view: EditorView) {
            // Initialize with current settings
            this.settingsHash = "";
            this.keywordMap = new Map();
            this.priorityMap = new Map();
            this.keywordRegex = null;
            this.priorityRegex = null;
            this.labelColors = {};
            this.rebuildMapsAndRegex();
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            // Check if settings have changed
            const currentSettings = getSettings();
            const newHash = this.hashSettings(currentSettings);

            if (newHash !== this.settingsHash) {
                // Settings changed - rebuild maps and regex
                this.rebuildMapsAndRegex();
                this.settingsHash = newHash;
                // Force full redecoration
                this.decorations = this.buildDecorations(update.view);
            } else if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        // Generate simple hash of relevant settings to detect changes
        hashSettings(settings: TodoTrackerSettings): string {
            const relevantData = [
                JSON.stringify(settings.todoKeywords),
                JSON.stringify(settings.doingKeywords),
                JSON.stringify(settings.doneKeywords),
                JSON.stringify(settings.priorityQueues),
                JSON.stringify(settings.keywordColors),
                JSON.stringify(settings.labelColors)
            ];
            return relevantData.join('|');
        }

        // Rebuild all maps and regex from current settings
        rebuildMapsAndRegex() {
            const settings = getSettings();

            // Clear existing maps
            this.keywordMap.clear();
            this.priorityMap.clear();

            // 1. Build keyword map
            const activeKeywords = new Set([
                ...(settings.todoKeywords || []),
                ...(settings.doingKeywords || []),
                ...(settings.doneKeywords || [])
            ]);

            activeKeywords.forEach(k => {
                if (!k) return;
                const upperK = k.toUpperCase();
                if (settings.keywordColors && settings.keywordColors[k]) {
                    this.keywordMap.set(upperK, settings.keywordColors[k]);
                } else {
                    this.keywordMap.set(upperK, '#888888');
                }
            });

            // 2. Build priority map
            const priorityQueues = settings.priorityQueues || [];
            const allPriorities: string[] = priorityQueues.flat();

            allPriorities.forEach(p => {
                const upperP = p.toUpperCase();
                if (settings.keywordColors && settings.keywordColors[p]) {
                    this.priorityMap.set(upperP, settings.keywordColors[p]);
                } else {
                    this.priorityMap.set(upperP, '#888888');
                }
            });

            // 3. Build keyword regex
            const escapedKeywords = Array.from(this.keywordMap.keys())
                .filter(k => k && k.length > 0)
                .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');

            this.keywordRegex = escapedKeywords
                ? new RegExp(`\\b(${escapedKeywords})\\b`, 'i')
                : null;

            // 4. Build priority regex
            const escapedPriorities = Array.from(this.priorityMap.keys())
                .filter(k => k && k.length > 0)
                .sort((a, b) => b.length - a.length)
                .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');

            this.priorityRegex = escapedPriorities
                ? new RegExp(`(?:^|\\s)(${escapedPriorities})(?=\\s|$)`, 'gi')
                : null;

            // 5. Load label colors
            this.labelColors = settings.labelColors || {};
        }

        buildDecorations(view: EditorView): DecorationSet {
            const decorations: any[] = [];

            for (let { from, to } of view.visibleRanges) {
                const doc = view.state.doc;
                let pos = from;

                while (pos <= to) {
                    const line = doc.lineAt(pos);
                    const lineText = line.text;

                    // Skip if line doesn't start with whitespace + keyword pattern
                    const trimmedStart = lineText.match(/^(\s*)/);
                    if (!trimmedStart) {
                        pos = line.to + 1;
                        continue;
                    }

                    const indent = trimmedStart[1].length;
                    const afterIndent = lineText.substring(indent);

                    // Check if line starts with a state keyword (after indentation)
                    if (this.keywordRegex) {
                        const match = afterIndent.match(this.keywordRegex);

                        if (match && match.index === 0) {
                            const keyword = match[1].toUpperCase();
                            const color = this.keywordMap.get(keyword);

                            if (color) {
                                const contrast = getContrastColor(color);
                                const keywordStart = line.from + indent;
                                const keywordEnd = keywordStart + match[1].length;

                                decorations.push(
                                    Decoration.mark({
                                        class: 'cm-todo-keyword',
                                        attributes: {
                                            style: `
                                                background-color: ${color}; 
                                                color: ${contrast}; 
                                                border-radius: 3px; 
                                                padding: 0 4px; 
                                                font-weight: bold; 
                                                font-size: 0.85em;
                                            `
                                        }
                                    }).range(keywordStart, keywordEnd)
                                );
                            }
                        }
                    }

                    // Check for priority tokens anywhere in the line
                    if (this.priorityRegex) {
                        // Reset regex lastIndex for each line
                        this.priorityRegex.lastIndex = 0;
                        let priorityMatch;

                        while ((priorityMatch = this.priorityRegex.exec(lineText)) !== null) {
                            const priority = priorityMatch[1].toUpperCase();
                            const color = this.priorityMap.get(priority);

                            if (color) {
                                const contrast = getContrastColor(color);
                                // Calculate position: match.index + leading space length
                                const matchStart = priorityMatch.index + (priorityMatch[0].length - priorityMatch[1].length);
                                const priorityStart = line.from + matchStart;
                                const priorityEnd = priorityStart + priorityMatch[1].length;

                                decorations.push(
                                    Decoration.mark({
                                        class: 'cm-todo-priority',
                                        attributes: {
                                            style: `
                                                background-color: ${color}; 
                                                color: ${contrast}; 
                                                border-radius: 3px; 
                                                padding: 0 3px; 
                                                font-weight: 600; 
                                                font-size: 0.8em;
                                                margin-left: 2px;
                                            `
                                        }
                                    }).range(priorityStart, priorityEnd)
                                );
                            }
                        }
                    }

                    // Check for label tokens (@label) anywhere in the line - Épica 5
                    labelRegex.lastIndex = 0;
                    let labelMatch;

                    while ((labelMatch = labelRegex.exec(lineText)) !== null) {
                        const labelWithAt = labelMatch[1]; // Includes the @
                        const labelName = labelWithAt.substring(1); // Without @

                        // Get color from settings or use default
                        const color =
                            this.labelColors[normalizeLabelKey(labelName)]
                            || this.labelColors[labelName]
                            || this.labelColors[labelWithAt]
                            || defaultLabelColor;
                        const contrast = getContrastColor(color);

                        // Calculate position
                        const matchStart = labelMatch.index + (labelMatch[0].length - labelMatch[1].length);
                        const labelStart = line.from + matchStart;
                        const labelEnd = labelStart + labelMatch[1].length;

                        decorations.push(
                            Decoration.mark({
                                class: 'cm-todo-label',
                                attributes: {
                                    style: `
                                        background-color: ${color}; 
                                        color: ${contrast}; 
                                        border-radius: 10px; 
                                        padding: 0 6px; 
                                        font-weight: 500; 
                                        font-size: 0.8em;
                                        margin-left: 2px;
                                    `
                                }
                            }).range(labelStart, labelEnd)
                        );
                    }

                    pos = line.to + 1;
                }
            }

            return Decoration.set(decorations, true);
        }
    }, {
        decorations: v => v.decorations
    });
}
