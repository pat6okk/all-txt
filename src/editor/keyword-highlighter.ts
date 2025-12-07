import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, MatchDecorator } from "@codemirror/view";
import { TodoTrackerSettings } from "../settings/defaults";

export function keywordHighlighter(getSettings: () => TodoTrackerSettings): Extension {
    // We build the decorator based on current settings.
    // Note: If settings change (keywords/colors), this extension would ideally need to be reconfigured.
    // For now, we assume this is initialized on load.

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

    // 3. Build Regex
    // Matches: [whitespace or start of line] + KEYWORD + [whitespace or end of line]
    // We use word boundary \b for safety.
    const escapedKeywords = Array.from(keywordMap.keys())
        .filter(k => k && k.length > 0)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    if (!escapedKeywords) return [];

    const regexp = new RegExp(`\\b(${escapedKeywords})\\b`, 'g');

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

    // 5. Use MatchDecorator (Robust standard CM6 pattern)
    try {
        const decorator = new MatchDecorator({
            regexp,
            decoration: (match) => {
                const keyword = match[1].toUpperCase();
                const color = keywordMap.get(keyword) || '#888888';
                const contrast = getContrastColor(color);

                return Decoration.mark({
                    attributes: {
                        style: `
                            background-color: ${color}; 
                            color: ${contrast}; 
                            border-radius: 4px; 
                            padding: 0 4px; 
                            font-weight: bold; 
                            font-size: 0.85em;
                        `
                    }
                });
            }
        });

        return ViewPlugin.fromClass(class {
            decorations: DecorationSet;
            constructor(view: EditorView) {
                this.decorations = decorator.createDeco(view);
            }
            update(update: ViewUpdate) {
                this.decorations = decorator.updateDeco(update, this.decorations);
            }
        }, {
            decorations: v => v.decorations
        });
    } catch (e) {
        console.error("TODO inline: Error initializing keyword highlighter", e);
        return [];
    }
}
