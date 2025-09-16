import { create } from "zustand";
// inline defaults to avoid missing constants import
const CAT_WIDTH = 80;
const CAT_HEIGHT = 80;

type Offset = { x: number; y: number };
export type Hitbox = {
  offset: Offset;
  size: { width: number; height: number };
};

interface CharacterHitboxes {
  default: Hitbox;
  sliding?: Hitbox;
  jumping?: Hitbox;
}

export interface CharacterStore {
  currentCharacter: string;
  sizes: Record<string, { width: number; height: number }>;
  hitboxes: Record<string, CharacterHitboxes>;

  // bulkcat specific
  bulkcatRunFrame: number;
  bulkcatHitCount: number;
  bulkcatIsImmune: boolean;

  // actions
  setCurrentCharacter: (c: string) => void;
  getHitbox: (
    character: string,
    isSliding?: boolean,
    isJumping?: boolean
  ) => Hitbox;
  getSize: (character: string) => { width: number; height: number };

  toggleBulkcatRunFrame: () => void;
  incrementBulkcatHitCount: () => number;
  setBulkcatImmune: (v: boolean) => void;
  resetBulkcat: () => void;
  setSize: (character: string, size: { width: number; height: number }) => void;
  setHitbox: (
    character: string,
    variant: keyof CharacterHitboxes,
    hitbox: Hitbox
  ) => void;
}

// NOTE: CAT_WIDTH/CAT_HEIGHT are small constants; if not available, fallback
const DEFAULT_W = typeof CAT_WIDTH === "number" ? CAT_WIDTH : 80;
const DEFAULT_H = typeof CAT_HEIGHT === "number" ? CAT_HEIGHT : 80;

// 캐릭터 크기, 히트박스 상태 관리 - 수정 필요
export const useCharacterStore = create<CharacterStore>(
  (set: any, get: any) => ({
    currentCharacter: "bcat",
    sizes: {
      bcat: { width: DEFAULT_W, height: DEFAULT_H },
      cat: { width: Math.round(DEFAULT_W * 1.5), height: DEFAULT_H },
      bulkcat: {
        width: Math.round(DEFAULT_W * 1.5),
        height: Math.round(DEFAULT_H * 1.5),
      },
    },
    hitboxes: {
      bcat: {
        default: {
          offset: { x: 5, y: 25 },
          size: { width: DEFAULT_W - 5, height: DEFAULT_H - 20 },
        },
        sliding: {
          offset: { x: 5, y: 50 },
          size: { width: DEFAULT_W - 5, height: DEFAULT_H - 50 },
        },
        jumping: {
          offset: { x: 25, y: 10 },
          size: { width: DEFAULT_W - 25, height: DEFAULT_H - 10 },
        },
      },
      cat: {
        default: {
          offset: { x: 5, y: 5 },
          size: { width: DEFAULT_W + 30, height: DEFAULT_H - 5 },
        },
        sliding: {
          offset: { x: 20, y: 30 },
          size: { width: DEFAULT_W - 40, height: DEFAULT_H - 45 },
        },
        jumping: {
          offset: { x: 22, y: 12 },
          size: { width: DEFAULT_W - 50, height: DEFAULT_H - 60 },
        },
      },
      bulkcat: {
        default: {
          offset: { x: 7, y: 25 },
          size: {
            width: Math.round(DEFAULT_W * 1.5) - 5,
            height: Math.round(DEFAULT_H * 1.5) - 20,
          },
        },
        sliding: {
          offset: { x: 30, y: 55 },
          size: {
            width: Math.round(DEFAULT_W * 1.5) - 40,
            height: Math.round(DEFAULT_H * 1.5) - 50,
          },
        },
        jumping: {
          offset: { x: 10, y: 15 },
          size: {
            width: Math.round(DEFAULT_W * 1.5) - 10,
            height: Math.round(DEFAULT_H * 1.5) - 10,
          },
        },
      },
    },

    bulkcatRunFrame: 0,
    bulkcatHitCount: 0,
    bulkcatIsImmune: false,

    setCurrentCharacter: (c: string) => set({ currentCharacter: c }),

    getHitbox: (character: string, isSliding = false, isJumping = false) => {
      const hb = get().hitboxes[character] || get().hitboxes.bcat;
      if (isJumping && hb.jumping) return hb.jumping;
      if (isSliding && hb.sliding) return hb.sliding;
      return hb.default;
    },

    getSize: (character: string) => {
      return get().sizes[character] || get().sizes.bcat;
    },

    toggleBulkcatRunFrame: () =>
      set((s: CharacterStore) => ({
        bulkcatRunFrame: s.bulkcatRunFrame === 0 ? 1 : 0,
      })),
    incrementBulkcatHitCount: () => {
      const next = get().bulkcatHitCount + 1;
      set({ bulkcatHitCount: next });
      return next;
    },
    setBulkcatImmune: (v: boolean) => set({ bulkcatIsImmune: v }),
    setSize: (character: string, size: { width: number; height: number }) =>
      set((s: CharacterStore) => ({
        sizes: { ...s.sizes, [character]: size },
      })),
    setHitbox: (
      character: string,
      variant: keyof CharacterHitboxes,
      hitbox: Hitbox
    ) =>
      set((s: CharacterStore) => ({
        hitboxes: {
          ...s.hitboxes,
          [character]: {
            ...(s.hitboxes[character] || s.hitboxes.bcat),
            [variant]: hitbox,
          },
        },
      })),
    resetBulkcat: () =>
      set({ bulkcatRunFrame: 0, bulkcatHitCount: 0, bulkcatIsImmune: false }),
  })
);

export default useCharacterStore;
