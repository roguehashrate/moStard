type PasteHandler = (mimeType: string, base64: string) => void;

let currentHandler: PasteHandler | null = null;

if (typeof window !== "undefined") {
  (window as any).__mostardPasteImage = (mimeType: string, base64: string) => {
    currentHandler?.(mimeType, base64);
  };
}

export function setPasteHandler(handler: PasteHandler | null) {
  currentHandler = handler;
}
