"use client"

import { useCallback, useEffect, useRef, useState, RefObject } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { PageHeader } from "@/components/ui/page-header"
import { PrimaryButton } from "@/components/ui/primary-button"
import { InterviewSetupForm, type InterviewFormData } from "@/components/interview/InterviewSetupForm"
import { TranscriptView } from "@/components/interview/TranscriptView"
import { StatusIndicator } from "@/components/interview/StatusIndicator"
import { SessionInfoCard } from "@/components/interview/SessionInfoCard"
import { ProctoringPanel } from "@/components/interview/ProctoringPanel"
import { InterviewSummary } from "@/components/interview/InterviewSummary"
import { ConsentNotice } from "@/components/ConsentNotice"
import { ReferencePhotoCapture } from "@/components/ReferencePhotoCapture"
import { useFaceVerification } from "@/hooks/useFaceVerification"
import { useInterviewAudio } from "@/hooks/useInterviewAudio"
import { useProctoring } from "@/hooks/useProctoring"
import {
  type SessionState,
  type SessionEnd,
  type StreamMeta,
  startInterviewStream,
  sendAudioStream,
  parseStreamHeaders,
  getSession,
  endInterview,
} from "@/lib/api"

type Phase = "idle" | "setup" | "listening" | "recording" | "processing" | "speaking" | "ended"

interface Turn {
  speaker: "user" | "bodhi"
  text: string
  phase?: string
}

const SILENCE_THRESHOLD = 0.015
const ID_CHECK_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_ID_CHECK_INTERVAL ?? 20_000)
const ID_SIMILARITY_THRESHOLD = Number(process.env.NEXT_PUBLIC_ID_SIMILARITY_THRESHOLD ?? 0.6)
const ID_MAX_VIOLATIONS = Number(process.env.NEXT_PUBLIC_ID_MAX_VIOLATIONS ?? 3)

