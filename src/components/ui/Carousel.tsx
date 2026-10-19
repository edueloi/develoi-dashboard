import React, { useState, useEffect, useRef } from 'react';
import { gsap, useGSAP, EASE, prefersReducedMotion } from '../../lib/gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

export function Carousel({ images, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    if (!imgRef.current || prefersReducedMotion()) return;
    gsap.fromTo(imgRef.current, { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.6, ease: EASE.expo, clearProps: 'opacity,transform' });
  }, { dependencies: [index] });

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const itv = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(itv);
  }, [autoPlay, images.length, interval]);

  if (!images || images.length === 0) return null;

  const next = () => setIndex((index + 1) % images.length);
  const prev = () => setIndex((index - 1 + images.length) % images.length);

  return (
    <div className="relative group w-full aspect-video rounded-3xl overflow-hidden border border-white/10 my-8 shadow-2xl">
      <img
        ref={imgRef}
        src={images[index]}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-8 bg-indigo-500' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
