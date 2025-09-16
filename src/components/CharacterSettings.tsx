import React, { useState } from "react";
import {
  useCharacterStore,
  CharacterStore,
  Hitbox,
} from "@/stores/characterStore";

export default function CharacterSettings() {
  const characters = Object.keys(useCharacterStore.getState().sizes);
  const [selected, setSelected] = useState<string>(characters[0] || "bcat");

  const size = useCharacterStore((s: CharacterStore) => s.sizes[selected]);
  const hitbox = useCharacterStore(
    (s: CharacterStore) => s.hitboxes[selected]?.default
  );
  const setSize = useCharacterStore((s: CharacterStore) => s.setSize);
  const setHitbox = useCharacterStore((s: CharacterStore) => s.setHitbox);

  if (!size || !hitbox) return null;

  const updateSize = (k: "width" | "height", v: number) => {
    setSize(selected, { ...size, [k]: v });
  };

  const updateHitbox = (
    k: keyof Hitbox["offset"] | "width" | "height",
    v: number
  ) => {
    const current = useCharacterStore.getState().hitboxes[selected]
      ?.default as Hitbox;
    if (!current) return;
    if (k === "width" || k === "height") {
      setHitbox(selected, "default", {
        ...current,
        size: { ...current.size, [k]: v },
      });
    } else {
      setHitbox(selected, "default", {
        ...current,
        offset: { ...current.offset, [k]: v },
      });
    }
  };

  return (
    <div className="p-2 bg-white border rounded shadow-sm">
      <h3 className="font-semibold">Character Settings</h3>
      <div className="flex gap-2 mt-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {characters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2">
        <div>Size</div>
        <label>
          Width:{" "}
          <input
            type="number"
            value={size.width}
            onChange={(e) => updateSize("width", Number(e.target.value))}
          />
        </label>
        <label className="ml-2">
          Height:{" "}
          <input
            type="number"
            value={size.height}
            onChange={(e) => updateSize("height", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="mt-2">
        <div>Hitbox (default)</div>
        <label>
          Offset X:{" "}
          <input
            type="number"
            value={hitbox.offset.x}
            onChange={(e) => updateHitbox("x", Number(e.target.value))}
          />
        </label>
        <label className="ml-2">
          Offset Y:{" "}
          <input
            type="number"
            value={hitbox.offset.y}
            onChange={(e) => updateHitbox("y", Number(e.target.value))}
          />
        </label>
        <label className="ml-2">
          Width:{" "}
          <input
            type="number"
            value={hitbox.size.width}
            onChange={(e) => updateHitbox("width", Number(e.target.value))}
          />
        </label>
        <label className="ml-2">
          Height:{" "}
          <input
            type="number"
            value={hitbox.size.height}
            onChange={(e) => updateHitbox("height", Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
