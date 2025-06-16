'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FilesetResolver,
  FaceLandmarker,
  FaceLandmarkerResult,
  Category,
} from '@mediapipe/tasks-vision';

import { classifyBlendshapes } from 'lightweight-expression-detector';

export default function EmotionTestPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [emotion, setEmotion] = useState('Neutral');
  const [blendshapes, setBlendshapes] = useState<Category[]>([]);
  const [baseline, setBaseline] = useState<Record<string, number> | null>(null);

  const baselineRef = useRef<Record<string, number> | null>(null);
  const frameCount = useRef(0);
  const frameAccumulator = useRef<Record<string, number>>({});
  const emotionHistory = useRef<string[]>([]); // optional: for smoothing

  useEffect(() => {
    const init = async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        detectLoop();
      }
    };

    init();
  }, []);

  const detectLoop = () => {
    const run = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        requestAnimationFrame(run);
        return;
      }

      const result: FaceLandmarkerResult = landmarker.detectForVideo(
        video,
        performance.now()
      );

      const expressions = result?.faceBlendshapes?.[0]?.categories ?? [];
      setBlendshapes(expressions);

      if (!baselineRef.current) {
        frameCount.current += 1;
        expressions.forEach(({ categoryName, score }) => {
          frameAccumulator.current[categoryName] =
            (frameAccumulator.current[categoryName] || 0) + score;
        });

        if (frameCount.current === 10) {
          const avg: Record<string, number> = {};
          for (const [key, sum] of Object.entries(frameAccumulator.current)) {
            avg[key] = sum / 10;
          }
          baselineRef.current = avg;
          setBaseline(avg);
          console.log(' Baseline captured:', avg);
        }

        requestAnimationFrame(run);
        return;
      }

      const resultEmotion = classifyBlendshapes(
        expressions,
        baselineRef.current,
        emotionHistory.current // optional smoothing array
      );

      setEmotion(resultEmotion.emotion);
      console.log(' Detected:', resultEmotion.emotion);

      requestAnimationFrame(run);
    };

    requestAnimationFrame(run);
  };

  return (
    <div className="min-h-screen bg-gray-400 flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-2xl font-bold text-black"> Emotion Detection</h1>

      <video
        ref={videoRef}
        className="rounded border border-gray-400"
        width={320}
        height={240}
        autoPlay
        muted
        playsInline
      />

      {!baseline && (
        <p className="text-gray-500 italic">Calibrating neutral face…</p>
      )}

      <div className="bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded">
        Detected Emotion: {emotion}
      </div>

      <div className="w-full max-w-md text-left">
        <h2 className="text-lg font-semibold text-black mb-1">Top Blendshapes</h2>
        <ul className="text-purple-800 font-medium bg-purple-100 px-4 py-2 rounded space-y-1 min-h-[4rem]">
          {blendshapes.length > 0 ? (
            blendshapes
              .filter((b) => b.score > 0.1)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((b) => (
                <li key={b.categoryName}>
                  {b.categoryName}: {(b.score * 100).toFixed(1)}%
                </li>
              ))
          ) : (
            <li className="text-gray-500">No data yet...</li>
          )}
        </ul>
      </div>
    </div>
  );
}
