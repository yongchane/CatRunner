"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
  const animationFrameId = useRef<number>();

  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.START);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Use state for rendering
  const [cat, setCat] = useState<Cat>({
    position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
    velocity: { x: 0, y: 0 },
    size: { width: CAT_WIDTH, height: CAT_HEIGHT },
    collisionBox: {
      offset: { x: 8, y: 8 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
    },
    isJumping: false,
    isSliding: false,
    sprite: "bcat",
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    stage: 1,
    isPlaying: false,
    isGameOver: false,
    speed: 2,
  });

  // Use refs for game loop logic to get synchronous updates
  const catRef = useRef(cat);
  const obstaclesRef = useRef(obstacles);
  const gameStateRef = useRef(gameState);

  // Sync refs whenever state changes
  useEffect(() => {
    catRef.current = cat;
  }, [cat]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Load images
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

    const imageList = [
      { name: "bcat", src: "/bcat.svg" },
      { name: "bcat_jump", src: "/bcat_jump.svg" },
      { name: "bcat_sliding", src: "/bcat_slide.svg" },
    ];

    const loadAllImages = async () => {
      try {
        await Promise.all(imageList.map(({ name, src }) => loadImage(name, src)));
        console.log("🎉 All cat images loaded successfully");
        setImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some images failed to load:", error);
      }
    };

    loadAllImages();
  }, []);

  // Handle resize
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

  const checkCollision = (cat: Cat, obstacle: Obstacle): boolean => {
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

  const spawnObstacle = useCallback(() => {
    const obstacleTypes = ["cactus", "rock", "bird"] as const;
    const randomType =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    let newObstacle: Obstacle;
    const currentCanvasWidth = window.innerWidth;

    if (randomType === "bird") {
      newObstacle = {
        position: { x: currentCanvasWidth, y: GROUND_Y - 80 },
        size: { width: 25, height: 20 },
        type: "bird",
      };
    } else if (randomType === "rock") {
      newObstacle = {
        position: { x: currentCanvasWidth, y: GROUND_Y - 25 },
        size: { width: 25, height: 25 },
        type: "rock",
      };
    } else {
      newObstacle = {
        position: { x: currentCanvasWidth, y: GROUND_Y - 30 },
        size: { width: 20, height: 30 },
        type: "cactus",
      };
    }
    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
  }, []);

  const gameLoop = useCallback(() => {
    // --- Physics and State Updates (using refs) ---
    const cat = catRef.current;
    const obstacles = obstaclesRef.current;
    const gameState = gameStateRef.current;

    // Update cat physics
    let newY = cat.position.y + cat.velocity.y;
    let newVelY = cat.velocity.y + GRAVITY;
    let isJumping = cat.isJumping;

    if (newY >= GROUND_Y - CAT_HEIGHT) {
      newY = GROUND_Y - CAT_HEIGHT;
      newVelY = 0;
      isJumping = false;
    }
    cat.position.y = newY;
    cat.velocity.y = newVelY;
    cat.isJumping = isJumping;
    cat.sprite = isJumping ? "bcat_jump" : cat.isSliding ? "bcat_sliding" : "bcat";

    // Update game state
    const newScore = gameState.score + 1;
    const newStage = Math.floor(newScore / 1000) + 1;
    let newSpeed = gameState.speed;
    if (newStage > gameState.stage) {
      if (newStage <= 10) newSpeed = 2 + (newStage - 1) * 0.2;
      else if (newStage <= 20) newSpeed = 4 + (newStage - 10) * 0.3;
      else newSpeed = 7 + (newStage - 20) * 0.5;
    }
    gameState.score = newScore;
    gameState.stage = newStage;
    gameState.speed = newSpeed;

    // Update obstacles
    obstaclesRef.current = obstacles
      .map((o) => ({
        ...o,
        position: { ...o.position, x: o.position.x - gameState.speed },
      }))
      .filter((o) => o.position.x > -o.size.width);

    // Spawn new obstacles
    const spawnChance = Math.min(0.008 + (gameState.stage - 1) * 0.002, 0.025);
    if (Math.random() < spawnChance) {
      spawnObstacle();
    }

    // --- Collision Detection ---
    for (const obstacle of obstaclesRef.current) {
      if (checkCollision(cat, obstacle)) {
        setGamePhase(GamePhase.GAME_OVER);
        setGameState((prev) => ({ ...prev, isPlaying: false, isGameOver: true }));
        onGameOver?.(gameState.score);
        return; // Stop the loop
      }
    }

    // --- Sync State for Rendering ---
    setCat({ ...catRef.current });
    setObstacles([...obstaclesRef.current]);
    setGameState({ ...gameStateRef.current });

    // --- Stage Completion ---
    if (gameState.score > 0 && gameState.score % 10000 === 0) {
      onStageComplete?.(gameState.stage);
    }

    // --- Next Frame ---
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, onStageComplete, spawnObstacle]);

  // --- Game Loop Controller ---
  useEffect(() => {
    if (gamePhase === GamePhase.PLAYING) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gamePhase, gameLoop]);

  const startGame = () => {
    resetGame(false); // Reset logic without changing phase
    setGamePhase(GamePhase.PLAYING);
  };

  const jump = () => {
    setCat((prev) => {
      if (prev.isJumping || prev.isSliding) return prev;
      return {
        ...prev,
        velocity: { ...prev.velocity, y: JUMP_FORCE },
        isJumping: true,
        sprite: "bcat_jump",
      };
    });
  };

  const slide = () => {
    const svgToRender = (v: number) => v * (CAT_WIDTH / 320);
    setCat((prev) => {
      if (prev.isJumping || prev.isSliding) return prev;
      return {
        ...prev,
        isSliding: true,
        sprite: "bcat_sliding",
        collisionBox: {
          offset: { x: 8, y: 8 },
          size: { width: svgToRender(28), height: svgToRender(20) },
        },
      };
    });

    setTimeout(() => {
      setCat((prev) => ({
        ...prev,
        isSliding: false,
        sprite: "bcat",
        collisionBox: {
          offset: { x: 8, y: 8 },
          size: { width: CAT_WIDTH, height: CAT_HEIGHT },
        },
      }));
    }, 500);
  };

  const resetGame = (shouldSetPhase = true) => {
    if (shouldSetPhase) {
      setGamePhase(GamePhase.START);
    }
    const initialGameState: GameState = {
      score: 0,
      stage: 1,
      isPlaying: false,
      isGameOver: false,
      speed: 2,
    };
    const initialCatState: Cat = {
      position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
      velocity: { x: 0, y: 0 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
      collisionBox: {
        offset: { x: 8, y: 8 },
        size: { width: CAT_WIDTH, height: CAT_HEIGHT },
      },
      isJumping: false,
      isSliding: false,
      sprite: "bcat",
    };

    setGameState(initialGameState);
    setCat(initialCatState);
    setObstacles([]);

    // Also reset refs
    gameStateRef.current = initialGameState;
    catRef.current = initialCatState;
    obstaclesRef.current = [];
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gamePhase === GamePhase.START && (e.code === "Space" || e.code === "ArrowUp") && imagesLoaded) {
        startGame();
      } else if (gamePhase === GamePhase.PLAYING) {
        if ((e.code === "Space" || e.code === "ArrowUp")) {
          jump();
        } else if (e.code === "ArrowDown") {
          slide();
        }
      } else if (gamePhase === GamePhase.GAME_OVER && (e.code === "Space" || e.code === "ArrowUp")) {
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gamePhase, imagesLoaded]);


  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT);

    if (gamePhase === GamePhase.START) {
      ctx.fillStyle = "#333333";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Cat Runner", canvasWidth / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = "16px Arial";
      if (!imagesLoaded) {
        ctx.fillText("Loading cat sprites...", canvasWidth / 2, CANVAS_HEIGHT / 2);
      } else {
        ctx.fillText("Press SPACE to start", canvasWidth / 2, CANVAS_HEIGHT / 2);
        ctx.fillText("SPACE: Jump, ↓: Slide", canvasWidth / 2, CANVAS_HEIGHT / 2 + 30);
      }
    } else if (gamePhase === GamePhase.PLAYING || gamePhase === GamePhase.GAME_OVER) {
      // Draw ground
      ctx.fillStyle = "#999999";
      ctx.fillRect(0, GROUND_Y, canvasWidth, 2);

      // Draw score and stage info
      ctx.fillStyle = "#333333";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${gameState.score.toString().padStart(5, "0")}`, 20, 30);
      ctx.fillText(`Stage: ${gameState.stage}`, 20, 50);
      ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}x`, 20, 70);

      // Draw cat
      const catImage = images[cat.sprite];
      if (catImage && catImage.complete && catImage.naturalWidth > 0) {
        ctx.drawImage(catImage, cat.position.x, cat.position.y, cat.size.width, cat.size.height);
      } else {
        ctx.fillStyle = "#FF6B35";
        ctx.fillRect(cat.position.x, cat.position.y, cat.size.width, cat.size.height);
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
        if (obstacle.type === "cactus") ctx.fillStyle = "#2E7D32";
        else if (obstacle.type === "rock") ctx.fillStyle = "#5D4037";
        else if (obstacle.type === "bird") ctx.fillStyle = "#1976D2";
        ctx.fillRect(obstacle.position.x, obstacle.position.y, obstacle.size.width, obstacle.size.height);
      });

      if (gamePhase === GamePhase.GAME_OVER) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvasWidth / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = "18px Arial";
        ctx.fillText(`Final Score: ${gameState.score.toString().padStart(5, "0")}`, canvasWidth / 2, CANVAS_HEIGHT / 2);
        ctx.font = "16px Arial";
        ctx.fillText("Press SPACE to restart", canvasWidth / 2, CANVAS_HEIGHT / 2 + 40);
      }
    }
  }, [gamePhase, cat, obstacles, gameState, images, imagesLoaded, canvasWidth]);

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