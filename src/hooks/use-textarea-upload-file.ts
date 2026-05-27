import React, { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback, useEffect } from "react";

import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { RefType } from "../components/magic-textarea";
import insertTextIntoMagicTextarea from "../helpers/magic-textarea";
import useUploadFile from "./use-upload-file";
import { setPasteHandler } from "./android-paste";

export function useTextAreaUploadFileWithForm(
  ref: MutableRefObject<RefType | null>,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
) {
  const insertText = useTextAreaInsertTextWithForm(ref, getValues, setValue);
  return useTextAreaUploadFile(insertText);
}

export function useTextAreaInsertTextWithForm(
  ref: MutableRefObject<RefType | null>,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
  field = "content",
) {
  const getText = useCallback(() => getValues()[field], [getValues, field]);
  const setText = useCallback(
    (text: string) => setValue(field, text, { shouldDirty: true, shouldTouch: true }),
    [setValue, field],
  );
  return useCallback(
    (text: string) => {
      if (ref.current) insertTextIntoMagicTextarea(ref.current, getText, setText, text);
    },
    [setText, getText],
  );
}

export default function useTextAreaUploadFile(insertText: (url: string) => void) {
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
      if (upload) insertText(upload.url);
    };
    setPasteHandler(handler);
    return () => setPasteHandler(null);
  }, [uploadFile.run, insertText]);

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const img = e.target.files?.[0];
      if (img) {
        const upload = await uploadFile.run(img);
        if (upload) insertText(upload.url);
      }
    },
    [uploadFile.run],
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

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    async (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) {
        const upload = await uploadFile.run(imageFile);
        if (upload) insertText(upload.url);
        return;
      }
      const url = extractImageUrlFromClipboard(e);
      if (url) {
        e.preventDefault();
        insertText(url);
      }
    },
    [uploadFile.run],
  );

  return { uploadFile: uploadFile.run, uploading: uploadFile.loading, onPaste, onFileInputChange };
}
