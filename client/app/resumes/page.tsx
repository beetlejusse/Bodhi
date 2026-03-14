"use client"

import Link from "next/link"
import { useState } from "react"
import Navbar from "@/components/Navbar"
import { PageHeader } from "@/components/ui/page-header"
import { StatusMessage } from "@/components/ui/status-message"
import { PrimaryButton } from "@/components/ui/primary-button"
import { uploadResume, type CandidateProfile } from "@/lib/api"

type UploadResult = {
  user_id: string
  profile: CandidateProfile
}

export default function ResumesPage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      setError("Please select a file")
      return
    }

    setUploading(true)
    setError("")
    setResult(null)

    try {
      const res = await uploadResume(file)
      setResult(res)
      formEl.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] font-sans">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Resume Upload"
          description="Upload your resume (PDF or DOCX) to create a profile for resume-based and JD-targeted interviews."
        />

        {error && <StatusMessage message={error} type="error" />}

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="space-y-4 rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-6 shadow-[0px_2px_8px_rgba(55,50,47,0.06)] animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#37322F]">
              Resume File{" "}
              <span className="text-[rgba(55,50,47,0.45)] font-normal">
                (PDF or DOCX)
              </span>
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx"
              disabled={uploading}
              className="w-full rounded-xl border border-[rgba(55,50,47,0.15)] bg-[#F7F5F3] px-3 py-2.5 text-sm text-[#37322F]
                file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0
                file:bg-[#37322F] file:text-white file:text-xs file:font-semibold
                hover:file:bg-[#2a2520] disabled:opacity-50 transition"
            />
          </div>

          <PrimaryButton type="submit" fullWidth loading={uploading} disabled={uploading}>
            {uploading ? "Uploading & Parsing…" : "Upload Resume"}
          </PrimaryButton>
        </form>

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Success header */}
            <div className="rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-5 shadow-[0px_2px_8px_rgba(55,50,47,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-[#37322F] flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-[#37322F] text-sm">
                  Resume uploaded successfully
                </span>
              </div>
              <p className="text-xs text-[rgba(55,50,47,0.55)] mb-2">
                User ID for resume-based interviews:
              </p>
              <div className="rounded-xl bg-[#F7F5F3] border border-[rgba(55,50,47,0.10)] px-3 py-2 font-mono text-sm text-[#37322F] break-all">
                {result.user_id}
              </div>
            </div>

            {/* Extracted profile */}
            <div className="space-y-5 rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-6 shadow-[0px_2px_8px_rgba(55,50,47,0.06)]">
              <h3 className="text-lg font-semibold text-[#37322F]">
                Extracted Profile
              </h3>

              {result.profile.name && (
                <Field label="Name" value={result.profile.name} />
              )}
              {result.profile.email && (
                <Field label="Email" value={result.profile.email} />
              )}
              {result.profile.summary && (
                <Field
                  label="Summary"
                  value={result.profile.summary}
                  paragraph
                />
              )}

              {result.profile.skills.length > 0 && (
                <div>
                  <FieldLabel>Skills</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[rgba(55,50,47,0.07)] px-3 py-1 text-xs text-[#37322F] font-medium transition-all duration-200 hover:bg-[rgba(55,50,47,0.12)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.profile.experience.length > 0 && (
                <div>
                  <FieldLabel>Experience</FieldLabel>
                  <div className="space-y-3 mt-2">
                    {result.profile.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-[rgba(55,50,47,0.04)] border border-[rgba(55,50,47,0.07)] p-4 transition-all duration-200 hover:border-[rgba(55,50,47,0.12)] hover:shadow-sm"
                      >
                        <p className="text-sm font-semibold text-[#37322F]">
                          {exp.title}
                        </p>
                        <p className="text-xs text-[rgba(55,50,47,0.5)] mt-0.5">
                          {exp.company} · {exp.duration}
                        </p>
                        <p className="mt-2 text-xs text-[rgba(55,50,47,0.7)] leading-5">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.profile.education.length > 0 && (
                <div>
                  <FieldLabel>Education</FieldLabel>
                  <div className="space-y-2 mt-2">
                    {result.profile.education.map((edu, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold text-[#37322F]">
                          {edu.degree}
                        </p>
                        <p className="text-xs text-[rgba(55,50,47,0.5)]">
                          {edu.institution} · {edu.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interview CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/interview?mode=option_a&user_id=${result.user_id}`}
                className="flex-1 rounded-full bg-[#37322F] py-2.5 text-center text-sm font-semibold text-white
                  transition-all duration-200 hover:bg-[#2a2520] hover:shadow-[0px_4px_12px_rgba(55,50,47,0.25)]
                  hover:scale-[1.01] active:scale-[0.99]"
              >
                Resume-Based Interview →
              </Link>
              <Link
                href={`/interview?mode=option_b&user_id=${result.user_id}`}
                className="flex-1 rounded-full border border-[rgba(55,50,47,0.2)] bg-white py-2.5 text-center text-sm font-semibold text-[#37322F]
                  transition-all duration-200 hover:border-[rgba(55,50,47,0.35)] hover:shadow-[0px_2px_8px_rgba(55,50,47,0.08)]
                  hover:scale-[1.01] active:scale-[0.99]"
              >
                JD-Targeted Interview →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Small reusable field components ────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[rgba(55,50,47,0.45)] uppercase tracking-wider">
      {children}
    </p>
  )
}

function Field({
  label,
  value,
  paragraph = false,
}: {
  label: string
  value: string
  paragraph?: boolean
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p
        className={`mt-1 text-sm text-[#37322F] ${paragraph ? "leading-6 text-[rgba(55,50,47,0.8)]" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}
