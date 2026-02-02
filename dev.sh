#!/bin/zsh

# Script de utilidad para desarrollo de FLOW.txt
# Ayuda a configurar symlinks y automatizar el build

PROJECT_ROOT=$(pwd)
MAIN="main.js"
MANIFEST="manifest.json"
STYLES="styles.css"

print_usage() {
    echo "Usage:"
    echo "  ./dev.sh link [ruta_boveda]   - Crea symlinks en tu boveda de Obsidian"
    echo "  ./dev.sh build                 - Compila el proyecto"
    echo ""
    echo "Ejemplo:"
    echo "  ./dev.sh link /Users/pat/Documents/ObsidianVault"
}

case "$1" in
    "link")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar la ruta de tu boveda."
            print_usage
            exit 1
        fi

        VAULT_PATH="$2"
        PLUGIN_PATH="$VAULT_PATH/.obsidian/plugins/flow-txt"

        if [ ! -d "$VAULT_PATH" ]; then
            echo "❌ Error: La carpeta de la boveda no existe: $VAULT_PATH"
            exit 1
        fi

        echo "🚀 Configurando entorno en: $PLUGIN_PATH"

        # Crear carpeta de plugin si no existe
        mkdir -p "$PLUGIN_PATH"

        # Crear symlinks
        for file in "$MAIN" "$MANIFEST" "$STYLES"; do
            TARGET="$PLUGIN_PATH/$file"
            SOURCE="$PROJECT_ROOT/$file"

            # Borrar si ya existe (para asegurar que sea el symlink correcto)
            if [ -L "$TARGET" ]; then
                rm "$TARGET"
            elif [ -f "$TARGET" ]; then
                echo "⚠️  Aviso: $file ya existe en la boveda y no es un link. Haciendo backup..."
                mv "$TARGET" "$TARGET.bak"
            fi

            ln -s "$SOURCE" "$TARGET"
            echo "✅ Vinculado: $file -> $TARGET"
        done

        echo ""
        echo "🎉 ¡Listo! Ahora abre Obsidian y activa el plugin FLOW.txt."
        ;;

    "build")
        echo "🔨 Compilando proyecto..."
        npm run build
        if [ $? -eq 0 ]; then
            echo "✅ Build exitoso."
        else
            echo "❌ Error en la compilación."
        fi
        ;;

    *)
        print_usage
        exit 1
        ;;
esac
