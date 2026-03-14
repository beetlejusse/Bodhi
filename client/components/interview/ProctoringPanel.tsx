"use client"

import { RefObject } from "react"

interface Violation {
  violation_type: string
  severity: string
  message: string
  timestamp: string
}

interface ProctoringPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>
  proctoringActive: boolean
  sessionFlagged: boolean
  violations: Violation[]
  cameraError: string
}

export function ProctoringPanel({
  videoRef,
  proctoringActive,
  sessionFlagged,
  violations,
  cameraError,
}: ProctoringPanelProps) {
  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="glass rounded-2xl overflow-hidden shadow-[0px_2px_8px_rgba(55,50,47,0.06)]">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full rounded-2xl"
          style={{ transform: "scaleX(-1)" }}
        />
        {cameraError && (
          <p className="px-4 py-3 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {cameraError}
          </p>
        )}
      </div>

      {/* Proctoring Status */}
      <div className="glass rounded-2xl p-4 shadow-[0px_2px_8px_rgba(55,50,47,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`h-2 w-2 rounded-full ${
              sessionFlagged
                ? "bg-red-500"
                : proctoringActive
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
            }`}
          />
          <h3 className="text-xs font-semibold text-[#37322F]">
            {sessionFlagged
              ? "Session Flagged"
              : proctoringActive
                ? "Proctoring Active"
                : "Proctoring Inactive"}
          </h3>
        </div>

        {sessionFlagged && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">
              Session has been flagged due to violations.
            </p>
          </div>
        )}

        {violations.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs text-[rgba(55,50,47,0.5)] mb-2">
              Recent Violations ({violations.length})
            </p>
            {violations.slice(-5).map((v, i) => (
              <div
                key={i}
                className="rounded-lg bg-red-50 border border-red-100 px-3 py-2"
              >
                <p className="text-[10px] font-semibold text-red-700 capitalize mb-0.5">
                  {v.violation_type.replace(/_/g, " ")}
                </p>
                <p className="text-[10px] text-[rgba(55,50,47,0.6)]">
                  {v.message}
                </p>
              </div>
            ))}
          </div>
        ) : proctoringActive ? (
          <p className="text-xs text-[rgba(55,50,47,0.5)]">
            No violations detected.
          </p>
        ) : null}
      </div>
    </div>
  )
}
