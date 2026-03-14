"use client";

import { useState } from "react";
import { uploadResume, type CandidateProfile } from "@/lib/api";
import Link from "next/link";

export default function ResumesPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    user_id: string;
    profile: CandidateProfile;
  } | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const res = await uploadResume(file);
      setResult(res);
      form.reset();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resume Upload</h1>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back
        </Link>
      </div>

      <p className="text-sm text-zinc-400">
        Upload your resume (PDF or DOCX) to create a profile for resume-based interviews.
      </p>

      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Resume File (PDF or DOCX)
          </label>
          <input
            type="file"
            name="file"
            accept=".pdf,.docx"
            disabled={uploading}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-white file:px-3 file:py-1 file:text-xs file:font-medium file:text-black hover:file:bg-zinc-200"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded border border-white py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-700 bg-green-900/30 p-4">
            <h3 className="font-semibold text-green-300 mb-2">Upload Successful!</h3>
            <p className="text-sm text-zinc-300 mb-3">
              Your profile has been created. Use this User ID to start a resume-based interview:
            </p>
            <div className="rounded bg-black/40 px-3 py-2 font-mono text-sm text-white">
              {result.user_id}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-lg font-semibold">Extracted Profile</h3>

            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-1">Name</h4>
              <p className="text-sm">{result.profile.name}</p>
            </div>

            {result.profile.email && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Email</h4>
                <p className="text-sm">{result.profile.email}</p>
              </div>
            )}

            {result.profile.phone && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Phone</h4>
                <p className="text-sm">{result.profile.phone}</p>
              </div>
            )}

            {result.profile.summary && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Summary</h4>
                <p className="text-sm text-zinc-300">{result.profile.summary}</p>
              </div>
            )}

            {result.profile.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {result.profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded bg-white/10 px-2 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.profile.experience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Experience</h4>
                <div className="space-y-3">
                  {result.profile.experience.map((exp, i) => (
                    <div key={i} className="rounded bg-white/5 p-3">
                      <p className="font-medium text-sm">{exp.title}</p>
                      <p className="text-xs text-zinc-400">{exp.company} • {exp.duration}</p>
                      <p className="text-xs text-zinc-300 mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.profile.education.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Education</h4>
                <div className="space-y-2">
                  {result.profile.education.map((edu, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-xs text-zinc-400">{edu.institution} • {edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.profile.projects.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Projects</h4>
                <div className="space-y-3">
                  {result.profile.projects.map((proj, i) => (
                    <div key={i} className="rounded bg-white/5 p-3">
                      <p className="font-medium text-sm">{proj.name}</p>
                      <p className="text-xs text-zinc-300 mt-1">{proj.description}</p>
                      {proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.technologies.map((tech, j) => (
                            <span
                              key={j}
                              className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/interview?mode=option_a&user_id=${result.user_id}`}
              className="flex-1 rounded border border-white py-2.5 text-center text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              Start Resume-Based Interview
            </Link>
            <Link
              href={`/interview?mode=option_b&user_id=${result.user_id}`}
              className="flex-1 rounded border border-white py-2.5 text-center text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              Start JD-Targeted Interview
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
