import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    Notice,
    TFile,
} from 'obsidian';
import { SettingsService } from '../services/settings-service';
import {
    collectInlineLabels,
    mergeLabelsWithDefinedOrder,
    normalizeLabelKey,
    toValidLabelDisplay,
} from '../labels/label-utils';
import { Task } from '../task';

type LabelScope = 'note' | 'vault';

interface LabelSuggestionItem {
    type: 'label' | 'create' | 'toggle-scope';
    label: string;
    detail?: string;
}

interface SuggestListController<T> {
    suggest?: {
        setSuggestions: (items: T[]) => void;
    };
}

export class LabelEditorSuggest extends EditorSuggest<LabelSuggestionItem> {
    private labelScope: LabelScope = 'note';
    private triggerAnchor: string | null = null;

    constructor(
        app: App,
        private readonly settingsService: SettingsService,
        private readonly getVaultTasks: () => Task[],
    ) {
        super(app);
        this.limit = 40;
        this.setInstructions([
            { command: '↑ ↓', purpose: 'Navigate labels' },
            { command: 'Enter', purpose: 'Apply label' },
            { command: 'Esc', purpose: 'Close' },
        ]);
    }

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
        if (!file) {
            this.resetScope();
            return null;
        }

        const lineBeforeCursor = editor.getLine(cursor.line).slice(0, cursor.ch);
        const match = lineBeforeCursor.match(/(?:^|\s)@([A-Za-z0-9_-]*)$/);
        if (!match) {
            this.resetScope();
            return null;
        }

        const query = match[1] || '';
        const anchorCh = cursor.ch - query.length;
        const anchor = `${file?.path || 'unknown'}:${cursor.line}:${anchorCh}`;
        if (this.triggerAnchor !== anchor) {
            this.labelScope = 'note';
            this.triggerAnchor = anchor;
        }

        return {
            start: { line: cursor.line, ch: anchorCh },
            end: cursor,
            query,
        };
    }

    getSuggestions(context: EditorSuggestContext): LabelSuggestionItem[] {
        const labels = this.getScopedLabels(context.editor);
        const queryLower = context.query.toLowerCase();
        const suggestions: LabelSuggestionItem[] = labels
            .filter(label => !queryLower || label.toLowerCase().includes(queryLower))
            .slice(0, this.limit)
            .map(label => ({
                type: 'label',
                label,
                detail: this.labelScope === 'note' ? 'Current note' : 'Vault',
            }));

        const queryLabel = toValidLabelDisplay(context.query);
        if (queryLabel) {
            const exists = labels.some(label => normalizeLabelKey(label) === normalizeLabelKey(queryLabel));
            if (!exists) {
                suggestions.unshift({
                    type: 'create',
                    label: queryLabel,
                    detail: 'Create and add to defined labels',
                });
            }
        }

        suggestions.push({
            type: 'toggle-scope',
            label: this.labelScope === 'note'
                ? 'Show all vault labels'
                : 'Show only note labels',
            detail: this.labelScope === 'note' ? 'Expand scope' : 'Use current note scope',
        });

        return suggestions;
    }

    renderSuggestion(value: LabelSuggestionItem, el: HTMLElement): void {
        el.empty();

        const title = el.createDiv({ cls: 'flowtxt-label-suggest-title' });
        if (value.type === 'label') {
            title.setText(`@${value.label}`);
        } else if (value.type === 'create') {
            title.setText(`Create @${value.label}`);
        } else {
            title.setText(value.label);
        }

        if (value.detail) {
            const detail = el.createDiv({ cls: 'flowtxt-label-suggest-detail' });
            detail.setText(value.detail);
        }
    }

    async selectSuggestion(value: LabelSuggestionItem): Promise<void> {
        if (!this.context) {
            return;
        }

        if (value.type === 'toggle-scope') {
            this.labelScope = this.labelScope === 'note' ? 'vault' : 'note';
            this.refreshSuggestionsInPlace();
            return;
        }

        let labelToInsert = value.label;
        if (value.type === 'create') {
            const created = await this.settingsService.upsertDefinedLabel(value.label);
            if (!created) {
                new Notice('Invalid label. Use format: @Label or Label.');
                return;
            }
            labelToInsert = created;
        }

        this.insertLabel(this.context.editor, this.context.start, this.context.end, labelToInsert);
        this.close();
    }

    private resetScope() {
        this.labelScope = 'note';
        this.triggerAnchor = null;
    }

    private getScopedLabels(editor: Editor): string[] {
        const noteLabels = mergeLabelsWithDefinedOrder(
            this.settingsService.getOrderedDefinedLabels(),
            collectInlineLabels(editor.getValue()),
        );

        if (this.labelScope === 'note') {
            return noteLabels;
        }

        const vaultLabels = mergeLabelsWithDefinedOrder(
            this.settingsService.getOrderedDefinedLabels(),
            this.getVaultTasks().flatMap(task => task.labels || []),
        );
        return vaultLabels;
    }

    private insertLabel(editor: Editor, start: EditorPosition, end: EditorPosition, label: string) {
        editor.replaceRange(label, start, end);

        const insertionEndCh = start.ch + label.length;
        const lineText = editor.getLine(start.line);
        const nextChar = lineText[insertionEndCh] || '';

        const shouldAddSpace = nextChar === '' || !/[\s.,;:!?)]/.test(nextChar);
        if (shouldAddSpace) {
            const pos = { line: start.line, ch: insertionEndCh };
            editor.replaceRange(' ', pos);
            editor.setCursor({ line: start.line, ch: insertionEndCh + 1 });
            return;
        }

        editor.setCursor({ line: start.line, ch: insertionEndCh });
    }

    private refreshSuggestionsInPlace() {
        const controller = this as unknown as SuggestListController<LabelSuggestionItem>;
        if (!this.context || !controller.suggest) {
            this.close();
            return;
        }

        controller.suggest.setSuggestions(this.getSuggestions(this.context));
    }
}
