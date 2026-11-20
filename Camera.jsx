import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Download,
  RefreshCw,
  X,
  SwitchCamera,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { FILTERS, getFilterCss } from "../filters.js";
import { useObjectDetector } from "../hooks/useObjectDetector.js";

export default function CameraApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");
  const [filterId, setFilterId] = useState("none");
  const [photo, setPhoto] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const { predictions, status: aiStatus, error: aiError } = useObjectDetector({
    videoRef,
    enabled: aiEnabled && !photo,
  });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setReady(false);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera permission in your browser and reload."
          : "Couldn't access a camera on this device."
      );
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startStream();
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Draw AI bounding boxes on a transparent overlay canvas positioned over the video.
  useEffect(() => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!predictions.length || !video.videoWidth) return;

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    predictions.forEach(({ bbox, class: label, score }) => {
      const [x, y, w, h] = bbox;
      const bx = x * scaleX;
      const by = y * scaleY;
      const bw = w * scaleX;
      const bh = h * scaleY;

      ctx.strokeStyle = "#4fd1c5";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      const text = `${label} ${Math.round(score * 100)}%`;
      ctx.font = "600 13px Inter, sans-serif";
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = "#4fd1c5";
      ctx.fillRect(bx, Math.max(0, by - 20), textWidth + 12, 20);
      ctx.fillStyle = "#0b0d12";
      ctx.fillText(text, bx + 6, Math.max(14, by - 5));
    });
  }, [predictions]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.filter = getFilterCss(filterId);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/png"));
  };

  const downloadPhoto = () => {
    if (!photo) return;
    const link = document.createElement("a");
    link.href = photo;
    link.download = `lens-${Date.now()}.png`;
    link.click();
  };

  const copyPhoto = async () => {
    if (!photo) return;
    try {
      const blob = await (await fetch(photo)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Your browser doesn't support copying images to the clipboard.");
    }
  };

  const retake = () => setPhoto(null);
  const switchCamera = () =>
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));

  return (
    <div className="camera-shell">
      <div className="viewport">
        {!photo && (
          <video
            ref={videoRef}
            className="video"
            style={{ filter: getFilterCss(filterId) }}
            playsInline
            muted
          />
        )}
        {!photo && <canvas ref={overlayRef} className="overlay" />}
        {photo && <img src={photo} alt="Captured" className="video" />}

        {error && (
          <div className="state-panel">
            <p>{error}</p>
          </div>
        )}
        {!ready && !photo && !error && (
          <div className="state-panel muted">
            <p>Starting camera…</p>
          </div>
        )}
        {aiEnabled && aiStatus === "loading" && !photo && (
          <div className="ai-badge">Loading AI model…</div>
        )}
        {aiError && <div className="ai-badge warn">{aiError}</div>}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!photo && (
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filterId === f.id ? "active" : ""}`}
              onClick={() => setFilterId(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="controls">
        {!photo ? (
          <>
            <button
              className={`icon-btn ${aiEnabled ? "active" : ""}`}
              onClick={() => setAiEnabled((v) => !v)}
              aria-label="Toggle AI object detection"
              title="AI object detection"
            >
              <Sparkles size={20} />
            </button>

            <button
              className="shutter"
              onClick={capturePhoto}
              disabled={!ready}
              aria-label="Take photo"
            >
              <Camera size={26} />
            </button>

            <button
              className="icon-btn"
              onClick={switchCamera}
              aria-label="Switch camera"
              title="Switch camera"
            >
              <SwitchCamera size={20} />
            </button>
          </>
        ) : (
          <>
            <button className="icon-btn" onClick={retake} aria-label="Discard">
              <X size={20} />
            </button>
            <button className="shutter" onClick={downloadPhoto} aria-label="Download">
              <Download size={26} />
            </button>
            <button className="icon-btn" onClick={copyPhoto} aria-label="Copy to clipboard">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
            <button className="icon-btn" onClick={retake} aria-label="Retake">
              <RefreshCw size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
