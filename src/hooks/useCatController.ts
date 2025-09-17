import { useCallback, useRef, useState } from "react";
import { type Cat } from "@/types/game";
import { useCharacterStore } from "@/stores/characterStore";

const CANVAS_GROUND_Y = 300;
const CAT_WIDTH = 80;
const CAT_HEIGHT = 80;
const GRAVITY = 0.5;
const JUMP_FORCE = -15;

export function useCatController() {
  const getHitbox = useCharacterStore((s) => s.getHitbox);
  const getSize = useCharacterStore((s) => s.getSize);
  const currentCharacter = useCharacterStore((s) => s.currentCharacter);

  const [cat, setCat] = useState<Cat>({
    position: { x: 50, y: CANVAS_GROUND_Y - CAT_HEIGHT },
    velocity: { x: 0, y: 0 },
    size: getSize("bcat", false, false),
    collisionBox: getHitbox("bcat"),
    isJumping: false,
    isSliding: false,
    sprite: "bcat",
  });

  const catRef = useRef(cat);
  // keep ref synced
  catRef.current = cat;

  const jump = useCallback(() => {
    setCat((prev) => {
      if (prev.isJumping || prev.isSliding) return prev;
      const jumpForce =
        currentCharacter === "bulkcat" ? JUMP_FORCE * 0.8 : JUMP_FORCE;
      return {
        ...prev,
        velocity: { ...prev.velocity, y: jumpForce },
        isJumping: true,
        sprite:
          currentCharacter === "bulkcat"
            ? "bulkcat_jump"
            : `${currentCharacter}_jump`,
        collisionBox: getHitbox(currentCharacter, false, true),
      };
    });
  }, [currentCharacter, getHitbox]);

  const startSlide = useCallback(() => {
    setCat((prev) => {
      if (prev.isSliding) return prev;
      let newY = prev.position.y;
      let newVelY = prev.velocity.y;
      let newIsJumping = prev.isJumping;

      const effectiveHeight =
        currentCharacter === "bulkcat" ? CAT_HEIGHT * 1.5 : CAT_HEIGHT;
      const groundLevel = CANVAS_GROUND_Y - effectiveHeight;

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
        collisionBox: getHitbox(currentCharacter, true),
        size: getSize(currentCharacter, true, false),
      };
    });
  }, [currentCharacter, getHitbox]);

  const endSlide = useCallback(() => {
    setCat((prev) => ({
      ...prev,
      isSliding: false,
      sprite: currentCharacter === "bulkcat" ? "bulkcat1" : currentCharacter,
      collisionBox: getHitbox(currentCharacter, false),
      size: getSize(currentCharacter, false, false),
    }));
  }, [currentCharacter, getHitbox]);

  const resetCat = useCallback(() => {
    const initialCatState: Cat = {
      position: { x: 50, y: CANVAS_GROUND_Y - CAT_HEIGHT },
      velocity: { x: 0, y: 0 },
      size: getSize("bcat", false, false),
      collisionBox: getHitbox("bcat", false),
      isJumping: false,
      isSliding: false,
      sprite: "bcat",
    };
    setCat(initialCatState);
    catRef.current = initialCatState;
  }, [getHitbox]);

  return {
    cat,
    setCat,
    catRef,
    jump,
    startSlide,
    endSlide,
    resetCat,
    getSize,
    getHitbox,
  };
}

export default useCatController;
