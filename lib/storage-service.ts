"use client";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadRequestAttachment(
  file: File,
  opts: { requestId?: string; employeeUid: string }
): Promise<{ url: string; path: string; name: string }> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const folder = opts.requestId ?? `tmp-${Date.now()}`;
  const path = `requests/${opts.employeeUid}/${folder}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(fileRef);
  return { url, path, name: file.name };
}

export async function deleteAttachment(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
