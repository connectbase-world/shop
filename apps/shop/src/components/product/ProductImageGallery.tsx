import { useState } from 'react'

type ProductImageGalleryProps = {
  mainImage: string
  images: string[]
  alt: string
}

export function ProductImageGallery({
  mainImage,
  images,
  alt,
}: ProductImageGalleryProps) {
  const allImages = [mainImage, ...images].filter(Boolean)
  const [selected, setSelected] = useState(0)

  return (
    <div>
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm">
        <img
          src={allImages[selected]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3">
          {allImages.map((img, i) => (
            <button
              key={i}
              className={`w-16 h-20 overflow-hidden rounded-sm border-2 transition-colors ${
                i === selected ? 'border-black' : 'border-transparent'
              }`}
              onClick={() => setSelected(i)}
            >
              <img
                src={img}
                alt={`${alt} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
