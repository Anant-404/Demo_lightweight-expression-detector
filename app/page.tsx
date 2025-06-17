'use client';

import { useEmotionDetector } from 'lightweight-expression-detector';

export default function HomePage() {
  const { videoRef, emotion, expressions, isDetecting } = useEmotionDetector();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 space-y-6 bg-gray-400">
      <h1 className="text-2xl font-bold text-black"> Emotion Detection Test</h1>

      <video
        ref={videoRef}
        width={320}
        height={240}
        autoPlay
        muted
        playsInline
        className="rounded border border-gray-400"
      />

      <div className="bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded">
        Detected Emotion: {emotion}
      </div>

      {/* <ul className="text-green-800 bg-green-100 px-4 py-2 rounded space-y-1 min-h-[3rem]">
        {expressions.length > 0 ? (
          expressions.map((e, i) => <li key={i}>• {e}</li>)
        ) : (
          <li className="text-gray-500">No expressions detected yet.</li>
        )}
      </ul> */}
    </main>
  );
}
