/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string | Uint8Array, filename: string, mimeType: string): void {
  const blobPart =
    typeof content === 'string'
      ? content
      : (content.buffer.slice(
          content.byteOffset,
          content.byteOffset + content.byteLength
        ) as ArrayBuffer);
  const blob = new Blob([blobPart], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
