import { Id } from '../../convex/_generated/dataModel';

/**
 * Upload a file to Convex storage
 * @param generateUploadUrl - The mutation to generate an upload URL
 * @param file - The file blob to upload
 * @returns The storage ID of the uploaded file
 */
export async function uploadFileToConvex(
  generateUploadUrl: () => Promise<string>,
  file: Blob
): Promise<Id<"_storage">> {
  // Step 1: Get a short-lived upload URL
  const uploadUrl = await generateUploadUrl();

  // Step 2: POST the file to the URL
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!result.ok) {
    throw new Error(`Upload failed: ${result.statusText}`);
  }

  const { storageId } = await result.json();
  return storageId as Id<"_storage">;
}

/**
 * Convert a base64 data URL to a Blob
 * @param dataUrl - The data URL (e.g., "data:image/png;base64,...")
 * @returns A Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload a data URL image to Convex storage
 * @param generateUploadUrl - The mutation to generate an upload URL
 * @param dataUrl - The data URL to upload
 * @returns The storage ID of the uploaded file
 */
export async function uploadDataUrlToConvex(
  generateUploadUrl: () => Promise<string>,
  dataUrl: string
): Promise<Id<"_storage">> {
  const blob = dataUrlToBlob(dataUrl);
  return uploadFileToConvex(generateUploadUrl, blob);
}
