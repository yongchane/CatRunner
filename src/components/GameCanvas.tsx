"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  GamePhase,
  type GameState,
  type Cat,
  type Obstacle,
} from "@/types/game";
import RandomBox from "./RandomBox";

const CANVAS_HEIGHT = 400;
const GROUND_Y = 300;
const CAT_WIDTH = 100;
const CAT_HEIGHT = 100;
const GRAVITY = 0.5;
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
  const [showRandomBox, setShowRandomBox] = useState(false);
  const [isRandomBoxPhase, setIsRandomBoxPhase] = useState(false);
  const [lastRandomBoxStage, setLastRandomBoxStage] = useState(0);

  // bcat 초기 렌더링용 state
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

  // 장애물 생성/이동/삭제 관리
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  // 게임 전체 상태 관리(점수, 스테이지, 게임오버 등)
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    stage: 1,
    isPlaying: false,
    isGameOver: false,
    speed: 2,
  });

  // 고양이,장애물,게임 상태 동기화용 ref
  const catRef = useRef(cat);
  const obstaclesRef = useRef(obstacles);
  const gameStateRef = useRef(gameState);

  // 고양이,장애물,게임 상태 동기화용 ref
  useEffect(() => {
    catRef.current = cat;
  }, [cat]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 이미지 연결 및 로드
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
    // bcat, bcat_jump, bcat_sliding의 이미지 로드
    const imageList = [
      { name: "bcat", src: "/bcat.svg" },
      { name: "bcat_jump", src: "/bcat_jump.svg" },
      { name: "bcat_sliding", src: "/bcat_slide.svg" },
    ];

    const loadAllImages = async () => {
      try {
        await Promise.all(
          imageList.map(({ name, src }) => loadImage(name, src))
        );
        console.log("🎉 All cat images loaded successfully");
        setImagesLoaded(true);
      } catch (error) {
        console.error("🚨 Some images failed to load:", error);
      }
    };

    loadAllImages();
  }, []);

  // 브라우저 창 크기 변경 대응
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

  // 고양이와 장애물 충돌 감지
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
  // 게임 화면 오른쪽 끝에 랜덤 장애물 생성
  const spawnObstacle = useCallback(() => {
    const MIN_OBSTACLE_GAP = 150; // 장애물 간 최소 간격(px)
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
    // 마지막 장애물과의 간격 체크
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    if (
      lastObstacle &&
      lastObstacle.position.x > currentCanvasWidth - MIN_OBSTACLE_GAP
    ) {
      // 간격이 충분하지 않으면 생성하지 않음
      return;
    }
    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
  }, []);

  const gameLoop = useCallback(() => {
    // --- Physics and State Updates (using refs) ---
    const cat = catRef.current;
    const obstacles = obstaclesRef.current;
    const gameState = gameStateRef.current;

    // 랜덤박스 단계에서는 게임 루프를 중단
    if (isRandomBoxPhase) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }

    // 고양이의 점프/중력/착지 처리
    // velocity.y에 중력 적용
    // position.y에 velocity.y 적용
    // 땅에 닿으면 점프 상태 해제 및 위치/속도 조정
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
    cat.sprite = isJumping
      ? "bcat_jump"
      : cat.isSliding
      ? "bcat_sliding"
      : "bcat";

    // 게임의 점수,스테이지,속도 처리
    // 일정 점수마다 스테이지 증가 및 속도 증가
    // 속도는 스테이지에 따라 점진적으로 증가
    // 1~10스테이지: 2 + 0.2씩 증가
    // 11~20스테이지: 4 + 0.3씩 증가
    // 21스테이지 이상: 7 + 0.5씩 증가
    // 수정 필요
    const newScore = gameState.score + 1;
    const newStage = Math.floor(newScore / 100) + 1;
    let newSpeed = gameState.speed;
    if (newStage > gameState.stage) {
      if (newStage <= 10) newSpeed = 2 + (newStage - 1) * 0.2;
      else if (newStage <= 20) newSpeed = 4 + (newStage - 10) * 0.3;
      else newSpeed = 7 + (newStage - 20) * 0.5;

      // 10 스테이지마다 랜덤박스 표시 (10, 20, 30, ...)
      if (newStage % 10 === 0 && newStage > lastRandomBoxStage) {
        setIsRandomBoxPhase(true);
        setShowRandomBox(true);
        setLastRandomBoxStage(newStage);
      }
    }
    gameState.score = newScore;
    gameState.stage = newStage;
    gameState.speed = newSpeed;

    // 장애물 위치 업데이트 및 화면 밖 장애물 제거
    // 장애물 위치는 게임 속도에 따라 좌측으로 이동
    // 화면 밖으로 나간 장애물은 배열에서 제거
    obstaclesRef.current = obstacles
      .map((o) => ({
        ...o,
        position: { ...o.position, x: o.position.x - gameState.speed },
      }))
      .filter((o) => o.position.x > -o.size.width);

    // 장애물 등장확률 처리
    // 스테이지가 올라갈수록 등장확률 증가 (최대 2.5%)
    const spawnChance = Math.min(0.008 + (gameState.stage - 1) * 0.002, 0.025);
    if (Math.random() < spawnChance) {
      spawnObstacle();
    }

    // 고양이와 장애물의 충돌을 감지
    // 충돌 시 게임오버 처리
    for (const obstacle of obstaclesRef.current) {
      if (checkCollision(cat, obstacle)) {
        setGamePhase(GamePhase.GAME_OVER);
        setGameState((prev) => ({
          ...prev,
          isPlaying: false,
          isGameOver: true,
        }));
        onGameOver?.(gameState.score);
        return; // Stop the loop
      }
    }

    // --- Sync State for Rendering ---
    setCat({ ...catRef.current });
    setObstacles([...obstaclesRef.current]);
    setGameState({ ...gameStateRef.current });

    // 스테이지 완료 감지 및 콜백 호출
    // 10000점마다 스테이지 완료로 간주
    if (gameState.score > 0 && gameState.score % 10000 === 0) {
      onStageComplete?.(gameState.stage);
    }

    // 다음 프레임 요청 (gameLoop 재호출)
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, onStageComplete, spawnObstacle, isRandomBoxPhase, lastRandomBoxStage]);

  // 게임 루프의 시작과 정지 관리
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

  // 점프 및 슬라이딩 처리
  // 점프 중에는 슬라이딩 불가, 슬라이딩 중에는 점프 불가
  // 점프 시 velocity.y에 음수값 부여
  // 슬라이딩 시 충돌박스 크기 축소 후 일정시간 후 원복
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

  const SLIDE_DURATION = 500; // 슬라이딩 지속 시간(ms)
  const svgToRender = (v: number) => v * (CAT_WIDTH / 320);
  const startSlide = () => {
    setCat((prev) => {
      if (prev.isSliding) return prev;
      // 점프 중에 ArrowDown을 누르면 즉시 바닥에 붙게 처리
      let newY = prev.position.y;
      let newVelY = prev.velocity.y;
      let newIsJumping = prev.isJumping;
      if (prev.position.y < GROUND_Y - CAT_HEIGHT) {
        newY = GROUND_Y - CAT_HEIGHT;
        newVelY = 0;
        newIsJumping = false;
      }
      return {
        ...prev,
        position: { ...prev.position, y: newY },
        velocity: { ...prev.velocity, y: newVelY },
        isJumping: newIsJumping,
        isSliding: true,
        sprite: "bcat_sliding",
        collisionBox: {
          offset: { x: 8, y: 8 },
          size: { width: svgToRender(28), height: svgToRender(20) },
        },
      };
    });
  };
  const endSlide = () => {
    setCat((prev) => ({
      ...prev,
      isSliding: false,
      sprite: "bcat",
      collisionBox: {
        offset: { x: 8, y: 8 },
        size: { width: CAT_WIDTH, height: CAT_HEIGHT },
      },
    }));
  };

  const handleRandomBoxComplete = () => {
    setShowRandomBox(false);
    setIsRandomBoxPhase(false);
  };
  // 게임 상태 및 고양이, 장애물 상태 초기화
  // gamePhase가 true면 게임 시작 상태로 변경
  // gamePhase가 false면 상태만 초기화
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
    setShowRandomBox(false);
    setIsRandomBoxPhase(false);
    setLastRandomBoxStage(0);

    // Also reset refs
    gameStateRef.current = initialGameState;
    catRef.current = initialCatState;
    obstaclesRef.current = [];
  };

  // 키보드 입력 처리
  // START 상태에서 SPACE 또는 ↑키로 게임 시작
  // PLAYING 상태에서 SPACE 또는 ↑키로 점프, ↓키로 슬라이딩
  // GAME_OVER 상태에서 SPACE 또는 ↑키로 게임 재시작
  useEffect(() => {
    let slideTimeout: NodeJS.Timeout | null = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        gamePhase === GamePhase.START &&
        (e.code === "Space" || e.code === "ArrowUp") &&
        imagesLoaded
      ) {
        startGame();
      } else if (gamePhase === GamePhase.PLAYING) {
        if (e.code === "Space" || e.code === "ArrowUp") {
          jump();
        } else if (e.code === "ArrowDown") {
          startSlide();
          // SLIDE_DURATION 이후 자동 해제 (키를 계속 누르고 있으면 해제 안됨)
          if (slideTimeout) clearTimeout(slideTimeout);
          slideTimeout = setTimeout(() => {
            endSlide();
          }, SLIDE_DURATION);
        }
      } else if (
        gamePhase === GamePhase.GAME_OVER &&
        (e.code === "Space" || e.code === "ArrowUp")
      ) {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gamePhase === GamePhase.PLAYING && e.code === "ArrowDown") {
        endSlide();
        if (slideTimeout) {
          clearTimeout(slideTimeout);
          slideTimeout = null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (slideTimeout) clearTimeout(slideTimeout);
    };
  }, [gamePhase, imagesLoaded]);

  // 게임 화면 렌더링
  // gamePhase에 따라 시작화면,게임화면,게임오버화면 렌더링
  // 게임화면에서는 고양이,장애물,점수,스테이지 정보 렌더링
  // DEBUG_COLLISION이 true면 충돌박스도 렌더링
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
    } else if (
      gamePhase === GamePhase.PLAYING ||
      gamePhase === GamePhase.GAME_OVER
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
        ctx.fillStyle = "#FF6B35";
        ctx.fillRect(
          cat.position.x,
          cat.position.y,
          cat.size.width,
          cat.size.height
        );
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
        ctx.fillRect(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.size.width,
          obstacle.size.height
        );
      });

      if (gamePhase === GamePhase.GAME_OVER) {
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
      
      <RandomBox
        isVisible={showRandomBox}
        onComplete={handleRandomBoxComplete}
        canvasWidth={canvasWidth}
        canvasHeight={CANVAS_HEIGHT}
      />
    </div>
  );
}
