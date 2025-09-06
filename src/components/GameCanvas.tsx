"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  GamePhase,
  type GameState,
  type Cat,
  type Obstacle,
} from "@/types/game";

const CANVAS_HEIGHT = 400;
const GROUND_Y = 300;
const CAT_WIDTH = 100;
const CAT_HEIGHT = 100;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const DEBUG_COLLISION = false; // Set to true to see collision boxes

interface GameCanvasProps {
  onGameOver?: (score: number) => void;
  onStageComplete?: (stage: number) => void;
}

export default function GameCanvas({
  onGameOver,
  onStageComplete,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(window.innerWidth);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.START);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    stage: 1,
    isPlaying: false,
    isGameOver: false,
    speed: 2,
  });
  // 화면 크기 변경 시 캔버스 크기 동적 적용
  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(window.innerWidth);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = CANVAS_HEIGHT;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 초기 렌더링 위치, 고양이 크기 변경, 속도 조정, 히트 박스
  const [cat, setCat] = useState<Cat>({
    // 초기 렌더링 위치 (바닥에 딱 붙게)
    position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
    velocity: { x: 0, y: 0 },
    size: { width: CAT_WIDTH, height: CAT_HEIGHT },
    collisionBox: {
      offset: { x: 2.5, y: 2.5 }, // 8px(SVG) * 100/320 = 2.5px
      size: { width: CAT_WIDTH, height: CAT_HEIGHT }, // 히트박스 크기도 필요시 비율 변환
    },
    isJumping: false,
    isSliding: false,
    sprite: "bcat",
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load images
  useEffect(() => {
    const loadImage = (
      name: string,
      src: string
    ): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Handle CORS if needed

        const timeout = setTimeout(() => {
          console.warn(`Image loading timeout: ${name}`);
          reject(new Error(`Timeout loading ${name}`));
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          console.log(
            `✅ Image loaded successfully: ${name} (${img.naturalWidth}x${img.naturalHeight})`
          );
          setImages((prev) => ({ ...prev, [name]: img }));
          resolve(img);
        };

        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`❌ Failed to load image: ${name} from ${src}`, error);
          reject(new Error(`Failed to load ${name}`));
        };

        console.log(`🔄 Loading image: ${name} from ${src}`);
        img.src = src;
      });
    };

    const imageList = [
      { name: "bcat", src: "/bcat.svg" },
      { name: "bcat_jump", src: "/bcatt_jump.png" },
      { name: "bcat_sliding", src: "/bcatt_slide.png" },
    ];

    // Load images sequentially to avoid overwhelming the browser
    const loadAllImages = async () => {
      try {
        for (const { name, src } of imageList) {
          await loadImage(name, src);
        }
        console.log("🎉 All cat images loaded successfully");
        setImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some images failed to load:", error);
      }
    };

    loadAllImages();
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 시작 화면: 스페이스 또는 방향키 위
      if (
        gamePhase === GamePhase.START &&
        (e.code === "Space" || e.code === "ArrowUp") &&
        imagesLoaded
      ) {
        startGame();
      }
      // 플레이 중: 스페이스 또는 방향키 위 = 점프, 방향키 아래 = 슬라이드
      else if (gamePhase === GamePhase.PLAYING) {
        if (
          (e.code === "Space" || e.code === "ArrowUp") &&
          !cat.isJumping &&
          !cat.isSliding
        ) {
          jump();
        } else if (e.code === "ArrowDown" && !cat.isJumping && !cat.isSliding) {
          slide();
        }
      }
      // 게임 오버: 스페이스 또는 방향키 위
      else if (
        gamePhase === GamePhase.GAME_OVER &&
        (e.code === "Space" || e.code === "ArrowUp")
      ) {
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gamePhase, cat, imagesLoaded]);

  const startGame = () => {
    setGamePhase(GamePhase.PLAYING);
    setGameState((prev) => ({ ...prev, isPlaying: true, isGameOver: false }));
  };

  const jump = () => {
    setCat((prev) => ({
      ...prev,
      velocity: { ...prev.velocity, y: JUMP_FORCE },
      isJumping: true,
      sprite: "bcat_jump",
    }));
  };

  const slide = () => {
    setCat((prev) => ({
      ...prev,
      isSliding: true,
      sprite: "bcat_sliding",
      collisionBox: {
        offset: { x: 8, y: 16 }, // Higher Y offset when sliding
        size: { width: 28, height: 20 }, // Shorter collision box when sliding
      },
    }));

    setTimeout(() => {
      setCat((prev) => ({
        ...prev,
        isSliding: false,
        sprite: "bcat",
        collisionBox: {
          offset: { x: 8, y: 8 },
          size: { width: 28, height: 28 },
        },
      }));
    }, 500);
  };

  const resetGame = () => {
    setGamePhase(GamePhase.START);
    setGameState({
      score: 0,
      stage: 1,
      isPlaying: false,
      isGameOver: false,
      speed: 2,
    });
    setCat({
      position: { x: 50, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
      collisionBox: {
        offset: { x: 8, y: 8 },
        size: { width: 28, height: 28 },
      },
      isJumping: false,
      isSliding: false,
      sprite: "bcat",
    });
    setObstacles([]);
  };

  const spawnObstacle = () => {
    const obstacleTypes = ["cactus", "rock", "bird"] as const;
    const randomType =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    let newObstacle: Obstacle;

    if (randomType === "bird") {
      newObstacle = {
        position: { x: canvasWidth, y: GROUND_Y - 80 }, // Higher up for bird
        size: { width: 25, height: 20 },
        type: "bird",
      };
    } else if (randomType === "rock") {
      newObstacle = {
        position: { x: canvasWidth, y: GROUND_Y - 25 },
        size: { width: 25, height: 25 },
        type: "rock",
      };
    } else {
      newObstacle = {
        position: { x: canvasWidth, y: GROUND_Y - 30 },
        size: { width: 20, height: 30 },
        type: "cactus",
      };
    }

    setObstacles((prev) => [...prev, newObstacle]);
  };

  const checkCollision = (cat: Cat, obstacle: Obstacle): boolean => {
    // Use the actual collision box instead of the full sprite size
    const catCollisionX = cat.position.x + cat.collisionBox.offset.x;
    const catCollisionY = cat.position.y + cat.collisionBox.offset.y;
    const catCollisionWidth = cat.collisionBox.size.width;
    const catCollisionHeight = cat.collisionBox.size.height;

    return (
      catCollisionX < obstacle.position.x + obstacle.size.width &&
      catCollisionX + catCollisionWidth > obstacle.position.x &&
      catCollisionY < obstacle.position.y + obstacle.size.height &&
      catCollisionY + catCollisionHeight > obstacle.position.y
    );
  };

  // Game loop
  useEffect(() => {
    if (gamePhase !== GamePhase.PLAYING) return;

    const gameLoop = setInterval(() => {
      // Update cat physics
      setCat((prev) => {
        let newY = prev.position.y + prev.velocity.y;
        let newVelY = prev.velocity.y + GRAVITY;
        let isJumping = prev.isJumping;

        if (newY >= GROUND_Y - CAT_HEIGHT) {
          newY = GROUND_Y - CAT_HEIGHT;
          newVelY = 0;
          isJumping = false;
        }

        return {
          ...prev,
          position: { ...prev.position, y: newY },
          velocity: { ...prev.velocity, y: newVelY },
          isJumping,
          sprite: isJumping
            ? "bcat_jump"
            : prev.isSliding
            ? "bcat_sliding"
            : "bcat",
        };
      });

      // Update game state and stage progression
      setGameState((prev) => {
        const newScore = prev.score + 1;
        const newStage = Math.floor(newScore / 1000) + 1;
        let newSpeed = prev.speed;

        // Increase speed based on stage
        if (newStage > prev.stage) {
          if (newStage <= 10) {
            newSpeed = 2 + (newStage - 1) * 0.2; // Gradual increase for stages 1-10
          } else if (newStage <= 20) {
            newSpeed = 4 + (newStage - 10) * 0.3; // Faster increase for stages 11-20
          } else {
            newSpeed = 7 + (newStage - 20) * 0.5; // Even faster for 21+
          }
        }

        return {
          ...prev,
          score: newScore,
          stage: newStage,
          speed: newSpeed,
        };
      });

      // Update obstacles
      setObstacles((prev) =>
        prev
          .map((obstacle) => ({
            ...obstacle,
            position: {
              ...obstacle.position,
              x: obstacle.position.x - gameState.speed,
            },
          }))
          .filter((obstacle) => obstacle.position.x > -obstacle.size.width)
      );

      // Spawn new obstacles (frequency increases with stage)
      const spawnChance = Math.min(
        0.008 + (gameState.stage - 1) * 0.002,
        0.025
      );
      if (Math.random() < spawnChance) {
        spawnObstacle();
      }

      // Check collisions
      obstacles.forEach((obstacle) => {
        if (checkCollision(cat, obstacle)) {
          setGamePhase(GamePhase.GAME_OVER);
          setGameState((prev) => ({
            ...prev,
            isPlaying: false,
            isGameOver: true,
          }));
          onGameOver?.(gameState.score);
        }
      });

      // Check for stage completion (every 10 stages, show achievement)
      if (gameState.score > 0 && gameState.score % 10000 === 0) {
        onStageComplete?.(gameState.stage);
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gamePhase, cat, obstacles, gameState]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT);

    if (gamePhase === GamePhase.START) {
      // Start screen
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
        ctx.font = "12px Arial";
        ctx.fillText(
          `Images loaded: ${Object.keys(images).length}/3`,
          canvasWidth / 2,
          CANVAS_HEIGHT / 2 + 20
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
    } else if (gamePhase === GamePhase.PLAYING) {
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

      // Stage progress bar (shows progress to next stage)
      const stageProgress = (gameState.score % 1000) / 1000;
      ctx.fillStyle = "#E5E5E5";
      ctx.fillRect(canvasWidth - 220, 20, 200, 10);
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(canvasWidth - 220, 20, 200 * stageProgress, 10);
      ctx.fillStyle = "#333333";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText(
        `Next Stage: ${Math.floor(stageProgress * 100)}%`,
        canvasWidth - 20,
        45
      );

      // Draw cat
      const catImage = images[cat.sprite];
      if (catImage && catImage.complete && catImage.naturalWidth > 0) {
        ctx.drawImage(
          catImage,
          cat.position.x,
          cat.position.y,
          cat.size.width,
          cat.size.height
        );
      } else {
        // Fallback rectangle if image not loaded
        ctx.fillStyle = "#FF6B35";
        ctx.fillRect(
          cat.position.x,
          cat.position.y,
          cat.size.width,
          cat.size.height
        );

        // Draw a simple cat face on the rectangle
        ctx.fillStyle = "#FFFFFF";
        // Eyes
        ctx.fillRect(cat.position.x + 8, cat.position.y + 10, 4, 4);
        ctx.fillRect(cat.position.x + 18, cat.position.y + 10, 4, 4);
        // Nose
        ctx.fillRect(cat.position.x + 14, cat.position.y + 18, 2, 2);
        // Mouth
        ctx.fillRect(cat.position.x + 12, cat.position.y + 22, 6, 2);
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

      // Draw obstacles with different colors based on type
      obstacles.forEach((obstacle) => {
        if (obstacle.type === "cactus") {
          ctx.fillStyle = "#2E7D32"; // Green for cactus
        } else if (obstacle.type === "rock") {
          ctx.fillStyle = "#5D4037"; // Brown for rock
        } else if (obstacle.type === "bird") {
          ctx.fillStyle = "#1976D2"; // Blue for bird
        }

        ctx.fillRect(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.size.width,
          obstacle.size.height
        );
      });
    } else if (gamePhase === GamePhase.GAME_OVER) {
      // Game over screen
      ctx.fillStyle = "#333333";
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
  }, [gamePhase, cat, obstacles, gameState, images, imagesLoaded]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={CANVAS_HEIGHT}
        style={{ width: "100%", height: `${CANVAS_HEIGHT}px` }}
        className="game-canvas border border-gray-300"
      />
      <div className="text-sm text-gray-600 text-center">
        <p>SPACE: Jump | ↓: Slide</p>
      </div>
    </div>
  );
}
