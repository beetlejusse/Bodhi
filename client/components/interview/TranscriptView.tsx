"use client"

import { useRef, useEffect } from "react"

interface Turn {
  speaker: "user" | "bodhi"
  text: string
  phase?: string
}

interface TranscriptViewProps {
  transcript: Turn[]
  isProcessing?: boolean
  interviewerPersona?: "bodhi" | "riya"
}

export function TranscriptView({ transcript, isProcessing, interviewerPersona = "bodhi" }: TranscriptViewProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript, isProcessing])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-[#1e1e1e] bg-[#272822] p-4 shadow-lg font-mono text-sm">
      {transcript.length === 0 && !isProcessing && (
        <div className="flex items-center justify-center h-full text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#3e3d32] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#75715e]">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <p className="text-sm text-[#75715e]">
              // Waiting for interview to start...
            </p>
          </div>
        </div>
      )}

      {transcript.map((turn, i) => (
        <div
          key={i}
          className="animate-fade-in-up"
        >
          <div className="flex items-start gap-3 mb-1">
            <span className={`text-xs font-semibold ${
              turn.speaker === "bodhi" ? "text-[#66d9ef]" : "text-[#a6e22e]"
            }`}>
              {turn.speaker === "bodhi" ? (interviewerPersona === "riya" ? "riya" : "bodhi") : "you"}
            </span>
            {turn.phase && (
              <span className="text-[10px] text-[#75715e] uppercase tracking-wider">
                // {turn.phase}
              </span>
            )}
          </div>
          <div className={`pl-3 border-l-2 ${
            turn.speaker === "bodhi" ? "border-[#66d9ef]" : "border-[#a6e22e]"
          }`}>
            <p className={`leading-relaxed ${
              turn.speaker === "bodhi" ? "text-[#f8f8f2]" : "text-[#e6db74]"
            }`}>
              {turn.text}
            </p>
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-1">
            <span className="text-xs font-semibold text-[#66d9ef]">
              {interviewerPersona === "riya" ? "riya" : "bodhi"}
            </span>
          </div>
          <div className="pl-3 border-l-2 border-[#66d9ef]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#66d9ef] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[#66d9ef] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[#66d9ef] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm text-[#75715e]">// thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
