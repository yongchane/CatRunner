"use client";

import { useCallback, useRef } from "react";
import type { Cat, Obstacle } from "@/types/game";

const GROUND_Y = 300;

interface ObstacleManagerProps {
  gameSpeed: number;
  gameStage: number;
  canvasWidth: number;
}

export function useObstacleManager({ gameSpeed, gameStage, canvasWidth }: ObstacleManagerProps) {
  const obstaclesRef = useRef<Obstacle[]>([]);

  // 고양이와 장애물 충돌 감지
  const checkCollision = useCallback((cat: Cat, obstacle: Obstacle): boolean => {
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
  }, []);

  // 게임 화면 오른쪽 끝에 랜덤 장애물 생성
  const spawnObstacle = useCallback(() => {
    const MIN_OBSTACLE_GAP = 150; // 장애물 간 최소 간격(px)
    const obstacleTypes = ["cactus", "rock", "bird"] as const;
    const randomType =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    let newObstacle: Obstacle;

    if (randomType === "bird") {
      newObstacle = {
        position: { x: canvasWidth, y: GROUND_Y - 80 },
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

    // 마지막 장애물과의 간격 체크
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    if (
      lastObstacle &&
      lastObstacle.position.x > canvasWidth - MIN_OBSTACLE_GAP
    ) {
      // 간격이 충분하지 않으면 생성하지 않음
      return;
    }
    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
  }, [canvasWidth]);

  // 장애물 업데이트 (이동 및 제거)
  const updateObstacles = useCallback(() => {
    // 장애물 위치 업데이트 및 화면 밖 장애물 제거
    obstaclesRef.current = obstaclesRef.current
      .map((o) => ({
        ...o,
        position: { ...o.position, x: o.position.x - gameSpeed },
      }))
      .filter((o) => o.position.x > -o.size.width);

    // 장애물 등장확률 처리 (스테이지가 올라갈수록 등장확률 증가)
    const spawnChance = Math.min(0.008 + (gameStage - 1) * 0.002, 0.025);
    if (Math.random() < spawnChance) {
      spawnObstacle();
    }
  }, [gameSpeed, gameStage, spawnObstacle]);

  // 장애물 충돌 체크
  const checkAllCollisions = useCallback((cat: Cat): Obstacle | null => {
    for (const obstacle of obstaclesRef.current) {
      if (checkCollision(cat, obstacle)) {
        return obstacle;
      }
    }
    return null;
  }, [checkCollision]);

  // 장애물 초기화
  const resetObstacles = useCallback(() => {
    obstaclesRef.current = [];
  }, []);

  // 현재 장애물 목록 반환
  const getObstacles = useCallback(() => {
    return [...obstaclesRef.current];
  }, []);

  return {
    updateObstacles,
    checkAllCollisions,
    resetObstacles,
    getObstacles,
  };
}