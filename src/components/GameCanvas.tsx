"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { GamePhase, type Cat, type Obstacle } from "@/types/game";
import RandomBox from "./RandomBox";
import { useObstacleManager } from "./ObstacleManager";
import { useGameStateManager } from "./GameStateManager";
import { useInputHandler } from "./InputHandler";
import { useGameRenderer } from "./GameRenderer";
import { useImageLoader } from "./ImageLoader";
import { useCharacterStore, CharacterStore } from "@/stores/characterStore";
import useCatController from "@/hooks/useCatController";

const CANVAS_HEIGHT = 500;
const GROUND_Y = 300;
const CAT_WIDTH = 80;
const CAT_HEIGHT = 80;
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
  // character state moved to zustand store
  const currentCharacter = useCharacterStore(
    (s: CharacterStore) => s.currentCharacter
  );
  const setCurrentCharacter = useCharacterStore(
    (s: CharacterStore) => s.setCurrentCharacter
  );
  const bulkcatRunFrameFromStore = useCharacterStore(
    (s: CharacterStore) => s.bulkcatRunFrame
  );
  const toggleBulkcatRunFrame = useCharacterStore(
    (s: CharacterStore) => s.toggleBulkcatRunFrame
  );
  const incrementBulkcatHitCount = useCharacterStore(
    (s: CharacterStore) => s.incrementBulkcatHitCount
  );
  const bulkcatIsImmuneFromStore = useCharacterStore(
    (s: CharacterStore) => s.bulkcatIsImmune
  );
  const bulkcatHitCountFromStore = useCharacterStore(
    (s: CharacterStore) => s.bulkcatHitCount
  );
  const resetBulkcat = useCharacterStore((s: CharacterStore) => s.resetBulkcat);
  const setBulkcatImmune = useCharacterStore(
    (s: CharacterStore) => s.setBulkcatImmune
  );
  const [showRandomBox, setShowRandomBox] = useState(false);
  const [isRandomBoxPhase, setIsRandomBoxPhase] = useState(false);
  const [lastRandomBoxStage, setLastRandomBoxStage] = useState(0);
  // local mirror states are no longer used; use store values via hooks
  const [boomAnimationFrame, setBoomAnimationFrame] = useState(0);
  const [boomAnimationStartTime, setBoomAnimationStartTime] = useState(0);
  const [randomBoxPhase, setRandomBoxPhase] = useState<
    "box" | "spinning" | "result"
  >("box");

  // 히트박스/사이즈는 스토어에서 관리한다 (CharacterSettings 컴포넌트로 조절 가능)

  // Cat controller hook (state + actions extracted)
  const {
    cat,
    setCat,
    catRef,
    jump,
    startSlide,
    endSlide,
    resetCat,
    getSize,
    getHitbox,
  } = useCatController();

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Initialize managers
  const { images, imagesLoaded, obstacleImages, obstacleImagesLoaded } =
    useImageLoader();

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
      console.log("🎁 RandomBox triggered! Setting states...");
      setIsRandomBoxPhase(true);
      setShowRandomBox(true);
      setBoomAnimationFrame(0);
      setBoomAnimationStartTime(Date.now());
      console.log(
        "🎁 RandomBox states set: isRandomBoxPhase=true, showRandomBox=true"
      );
    },
    lastRandomBoxStage,
    setLastRandomBoxStage,
  });

  const obstacleManager = useObstacleManager({
    gameSpeed: gameState.speed,
    gameStage: gameState.stage,
    canvasWidth,
  });

  // Cat actions are provided by useCatController: jump, startSlide, endSlide, resetCat

  const startGame = useCallback(() => {
    resetGameState(false);
    startGameState();
  }, [resetGameState, startGameState]);

  const resetGame = useCallback(() => {
    setCurrentCharacter("bcat");
    resetBulkcat();

    const initialCatState: Cat = {
      position: { x: 50, y: GROUND_Y - CAT_HEIGHT },
      velocity: { x: 0, y: 0 },
      size: { width: CAT_WIDTH, height: CAT_HEIGHT },
  collisionBox: getHitbox("bcat", false),
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
  }, [obstacleManager, resetGameState]);

  // Input handler
  useInputHandler({
    gamePhase,
    imagesLoaded,
    isRandomBoxPhase, // RandomBox 상태 전달
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
    obstacleImages,
    imagesLoaded,
    obstacleImagesLoaded,
    isImmune: currentCharacter === "bulkcat" ? bulkcatIsImmuneFromStore : false,
    currentCharacter,
    bulkcatHitCount: bulkcatHitCountFromStore,
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
      // RandomBox 중에도 스프라이트 업데이트는 실행해야 함
      const currentTime = Date.now();
      const elapsed = currentTime - boomAnimationStartTime;

      // boom1 → boom2 → RandomBox phase에 따라 box 렌더링
      let currentSprite = "transform_box";
      if (elapsed < 300) {
        currentSprite = "boom1";
      } else if (elapsed < 600) {
        currentSprite = "boom2";
      } else {
        // RandomBox가 "result" phase일 때만 box 렌더링
        if (randomBoxPhase === "result") {
          currentSprite = "box";
        } else {
          currentSprite = "box2";
        }
      }

      console.log(
        `🎁 In RandomBox phase, sprite: ${currentSprite}, elapsed: ${elapsed}ms`
      );

      // Sprite updates (RandomBox 중에만 실행)
      catState.sprite = currentSprite;
      catState.size = { width: CAT_WIDTH, height: CAT_HEIGHT };
      catState.position.y = GROUND_Y - 100;
      catState.velocity.y = 0;
      catState.isJumping = false;

      // Cat 상태 업데이트
      setCat({ ...catState });

      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Physics updates
    let newY = catState.position.y + catState.velocity.y;
    let newVelY = catState.velocity.y + GRAVITY;
    let isJumping = catState.isJumping;

    // bulkcat일 때는 1.5배 크기를 고려한 ground 위치 계산
    const effectiveHeight =
      currentCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
    const groundLevel = GROUND_Y - effectiveHeight;

    if (newY >= groundLevel) {
      newY = groundLevel;
      newVelY = 0;
      isJumping = false;
      // 착지 시 히트박스 복원
      catState.collisionBox = getHitbox(
        currentCharacter,
        catState.isSliding,
        false
      );
    }
    catState.position.y = newY;
    catState.velocity.y = newVelY;
    catState.isJumping = isJumping;

    // BulkCat 애니메이션 프레임 업데이트 (store로 위임)
    if (currentCharacter === "bulkcat") {
      const currentTime = Date.now();
      if (currentTime % 5 === 0) {
        toggleBulkcatRunFrame();
      }
    }

    // Sprite updates (일반 게임 진행 중)
    if (currentCharacter === "bulkcat") {
      // BulkCat 스프라이트 처리
      if (isJumping) {
        catState.sprite = "bulkcat_jump";
      } else if (catState.isSliding) {
        catState.sprite = "bulkcat_sliding";
      } else {
        // 달리기 애니메이션
        catState.sprite =
          bulkcatRunFrameFromStore === 0 ? "bulkcat1" : "bulkcat2";
      }
      // bulkcat 크기 조정
      catState.size = getSize("bulkcat");
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
      catState.size = getSize(currentCharacter);
    }

    // Update game state
    updateGameState();

    // Update obstacles
    obstacleManager.updateObstacles();

    // Check collisions
    const collidedObstacle = obstacleManager.checkAllCollisions(catState);
    if (collidedObstacle) {
      if (currentCharacter === "bulkcat" && !bulkcatIsImmuneFromStore) {
        // BulkCat 충돌 처리 (3번까지 허용)
        const newHitCount = incrementBulkcatHitCount();

        if (newHitCount >= 3) {
          // 3번째 충돌 - 게임오버
          endGame();
          onGameOver?.(gameStateData.score);
          return;
        } else {
          // 1~2번째 충돌 - 잠시 면역 상태 (0.5초)
          setBulkcatImmune(true);
          console.log(
            `🔥 BulkCat collision ${newHitCount}/3! Hearts remaining: ${
              3 - newHitCount
            }`
          );
          console.log(`Collision details:`, {
            catPosition: catState.position,
            catHitbox: catState.collisionBox,
            obstacleType: collidedObstacle.type,
            obstaclePosition: collidedObstacle.position,
            obstacleSize: collidedObstacle.size,
          });

          // 0.5초 후 면역 해제 (너무 짧은 간격 충돌 방지)
          setTimeout(() => {
            setBulkcatImmune(false);
            console.log("BulkCat immunity ended");
          }, 500);

          // 게임 계속
          setCat({ ...catState });
          setObstacles(obstacleManager.getObstacles());
          animationFrameId.current = requestAnimationFrame(gameLoop);
          return;
        }
      } else if (currentCharacter === "bulkcat" && bulkcatIsImmuneFromStore) {
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
    randomBoxPhase,
    boomAnimationStartTime,
    currentCharacter,
    bulkcatRunFrameFromStore,
    bulkcatHitCountFromStore,
    bulkcatIsImmuneFromStore,
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
        resetBulkcat();
        console.log("BulkCat selected! Collision immunity reset to 3 hits");
      } else {
        // 다른 캐릭터 선택 시 BulkCat 상태 리셋
        resetBulkcat();
      }

      setCat((prev) => {
        // bulkcat일 때는 올바른 ground 위치 계산
        const effectiveHeight =
          selectedCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
        const groundLevel = GROUND_Y - effectiveHeight;
        const newY =
          prev.position.y > groundLevel ? groundLevel : prev.position.y;

        return {
          ...prev,
          position: { ...prev.position, y: newY },
          sprite:
            selectedCharacter === "bulkcat" ? "bulkcat1" : selectedCharacter,
          size:
            selectedCharacter === "bulkcat"
              ? { width: CAT_WIDTH * 1.5, height: CAT_HEIGHT * 1.5 }
              : { width: CAT_WIDTH, height: CAT_HEIGHT },
          collisionBox: getHitbox(selectedCharacter, prev.isSliding),
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
        onPhaseChange={setRandomBoxPhase}
      />
    </div>
  );
}
