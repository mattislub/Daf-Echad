import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/imagePaths';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const galleryImages = images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE];

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    setSelectedImage((prev) => Math.min(prev, Math.max(0, galleryImages.length - 1)));
  }, [galleryImages.length]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl shadow-yellow-600/5 group">
        <img
          src={galleryImages[selectedImage]}
          alt={`${alt} - ${selectedImage + 1}`}
          className="w-full h-full max-h-[520px] object-contain rounded-2xl transition-transform duration-500 ease-out bg-white p-6"
        />

        {galleryImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedImage
                  ? 'bg-yellow-600 w-8'
                  : 'bg-white/70 hover:bg-white'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {galleryImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-xl overflow-hidden border-2 shadow-sm transition-all ${
                index === selectedImage
                  ? 'border-yellow-600 ring-2 ring-yellow-600/20'
                : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                className="w-full h-full object-contain rounded-xl bg-white p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
