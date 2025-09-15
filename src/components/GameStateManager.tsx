"use client";

import { useState, useCallback, useRef } from "react";
import { GamePhase, type GameState } from "@/types/game";

interface GameStateManagerProps {
  onStageComplete?: (stage: number) => void;
  onRandomBoxTrigger?: () => void;
  lastRandomBoxStage: number;
  setLastRandomBoxStage: (stage: number) => void;
}

export function useGameStateManager({
  onStageComplete,
  onRandomBoxTrigger,
  lastRandomBoxStage,
  setLastRandomBoxStage,
}: GameStateManagerProps) {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    stage: 1,
    isPlaying: false,
    isGameOver: false,
    speed: 2,
  });

  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.START);
  const gameStateRef = useRef(gameState);

  // ref와 state 동기화
  const syncGameState = useCallback(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 게임 상태 업데이트
  const updateGameState = useCallback(() => {
    const newScore = gameStateRef.current.score + 1;
    const newStage = Math.floor(newScore / 10) + 1;
    let newSpeed = gameStateRef.current.speed;

    // 스테이지별 속도 조정
    if (newStage > gameStateRef.current.stage) {
      if (newStage <= 10) newSpeed = 2 + (newStage - 1) * 0.2;
      else if (newStage <= 20) newSpeed = 4 + (newStage - 10) * 0.3;
      else newSpeed = 7 + (newStage - 20) * 0.5;

      // 10 스테이지마다 랜덤박스 표시
      if (newStage % 10 === 0 && newStage > lastRandomBoxStage) {
        onRandomBoxTrigger?.();
        setLastRandomBoxStage(newStage);
      }

      // 스테이지 완료 콜백
      if (newScore > 0 && newScore % 10000 === 0) {
        onStageComplete?.(newStage);
      }
    }

    // 상태 업데이트
    gameStateRef.current = {
      ...gameStateRef.current,
      score: newScore,
      stage: newStage,
      speed: newSpeed,
    };

    setGameState({ ...gameStateRef.current });
  }, [
    onStageComplete,
    onRandomBoxTrigger,
    lastRandomBoxStage,
    setLastRandomBoxStage,
  ]);

  // 게임 시작
  const startGame = useCallback(() => {
    setGamePhase(GamePhase.PLAYING);
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
    }));
  }, []);

  // 게임 오버
  const endGame = useCallback(() => {
    setGamePhase(GamePhase.GAME_OVER);
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
    }));
  }, []);

  // 게임 초기화
  const resetGame = useCallback((shouldSetPhase = true) => {
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

    setGameState(initialGameState);
    gameStateRef.current = initialGameState;
  }, []);

  return {
    gameState,
    gamePhase,
    gameStateRef,
    setGamePhase,
    startGame,
    endGame,
    resetGame,
    updateGameState,
    syncGameState,
  };
}
