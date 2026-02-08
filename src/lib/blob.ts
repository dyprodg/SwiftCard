import { put, del, list } from "@vercel/blob";

export async function uploadImage(
  file: File,
  folder: string = "products",
): Promise<string> {
  const blob = await put(`${folder}/${file.name}`, file, {
    access: "public",
  });
  return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}

export async function listImages(prefix?: string) {
  const result = await list({ prefix });
  return result.blobs;
}
