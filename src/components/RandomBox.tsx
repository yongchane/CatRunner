"use client";

import React, { useState, useEffect } from "react";

interface RandomBoxProps {
  isVisible: boolean;
  onComplete: (selectedCharacter?: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export default function RandomBox({
  isVisible,
  onComplete,
  canvasWidth,
  canvasHeight,
}: RandomBoxProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 다양한 랜덤 이미지 목록
  const randomImages = [
    "/buff/trashMeet.png",
    "/buff/bulkupmeet.png",
    "/buff/churu.png",
    "/babycat/bcat.svg",
    "/babycat/bcat_jump.svg",
    "/babycat/bcat_slide.svg",
  ];

  // 이미지 선택 및 애니메이션 효과
  useEffect(() => {
    if (isVisible && !isAnimating) {
      setIsAnimating(true);

      let rotationCount = 0;
      const maxRotations = 15;

      const rotateImages = () => {
        if (rotationCount < maxRotations) {
          const randomIndex = Math.floor(Math.random() * randomImages.length);
          setSelectedImage(randomImages[randomIndex]);
          rotationCount++;
          setTimeout(rotateImages, 110);
        } else {
          const finalIndex = Math.floor(Math.random() * randomImages.length);
          const finalImage = randomImages[finalIndex];
          setSelectedImage(finalImage);

          setTimeout(() => {
            setIsAnimating(false);
            setSelectedImage(null);
            
            // Determine character based on selected image
            let selectedCharacter = "bcat"; // default
            if (finalImage === "/buff/bulkupmeet.png") {
              selectedCharacter = "bulkcat";
            } else if (finalImage === "/buff/churu.png") {
              selectedCharacter = "cat";
            }
            
            onComplete(selectedCharacter);
          }, 3400);
        }
      };

      rotateImages();
    }
  }, [isVisible, isAnimating, onComplete, randomImages]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
      }}
    >
      <div
        className="bg-white rounded-lg p-8 border-4 border-yellow-400 shadow-2xl"
        style={{
          minWidth: "300px",
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          🎁 BONUS BOX! 🎁
        </h2>

        {selectedImage && (
          <div
            className="border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              transition: isAnimating ? "all 0.1s ease-in-out" : "none",
            }}
          >
            <img
              src={selectedImage}
              alt="Random Item"
              style={{
                maxWidth: "150px",
                maxHeight: "150px",
                objectFit: "contain",
              }}
              className={isAnimating ? "animate-pulse" : ""}
            />
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4 text-center">
          {isAnimating ? "선택 중..." : "보너스 획득!"}
        </p>
      </div>
    </div>
  );
}
