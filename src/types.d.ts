type IHTMLComponent = {
  render(): string;
};

type StyleConfig = {
  editorWidth: string;
  previewWidth: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  theme: {
    background: string;
    foreground: string;
    border: string;
  };
};
