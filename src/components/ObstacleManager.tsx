"use client";

import { useCallback, useRef } from "react";
import type { Cat, Obstacle } from "@/types/game";

const GROUND_Y = 300;

interface ObstacleManagerProps {
  gameSpeed: number;
  gameStage: number;
  canvasWidth: number;
}

export function useObstacleManager({
  gameSpeed,
  gameStage,
  canvasWidth,
}: ObstacleManagerProps) {
  const obstaclesRef = useRef<Obstacle[]>([]);

  // 고양이와 장애물 충돌 감지
  const checkCollision = useCallback(
    (cat: Cat, obstacle: Obstacle): boolean => {
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
    },
    []
  );

  // 스테이지별 장애물 타입 결정
  const getObstacleTypesForStage = useCallback((stage: number) => {
    if (stage <= 10) {
      // 1-10 스테이지: 기본 장애물만
      return ["cactus", "rock", "bird"] as const;
    } else if (stage <= 20) {
      // 11-20 스테이지: 기본 + 개, 쥐 추가
      return ["cactus", "rock", "bird", "dog", "mouse"] as const;
    } else {
      // 21+ 스테이지: 모든 장애물
      return [
        "cactus",
        "rock",
        "bird",
        "dog",
        "mouse",
        "fish",
        "spider",
        "yarn",
      ] as const;
    }
  }, []);

  // 게임 화면 오른쪽 끝에 랜덤 장애물 생성
  const spawnObstacle = useCallback(() => {
    // 장애물 크기를 2배로 키움에 따라 최소 간격도 늘려 충돌/겹침을 방지
    const MIN_OBSTACLE_GAP = 200; // 장애물 간 최소 간격(px) — 기존 100에서 확대
    const availableTypes = getObstacleTypesForStage(gameStage);
    const randomType =
      availableTypes[Math.floor(Math.random() * availableTypes.length)];

    let newObstacle: Obstacle;

    // helper: base -> doubled size, and position for ground-based obstacles
    const makeGroundObstacle = (
      baseW: number,
      baseH: number,
      type: Obstacle["type"]
    ) => {
      const w = baseW * 2;
      const h = baseH * 2;
      return {
        position: { x: canvasWidth, y: GROUND_Y - h },
        size: { width: w, height: h },
        type,
      } as Obstacle;
    };

    switch (randomType) {
      case "bird": {
        // bird은 공중에 떠있는 y-offset을 고정(기존대로 유지)
        const baseW = 25;
        const baseH = 20;
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 150 },
          size: { width: baseW * 2, height: baseH * 2 },
          type: "bird",
        };
        break;
      }
      case "rock":
        newObstacle = makeGroundObstacle(25, 25, "rock");
        break;
      case "dog":
        newObstacle = makeGroundObstacle(30, 25, "dog");
        break;
      case "mouse":
        newObstacle = makeGroundObstacle(26, 12, "mouse");
        break;
      case "fish": {
        // fish 위치는 기존 오프셋 유지
        const baseW = 22;
        const baseH = 15;
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 60 },
          size: { width: baseW * 2, height: baseH * 2 },
          type: "fish",
        };
        break;
      }
      case "spider":
        newObstacle = makeGroundObstacle(18, 18, "spider");
        break;
      case "yarn":
        newObstacle = makeGroundObstacle(24, 24, "yarn");
        break;
      default: // cactus
        newObstacle = makeGroundObstacle(20, 30, "cactus");
        break;
    }

    // 마지막 장애물과의 간격 체크 (새 크기를 고려)
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    if (
      lastObstacle &&
      lastObstacle.position.x > canvasWidth - MIN_OBSTACLE_GAP
    ) {
      // 간격이 충분하지 않으면 생성하지 않음
      return;
    }
    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
  }, [canvasWidth, gameStage, getObstacleTypesForStage]);

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
  const checkAllCollisions = useCallback(
    (cat: Cat): Obstacle | null => {
      for (const obstacle of obstaclesRef.current) {
        if (checkCollision(cat, obstacle)) {
          return obstacle;
        }
      }
      return null;
    },
    [checkCollision]
  );

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
