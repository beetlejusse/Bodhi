"use client";

import { useState } from "react";
import { uploadResume, CandidateProfile } from "@/lib/api";

export default function ResumesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    userId: string;
    profile: CandidateProfile;
  } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await uploadResume(file);
      setResult({
        userId: res.user_id,
        profile: res.profile,
      });
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Resumes</h1>
      <p className="text-zinc-400">
        Upload a PDF or DOCX resume to extract a structured profile. You will
        receive a User ID that can be used to start personalized interviews or JD
        gap-analysis interviews.
      </p>

      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-4 py-3 text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Resume Document
          </label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-zinc-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-medium
              file:bg-zinc-800 file:text-white
              hover:file:bg-zinc-700"
          />
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="rounded bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {loading ? "Parsing Resume..." : "Upload & Parse"}
        </button>
      </form>

      {result && (
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-xl font-semibold text-green-400">
            Success! User ID: {result.userId}
          </h2>
          <p className="text-sm text-zinc-400">
            Save this User ID. You can enter it on the Interview page to start a
            resume-based or JD-targeted session.
          </p>

          <div className="mt-4 rounded bg-black/50 p-4">
            <h3 className="font-medium mb-2">{result.profile.name}</h3>
            {result.profile.summary && (
              <p className="text-sm text-zinc-300 mb-4">
                {result.profile.summary}
              </p>
            )}

            <div className="space-y-4">
              {result.profile.experience && result.profile.experience.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Experience</h4>
                  <ul className="text-sm text-zinc-400 list-disc list-inside">
                    {result.profile.experience.map((exp, i) => (
                      <li key={i}>
                        {exp.title} at {exp.company} ({exp.duration})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.profile.skills && result.profile.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
