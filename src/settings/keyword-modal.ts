import { App, Modal, Setting } from "obsidian";

interface KeywordEditResult {
    newName: string;
    color: string;
    description: string; // Tooltip text
}

export class KeywordEditModal extends Modal {
    keyword: string;
    originalKeyword: string;
    color: string;
    description: string;
    onSubmit: (result: KeywordEditResult) => void;

    constructor(
        app: App,
        keyword: string,
        initialColor: string,
        initialDesc: string,
        onSubmit: (result: KeywordEditResult) => void
    ) {
        super(app);
        this.keyword = keyword;
        this.originalKeyword = keyword;
        this.color = initialColor || "#888888"; // Default grey
        this.description = initialDesc || "";
        this.onSubmit = onSubmit;
    }

    // Predefined Color Palette (Swatches)
    // Predefined Color Palette (Requested by User)
    private readonly PREDEFINED_COLORS = [
        '#FF5555', // Red
        '#FFB86C', // Orange
        '#43A047', // Green
        '#8BE9FD', // Cyan
        '#BD93F9', // Purple
        '#F1FA8C', // Yellow
        '#6272A4', // Blueish Grey
        '#50FA7B', // Bright Green
        '#FF79C6', // Pink
        '#44475A'  // Dark Grey/Navy
    ];

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: `Edit Keyword` });

        // 0. Name Edit
        new Setting(contentEl)
            .setName("Keyword Text")
            .setDesc("The actual text used in the editor.")
            .addText((text) =>
                text
                    .setValue(this.keyword)
                    .onChange((value) => {
                        this.keyword = value;
                    })
            );

        // 1. Description (Tooltip) - Moved up for better flow
        new Setting(contentEl)
            .setName("Description (Tooltip)")
            .setDesc("Text shown when hovering over the task status.")
            .addText((text) =>
                text
                    .setPlaceholder("e.g. Waiting for external review")
                    .setValue(this.description)
                    .onChange((value) => {
                        this.description = value;
                    })
            );

        // 2. Color Selection (Collapsible)
        new Setting(contentEl)
            .setName("Color")
            .setDesc("Click the circle to choose a color.")
            .addExtraButton(btn => {
                // Nothing here, we build custom UI below
            });

        // Container for Custom Picker
        const pickerContainer = contentEl.createDiv('picker-container');
        pickerContainer.style.marginBottom = '20px';
        pickerContainer.style.position = 'relative';

        // A. Selected Color Indicator (Trigger)
        const triggerBtn = pickerContainer.createDiv('color-trigger');
        triggerBtn.style.display = 'flex';
        triggerBtn.style.alignItems = 'center';
        triggerBtn.style.gap = '10px';
        triggerBtn.style.cursor = 'pointer';
        triggerBtn.style.padding = '5px';
        triggerBtn.style.borderRadius = '5px';
        triggerBtn.style.border = '1px solid var(--background-modifier-border)';
        triggerBtn.style.width = 'fit-content';

        const colorDot = triggerBtn.createDiv();
        colorDot.style.width = '24px';
        colorDot.style.height = '24px';
        colorDot.style.borderRadius = '50%';
        colorDot.style.backgroundColor = this.color;
        colorDot.style.border = '1px solid var(--text-muted)';

        const triggerLabel = triggerBtn.createSpan({ text: this.color });
        triggerBtn.appendChild(colorDot);
        triggerBtn.appendChild(triggerLabel);

        // B. Popover / Dropdown (Hidden by Default)
        const dropdown = pickerContainer.createDiv('color-dropdown');
        dropdown.style.display = 'none'; // Hidden initially
        dropdown.style.marginTop = '10px';
        dropdown.style.padding = '10px';
        dropdown.style.backgroundColor = 'var(--background-secondary)';
        dropdown.style.borderRadius = '8px';
        dropdown.style.border = '1px solid var(--background-modifier-border)';

        // Toggle Logic
        triggerBtn.onclick = () => {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';
        };

        // Grid of Presets
        const swatchGrid = dropdown.createDiv();
        swatchGrid.style.display = 'grid';
        swatchGrid.style.gridTemplateColumns = 'repeat(8, 1fr)';
        swatchGrid.style.gap = '6px';
        swatchGrid.style.marginBottom = '10px';

        this.PREDEFINED_COLORS.forEach(color => {
            const swatch = swatchGrid.createDiv();
            swatch.style.backgroundColor = color;
            swatch.style.width = '24px';
            swatch.style.height = '24px';
            swatch.style.borderRadius = '4px';
            swatch.style.cursor = 'pointer';
            swatch.style.border = '1px solid transparent';

            if (color === this.color) {
                swatch.style.border = '2px solid white';
                swatch.style.boxShadow = '0 0 0 1px var(--text-normal)';
            }

            swatch.onclick = () => {
                this.color = color;
                colorDot.style.backgroundColor = color;
                triggerLabel.innerText = color;
                dropdown.style.display = 'none'; // Auto-close on selection

                // Update active state in grid (optional if closing)
            };
        });

        // C. Custom RGB Input
        const customContainer = dropdown.createDiv();
        customContainer.style.borderTop = '1px solid var(--background-modifier-border)';
        customContainer.style.paddingTop = '10px';
        customContainer.style.display = 'flex';
        customContainer.style.alignItems = 'center';
        customContainer.style.gap = '10px';

        const customLabel = customContainer.createSpan({ text: "Custom RGB:" });

        const colorInput = customContainer.createEl('input', { type: 'color' });
        colorInput.value = this.color;
        colorInput.style.cursor = 'pointer';

        colorInput.onchange = (e: any) => {
            const val = e.target.value;
            this.color = val;
            colorDot.style.backgroundColor = val;
            triggerLabel.innerText = val;
            // Don't close immediately so user can adjust
        };

        customContainer.appendChild(colorInput);


        // Footer Buttons
        const footer = contentEl.createDiv({ cls: "modal-button-container" });
        footer.style.marginTop = '20px';

        const saveBtn = footer.createEl("button", { text: "Save", cls: "mod-cta" });
        saveBtn.addEventListener("click", () => {
            this.onSubmit({
                newName: this.keyword,
                color: this.color,
                description: this.description,
            });
            this.close();
        });

        const cancelBtn = footer.createEl("button", { text: "Cancel" });
        cancelBtn.addEventListener("click", () => {
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
