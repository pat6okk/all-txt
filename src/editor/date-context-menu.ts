import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { App } from "obsidian";
import { SettingsService } from "../services/settings-service";
import { DatePickerModal } from "../ui/DatePickerModal";
import { DateParser } from "../parser/date-parser";

/**
 * US-4.1 Phase 2: Context Menu for Dates in Editor
 * Adds right-click functionality to date lines in the editor.
 * When user right-clicks on a date line (PLAN/DUE), shows the DatePickerModal.
 */
export function dateContextMenu(
    app: App,
    settingsService: SettingsService
): Extension {

    return EditorView.domEventHandlers({
        contextmenu: (event: MouseEvent, view: EditorView) => {
            // Get the position in the document where the click occurred
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            const line = view.state.doc.lineAt(pos);
            const lineText = line.text;
            const trimText = lineText.trim();

            const scheduledKeywords = settingsService.settings.scheduledKeywords || ['PLAN'];
            const deadlineKeywords = settingsService.settings.deadlineKeywords || ['DUE'];
            const allDateKeywords = [...scheduledKeywords, ...deadlineKeywords];

            // Check if line corresponds to a date metadata line
            // Pattern: ^(KEYWORD):\s*(.*)$
            // We use a loose check first
            const matchedKeyword = allDateKeywords.find(k =>
                trimText.toUpperCase().startsWith(`${k.toUpperCase()}:`) ||
                trimText.toUpperCase().startsWith(`${k.toUpperCase()} `) // Handling potential variations without colon
            );

            if (!matchedKeyword) return false;

            // Optional: Check if click is actually on or near the text (simple check already done by getting line)
            // But we might want to restrict it to clicking ON the date part or the keyword.
            // For now, clicking anywhere on the metadata line triggers it (good UX).

            // Extract current date text
            // Format assumed: KEYWORD: <DATE> or KEYWORD: DATE
            // We can reuse logic similar to DateParser but here we just want the value part
            const valuePart = trimText.substring(matchedKeyword.length).trim();
            // Remove optional colon at start of value if it was not part of keyword match (it usually isn't)
            const dateText = valuePart.replace(/^[:\s]+/, '');

            // Try to parse existing date
            const currentDate = DateParser.parseDate(dateText);

            // Prevent default context menu
            event.preventDefault();
            event.stopPropagation();

            // Open DatePicker
            const title = scheduledKeywords.includes(matchedKeyword) ? 'Edit Plan Date' : 'Edit Due Date';

            new DatePickerModal(
                app,
                title,
                currentDate,
                settingsService.settings.dateFormat,
                (newDate) => {
                    updateDateInEditor(line, matchedKeyword, newDate, view, settingsService);
                }
            ).open();

            return true; // Event handled
        }
    });
}

function updateDateInEditor(
    line: any,
    keyword: string,
    newDate: Date | null,
    view: EditorView,
    settingsService: SettingsService
) {
    const lineText = line.text;
    const trimmedStart = lineText.match(/^(\s*)/);
    const indent = trimmedStart ? trimmedStart[1] : '';

    if (newDate) {
        // Format new date
        const formattedDate = DateParser.formatDate(newDate, settingsService.settings.dateFormat);
        const newLineText = `${indent}${keyword}: ${formattedDate}`;

        view.dispatch({
            changes: {
                from: line.from,
                to: line.to,
                insert: newLineText
            }
        });
    } else {
        // If date cleared, remove the line? Or just clear value?
        // Usually removing the line is better for metadata lines.
        const tr = view.state.update({
            changes: {
                from: line.from,
                to: line.to + 1, // +1 to include newline character if it exists (basic approximation)
                insert: ''
            }
        });
        view.dispatch(tr);
    }
}
