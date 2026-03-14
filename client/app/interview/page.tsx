"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Navbar from "@/components/Navbar"
import { PageHeader } from "@/components/ui/page-header"
import { InterviewSetupForm, type InterviewFormData } from "@/components/interview/InterviewSetupForm"
import { InterviewSummary } from "@/components/interview/InterviewSummary"
import { InterviewSessionView } from "@/components/interview/InterviewSessionView"
import { useInterviewAudio } from "@/hooks/useInterviewAudio"
import { useProctoring } from "@/hooks/useProctoring"
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis"
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

type Phase = "idle" | "listening" | "recording" | "processing" | "speaking" | "ended"

interface Turn {
  speaker: "user" | "bodhi"
  text: string
  phase?: string
}

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [summary, setSummary] = useState<SessionEnd | null>(null)
  const [error, setError] = useState("")

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<Phase>("idle")
  const sessionIdRef = useRef("")

  // Custom hooks
  const audio = useInterviewAudio()
  const proctoring = useProctoring(videoRef, canvasRef)
  const sentiment = useSentimentAnalysis()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const refreshSession = useCallback(async () => {
    try {
      await getSession(sessionIdRef.current)
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
      // Send audio for sentiment analysis (non-blocking)
      sentiment.analyzeSpeech(wavBlob).catch(err => {
        console.warn("Sentiment analysis failed:", err)
      })

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
        sentiment.reset()
        return
      }

      refreshSession()
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    } catch (err) {
      setError(String(err))
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    }
  }, [audio, proctoring, refreshSession, sentiment])

  const handleFormSubmit = async (data: InterviewFormData) => {
    setError("")
    setPhase("processing")
    phaseRef.current = "processing"

    try {
      await proctoring.initCamera()
      await audio.initMic()
      const res = await startInterviewStream(data)
      if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`)

      const meta: StreamMeta = parseStreamHeaders(res)
      if (meta.session) setSessionId(meta.session)
      if (meta.text) setTranscript([{ speaker: "bodhi", text: meta.text, phase: "intro" }])

      if (meta.session) {
        proctoring.connectWebSocket(meta.session, "")
      }

      setPhase("speaking")
      await audio.playStreamingAudio(res)
      refreshSession()
      audio.startListening(() => setPhase("listening"), () => setPhase("recording"), finishRecording)
    } catch (err) {
      setError(String(err))
      setPhase("idle")
    }
  }

  const handleEnd = async () => {
    audio.stopListening()
    setPhase("processing")
    proctoring.endSession()
    sentiment.reset()
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
      sentiment.reset()
    }
  }, [audio, proctoring, sentiment])

  // URL params - auto-start if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get("mode") as "option_a" | "option_b" | null
    const userId = params.get("user_id")
    if (mode && userId && phase === "idle") {
      handleFormSubmit({
        candidate_name: "",
        company: "",
        role: "Software Engineer",
        mode,
        user_id: userId,
        jd_text: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render: Idle (Setup Form)
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-lg space-y-6 pt-28 px-4 pb-12">
          <PageHeader
            title="Mock Interview"
            description="Hands-free voice conversation. Speak naturally — Bodhi listens, responds, and loops."
          />
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in-up">
              {error}
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-fade-in-up">
            <InterviewSetupForm onSubmit={handleFormSubmit} loading={phase !== "idle"} />
          </div>
        </div>
      </div>
    )
  }

  // Render: Active Interview - Show summary if ended, otherwise show session view
  if (phase === "ended" && summary) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-8 px-4 sm:px-6 max-w-7xl mx-auto">
          <InterviewSummary summary={summary} />
        </div>
      </div>
    )
  }

  // Render: Active Interview Session (no navbar, full screen)
  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <InterviewSessionView
        sessionId={sessionId}
        videoRef={videoRef}
        transcript={transcript}
        phase={phase}
        onEndSession={handleEnd}
        proctoringActive={proctoring.proctoringActive}
        sessionFlagged={proctoring.sessionFlagged}
        cameraError={proctoring.cameraError}
        sentimentData={sentiment.sentimentData}
        violationCount={proctoring.violations.length}
      />
    </>
  )
}
