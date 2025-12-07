import { App, Modal, Setting } from "obsidian";

interface KeywordEditResult {
    color: string;
    description: string; // Tooltip text
}

export class KeywordEditModal extends Modal {
    keyword: string;
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
        this.color = initialColor || "#888888"; // Default grey
        this.description = initialDesc || "";
        this.onSubmit = onSubmit;
    }

    // Predefined Color Palette (Swatches)
    // Predefined Color Palette (Swatches) - Excludes Black, White, and Dark Grays
    private readonly PREDEFINED_COLORS = [
        '#ff5555', '#ffb86c', '#f1fa8c', '#50fa7b', '#8be9fd', // Dracula
        '#bd93f9', '#ff79c6', '#6272a4', '#f8f8f2',            // More Dracula (Removed dark gray #44475a)
        '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', // One Dark
        '#d19a66', '#abb2bf', '#56b6c2', '#be5046',            // One Dark (Removed dark gray #282c34)
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', // Material
        '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFeb3B',
        '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B'
    ];

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: `Edit Keyword: ${this.keyword}` });

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
