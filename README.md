# SPX Launcher

SPX Launcher is a Tauri-based desktop application for managing the `spx-server`.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### 1. Node.js & npm

- [Node.js](https://nodejs.org/) (Version 18 or later recommended).
- npm (Comes with Node.js).

### 2. Rust & Cargo

- [Rust](https://www.rust-lang.org/tools/install) (Latest stable version).
- Ensure `cargo` is in your environment's PATH.

### 3. Tauri Dependencies

Depending on your operating system, you may need to install additional system dependencies. Follow the official [Tauri Setup Guide](https://tauri.app/v2/guides/getting-started/setup/) for your platform:

- [macOS](https://v2.tauri.app/start/prerequisites/#macos)
- [Windows](https://v2.tauri.app/start/prerequisites/#windows)
- [Linux](https://v2.tauri.app/start/prerequisites/#linux)

## Manual Setup (Important)

The following items are ignored by Git and must be set up manually to run the application in development or to build it:

### 1. `spx-server` Binary

The application expects the `spx-server` executable to be present. During development, ensure it is available in the `src-tauri/target/debug/` directory.

- **macOS/Linux**: `spx-server`
- **Windows**: `spx-server.exe`

### 2. Data Directories & Config

The following directories and files are also required in the `src-tauri/target/debug/` directory:

- `ASSETS/` - Template and plugin assets.
- `DATAROOT/` - Runtime data.
- `locales/` - Localization files.
- `config.json` - Server configuration file.

## Development

Once the prerequisites are met, follow these steps to start developing:

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run tauri dev
```

### 3. Build for Production

```bash
npm run tauri build
```
