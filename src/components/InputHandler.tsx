"use client";

import { useEffect } from "react";
import { GamePhase } from "@/types/game";

interface InputHandlerProps {
  gamePhase: GamePhase;
  imagesLoaded: boolean;
  onStartGame: () => void;
  onJump: () => void;
  onStartSlide: () => void;
  onEndSlide: () => void;
  onResetGame: () => void;
  slideTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  slideDuration: number;
}

export function useInputHandler({
  gamePhase,
  imagesLoaded,
  onStartGame,
  onJump,
  onStartSlide,
  onEndSlide,
  onResetGame,
  slideTimeout,
  slideDuration,
}: InputHandlerProps) {
  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        gamePhase === GamePhase.START &&
        (e.code === "Space" || e.code === "ArrowUp") &&
        imagesLoaded
      ) {
        onStartGame();
      } else if (gamePhase === GamePhase.PLAYING) {
        if (e.code === "Space" || e.code === "ArrowUp") {
          onJump();
        } else if (e.code === "ArrowDown") {
          onStartSlide();
          // slideDuration 이후 자동 해제
          if (slideTimeout.current) clearTimeout(slideTimeout.current);
          slideTimeout.current = setTimeout(() => {
            onEndSlide();
          }, slideDuration);
        }
      } else if (
        gamePhase === GamePhase.GAME_OVER &&
        (e.code === "Space" || e.code === "ArrowUp")
      ) {
        onResetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gamePhase === GamePhase.PLAYING && e.code === "ArrowDown") {
        onEndSlide();
        if (slideTimeout.current) {
          clearTimeout(slideTimeout.current);
          slideTimeout.current = null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (slideTimeout.current) clearTimeout(slideTimeout.current);
    };
  }, [
    gamePhase,
    imagesLoaded,
    onStartGame,
    onJump,
    onStartSlide,
    onEndSlide,
    onResetGame,
    slideTimeout,
    slideDuration,
  ]);
}