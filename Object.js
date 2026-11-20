import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lazily loads TensorFlow.js + the COCO-SSD model (only once the caller
 * actually enables detection) and runs it against a <video> element on an
 * interval, returning the latest predictions.
 *
 * Predictions look like:
 *   { bbox: [x, y, width, height], class: "person", score: 0.93 }
 */
export function useObjectDetector({ videoRef, enabled, intervalMs = 400 }) {
  const modelRef = useRef(null);
  const timerRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    setStatus("loading");
    const [tf, cocoSsd] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("@tensorflow-models/coco-ssd"),
    ]);
    await tf.ready();
    modelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    setStatus("ready");
    return modelRef.current;
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearInterval(timerRef.current);
      setPredictions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const model = await loadModel();
        if (cancelled) return;

        timerRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          try {
            const results = await model.detect(video);
            if (!cancelled) setPredictions(results);
          } catch {
            // transient frame errors are safe to skip
          }
        }, intervalMs);
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError("Couldn't load the AI model. Check your connection and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [enabled, intervalMs, loadModel, videoRef]);

  return { predictions, status, error };
}
