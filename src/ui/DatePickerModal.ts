import { App, Modal } from 'obsidian';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import { DateInputFormat, DateParser } from '../parser/date-parser';

/**
 * US-4.1: Date Picker Modal
 * Ergonomic date selection using Flatpickr
 */
export class DatePickerModal extends Modal {
    private picker: FlatpickrInstance | null = null;
    private onSubmit: (date: Date | null) => void;
    private initialDate: Date | null;
    private dateFormat: DateInputFormat;
    private title: string;

    constructor(
        app: App,
        title: string,
        initialDate: Date | null,
        dateFormat: DateInputFormat,
        onSubmit: (date: Date | null) => void
    ) {
        super(app);
        this.title = title;
        this.initialDate = initialDate;
        this.dateFormat = dateFormat;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Title
        contentEl.createEl('h3', { text: this.title });

        // Date input container
        const inputContainer = contentEl.createDiv({ cls: 'date-picker-container' });
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: this.getFlatpickrFormat(),
            cls: 'date-picker-input'
        });

        // Initialize Flatpickr
        this.picker = flatpickr(input, {
            dateFormat: this.getFlatpickrFormat(),
            defaultDate: this.initialDate || undefined,
            inline: true, // Show calendar inline
            onChange: (selectedDates) => {
                if (selectedDates.length > 0) {
                    input.value = DateParser.formatDate(selectedDates[0], this.dateFormat);
                }
            }
        });

        // Shortcuts
        const shortcutsContainer = contentEl.createDiv({ cls: 'date-picker-shortcuts' });

        this.addShortcut(shortcutsContainer, 'Today', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        });

        this.addShortcut(shortcutsContainer, 'Tomorrow', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow;
        });

        this.addShortcut(shortcutsContainer, 'Next Week', () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(0, 0, 0, 0);
            return nextWeek;
        });

        this.addShortcut(shortcutsContainer, 'Clear', () => null);

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'date-picker-buttons' });

        const submitBtn = buttonContainer.createEl('button', {
            text: 'Set Date',
            cls: 'mod-cta'
        });
        submitBtn.addEventListener('click', () => {
            const selectedDates = this.picker?.selectedDates || [];
            this.onSubmit(selectedDates.length > 0 ? selectedDates[0] : null);
            this.close();
        });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());
    }

    private addShortcut(
        container: HTMLElement,
        label: string,
        getDate: () => Date | null
    ) {
        const btn = container.createEl('button', {
            text: label,
            cls: 'date-picker-shortcut'
        });
        btn.addEventListener('click', () => {
            const date = getDate();
            if (date) {
                this.picker?.setDate(date);
            } else {
                this.picker?.clear();
            }
        });
    }

    private getFlatpickrFormat(): string {
        switch (this.dateFormat) {
            case 'DD/MM/YYYY':
                return 'd/m/Y';
            case 'YYYY-MM-DD':
                return 'Y-m-d';
            case 'MM-DD-YYYY':
                return 'm-d-Y';
            default:
                return 'd/m/Y';
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (this.picker) {
            this.picker.destroy();
            this.picker = null;
        }
    }
}
