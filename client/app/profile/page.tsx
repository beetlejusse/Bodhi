"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth, useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { StatusMessage } from "@/components/ui/status-message"
import { getUserProfile, type UserProfileResponse, uploadResume, downloadResumeBlob } from "@/lib/api"
import { PrimaryButton } from "@/components/ui/primary-button"

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  
  // Resume upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [downloadingResume, setDownloadingResume] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [updatingName, setUpdatingName] = useState(false)
  
  const [editingExperience, setEditingExperience] = useState(false)
  const [newExperience, setNewExperience] = useState("")
  const [updatingExperience, setUpdatingExperience] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/")
      return
    }

    if (isLoaded && isSignedIn) {
      loadProfile()
    }
  }, [isLoaded, isSignedIn])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await getUserProfile(token ?? undefined)
      setProfile(data)
    } catch (err) {
      console.error("Failed to load profile:", err)
      setError("Failed to load your profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut(() => router.push("/"))
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      setUploadError("Please select a file")
      return
    }

    setUploading(true)
    setUploadError("")

    try {
      const token = await getToken()
      await uploadResume(file, token ?? undefined)
      await loadProfile() // Refresh profile
      setShowUpload(false)
      formEl.reset()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloadingResume(true)
      const token = await getToken()
      const { blob, filename } = await downloadResumeBlob(token ?? undefined)
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || "resume.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError("Failed to download resume. It may not exist.")
    } finally {
      setDownloadingResume(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError("Name cannot be empty")
      return
    }

    try {
      setUpdatingName(true)
      setError("")
      
      const token = await getToken()
      const headers = new Headers()
      headers.append("Authorization", `Bearer ${token}`)
      headers.append("Content-Type", "application/json")
      
      const response = await fetch("/api/users/me/name", {
        method: "PUT",
        headers,
        body: JSON.stringify({ full_name: newName.trim() }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update name")
      }
      
      // Reload profile to show updated name
      await loadProfile()
      setEditingName(false)
    } catch (err) {
      console.error("Name update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update name. Please try again.")
    } finally {
      setUpdatingName(false)
    }
  }

  const handleUpdateExperience = async () => {
    if (!newExperience.trim()) {
      setError("Experience level cannot be empty")
      return
    }

    try {
      setUpdatingExperience(true)
      setError("")
      
      const token = await getToken()
      const headers = new Headers()
      headers.append("Authorization", `Bearer ${token}`)
      headers.append("Content-Type", "application/json")
      
      const response = await fetch("/api/users/me/experience", {
        method: "PUT",
        headers,
        body: JSON.stringify({ experience_level: newExperience.trim() }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update experience level")
      }
      
      await loadProfile()
      setEditingExperience(false)
    } catch (err) {
      console.error("Experience update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update experience. Please try again.")
    } finally {
      setUpdatingExperience(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] font-sans relative overflow-hidden flex items-center justify-center">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, #37322F 1px, transparent 1px),
                linear-gradient(to bottom, #37322F 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E8E3DF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DED9D5] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }} />

        <div className="w-8 h-8 rounded-full border-4 border-[#37322F]/20 border-t-[#37322F] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] font-sans relative overflow-hidden pb-20">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #37322F 1px, transparent 1px),
              linear-gradient(to bottom, #37322F 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E8E3DF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DED9D5] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      <Navbar />

      <main className="relative pt-24 px-4 sm:px-6 max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        {error && <StatusMessage message={error} type="error" />}

        {/* 1. Header Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-3xl bg-white/60 backdrop-blur-md border border-[rgba(55,50,47,0.08)] p-8 shadow-[0px_8px_24px_rgba(55,50,47,0.04)]">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" className="w-24 h-24 rounded-full shadow-md object-cover border-4 border-white" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[rgba(55,50,47,0.1)] shadow-inner flex items-center justify-center border-4 border-white">
              <span className="text-3xl text-[rgba(55,50,47,0.5)] font-semibold uppercase">
                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "?"}
              </span>
            </div>
          )}
          
          <div className="flex-1 text-center sm:text-left mt-2 sm:mt-4">
            {editingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 rounded-xl border border-[rgba(55,50,47,0.15)] bg-white text-[#2F3037] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[rgba(55,50,47,0.15)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateName}
                    disabled={updatingName}
                    className="px-4 py-1.5 rounded-full bg-[#37322F] text-white text-xs font-semibold hover:bg-[#2a2520] transition-colors disabled:opacity-50"
                  >
                    {updatingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false)
                      setNewName("")
                    }}
                    className="px-4 py-1.5 rounded-full border border-[rgba(55,50,47,0.12)] bg-white text-[#37322F] text-xs font-semibold hover:bg-[rgba(55,50,47,0.02)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#2F3037] tracking-tight">
                    {profile?.full_name || user?.fullName || "Candidate Profile"}
                  </h1>
                  <button
                    onClick={() => {
                      setNewName(profile?.full_name || user?.fullName || "")
                      setEditingName(true)
                    }}
                    className="p-1.5 rounded-full hover:bg-[rgba(55,50,47,0.05)] transition-colors group"
                    title="Edit name"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(55,50,47,0.4)] group-hover:text-[#37322F]">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[#37322F]/60 font-medium mt-1">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                
                <div className="mt-4">
                  {editingExperience ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={newExperience}
                        onChange={(e) => setNewExperience(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-[rgba(55,50,47,0.15)] bg-white text-[#2F3037] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[rgba(55,50,47,0.15)]"
                      >
                        <option value="">Select Experience Level</option>
                        <option value="Intern">Intern</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleUpdateExperience} disabled={updatingExperience} className="px-4 py-1.5 rounded-full bg-[#37322F] text-white text-xs font-semibold hover:bg-[#2a2520] transition-colors disabled:opacity-50">
                          {updatingExperience ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => { setEditingExperience(false); setNewExperience(""); }} className="px-4 py-1.5 rounded-full border border-[rgba(55,50,47,0.12)] bg-white text-[#37322F] text-xs font-semibold hover:bg-[rgba(55,50,47,0.02)] transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[#37322F] font-semibold text-sm bg-white/80 border border-[rgba(55,50,47,0.1)] px-3 py-1 rounded-full shadow-sm">
                        {profile?.experience_level || "No Experience Set"}
                      </span>
                      <button
                        onClick={() => {
                          setNewExperience(profile?.experience_level || "")
                          setEditingExperience(true)
                        }}
                        className="text-xs font-semibold text-[#37322F]/60 hover:text-[#37322F] underline underline-offset-2 transition-colors ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-full border border-[rgba(55,50,47,0.12)] bg-white text-[13px] font-semibold text-[#37322F] shadow-sm hover:shadow-md hover:bg-[rgba(55,50,47,0.02)] transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 2. Resume Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2F3037]">Resume Data</h2>
            <div className="flex gap-4">
              {profile?.resume_file_name && (
                <button
                  onClick={handleDownload}
                  disabled={downloadingResume}
                  className="text-sm font-semibold text-[#37322F] hover:underline hover:text-[#37322F]/80 transition-colors disabled:opacity-50"
                >
                  {downloadingResume ? "Downloading..." : "Download Original"}
                </button>
              )}
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="text-sm font-semibold text-[#37322F] hover:underline hover:text-[#37322F]/80 transition-colors"
              >
                {profile?.has_resume ? "Update Resume" : "Upload Resume"}
              </button>
            </div>
          </div>

          {showUpload && (
            <div className="rounded-2xl border-2 border-[rgba(55,50,47,0.08)] bg-white/70 backdrop-blur-sm p-6 shadow-sm mb-6 pb-2 animate-fade-in-up">
              <h3 className="text-md font-bold text-[#2F3037] mb-4">
                {profile?.has_resume ? "Upload New Resume" : "Upload Resume"}
              </h3>
              {uploadError && <StatusMessage message={uploadError} type="error" />}
              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.docx"
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-[rgba(55,50,47,0.12)] bg-white px-4 py-3.5 text-sm text-[#37322F]
                    file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0
                    file:bg-gradient-to-r file:from-[#37322F] file:to-[#2A2624] file:text-white file:text-xs file:font-semibold
                    hover:file:from-[#2A2624] hover:file:to-[#1F1C1A] hover:file:shadow-md
                    focus:outline-none focus:ring-4 focus:ring-[#37322F]/10 focus:border-[#37322F]
                    disabled:opacity-50 transition-all cursor-pointer"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="px-4 py-2 text-sm font-semibold text-[rgba(55,50,47,0.6)] hover:bg-[rgba(55,50,47,0.05)] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <PrimaryButton type="submit" loading={uploading} disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload & Parse"}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          )}

          {!profile?.has_resume && !showUpload ? (
            <div className="rounded-2xl border border-dashed border-[rgba(55,50,47,0.2)] bg-[rgba(55,50,47,0.02)] p-10 text-center">
              <p className="text-[rgba(55,50,47,0.6)] font-medium mb-4">No resume uploaded yet.</p>
              <PrimaryButton onClick={() => setShowUpload(true)}>
                Upload Resume Now
              </PrimaryButton>
            </div>
          ) : (
             profile?.resume_data && (
              <div className="rounded-2xl border border-[rgba(55,50,47,0.08)] bg-white/60 backdrop-blur-md p-7 shadow-sm space-y-6">
                {profile.resume_data.summary && (
                  <Field label="Professional Summary" value={profile.resume_data.summary} paragraph />
                )}
                
                {profile.resume_data.skills && profile.resume_data.skills.length > 0 && (
                  <div>
                    <FieldLabel>Technical Skills</FieldLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.resume_data.skills.map((skill: string, i: number) => (
                        <span key={i} className="rounded-full bg-[rgba(55,50,47,0.06)] px-3 py-1 text-xs text-[#37322F] font-semibold border border-[rgba(55,50,47,0.05)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.resume_data.projects && profile.resume_data.projects.length > 0 && (
                  <div>
                    <FieldLabel>Projects & Achievements</FieldLabel>
                    <ul className="mt-2 space-y-2">
                      {profile.resume_data.projects.map((project: { name: string, description: string }, i: number) => (
                        <li key={i} className="text-[13px] text-[rgba(55,50,47,0.8)] leading-relaxed flex gap-2">
                          <span className="text-[#37322F]/40 shadow-sm">•</span>
                          <strong>{project.name}:</strong> {project.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* 3. Interview History Section */}
        <div className="space-y-5 pt-4">
          <h2 className="text-xl font-bold text-[#2F3037]">Interview History</h2>
          
          {!profile?.interview_history || profile.interview_history.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(55,50,47,0.08)] bg-white/60 backdrop-blur-md p-8 text-center text-[rgba(55,50,47,0.6)] font-medium">
              You haven&apos;t completed any interviews yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {profile.interview_history.map((session) => (
                <div key={session.session_id} className="relative group rounded-2xl bg-white/70 backdrop-blur-sm border border-[rgba(55,50,47,0.08)] p-6 transition-all hover:shadow-[0px_8px_24px_rgba(55,50,47,0.08)] hover:-translate-y-0.5 overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#2F3037] mb-1">
                        {session.target_role} <span className="text-[rgba(55,50,47,0.4)]">at</span> {session.target_company}
                      </h3>
                      <p className="text-[13px] text-[rgba(55,50,47,0.6)] font-medium">
                        {new Date(session.started_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {session.overall_score !== null && session.overall_score > 0 ? (
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-[#37322F]">
                          {Math.round(session.overall_score)}<span className="text-[15px] font-bold text-[rgba(55,50,47,0.4)]">/100</span>
                        </div>
                        <div className="text-[10px] font-bold text-[rgba(55,50,47,0.4)] uppercase tracking-widest mt-0.5">Overall Score</div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-[rgba(55,50,47,0.05)] px-3 py-1.5 text-xs font-semibold text-[rgba(55,50,47,0.6)] border border-[rgba(55,50,47,0.05)]">
                        Incomplete
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[rgba(55,50,47,0.08)] flex justify-end">
                    <Link
                      href={`/report/${session.session_id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#37322F] group-hover:underline hover:text-[#37322F]/80 transition-all"
                    >
                      View Report →
                    </Link>
                  </div>
                  
                  {/* Subtle right-edge shine on hover */}
                  <div className="absolute top-0 bottom-0 -right-20 w-16 bg-gradient-to-l from-white/40 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:-translate-x-[200px] transition-all duration-700 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Small reusable field components ────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-[rgba(55,50,47,0.4)] uppercase tracking-wider mb-1.5">
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
        className={`text-[14px] text-[#37322F] ${paragraph ? "leading-relaxed text-[rgba(55,50,47,0.85)] font-medium" : "font-semibold"}`}
      >
        {value}
      </p>
    </div>
  )
}
