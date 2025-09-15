"use client";
import GameCanvas from "@/components/GameCanvas";

export default function Home() {
  const handleGameOver = (score: number) => {
    console.log("Game Over! Score:", score);
  };

  const handleStageComplete = (stage: number) => {
    console.log("Stage Complete:", stage);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          🐱 Cat Runner
        </h1>
        <p className="text-center text-gray-600 mb-8">{/* 설명 적기 */}</p>

        <GameCanvas
          onGameOver={handleGameOver}
          onStageComplete={handleStageComplete}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{/* 설명 칸 */}</p>
        </div>
      </div>
    </main>
  );
}
