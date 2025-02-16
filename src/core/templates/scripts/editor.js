// Monaco Editor initialization
function loadMonaco() {
  return new Promise((resolve, reject) => {
    try {
      require(['vs/editor/editor.main'], resolve, reject);
    } catch (error) {
      console.error('Failed to load Monaco:', error);
      reject(error);
    }
  });
}

async function initializeEditor() {
  try {
    await loadMonaco();

    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' });

    // Configure Mermaid language features
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          // Keywords
          [
            /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)\b/,
            'keyword',
          ],
          [
            /\b(TB|TD|BT|RL|LR|participant|actor|class|state|title|section|loop|alt|opt|par|rect)\b/,
            'keyword',
          ],

          // Arrows and relationships
          [/[-.=]>|--[>x]|==[\]>x]|--[o\|]|\.\.[\]>]/, 'arrow'],

          // Comments
          [/%%.*$/, 'comment'],
          [/<!--/, 'comment', '@comment'],

          // Strings
          [/"/, 'string', '@string_double'],
          [/'/, 'string', '@string_single'],

          // Identifiers and labels
          [/[A-Za-z][A-Za-z0-9_-]*/, 'identifier'],

          // Brackets
          [/[\[\](){}<>]/, '@brackets'],

          // Whitespace
          [/[ \t\r\n]+/, 'white'],
        ],

        comment: [
          [/[^-]+/, 'comment'],
          [/-->/, 'comment', '@pop'],
          [/-/, 'comment'],
        ],

        string_double: [
          [/[^\\"]+/, 'string'],
          [/"/, 'string', '@pop'],
        ],

        string_single: [
          [/[^\\']+/, 'string'],
          [/'/, 'string', '@pop'],
        ],
      },
    });

    // Configure Mermaid language configuration
    monaco.languages.setLanguageConfiguration('mermaid', {
      comments: {
        lineComment: '%%',
        blockComment: ['%%{', '}%%'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });

    // Get VS Code's current theme colors
    const computedStyle = getComputedStyle(document.body);
    const backgroundColor = computedStyle.getPropertyValue('--vscode-editor-background');
    const foregroundColor = computedStyle.getPropertyValue('--vscode-editor-foreground');

    // Get VS Code's current theme type
    const vsThemeKind = document.body.classList.contains('vscode-dark')
      ? 'vs-dark'
      : document.body.classList.contains('vscode-high-contrast')
        ? 'hc-black'
        : 'vs';

    // Define custom theme with VS Code colors
    monaco.editor.defineTheme('vscode-custom', {
      base: vsThemeKind,
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'arrow', foreground: '00B7C3' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'identifier', foreground: '4EC9B0' },
        { token: '@brackets', foreground: 'FFD700' },
      ],
      colors: {
        'editor.background': backgroundColor || null,
        'editor.foreground': foregroundColor || null,
      },
    });

    // Create editor instance
    const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: window.mermaidText || '',
      language: 'mermaid',
      theme: 'vscode-custom',
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      formatOnType: true,
      formatOnPaste: true,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
    });

    // Handle editor changes
    editor.onDidChangeModelContent(
      debounce(() => {
        const value = editor.getValue();
        updateDiagram(value);
        window.vscode.postMessage({
          command: 'editorChange',
          text: value,
        });
      }, 300)
    );

    // Handle external content updates
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'update' && message.text) {
        const currentPosition = editor.getPosition();
        const currentScrollPosition = editor.getScrollPosition();
        editor.setValue(message.text);
        if (currentPosition) {
          editor.setPosition(currentPosition);
          editor.setScrollPosition(currentScrollPosition);
        }
      }
    });

    // Listen for VS Code theme changes
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'vscode-theme-changed') {
        // Update theme colors when VS Code theme changes
        const newComputedStyle = getComputedStyle(document.body);
        const newBackgroundColor = newComputedStyle.getPropertyValue('--vscode-editor-background');
        const newForegroundColor = newComputedStyle.getPropertyValue('--vscode-editor-foreground');

        // Update custom theme with new colors
        monaco.editor.defineTheme('vscode-custom', {
          base:
            message.theme === 'vscode-dark'
              ? 'vs-dark'
              : message.theme === 'vscode-high-contrast'
                ? 'hc-black'
                : 'vs',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
            { token: 'arrow', foreground: '00B7C3' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'identifier', foreground: '4EC9B0' },
            { token: '@brackets', foreground: 'FFD700' },
          ],
          colors: {
            'editor.background': newBackgroundColor || null,
            'editor.foreground': newForegroundColor || null,
          },
        });

        monaco.editor.setTheme('vscode-custom');
      }
    });

    // Save current instance
    window.monacoEditor = editor;

    // Add cursor position listener
    editor.onDidChangeCursorPosition(e => {
      onCursorPositionChange(e.position);
    });
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error);
    document.getElementById('monaco-editor').innerHTML = `
      <div class="error" style="padding: 1em; color: var(--vscode-errorForeground);">
        Failed to initialize editor: ${error.message}
      </div>
    `;
  }
}

function onCursorPositionChange(position) {
  const vscode = acquireVsCodeApi();
  vscode.postMessage({
    type: 'cursorPosition',
    line: position.lineNumber,
    column: position.column,
  });
}

function initializeSplitter() {
  const splitter = document.querySelector('.splitter');
  const editorContainer = document.querySelector('.editor-container');
  let isDragging = false;

  splitter?.addEventListener('mousedown', e => {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    splitter.classList.add('dragging');
    document.body.style.userSelect = 'none';

    const content = document.querySelector('.content');
    const contentRect = content.getBoundingClientRect();

    const handleMouseMove = e => {
      if (!isDragging) return;

      const newWidth = Math.min(
        Math.max(200, e.clientX - contentRect.left),
        contentRect.width - 200
      );

      const widthPercentage = (newWidth / contentRect.width) * 100;
      editorContainer.style.width = `${widthPercentage}%`;

      if (window.monacoEditor) {
        window.monacoEditor.layout();
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      splitter.classList.remove('dragging');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeEditor();
  initializeSplitter();
});
