# 🛠 Flujo de Trabajo para Desarrolladores

Este documento describe cómo configurar tu entorno local para desarrollar **FLOW.txt** y ver los cambios en tiempo real dentro de tu propia bóveda de Obsidian.

## 🚀 Inicio Rápido

Para preparar el proyecto por primera vez:

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Compila el código inicialmente:
   ```bash
   npm run build
   ```

## 🔗 Vinculación con Obsidian (Symlinks)

La forma más eficiente de trabajar es crear "enlaces simbólicos" entre esta carpeta de desarrollo y tu carpeta de plugins de Obsidian. Esto permite que Obsidian "vea" automáticamente los archivos que generas aquí.

### Usando el script automatizado

Hemos creado un script llamado `dev.sh` en la raíz del proyecto para facilitar todo esto.

#### 1. Configurar y Vincular
Para vincular tu bóveda por primera vez:
```bash
./dev.sh link "/ruta/absoluta/a/tu/boveda"
```
*(Esto creará la carpeta del plugin en tu bóveda y los symlinks necesarios para `main.js`, `manifest.json` y `styles.css`)*.
 Ejemplo: 

 ```bash
./dev.sh link "/Users/pat/Documents/Obsidian/Obsidian-tester"
```
 ```bash
./dev.sh link "/Users/pat/Katalizo"
```

#### 2. Compilar y Actualizar

Cada vez que hagas un cambio importante:
```bash
./dev.sh build
```

---

## 🏗 Detalles del Build

El proyecto utiliza **esbuild** para una compilación ultra rápida.

- **`main.js`**: El código lógico compilado desde TypeScript.
- **`styles.css`**: Estilos del plugin.
- **`manifest.json`**: Metadatos necesarios para que Obsidian cargue el plugin.

### Comandos de NPM directos:
- `npm run dev`: Compila y se queda esperando cambios (watch mode).
- `npm run build`: Compila la versión de producción optimizada.
- `npm test`: Ejecuta la suite de pruebas (Jest).

---

## 🔄 Ver cambios en Obsidian

1. Una vez vinculada la carpeta con `./dev.sh link`, abre tu Obsidian.
2. Ve a `Settings > Community Plugins`.
3. Activa **FLOW.txt** (si es la primera vez).
4. **Para actualizar tras un cambio**:
   - Pulsa el botón de "Refresh" en la lista de plugins instalados.
   - Desactiva y vuelve a activar el plugin.
   - *Tip: Instala el plugin "Hot Reload" de la comunidad para que Obsidian detecte los cambios en `main.js` y se reinicie solo.*

## 📂 Estructura de Archivos Clave

- `src/main.ts`: Punto de entrada del plugin.
- `src/parser/`: Lógica de detección de tareas y bloques.
- `src/ui/`: Componentes de interfaz (React).
- `styles.css`: CSS global del plugin.
