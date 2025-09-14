"use client";

import { useEffect } from "react";
import { GamePhase, type GameState, type Cat, type Obstacle } from "@/types/game";

const CANVAS_HEIGHT = 400;
const GROUND_Y = 300;
const DEBUG_COLLISION = false;

interface GameRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  gamePhase: GamePhase;
  gameState: GameState;
  cat: Cat;
  obstacles: Obstacle[];
  images: { [key: string]: HTMLImageElement };
  obstacleImages: { [key: string]: HTMLImageElement };
  imagesLoaded: boolean;
  obstacleImagesLoaded: boolean;
  isImmune?: boolean;
}

export function useGameRenderer({
  canvasRef,
  canvasWidth,
  gamePhase,
  gameState,
  cat,
  obstacles,
  images,
  obstacleImages,
  imagesLoaded,
  obstacleImagesLoaded,
  isImmune = false,
}: GameRendererProps) {
  // 게임 화면 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT);

    if (gamePhase === GamePhase.START) {
      renderStartScreen(ctx, canvasWidth, imagesLoaded);
    } else if (
      gamePhase === GamePhase.PLAYING ||
      gamePhase === GamePhase.GAME_OVER
    ) {
      renderGameScreen(ctx, canvasWidth, gameState, cat, obstacles, images, obstacleImages, obstacleImagesLoaded, isImmune);
      
      if (gamePhase === GamePhase.GAME_OVER) {
        renderGameOverScreen(ctx, canvasWidth, gameState);
      }
    }
  }, [canvasRef, canvasWidth, gamePhase, gameState, cat, obstacles, images, obstacleImages, imagesLoaded, obstacleImagesLoaded, isImmune]);
}

function renderStartScreen(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  imagesLoaded: boolean
) {
  ctx.fillStyle = "#333333";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Cat Runner", canvasWidth / 2, CANVAS_HEIGHT / 2 - 50);
  ctx.font = "16px Arial";
  
  if (!imagesLoaded) {
    ctx.fillText(
      "Loading cat sprites...",
      canvasWidth / 2,
      CANVAS_HEIGHT / 2
    );
  } else {
    ctx.fillText(
      "Press SPACE to start",
      canvasWidth / 2,
      CANVAS_HEIGHT / 2
    );
    ctx.fillText(
      "SPACE: Jump, ↓: Slide",
      canvasWidth / 2,
      CANVAS_HEIGHT / 2 + 30
    );
  }
}

function renderGameScreen(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  gameState: GameState,
  cat: Cat,
  obstacles: Obstacle[],
  images: { [key: string]: HTMLImageElement },
  obstacleImages: { [key: string]: HTMLImageElement },
  obstacleImagesLoaded: boolean,
  isImmune: boolean = false
) {
  // Draw ground
  ctx.fillStyle = "#999999";
  ctx.fillRect(0, GROUND_Y, canvasWidth, 2);

  // Draw score and stage info
  ctx.fillStyle = "#333333";
  ctx.font = "16px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    `Score: ${gameState.score.toString().padStart(5, "0")}`,
    20,
    30
  );
  ctx.fillText(`Stage: ${gameState.stage}`, 20, 50);
  ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}x`, 20, 70);

  // Draw cat (면역 상태일 때 반투명 효과)
  const catImage = images[cat.sprite];
  if (isImmune) {
    ctx.globalAlpha = 0.5; // 면역 상태일 때 반투명
  }
  
  if (catImage && catImage.complete && catImage.naturalWidth > 0) {
    ctx.drawImage(
      catImage,
      cat.position.x,
      cat.position.y,
      cat.size.width,
      cat.size.height
    );
  } else {
    ctx.fillStyle = "#FF6B35";
    ctx.fillRect(
      cat.position.x,
      cat.position.y,
      cat.size.width,
      cat.size.height
    );
  }
  
  if (isImmune) {
    ctx.globalAlpha = 1.0; // 투명도 원복
  }

  // Debug: Draw collision box
  if (DEBUG_COLLISION) {
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cat.position.x + cat.collisionBox.offset.x,
      cat.position.y + cat.collisionBox.offset.y,
      cat.collisionBox.size.width,
      cat.collisionBox.size.height
    );
  }

  // Draw obstacles
  obstacles.forEach((obstacle) => {
    const obstacleImage = obstacleImages[obstacle.type];
    if (obstacleImagesLoaded && obstacleImage && obstacleImage.complete && obstacleImage.naturalWidth > 0) {
      // 렌더링할 때 크기를 2배로 키움 (히트박스는 원본 크기 유지)
      const renderWidth = obstacle.size.width * 2;
      const renderHeight = obstacle.size.height * 2;
      // 중앙 정렬을 위해 위치 조정
      const renderX = obstacle.position.x - (renderWidth - obstacle.size.width) / 2;
      const renderY = obstacle.position.y - (renderHeight - obstacle.size.height) / 2;
      
      ctx.drawImage(
        obstacleImage,
        renderX,
        renderY,
        renderWidth,
        renderHeight
      );
    } else {
      // Fallback to colored rectangles if SVG not loaded (2배 크기)
      const renderWidth = obstacle.size.width * 2;
      const renderHeight = obstacle.size.height * 2;
      const renderX = obstacle.position.x - (renderWidth - obstacle.size.width) / 2;
      const renderY = obstacle.position.y - (renderHeight - obstacle.size.height) / 2;
      
      if (obstacle.type === "cactus") ctx.fillStyle = "#2E7D32";
      else if (obstacle.type === "rock") ctx.fillStyle = "#5D4037";
      else if (obstacle.type === "bird") ctx.fillStyle = "#1976D2";
      else if (obstacle.type === "dog") ctx.fillStyle = "#8B4513";
      else if (obstacle.type === "mouse") ctx.fillStyle = "#8B7D6B";
      else if (obstacle.type === "fish") ctx.fillStyle = "#FF6B35";
      else if (obstacle.type === "spider") ctx.fillStyle = "#2c1810";
      else if (obstacle.type === "yarn") ctx.fillStyle = "#FF6B9D";
      else ctx.fillStyle = "#666666";
      
      ctx.fillRect(
        renderX,
        renderY,
        renderWidth,
        renderHeight
      );
    }
  });
}

function renderGameOverScreen(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  gameState: GameState
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvasWidth / 2, CANVAS_HEIGHT / 2 - 50);
  ctx.font = "18px Arial";
  ctx.fillText(
    `Final Score: ${gameState.score.toString().padStart(5, "0")}`,
    canvasWidth / 2,
    CANVAS_HEIGHT / 2
  );
  ctx.font = "16px Arial";
  ctx.fillText(
    "Press SPACE to restart",
    canvasWidth / 2,
    CANVAS_HEIGHT / 2 + 40
  );
}