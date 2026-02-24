"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

type UploadedImage = {
  url: string;
  alt?: string;
};

type ImageUploadProps = {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
};

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (images.length + files.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      setIsUploading(true);

      try {
        const uploaded: UploadedImage[] = [];

        for (const file of Array.from(files)) {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob",
          });
          uploaded.push({ url: blob.url });
        }

        onChange([...images, ...uploaded]);
        toast.success(
          `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`,
        );
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
        // Reset the input
        e.target.value = "";
      }
    },
    [images, onChange, maxImages],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    },
    [images, onChange],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.url}
            className="group relative aspect-square overflow-hidden rounded-lg border"
          >
            <Image
              src={image.url}
              alt={image.alt || `Product image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                Primary
              </span>
            )}
          </div>
        ))}
        {images.length < maxImages && (
          <label className="hover:border-primary/50 hover:bg-muted/50 flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors">
            {isUploading ? (
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            ) : (
              <>
                <Upload className="text-muted-foreground h-8 w-8" />
                <span className="text-muted-foreground mt-2 text-xs">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleUpload}
              disabled={isUploading}
              className="sr-only"
            />
          </label>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {images.length}/{maxImages} images. Max 4.5MB each. JPG, PNG, WebP, GIF.
      </p>
    </div>
  );
}
