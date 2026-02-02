import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { TodoTrackerSettings } from "../settings/defaults";

export function keywordHighlighter(getSettings: () => TodoTrackerSettings): Extension {
    const settings = getSettings();
    const keywordMap = new Map<string, string>();

    // 1. Load explicit colors
    if (settings.keywordColors) {
        for (const [k, v] of Object.entries(settings.keywordColors)) {
            if (k) keywordMap.set(k.toUpperCase(), v);
        }
    }

    // 2. Ensure all keywords have at least a default color
    const allKeywords = new Set([
        ...(settings.todoKeywords || []),
        ...(settings.doingKeywords || []),
        ...(settings.doneKeywords || [])
    ]);

    allKeywords.forEach(k => {
        if (!keywordMap.has(k)) {
            keywordMap.set(k, '#888888'); // Default grey
        }
    });

    if (keywordMap.size === 0) return [];

    // 3. Build Regex for keyword matching (without capturing whitespace)
    const escapedKeywords = Array.from(keywordMap.keys())
        .filter(k => k && k.length > 0)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    if (!escapedKeywords) return [];

    // Regex to match keywords at start of line (after whitespace)
    const keywordRegex = new RegExp(`\\b(${escapedKeywords})\\b`, 'i');

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

    // 5. ViewPlugin that decorates keywords
    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
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

                    // Check if line starts with a keyword (after indentation)
                    const match = afterIndent.match(keywordRegex);

                    if (match && match.index === 0) {
                        const keyword = match[1].toUpperCase();
                        const color = keywordMap.get(keyword);

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

                    pos = line.to + 1;
                }
            }

            return Decoration.set(decorations, true);
        }
    }, {
        decorations: v => v.decorations
    });
}
