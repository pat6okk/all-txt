import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Menu } from "obsidian";
import { SettingsService } from "../services/settings-service";

/**
 * Priority Context Menu in Editor
 * Adds right-click functionality to priority tokens in the editor.
 * When user right-clicks on a priority (P1, P2, etc.), shows a context menu to change it.
 */
export function priorityContextMenu(
    settingsService: SettingsService
): Extension {
    return EditorView.domEventHandlers({
        contextmenu: (event: MouseEvent, view: EditorView) => {
            const settings = settingsService.settings;
            const priorityQueues = settings.priorityQueues || [];
            const allPriorities: string[] = priorityQueues.flat();

            if (allPriorities.length === 0) return false;

            // Get the position in the document where the click occurred
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            const line = view.state.doc.lineAt(pos);
            const lineText = line.text;

            // Build regex to match priority tokens
            const escapedPriorities = allPriorities
                .filter(p => p && p.length > 0)
                .sort((a, b) => b.length - a.length) // Longest first
                .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');

            if (!escapedPriorities) return false;

            // Match priority anywhere in line (with word boundaries)
            const priorityRegex = new RegExp(`(?:^|\\s)(${escapedPriorities})(?=\\s|$)`, 'gi');

            // Find all priorities in the line
            let match;
            let foundPriority: { start: number; end: number; value: string } | null = null;

            while ((match = priorityRegex.exec(lineText)) !== null) {
                const matchStart = match.index + (match[0].length - match[1].length);
                const matchEnd = matchStart + match[1].length;
                const absoluteStart = line.from + matchStart;
                const absoluteEnd = line.from + matchEnd;

                // Check if click is within this priority
                if (pos >= absoluteStart && pos <= absoluteEnd) {
                    foundPriority = {
                        start: absoluteStart,
                        end: absoluteEnd,
                        value: match[1]
                    };
                    break;
                }
            }

            if (!foundPriority) {
                return false; // Click was not on a priority
            }

            // Prevent default context menu
            event.preventDefault();
            event.stopPropagation();

            // Show our custom context menu
            showPriorityMenu(
                event,
                foundPriority,
                line,
                priorityQueues,
                settings.keywordColors || {},
                view
            );

            return true; // Event handled
        }
    });
}

function showPriorityMenu(
    event: MouseEvent,
    currentPriority: { start: number; end: number; value: string },
    line: any,
    priorityQueues: string[][],
    keywordColors: Record<string, string>,
    view: EditorView
) {
    const menu = new Menu();

    // Add header
    menu.addItem(item => {
        item.setTitle("Change Priority");
        item.setIcon('flag');
        item.setIsLabel?.(true);
    });

    // Helper to get color for a priority
    const getColor = (p: string): string => {
        return keywordColors[p] || keywordColors[p.toUpperCase()] || '#888888';
    };

    // Add each priority queue as a section
    priorityQueues.forEach((queue, queueIndex) => {
        if (queueIndex > 0) {
            menu.addSeparator();
        }

        queue.forEach(priority => {
            const isSelected = currentPriority.value.toUpperCase() === priority.toUpperCase();
            const color = getColor(priority);

            menu.addItem(item => {
                item.setTitle(priority)
                    .setChecked(isSelected)
                    .onClick(() => {
                        updatePriorityInEditor(currentPriority, priority, view);
                    });
            });
        });
    });

    // Add option to remove priority
    menu.addSeparator();
    menu.addItem(item => {
        item.setTitle("Remove Priority")
            .setIcon('x')
            .onClick(() => {
                removePriorityFromEditor(currentPriority, line, view);
            });
    });

    menu.showAtMouseEvent(event);
}

function updatePriorityInEditor(
    currentPriority: { start: number; end: number; value: string },
    newPriority: string,
    view: EditorView
) {
    // Replace the priority token directly
    view.dispatch({
        changes: {
            from: currentPriority.start,
            to: currentPriority.end,
            insert: newPriority
        }
    });
}

function removePriorityFromEditor(
    currentPriority: { start: number; end: number; value: string },
    line: any,
    view: EditorView
) {
    const lineText = line.text;
    const localStart = currentPriority.start - line.from;
    const localEnd = currentPriority.end - line.from;

    // Check if there's a space before or after to remove
    let removeFrom = currentPriority.start;
    let removeTo = currentPriority.end;

    // If there's a space before the priority, remove it too
    if (localStart > 0 && lineText[localStart - 1] === ' ') {
        removeFrom = currentPriority.start - 1;
    }
    // Otherwise, if there's a space after, remove that
    else if (localEnd < lineText.length && lineText[localEnd] === ' ') {
        removeTo = currentPriority.end + 1;
    }

    view.dispatch({
        changes: {
            from: removeFrom,
            to: removeTo,
            insert: ''
        }
    });
}
