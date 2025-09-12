"use client";

import { useState, useEffect } from "react";

export function useImageLoader() {
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const loadImage = (
      name: string,
      src: string
    ): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timeout = setTimeout(() => {
          console.warn(`Image loading timeout: ${name}`);
          reject(new Error(`Timeout loading ${name}`));
        }, 10000);
        img.onload = () => {
          clearTimeout(timeout);
          setImages((prev) => ({ ...prev, [name]: img }));
          resolve(img);
        };
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`❌ Failed to load image: ${name} from ${src}`, error);
          reject(new Error(`Failed to load ${name}`));
        };
        img.src = src;
      });
    };

    // 모든 캐릭터 이미지 로드
    const imageList = [
      { name: "bcat", src: "/babycat/bcat.svg" },
      { name: "bcat_jump", src: "/babycat/bcat_jump.svg" },
      { name: "bcat_sliding", src: "/babycat/bcat_slide.svg" },
      { name: "cat", src: "/cat/cat.png" },
      { name: "cat_jump", src: "/babycat/bcat_jump.svg" },
      { name: "cat_sliding", src: "/babycat/bcat_slide.svg" },
      { name: "bulkcat1", src: "/bulkcat/bulkcat.svg" },
      { name: "bulkcat2", src: "/bulkcat/bulkcat_run.svg" },
      { name: "bulkcat_jump", src: "/bulkcat/bulkcat_jump.svg" },
      { name: "bulkcat_sliding", src: "/bulkcat/bulkcat_slide.svg" },
    ];

    const loadAllImages = async () => {
      try {
        await Promise.all(
          imageList.map(({ name, src }) => loadImage(name, src))
        );
        console.log("🎉 All character images loaded successfully");
        setImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some images failed to load:", error);
      }
    };

    loadAllImages();
  }, []);

  return { images, imagesLoaded };
}
