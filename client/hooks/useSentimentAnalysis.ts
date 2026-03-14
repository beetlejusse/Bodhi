import { useState, useCallback, useRef } from "react"

export interface SentimentData {
  emotion: string
  emotionConfidence: number
  sentiment: string
  speechRateWpm: number
  confidenceScore: number
  flags: string[]
}

export function useSentimentAnalysis() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const analyzeSpeech = useCallback(async (audioBlob: Blob) => {
    setIsAnalyzing(true)
    
    try {
      abortControllerRef.current = new AbortController()
      
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")

      const apiBase = process.env.NEXT_PUBLIC_BEHAVIORAL_API_URL ?? "http://localhost:8001"
      const response = await fetch(`${apiBase}/api/test/behavioral-analysis`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Sentiment analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.speech) {
        setSentimentData({
          emotion: result.speech.emotion,
          emotionConfidence: result.speech.emotion_confidence,
          sentiment: result.speech.sentiment,
          speechRateWpm: result.speech.speech_rate_wpm,
          confidenceScore: result.speech.confidence_score,
          flags: result.speech.flags,
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Ignore abort errors
        return
      }
      console.error("Sentiment analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setSentimentData(null)
    setIsAnalyzing(false)
  }, [])

  return {
    sentimentData,
    isAnalyzing,
    analyzeSpeech,
    reset,
  }
}
