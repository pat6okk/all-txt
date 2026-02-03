import { App, Modal } from 'obsidian';
import { DateInputFormat, DateParser } from '../parser/date-parser';

/**
 * US-4.1: Date Picker Modal
 * Simple and intuitive date selection using HTML5 native date input
 */
export class DatePickerModal extends Modal {
    private onSubmit: (date: Date | null) => void;
    private initialDate: Date | null;
    private dateFormat: DateInputFormat;
    private title: string;
    private selectedDate: Date | null;

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
        this.selectedDate = initialDate;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('date-picker-modal');

        // Title
        contentEl.createEl('h3', { text: this.title });

        // Date input container
        const inputContainer = contentEl.createDiv({ cls: 'date-picker-container' });

        const label = inputContainer.createEl('label', {
            text: 'Select Date:',
            cls: 'date-picker-label'
        });
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        label.style.fontWeight = '500';

        // HTML5 date input
        const input = inputContainer.createEl('input', {
            type: 'date',
            cls: 'date-picker-input'
        });

        // Set initial value in ISO format (required by HTML5 date input)
        if (this.initialDate) {
            input.value = this.formatDateForInput(this.initialDate);
        }

        // Update selected date on change
        input.addEventListener('change', () => {
            if (input.value) {
                this.selectedDate = this.parseDateFromInput(input.value);
            } else {
                this.selectedDate = null;
            }
        });

        // Shortcuts
        const shortcutsContainer = contentEl.createDiv({ cls: 'date-picker-shortcuts' });
        shortcutsContainer.createEl('span', {
            text: 'Quick Actions:',
            cls: 'date-picker-shortcuts-label'
        });

        const shortcutsButtons = shortcutsContainer.createDiv({ cls: 'date-picker-shortcuts-buttons' });

        this.addShortcut(shortcutsButtons, 'Today', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }, input);

        this.addShortcut(shortcutsButtons, 'Tomorrow', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow;
        }, input);

        this.addShortcut(shortcutsButtons, 'Next Week', () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(0, 0, 0, 0);
            return nextWeek;
        }, input);

        this.addShortcut(shortcutsButtons, 'Clear', () => null, input);

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'date-picker-buttons' });

        const submitBtn = buttonContainer.createEl('button', {
            text: 'Set Date',
            cls: 'mod-cta'
        });
        submitBtn.addEventListener('click', () => {
            this.onSubmit(this.selectedDate);
            this.close();
        });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());
    }

    private addShortcut(
        container: HTMLElement,
        label: string,
        getDate: () => Date | null,
        input: HTMLInputElement
    ) {
        const btn = container.createEl('button', {
            text: label,
            cls: 'date-picker-shortcut'
        });
        btn.addEventListener('click', () => {
            const date = getDate();
            this.selectedDate = date;
            if (date) {
                input.value = this.formatDateForInput(date);
            } else {
                input.value = '';
            }
        });
    }

    /**
     * Format Date to YYYY-MM-DD for HTML5 input
     */
    private formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Parse YYYY-MM-DD from HTML5 input to Date
     */
    private parseDateFromInput(value: string): Date {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
