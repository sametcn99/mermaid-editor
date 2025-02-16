# VS Code Mermaid.js Editor Extension Development Guide

## Overview

This is a VS Code extension for editing Mermaid.js diagrams. It provides a visual editor and live preview for `.mmd` files.

## Core Components

- **EditorManager**: Handles file operations for `.mmd` files
- **PreviewRenderer**: Shows live diagram previews
- **VisualEditor**: Provides drag-and-drop diagram editing
- **SyncHandler**: Keeps visual editor and code in sync
- **ExtensionAPI**: Manages VS Code integration

## Setup

1. Install Node.js and VS Code
2. Clone and install:
   ```bash
   git clone https://github.com/your-username/vscode-mermaid-editor.git
   npm install
   npm run build
   ```

## Development Steps

1. **Setup Project**

   - Use `yo code` to create extension
   - Configure webpack

2. **Create Core Classes**

   - EditorManager
   - PreviewRenderer
   - VisualEditor
   - SyncHandler
   - ExtensionAPI

3. **Build UI**

   - Create split-view editor
   - Add live preview
   - Add code view toggle

4. **Add Features**

   - Mermaid.js rendering
   - Diagram editing tools
   - Export options (PNG/SVG/PDF)

5. **Test & Deploy**
   - Run tests
   - Debug
   - Package with `vsce`

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test
5. Submit pull request

## Testing

- Use VS Code debugger
- Write unit tests
- Test with large diagrams

## Publishing

1. Update version in `package.json`
2. Run `vsce package`
3. Publish to VS Code Marketplace
