import React, { ChangeEventHandler, ClipboardEventHandler, useCallback, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";

import useUploadFile from "./use-upload-file";
import { setPasteHandler } from "./android-paste";

export function useInputUploadFileWithForm(setValue: UseFormSetValue<any>, field: string) {
  const setText = useCallback((text: string) => setValue(field, text), [setValue]);
  return useInputUploadFile(setText);
}

export default function useInputUploadFile(setText: (text: string) => void) {
  const uploadFile = useUploadFile();

  useEffect(() => {
    const handler = async (mimeType: string, base64: string) => {
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        bytes[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const ext = mimeType.split("/")[1] || "gif";
      const file = new File([blob], `image.${ext}`, { type: mimeType });
      const upload = await uploadFile.run(file);
      if (upload) setText(upload.url);
    };
    setPasteHandler(handler);
    return () => setPasteHandler(null);
  }, [uploadFile.run, setText]);

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const img = e.target.files?.[0];
      if (img) {
        const upload = await uploadFile.run(img);
        if (upload) setText(upload.url);
      }
    },
    [uploadFile.run, setText],
  );

  function extractImageUrlFromClipboard(e: React.ClipboardEvent) {
    const html = e.clipboardData.getData("text/html");
    if (html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) return imgMatch[1];
    }
    const text = e.clipboardData.getData("text/plain");
    if (text && /^https?:\/\/.+\.(gif|png|jpe?g|webp|bmp)/i.test(text)) return text;
    return null;
  }

  const onPaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    async (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) {
        const upload = await uploadFile.run(imageFile);
        if (upload) setText(upload.url);
        return;
      }
      const url = extractImageUrlFromClipboard(e);
      if (url) {
        e.preventDefault();
        setText(url);
      }
    },
    [uploadFile.run, setText],
  );

  return { uploadFile: uploadFile.run, uploading: uploadFile.loading, onPaste, onFileInputChange };
}
