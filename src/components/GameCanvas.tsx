"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { GamePhase, type Cat, type Obstacle } from "@/types/game";
import RandomBox from "./RandomBox";
import { useObstacleManager } from "./ObstacleManager";
import { useGameStateManager } from "./GameStateManager";
import { useInputHandler } from "./InputHandler";
import { useGameRenderer } from "./GameRenderer";
import { useImageLoader } from "./ImageLoader";

const CANVAS_HEIGHT = 400;
const GROUND_Y = 300;
const CAT_WIDTH = 100;
const CAT_HEIGHT = 100;
const GRAVITY = 0.5;
const JUMP_FORCE = -15;
const SLIDE_DURATION = 500;

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
  const slideTimeout = useRef<NodeJS.Timeout | null>(null);

  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [currentCharacter, setCurrentCharacter] = useState<string>("bcat");
  const [showRandomBox, setShowRandomBox] = useState(false);
  const [isRandomBoxPhase, setIsRandomBoxPhase] = useState(false);
  const [lastRandomBoxStage, setLastRandomBoxStage] = useState(0);
  const [bulkcatRunFrame, setBulkcatRunFrame] = useState(0);
  const [bulkcatHitCount, setBulkcatHitCount] = useState(0);
  const [bulkcatIsImmune, setBulkcatIsImmune] = useState(false);

  // 캐릭터별 히트박스 설정
  const getCharacterHitbox = (
    character: string,
    isSliding: boolean = false
  ) => {
    const baseHitbox = {
      offset: { x: 8, y: 8 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
    };

    if (character === "bulkcat") {
      const scaledWidth = CAT_WIDTH * 1.5;
      const scaledHeight = CAT_HEIGHT * 1.5;
      return {
        offset: { x: 5, y: 5 },
        size: {
          width: isSliding ? scaledWidth + 15 : scaledWidth + 30,
          height: isSliding ? scaledHeight - 15 : scaledHeight + 20,
        },
      };
    } else if (character === "cat") {
      return {
        offset: { x: 10, y: 10 },
        size: {
          width: isSliding ? CAT_WIDTH - 10 : CAT_WIDTH - 5,
          height: isSliding ? CAT_HEIGHT - 15 : CAT_HEIGHT - 5,
        },
      };
    }

    // Default hitbox for bcat and sliding
    if (isSliding) {
      const svgToRender = (v: number) => v * (CAT_WIDTH / 320);
      return {
        offset: { x: 8, y: 8 },
        size: { width: svgToRender(28), height: svgToRender(20) },
      };
    }

    return baseHitbox;
  };

  // Cat state
  const [cat, setCat] = useState<Cat>({
    position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
    velocity: { x: 0, y: 0 },
    size: { width: CAT_WIDTH, height: CAT_HEIGHT },
    collisionBox: getCharacterHitbox("bcat"),
    isJumping: false,
    isSliding: false,
    sprite: "bcat",
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const catRef = useRef(cat);

  // Initialize managers
  const { images, imagesLoaded } = useImageLoader();

  const {
    gameState,
    gamePhase,
    gameStateRef,
    startGame: startGameState,
    endGame,
    resetGame: resetGameState,
    updateGameState,
  } = useGameStateManager({
    onStageComplete,
    onRandomBoxTrigger: () => {
      setIsRandomBoxPhase(true);
      setShowRandomBox(true);
    },
    lastRandomBoxStage,
    setLastRandomBoxStage,
  });

  const obstacleManager = useObstacleManager({
    gameSpeed: gameState.speed,
    gameStage: gameState.stage,
    canvasWidth,
  });


  // Cat actions
  const jump = useCallback(() => {
    setCat((prev) => {
      if (prev.isJumping || prev.isSliding) return prev;
      return {
        ...prev,
        velocity: { ...prev.velocity, y: JUMP_FORCE },
        isJumping: true,
        sprite:
          currentCharacter === "bulkcat"
            ? "bulkcat_jump"
            : `${currentCharacter}_jump`,
      };
    });
  }, [currentCharacter]);

  const startSlide = useCallback(() => {
    setCat((prev) => {
      if (prev.isSliding) return prev;
      let newY = prev.position.y;
      let newVelY = prev.velocity.y;
      let newIsJumping = prev.isJumping;
      
      // bulkcat일 때는 1.5배 크기를 고려한 ground 위치 계산
      const effectiveHeight = currentCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
      const groundLevel = GROUND_Y - effectiveHeight;
      
      if (prev.position.y < groundLevel) {
        newY = groundLevel;
        newVelY = 0;
        newIsJumping = false;
      }
      return {
        ...prev,
        position: { ...prev.position, y: newY },
        velocity: { ...prev.velocity, y: newVelY },
        isJumping: newIsJumping,
        isSliding: true,
        sprite:
          currentCharacter === "bulkcat"
            ? "bulkcat_sliding"
            : `${currentCharacter}_sliding`,
        collisionBox: getCharacterHitbox(currentCharacter, true),
      };
    });
  }, [currentCharacter, getCharacterHitbox]);

  const endSlide = useCallback(() => {
    setCat((prev) => ({
      ...prev,
      isSliding: false,
      sprite: currentCharacter === "bulkcat" ? "bulkcat1" : currentCharacter,
      collisionBox: getCharacterHitbox(currentCharacter, false),
    }));
  }, [currentCharacter, getCharacterHitbox]);

  const startGame = useCallback(() => {
    resetGameState(false);
    startGameState();
  }, [resetGameState, startGameState]);

  const resetGame = useCallback(() => {
    setCurrentCharacter("bcat");
    setBulkcatRunFrame(0);
    setBulkcatHitCount(0);
    setBulkcatIsImmune(false);

    const initialCatState: Cat = {
      position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
      velocity: { x: 0, y: 0 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
      collisionBox: getCharacterHitbox("bcat", false),
      isJumping: false,
      isSliding: false,
      sprite: "bcat",
    };

    setCat(initialCatState);
    setObstacles([]);
    setShowRandomBox(false);
    setIsRandomBoxPhase(false);
    setLastRandomBoxStage(0);
    obstacleManager.resetObstacles();
    resetGameState();

    catRef.current = initialCatState;
  }, [getCharacterHitbox, obstacleManager, resetGameState]);

  // Input handler
  useInputHandler({
    gamePhase,
    imagesLoaded,
    onStartGame: startGame,
    onJump: jump,
    onStartSlide: startSlide,
    onEndSlide: endSlide,
    onResetGame: resetGame,
    slideTimeout,
    slideDuration: SLIDE_DURATION,
  });

  // Game renderer
  useGameRenderer({
    canvasRef,
    canvasWidth,
    gamePhase,
    gameState,
    cat,
    obstacles,
    images,
    imagesLoaded,
    isImmune: currentCharacter === "bulkcat" ? bulkcatIsImmune : false,
  });

  // Sync cat ref
  useEffect(() => {
    catRef.current = cat;
  }, [cat]);

  // Canvas resize handler
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

  // Game loop
  const gameLoop = useCallback(() => {
    const catState = catRef.current;
    const gameStateData = gameStateRef.current;

    if (isRandomBoxPhase) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Physics updates
    let newY = catState.position.y + catState.velocity.y;
    let newVelY = catState.velocity.y + GRAVITY;
    let isJumping = catState.isJumping;

    // bulkcat일 때는 1.5배 크기를 고려한 ground 위치 계산
    const effectiveHeight = currentCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
    const groundLevel = GROUND_Y - effectiveHeight;

    if (newY >= groundLevel) {
      newY = groundLevel;
      newVelY = 0;
      isJumping = false;
    }
    catState.position.y = newY;
    catState.velocity.y = newVelY;
    catState.isJumping = isJumping;

    // BulkCat 애니메이션 프레임 업데이트 (1초마다)
    if (currentCharacter === "bulkcat") {
      const currentTime = Date.now();
      if (currentTime % 5 === 0) {
        setBulkcatRunFrame((prev) => (prev === 0 ? 1 : 0));

        console.log("BulkCat frame toggled to:", bulkcatRunFrame === 0 ? 1 : 0);
      }
    }

    // Sprite updates
    if (currentCharacter === "bulkcat") {
      // BulkCat 스프라이트 처리
      if (isJumping) {
        catState.sprite = "bulkcat_jump";
      } else if (catState.isSliding) {
        catState.sprite = "bulkcat_sliding";
      } else {
        // 달리기 애니메이션
        catState.sprite = bulkcatRunFrame === 0 ? "bulkcat1" : "bulkcat2";
      }
      // bulkcat 크기 조정
      catState.size = { width: CAT_WIDTH * 1.5, height: CAT_HEIGHT * 1.5 };
    } else {
      // 일반 캐릭터 스프라이트 처리
      if (isJumping) {
        catState.sprite = `${currentCharacter}_jump`;
      } else if (catState.isSliding) {
        catState.sprite = `${currentCharacter}_sliding`;
      } else {
        catState.sprite = currentCharacter;
      }
      // 기본 크기
      catState.size = { width: CAT_WIDTH, height: CAT_HEIGHT };
    }

    // Update game state
    updateGameState();

    // Update obstacles
    obstacleManager.updateObstacles();

    // Check collisions
    const collidedObstacle = obstacleManager.checkAllCollisions(catState);
    if (collidedObstacle) {
      if (currentCharacter === "bulkcat" && !bulkcatIsImmune) {
        // BulkCat 충돌 처리
        if (bulkcatHitCount >= 1) {
          // 2번째 충돌 - 게임오버
          endGame();
          onGameOver?.(gameStateData.score);
          return;
        } else {
          // 첫 번째 충돌 - 면역 상태 활성화
          setBulkcatHitCount((prev) => prev + 1);
          setBulkcatIsImmune(true);
          console.log("BulkCat first collision! Immune for 2 seconds");
          
          // 2초 후 면역 해제
          setTimeout(() => {
            setBulkcatIsImmune(false);
            console.log("BulkCat immunity ended");
          }, 2000);

          // 게임 계속
          setCat({ ...catState });
          setObstacles(obstacleManager.getObstacles());
          animationFrameId.current = requestAnimationFrame(gameLoop);
          return;
        }
      } else if (currentCharacter === "bulkcat" && bulkcatIsImmune) {
        // 면역 상태일 때는 충돌 무시
        setCat({ ...catState });
        setObstacles(obstacleManager.getObstacles());
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      } else {
        // 일반 캐릭터 충돌 - 즉시 게임오버
        endGame();
        onGameOver?.(gameStateData.score);
        return;
      }
    }

    // Update states
    setCat({ ...catState });
    setObstacles(obstacleManager.getObstacles());

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [
    isRandomBoxPhase,
    currentCharacter,
    bulkcatRunFrame,
    bulkcatHitCount,
    bulkcatIsImmune,
    updateGameState,
    obstacleManager,
    endGame,
    onGameOver,
  ]);

  // Game loop control
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

  const handleRandomBoxComplete = (selectedCharacter?: string) => {
    setShowRandomBox(false);
    setIsRandomBoxPhase(false);

    if (selectedCharacter) {
      setCurrentCharacter(selectedCharacter);
      
      // 캐릭터별 상태 초기화
      if (selectedCharacter === "bulkcat") {
        // BulkCat 선택 시 무적 상태 초기화
        setBulkcatHitCount(0);
        setBulkcatIsImmune(false);
        setBulkcatRunFrame(0);
        console.log("BulkCat selected! Collision immunity reset to 2 hits");
      } else {
        // 다른 캐릭터 선택 시 BulkCat 상태 리셋
        setBulkcatHitCount(0);
        setBulkcatIsImmune(false);
        setBulkcatRunFrame(0);
      }
      
      setCat((prev) => {
        // bulkcat일 때는 올바른 ground 위치 계산
        const effectiveHeight = selectedCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
        const groundLevel = GROUND_Y - effectiveHeight;
        const newY = prev.position.y > groundLevel ? groundLevel : prev.position.y;
        
        return {
          ...prev,
          position: { ...prev.position, y: newY },
          sprite:
            selectedCharacter === "bulkcat" ? "bulkcat1" : selectedCharacter,
          size:
            selectedCharacter === "bulkcat"
              ? { width: CAT_WIDTH * 1.5, height: CAT_HEIGHT * 1.5 }
              : { width: CAT_WIDTH, height: CAT_HEIGHT },
          collisionBox: getCharacterHitbox(selectedCharacter, prev.isSliding),
        };
      });
    }
  };

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
