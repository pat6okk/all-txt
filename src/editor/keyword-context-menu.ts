import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Menu } from "obsidian";
import { WorkflowService } from "../services/workflow-service";
import { TaskEditor } from "../view/task-editor";

/**
 * US-3.4: Context Menu in Editor
 * Adds right-click functionality to keywords in the editor.
 * When user right-clicks on a keyword, shows a context menu to change state directly.
 */
export function keywordContextMenu(
    workflowService: WorkflowService,
    taskEditor: TaskEditor
): Extension {

    return EditorView.domEventHandlers({
        contextmenu: (event: MouseEvent, view: EditorView) => {
            // Get the position in the document where the click occurred
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            const line = view.state.doc.lineAt(pos);
            const lineText = line.text;

            // Check if this line contains a keyword at the start
            const allKeywords = workflowService.getAllKeywords();
            const trimmedStart = lineText.match(/^(\s*)/);
            if (!trimmedStart) return false;

            const indent = trimmedStart[1].length;
            const afterIndent = lineText.substring(indent);

            // Build regex to match keywords
            const escapedKeywords = allKeywords
                .filter(k => k && k.length > 0)
                .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');

            if (!escapedKeywords) return false;

            const keywordRegex = new RegExp(`\\b(${escapedKeywords})\\b`, 'i');
            const match = afterIndent.match(keywordRegex);

            if (!match || match.index !== 0) {
                // Click was not on a keyword at start of line
                return false;
            }

            const keyword = match[1];

            // Calculate the position of the keyword in the document
            const keywordStart = line.from + indent;
            const keywordEnd = keywordStart + keyword.length;

            // Check if the click position is within the keyword bounds
            if (pos < keywordStart || pos > keywordEnd) {
                return false; // Click was not on the keyword
            }

            // Prevent default context menu
            event.preventDefault();
            event.stopPropagation();

            // Show our custom context menu
            showStateMenu(event, keyword, line, workflowService, taskEditor, view);

            return true; // Event handled
        }
    });
}

function showStateMenu(
    event: MouseEvent,
    currentKeyword: string,
    line: any,
    workflowService: WorkflowService,
    taskEditor: TaskEditor,
    view: EditorView
) {
    const menu = new Menu();

    // Helper to add sections
    const addSection = (header: string, keywords: string[]) => {
        if (!keywords.length) return;

        menu.addItem(item => {
            item.setTitle(header);
            item.setIcon('hash');
            item.setIsLabel?.(true); // Mark as label if API supports it
        });

        keywords.forEach(state => {
            menu.addItem(item => {
                item.setTitle(state)
                    .setChecked(currentKeyword.toUpperCase() === state.toUpperCase())
                    .onClick(() => {
                        updateKeywordInEditor(line, currentKeyword, state, view);
                    });
            });
        });
        menu.addSeparator();
    };

    addSection("Pending", workflowService.getPendingKeywords());
    addSection("Active", workflowService.getActiveKeywords());
    addSection("Completed", workflowService.getCompletedKeywords());

    menu.showAtMouseEvent(event);
}

function updateKeywordInEditor(
    line: any,
    oldKeyword: string,
    newKeyword: string,
    view: EditorView
) {
    const lineText = line.text;

    // Find and replace the keyword
    // We need to be careful to only replace the first occurrence (the state keyword)
    const trimmedStart = lineText.match(/^(\s*)/);
    if (!trimmedStart) return;

    const indent = trimmedStart[1].length;
    const afterIndent = lineText.substring(indent);

    // Build regex to match the old keyword at the start
    const escapedOld = oldKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordRegex = new RegExp(`^(${escapedOld})\\b`, 'i');

    if (!keywordRegex.test(afterIndent)) {
        return; // Safety check: keyword not at expected position
    }

    // Replace the keyword
    const newAfterIndent = afterIndent.replace(keywordRegex, newKeyword);
    const newLineText = lineText.substring(0, indent) + newAfterIndent;

    // Apply the change to the editor
    view.dispatch({
        changes: {
            from: line.from,
            to: line.to,
            insert: newLineText
        }
    });
}
