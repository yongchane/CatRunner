"use client";

import { useState, useEffect } from "react";

export function useImageLoader() {
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [obstacleImages, setObstacleImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [obstacleImagesLoaded, setObstacleImagesLoaded] = useState(false);

  useEffect(() => {
    const loadImage = (
      name: string,
      src: string,
      setImageState: React.Dispatch<React.SetStateAction<{ [key: string]: HTMLImageElement }>>
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
          setImageState((prev) => ({ ...prev, [name]: img }));
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

    // 장애물 이미지 목록
    const obstacleImageList = [
      { name: "bird", src: "/obstacle/bird.svg" },
      { name: "rock", src: "/obstacle/rock.svg" },
      { name: "cactus", src: "/obstacle/cactus.svg" },
      { name: "dog", src: "/obstacle/dog.svg" },
      { name: "mouse", src: "/obstacle/mouse.svg" },
      { name: "fish", src: "/obstacle/fish.svg" },
      { name: "spider", src: "/obstacle/spider.svg" },
      { name: "yarn", src: "/obstacle/yarn.svg" },
    ];

    const loadAllImages = async () => {
      try {
        // 캐릭터 이미지 로드
        await Promise.all(
          imageList.map(({ name, src }) => loadImage(name, src, setImages))
        );
        console.log("🎉 All character images loaded successfully");
        setImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some character images failed to load:", error);
      }
    };

    const loadAllObstacleImages = async () => {
      try {
        // 장애물 이미지 로드
        await Promise.all(
          obstacleImageList.map(({ name, src }) => loadImage(name, src, setObstacleImages))
        );
        console.log("🎉 All obstacle images loaded successfully");
        setObstacleImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some obstacle images failed to load:", error);
      }
    };

    loadAllImages();
    loadAllObstacleImages();
  }, []);

  return { images, imagesLoaded, obstacleImages, obstacleImagesLoaded };
}
