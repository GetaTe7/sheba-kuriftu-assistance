import { useState, useRef } from "react";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import {
  Eye, AlertTriangle, ToggleLeft, ToggleRight,
  Camera, Loader2, Volume2, X,
} from "lucide-react";
import { fetchAccessibilityCues } from "@/services/api";
import { speak, isTTSAvailable } from "@/services/tts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { shebaChat } from "@/services/api";
import { toast } from "sonner";

interface Cue {
  id: string;
  scene: string;
  description: string;
  obstacles: string[];
}

export default function Accessibility() {
  const { 
    accessibilityMode, 
    toggleAccessibility, 
    language, 
    targetLanguage, 
    resortProperty,
    accessibilityCues: contextCues
  } = useApp();
  const [cues, setCues] = useState<Cue[]>([]);
  const [loading, setLoading] = useState(true);

  // Camera / scene description state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sceneDescription, setSceneDescription] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAccessibilityCues()
      .then((data) => {
        if (!data || data.length === 0) setCues(contextCues);
        else setCues(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching accessibility cues:", err);
        setCues(contextCues);
        setLoading(false);
      });
      
    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, [contextCues]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setImagePreview(null);
      setSceneDescription(null);
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Camera access denied or unavailable.");
    }
  };

  // Attach stream once video element is mounted in the DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setSceneDescription(null);
  };

  // Send image + text to Sheba AI — multimodal via Vertex AI in the edge function
  const analyzeScene = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setSceneDescription(null);

    try {
      // Strip the data-URL prefix to get raw base64: "data:image/jpeg;base64,<DATA>"
      const imageBase64 = imagePreview.includes(',')
        ? imagePreview.split(',')[1]
        : imagePreview;

      const result = await shebaChat({
        text: "I am sharing a photo of my surroundings taken at Kuriftu Resort. Please describe what a person with visual impairment needs to know: any obstacles, steps, doors, furniture layout, or hazards visible in this image. Keep it under 3 sentences.",
        sourceLanguage: language,
        targetLanguage,
        accessibilityMode: true,
        resortProperty,
        imageBase64,
      });

      const description = result.translation ?? result.response;
      setSceneDescription(description);

      // Speak the description automatically
      if (isTTSAvailable()) {
        setSpeaking(true);
        await speak(description, targetLanguage);
        setSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not analyse the scene. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const speakCue = async (cue: Cue) => {
    if (!isTTSAvailable()) {
      toast.info("Text-to-speech is not available in this browser.");
      return;
    }
    const text = `${cue.scene}. ${cue.description}. ${cue.obstacles.join(". ")}`;
    await speak(text, language);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Accessibility
            </h1>
          </div>
          <button
            onClick={toggleAccessibility}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            title={accessibilityMode ? "Disable accessibility mode" : "Enable accessibility mode"}
          >
            {accessibilityMode ? (
              <ToggleRight className="w-8 h-8 text-primary" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-muted-foreground" />
            )}
          </button>
        </div>

        {accessibilityMode ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Scene descriptions and obstacle hints are active. Tap a card to hear it read aloud.
            </p>

            {/* ── Camera / scene analysis section ─────────────────────────── */}
            <div className="card-luxury mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Describe My Surroundings
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Take or upload a photo — Sheba will describe what a visually impaired person needs to know.
              </p>

              {/* In-App Camera stream bypassing gallery */}
              {!imagePreview && !isCameraActive ? (
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </Button>
              ) : isCameraActive && !imagePreview ? (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="relative rounded-xl overflow-hidden bg-black flex justify-center">
                    <video 
                      ref={videoRef} 
                      className="w-full h-48 object-cover" 
                      playsInline 
                      muted 
                      autoPlay
                    />
                    <button
                      onClick={stopCamera}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                  <Button className="w-full h-12 gap-2" onClick={capturePhoto}>
                    <Camera className="w-4 h-4" />
                    Capture Snapshot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <img
                      src={imagePreview}
                      alt="Scene capture"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Analyse button */}
                  {!sceneDescription && (
                    <Button
                      className="w-full h-11 gap-2"
                      onClick={analyzeScene}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analysing scene…
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Describe This Scene
                        </>
                      )}
                    </Button>
                  )}

                  {/* Result */}
                  {sceneDescription && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 className={`w-4 h-4 text-primary ${speaking ? "animate-pulse" : ""}`} />
                        <span className="text-xs font-medium text-primary">Scene Description</span>
                      </div>
                      <p className="text-sm text-foreground">{sceneDescription}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => speak(sceneDescription, targetLanguage)}
                          disabled={speaking}
                        >
                          <Volume2 className="w-3 h-3 mr-1" />
                          Read Again
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={clearImage}
                        >
                          New Photo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Preset scene cue cards ─────────────────────────────────── */}
            <h2 className="font-display text-base font-semibold text-foreground mb-3">
              Resort Scene Guide
            </h2>
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                  ))
                : cues.map((cue, i) => (
                    <button
                      key={cue.id}
                      onClick={() => speakCue(cue)}
                      className="card-luxury w-full text-left animate-fade-in-up hover:ring-2 hover:ring-primary/30 transition-all"
                      style={{ animationDelay: `${i * 0.08}s` }}
                      title="Tap to hear this description"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {cue.scene}
                        </h3>
                        <Volume2 className="w-4 h-4 text-primary shrink-0 ml-2 mt-0.5" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{cue.description}</p>
                      {cue.obstacles.length > 0 && (
                        <div className="space-y-1.5">
                          {cue.obstacles.map((ob, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              <span className="text-foreground">{ob}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 animate-fade-in-up">
            <Eye className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="font-display text-lg font-semibold text-foreground mb-2">
              Accessibility Mode Off
            </p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Enable accessibility mode to get scene descriptions, obstacle hints, and audio cues throughout the resort.
            </p>
            <Button onClick={toggleAccessibility} className="gap-2">
              <ToggleRight className="w-4 h-4" />
              Enable Accessibility Mode
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
