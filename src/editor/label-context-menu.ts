import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { Menu } from "obsidian";
import { SettingsService } from "../services/settings-service";
import {
    collectInlineLabels,
    mergeLabelsWithDefinedOrder,
    normalizeLabelKey,
} from "../labels/label-utils";

/**
 * Épica 5: Label Context Menu Extension for CodeMirror
 * Allows right-clicking on @label tokens in the editor to manage them
 */
export function labelContextMenu(
    settingsService: SettingsService
): Extension {
    return EditorView.domEventHandlers({
        contextmenu: (event: MouseEvent, view: EditorView) => {
            const settings = settingsService.settings;

            // Regex to detect labels
            const labelRegex = /@([A-Za-z][A-Za-z0-9_-]*)/g;

            // Get position from click
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            // Get the line at click position
            const line = view.state.doc.lineAt(pos);
            const lineText = line.text;

            // Find all label matches in the line
            let match;
            let clickedLabel: { label: string; start: number; end: number } | null = null;

            while ((match = labelRegex.exec(lineText)) !== null) {
                const start = line.from + match.index;
                const end = start + match[0].length;

                // Check if click position is within this label
                if (pos >= start && pos <= end) {
                    clickedLabel = {
                        label: match[1], // Label without @
                        start,
                        end
                    };
                    break;
                }
            }

            if (!clickedLabel) return false;

            // Prevent default context menu
            event.preventDefault();

            const docLabels = collectInlineLabels(view.state.doc.toString());
            const orderedLabels = mergeLabelsWithDefinedOrder(settings.definedLabels || [], docLabels);
            const clickedLabelKey = normalizeLabelKey(clickedLabel.label);
            const otherLabels = orderedLabels
                .filter(label => normalizeLabelKey(label) !== clickedLabelKey);

            // Create the menu
            const menu = new Menu();

            // Header showing what label was clicked
            menu.addItem(item => {
                item.setTitle(`Label: @${clickedLabel!.label}`)
                    .setIcon('tag')
                    .setDisabled(true);
            });

            menu.addSeparator();

            // If there are other labels in the document, show option to change to them
            if (otherLabels.length > 0) {
                menu.addItem(item => {
                    item.setTitle('Change to:')
                        .setIcon('edit')
                        .setDisabled(true);
                });

                otherLabels
                    .slice(0, 15) // Limit to 15 labels
                    .forEach(label => {
                        menu.addItem(item => {
                            item.setTitle(`  @${label}`)
                                .onClick(() => {
                                    // Replace the clicked label with the new one
                                    view.dispatch({
                                        changes: {
                                            from: clickedLabel!.start,
                                            to: clickedLabel!.end,
                                            insert: `@${label}`
                                        }
                                    });
                                });
                        });
                    });

                menu.addSeparator();
            }

            // Remove label option
            menu.addItem(item => {
                item.setTitle('Remove Label')
                    .setIcon('trash-2')
                    .onClick(() => {
                        // Remove the label and clean up whitespace
                        const before = view.state.doc.sliceString(clickedLabel!.start - 1, clickedLabel!.start);
                        const after = view.state.doc.sliceString(clickedLabel!.end, clickedLabel!.end + 1);

                        let deleteFrom = clickedLabel!.start;
                        let deleteTo = clickedLabel!.end;

                        // If there's a space before the label, include it
                        if (before === ' ') {
                            deleteFrom -= 1;
                        } else if (after === ' ') {
                            // Or if there's a space after
                            deleteTo += 1;
                        }

                        view.dispatch({
                            changes: {
                                from: deleteFrom,
                                to: deleteTo,
                                insert: ''
                            }
                        });
                    });
            });

            // Copy label option
            menu.addItem(item => {
                item.setTitle('Copy Label')
                    .setIcon('copy')
                    .onClick(() => {
                        navigator.clipboard.writeText(`@${clickedLabel!.label}`);
                    });
            });

            // Show the menu
            menu.showAtMouseEvent(event);

            return true;
        }
    });
}
