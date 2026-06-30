import type { GalleryImage } from "@/lib/api/types";
import { ImageFrame } from "../ui/ImageFrame";
import { getGalleryImageLayout } from "./imageLayout";

type GalleryPhotoProps = {
  image?: GalleryImage;
  label: string;
  aspect?: string;
  index?: number;
  className?: string;
  flat?: boolean;
};

export function GalleryPhoto({
  image,
  label,
  aspect = "aspect-[4/3]",
  index = 0,
  className = "",
  flat = false,
}: GalleryPhotoProps) {
  const layout = image ? getGalleryImageLayout(image, index) : null;

  if (!image?.thumbUrl) {
    return <ImageFrame label={label} aspect={aspect} hover flat={flat} className={className} />;
  }

  return (
    <ImageFrame
      label={label}
      src={image.thumbUrl}
      alt={image.alt || label}
      aspect={aspect}
      aspectRatio={layout?.aspectRatio}
      fit={layout?.fit}
      hover
      flat={flat}
      className={className}
    />
  );
}
