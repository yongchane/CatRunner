"use client";

import React, { useState, useEffect } from "react";

interface RandomBoxProps {
  isVisible: boolean;
  onComplete: (selectedCharacter?: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  onPhaseChange?: (phase: "box" | "spinning" | "result") => void;
}

export default function RandomBox({
  isVisible,
  onComplete,
  canvasWidth,
  canvasHeight,
  onPhaseChange,
}: RandomBoxProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<"box" | "spinning" | "result">("box");

  // 능력치/캐릭터 목록
  const abilities = [
    {
      name: "bulkcat",
      image: "/buff/bulkupmeet.png",
      description: "Strong Cat - 3 Lives!",
    },
    {
      name: "cat",
      image: "/buff/churu.png",
      description: "Speed Cat - Fast Runner!",
    },
    {
      name: "bcat",
      image: "/babycat/bcat.svg",
      description: "Baby Cat - Default!",
    },
  ];

  // 3단계 애니메이션 효과
  useEffect(() => {
    if (isVisible && !isAnimating) {
      setIsAnimating(true);
      setPhase("box");
      onPhaseChange?.("box");
      setSelectedImage("/transform/box.svg");

      // 1단계: Box 표시 (2초)
      setTimeout(() => {
        setPhase("spinning");
        onPhaseChange?.("spinning");

        // 2단계: 능력치 회전 (3초)
        let rotationCount = 0;
        const maxRotations = 20;

        const rotateAbilities = () => {
          if (rotationCount < maxRotations) {
            const randomIndex = Math.floor(Math.random() * abilities.length);
            setSelectedImage(abilities[randomIndex].image);
            rotationCount++;
            setTimeout(rotateAbilities, 150);
          } else {
            // 3단계: 최종 능력치 결정
            const finalIndex = Math.floor(Math.random() * abilities.length);
            const finalAbility = abilities[finalIndex];
            setSelectedImage(finalAbility.image);
            setPhase("result");
            onPhaseChange?.("result");

            setTimeout(() => {
              setIsAnimating(false);
              setSelectedImage(null);
              setPhase("box");

              onComplete(finalAbility.name);
            }, 1500);
          }
        };

        rotateAbilities();
      }, 1500);
    }
  }, [isVisible, isAnimating, onComplete, abilities]);

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
          {phase === "box"
            ? "🎁 TRANSFORMATION TIME! 🎁"
            : phase === "spinning"
            ? "✨ SELECTING ABILITY... ✨"
            : "🎊 TRANSFORMATION COMPLETE! 🎊"}
        </h2>

        {phase === "spinning" && selectedImage && (
          <div
            className="border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              transition: "all 0.1s ease-in-out",
              transform: "scale(1.05)",
            }}
          >
            <img
              src={selectedImage}
              alt="Ability"
              style={{
                maxWidth: "150px",
                maxHeight: "150px",
                objectFit: "contain",
              }}
              className="animate-spin"
            />
          </div>
        )}

        {phase === "result" && selectedImage && (
          <div
            className="border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <img
              src={selectedImage}
              alt="Final Ability"
              style={{
                maxWidth: "150px",
                maxHeight: "150px",
                objectFit: "contain",
              }}
              className="animate-pulse"
            />
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4 text-center">
          {phase === "box"
            ? "캐릭터가 변신 상자로 변했다!"
            : phase === "spinning"
            ? "능력치를 결정하는 중..."
            : "새로운 능력을 얻었다!"}
        </p>

        {phase === "result" && selectedImage && (
          <div className="mt-2 text-center">
            {abilities.map((ability) =>
              ability.image === selectedImage ? (
                <p
                  key={ability.name}
                  className="text-xs text-blue-600 font-semibold"
                >
                  {ability.description}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