export default function InterviewPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [sessionInfo, setSessionInfo] = useState<SessionState | null>(null)
  const [summary, setSummary] = useState<SessionEnd | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<InterviewFormData | null>(null)

  // Setup state
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [referencePhotoB64, setReferencePhotoB64] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<Phase>("idle")
  const sessionIdRef = useRef("")

  // Custom hooks
  const audio = useInterviewAudio()
  const proctoring = useProctoring(videoRef, canvasRef)
  const faceVerification = useFaceVerification(videoRef, {
    checkIntervalMs: ID_CHECK_INTERVAL_MS,
    similarityThreshold: ID_SIMILARITY_THRESHOLD,
    maxConsecutiveViolations: ID_MAX_VIOLATIONS,
    onViolation: proctoring.handleFaceViolation,
    onFlag: proctoring.handleFaceFlag,
  })

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get("mode") as "option_a" | "option_b" | null
    const userId = params.get("user_id")
    if (mode && userId) {
      setFormData((prev) => ({
        ...(prev || {
          candidate_name: "",
          company: "",
          role: "Software Engineer",
          mode: "standard",
          user_id: "",
          jd_text: "",
        }),
        mode,
        user_id: userId,
      }))
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const info = await getSession(sessionIdRef.current)
      setSessionInfo(info)
    } catch { }
  }, [])

  const finishRecording = useCallback(async () => {
    setPhase("processing")
    phaseRef.current = "processing"
    audio.setLevel(0)

    const wavBlob = audio.getRecordedAudio()
    if (!wavBlob) {
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
      return
    }

    try {
      const res = await sendAudioStream(sessionIdRef.current, wavBlob, "recording.wav")
      if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`)

      const meta: StreamMeta = parseStreamHeaders(res)
      if (meta.transcript) setTranscript((prev) => [...prev, { speaker: "user", text: meta.transcript! }])
      if (meta.text) setTranscript((prev) => [...prev, { speaker: "bodhi", text: meta.text!, phase: meta.phase }])

      setPhase("speaking")
      phaseRef.current = "speaking"
      await audio.playStreamingAudio(res)

      if (meta.shouldEnd) {
        setPhase("ended")
        proctoring.endSession()
        phaseRef.current = "ended"
        try {
          const end = await endInterview(sessionIdRef.current)
          setSummary(end)
        } catch { }
        audio.cleanup()
        proctoring.cleanupCamera()
        return
      }

      refreshSession()
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    } catch (err) {
      setError(String(err))
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    }
  }, [audio, proctoring, refreshSession])

  const handleFormSubmit = async (data: InterviewFormData) => {
    setFormData(data)
    setError("")
    setPhase("processing")
    try {
      await proctoring.initCamera()
      faceVerification.loadModels()
      setPhase("setup")
    } catch (err) {
      setError(String(err))
      setPhase("idle")
    }
  }

  const handleSetupComplete = async () => {
    if (!consentAccepted || !referencePhotoB64 || !formData) return
    setError("")
    setPhase("processing")
    phaseRef.current = "processing"

    try {
      await audio.initMic()
      const res = await startInterviewStream(formData)
      if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`)

      const meta: StreamMeta = parseStreamHeaders(res)
      if (meta.session) setSessionId(meta.session)
      if (meta.text) setTranscript([{ speaker: "bodhi", text: meta.text, phase: "intro" }])

      if (meta.session) {
        proctoring.connectWebSocket(meta.session, referencePhotoB64)
        setTimeout(() => {
          if (faceVerification.hasReference) faceVerification.startVerification()
        }, 3000)
      }

      setPhase("speaking")
      await audio.playStreamingAudio(res)
      refreshSession()
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    } catch (err) {
      setError(String(err))
      setPhase("setup")
    }
  }

  const handleEnd = async () => {
    audio.stopListening()
    setPhase("processing")
    proctoring.endSession()
    try {
      const r = await endInterview(sessionIdRef.current)
      setSummary(r)
      setPhase("ended")
    } catch (err) {
      setError(String(err))
    }
    audio.cleanup()
    proctoring.cleanupCamera()
  }

  // Cleanup
  useEffect(() => {
    return () => {
      audio.cleanup()
      proctoring.cleanupCamera()
      proctoring.endSession()
    }
  }, [audio, proctoring])

  // Render: Idle (Setup Form)
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="mx-auto max-w-lg space-y-6 pt-28 px-4 pb-12">
          <PageHeader
            title="Mock Interview"
            description="Hands-free voice conversation. Speak naturally — Bodhi listens, responds, and loops."
          />
          <div className="rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-6 shadow-[0px_2px_8px_rgba(55,50,47,0.06)] animate-fade-in-up">
            <InterviewSetupForm onSubmit={handleFormSubmit} loading={phase !== "idle"} />
          </div>
        </div>
      </div>
    )
  }

  // Render: Setup (Consent + Reference Photo)
  if (phase === "setup") {
    const canStart = consentAccepted && !!referencePhotoB64
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="mx-auto max-w-2xl space-y-5 pt-28 px-4 pb-12">
          <PageHeader
            title="Identity Verification"
            description="Complete these two steps before starting your interview."
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in-up">
              {error}
            </div>
          )}

          <div className="glass rounded-2xl overflow-hidden shadow-[0px_2px_8px_rgba(55,50,47,0.06)] animate-fade-in-up">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full"
              style={{ transform: "scaleX(-1)" }}
            />
            {proctoring.cameraError && (
              <p className="px-4 py-3 text-xs text-red-600 bg-red-50 border-t border-red-100">
                {proctoring.cameraError}
              </p>
            )}
          </div>

          <ConsentNotice accepted={consentAccepted} onAccept={setConsentAccepted} />

          <ReferencePhotoCapture
            onReady={setReferencePhotoB64}
            modelsLoading={faceVerification.modelsLoading}
            modelsLoaded={faceVerification.modelsLoaded}
            setReferenceFromFile={faceVerification.setReferenceFromFile}
            setReferenceFromWebcam={faceVerification.setReferenceFromWebcam}
            videoRef={videoRef}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                proctoring.cleanupCamera()
                setPhase("idle")
              }}
              className="flex-1 rounded-full border border-[rgba(55,50,47,0.2)] bg-white py-2.5 text-sm font-semibold text-[#37322F] transition-all duration-200 hover:border-[rgba(55,50,47,0.35)] hover:shadow-[0px_2px_8px_rgba(55,50,47,0.08)]"
            >
              ← Back
            </button>
            <PrimaryButton
              onClick={handleSetupComplete}
              disabled={!canStart}
              className="flex-1"
            >
              Start Interview
            </PrimaryButton>
          </div>

          {!canStart && (
            <p className="text-center text-xs text-[rgba(55,50,47,0.5)]">
              {!consentAccepted && !referencePhotoB64 && "Accept consent and set a reference photo to continue."}
              {consentAccepted && !referencePhotoB64 && "Set a reference photo to continue."}
              {!consentAccepted && referencePhotoB64 && "Accept the consent notice to continue."}
            </p>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    )
  }

  // Render: Active Interview
  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <canvas ref={canvasRef} className="hidden" />

      <div className="pt-24 pb-8 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#37322F]">Live Interview</h1>
            <p className="text-sm text-[rgba(55,50,47,0.5)] mt-1">
              Session: {sessionId.slice(0, 12)}...
            </p>
          </div>
          {phase !== "ended" && (
            <button
              onClick={handleEnd}
              className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-all duration-200 hover:shadow-[0px_4px_12px_rgba(239,68,68,0.3)] hover:scale-105"
            >
              End Interview
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in-up">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <StatusIndicator phase={phase} level={audio.level} silenceThreshold={SILENCE_THRESHOLD} />
            <TranscriptView transcript={transcript} isProcessing={phase === "processing"} />
            {summary && <InterviewSummary summary={summary} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ProctoringPanel
              videoRef={videoRef}
              proctoringActive={proctoring.proctoringActive}
              sessionFlagged={proctoring.sessionFlagged}
              violations={proctoring.violations}
              cameraError={proctoring.cameraError}
              faceVerification={{
                isActive: faceVerification.isActive,
                lastScore: faceVerification.lastScore,
                consecutiveMismatches: faceVerification.consecutiveMismatches,
              }}
            />
            <SessionInfoCard sessionInfo={sessionInfo} sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  )
}
