"use client";

import { useEffect, useState } from "react";
import type { Cat } from "@/types/game";

interface BulkCatControllerProps {
  currentCharacter: string;
  cat: Cat;
  setCat: (cat: Cat | ((prev: Cat) => Cat)) => void;
  isPlaying: boolean;
}

export interface BulkCatState {
  hitCount: number;
  isImmune: boolean;
}

const CAT_WIDTH = 100;
const CAT_HEIGHT = 100;

export default function useBulkCatController({
  currentCharacter,
  cat,
  setCat,
  isPlaying,
}: BulkCatControllerProps) {
  const [bulkCatState, setBulkCatState] = useState<BulkCatState>({
    hitCount: 0,
    isImmune: false,
  });

  // bulkcat 히트박스 계산 (게임캔버스에서 사용)
  const getBulkCatHitbox = (isSliding: boolean = false) => {
    const scaledWidth = CAT_WIDTH * 1.5;
    const scaledHeight = CAT_HEIGHT * 1.5;

    return {
      offset: { x: 5, y: 5 },
      size: {
        width: isSliding ? scaledWidth + 15 : scaledWidth + 30,
        height: isSliding ? scaledHeight - 15 : scaledHeight + 20,
      },
    };
  };

  // 충돌 처리 (2번까지 면역)
  const handleCollision = (): boolean => {
    if (currentCharacter !== "bulkcat") return true; // 즉시 게임오버

    const currentHitCount = bulkCatState.hitCount;

    if (currentHitCount >= 1) {
      // 2번째 충돌 - 게임오버
      return true;
    } else {
      // 첫 번째 충돌 - 면역 상태 활성화
      setBulkCatState((prev) => ({
        ...prev,
        hitCount: prev.hitCount + 1,
        isImmune: true,
      }));

      // 2초 후 면역 해제
      setTimeout(() => {
        setBulkCatState((prev) => ({ ...prev, isImmune: false }));
      }, 2000);

      return false; // 게임 계속
    }
  };

  // 상태 초기화
  const resetBulkCatState = () => {
    setBulkCatState({
      hitCount: 0,
      isImmune: false,
    });
  };

  return {
    bulkCatState,
    getBulkCatHitbox,
    handleCollision,
    resetBulkCatState,
  };
}
