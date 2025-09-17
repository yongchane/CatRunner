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

      // If the cat's hitbox is ellipse-shaped, perform ellipse-rect intersection test
      const catHitboxAny: any = (cat as any).collisionBox;
      const isEllipse = catHitboxAny.shape === "ellipse";

      if (!isEllipse) {
        // rectangle-rectangle AABB check (existing behavior)
        return (
          catCollisionX < obstacle.position.x + obstacle.size.width &&
          catCollisionX + catCollisionWidth > obstacle.position.x &&
          catCollisionY < obstacle.position.y + obstacle.size.height &&
          catCollisionY + catCollisionHeight > obstacle.position.y
        );
      }

      // Ellipse vs Rect intersection test (approx): transform coordinates so ellipse is centered at origin,
      // scale to unit circle, then find closest point on rectangle to the circle and test distance.
      const rx = catCollisionX + catCollisionWidth / 2; // ellipse center x
      const ry = catCollisionY + catCollisionHeight / 2; // ellipse center y
      const a = catCollisionWidth / 2; // ellipse radius x
      const b = catCollisionHeight / 2; // ellipse radius y

      // Rectangle bounds
      const rectLeft = obstacle.position.x;
      const rectTop = obstacle.position.y;
      const rectRight = obstacle.position.x + obstacle.size.width;
      const rectBottom = obstacle.position.y + obstacle.size.height;

      // Find closest point (cx,cy) on rectangle to ellipse center
      const cx = Math.max(rectLeft, Math.min(rx, rectRight));
      const cy = Math.max(rectTop, Math.min(ry, rectBottom));

      // Compute normalized distance from ellipse center to closest point
      const nx = (cx - rx) / a;
      const ny = (cy - ry) / b;

      return nx * nx + ny * ny <= 1;
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

    switch (randomType) {
      case "bird": {
        // bird은 공중에 떠있는 y-offset을 랜덤화 (-200 ~ -90)
        const randomY = GROUND_Y - (Math.random() * 110 + 90); // -200 ~ -90 범위
        newObstacle = {
          position: { x: canvasWidth, y: randomY },
          size: { width: 25, height: 20 }, // 원본 크기로 히트박스 설정
          type: "bird",
        };
        break;
      }
      case "rock":
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 25 },
          size: { width: 25, height: 25 },
          type: "rock",
        };
        break;
      case "dog":
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 25 },
          size: { width: 30, height: 25 },
          type: "dog",
        };
        break;
      case "mouse":
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 12 },
          size: { width: 26, height: 12 },
          type: "mouse",
        };
        break;
      case "fish": {
        const randomY = GROUND_Y - (Math.random() * 80 + 40); // 공중 장애물
        newObstacle = {
          position: { x: canvasWidth, y: randomY },
          size: { width: 22, height: 15 },
          type: "fish",
        };
        break;
      }
      case "spider":
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 18 },
          size: { width: 18, height: 18 },
          type: "spider",
        };
        break;
      case "yarn":
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 24 },
          size: { width: 24, height: 24 },
          type: "yarn",
        };
        break;
      default: // cactus
        newObstacle = {
          position: { x: canvasWidth, y: GROUND_Y - 30 },
          size: { width: 20, height: 30 },
          type: "cactus",
        };
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
