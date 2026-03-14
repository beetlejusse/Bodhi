"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import { PageHeader } from "@/components/ui/page-header"
import { StatusMessage } from "@/components/ui/status-message"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { FormCard } from "@/components/ui/form-card"
import { FormInput } from "@/components/ui/form-input"
import { PrimaryButton } from "@/components/ui/primary-button"
import { CompanyBentoGrid } from "@/components/companies/CompanyBentoGrid"
import {
  type CompanyProfile,
  listCompanies,
  createCompany,
  deleteCompany,
} from "@/lib/api"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"success" | "error">("success")

  const [form, setForm] = useState({
    company_name: "",
    role: "general",
    description: "",
    hiring_patterns: "",
    tech_stack: "",
  })

  const load = () => {
    setLoading(true)
    listCompanies()
      .then(setCompanies)
      .catch((e) => {
        setMsg(String(e))
        setMsgType("error")
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg("")
    try {
      await createCompany(form)
      setForm({
        company_name: "",
        role: "general",
        description: "",
        hiring_patterns: "",
        tech_stack: "",
      })
      load()
      setMsg("Company profile created successfully")
      setMsgType("success")
    } catch (err) {
      setMsg(String(err))
      setMsgType("error")
    }
  }

  const handleDelete = async (company: CompanyProfile) => {
    try {
      await deleteCompany(company.company_name, company.role)
      load()
    } catch (err) {
      setMsg(String(err))
      setMsgType("error")
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] font-sans">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-10 w-full max-w-none">
        <PageHeader
          title="Company Profiles"
          description="Add companies you're targeting to tailor your AI interview prep to their culture and tech stack."
        />

        {msg && <StatusMessage message={msg} type={msgType} />}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <section className="rounded-3xl border border-white/40 bg-white/60 p-6 sm:p-8 shadow-[0px_20px_50px_rgba(30,30,30,0.08)] backdrop-blur-xl">
            {loading ? (
              <LoadingSpinner />
            ) : companies.length === 0 ? (
              <EmptyState message="No company profiles yet. Add one above to get started." />
            ) : (
              <CompanyBentoGrid companies={companies} onDelete={handleDelete} />
            )}
          </section>

          <aside className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-[0px_18px_40px_rgba(30,30,30,0.08)] backdrop-blur-xl">
            <FormCard
              title="Add Company"
              onSubmit={handleCreate}
              columns="single"
              className="mb-0 bg-white/60 border-white/40 shadow-[0px_10px_30px_rgba(30,30,30,0.06)]"
            >
              <FormInput
                placeholder="Company name *"
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
              <FormInput
                placeholder="Role (e.g. Backend Engineer)"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <FormInput
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <FormInput
                placeholder="Hiring patterns"
                value={form.hiring_patterns}
                onChange={(e) =>
                  setForm({ ...form, hiring_patterns: e.target.value })
                }
              />
              <FormInput
                placeholder="Tech stack (e.g. React, Python, AWS)"
                value={form.tech_stack}
                onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                fullWidth
              />
              <PrimaryButton type="submit" fullWidth>
                Save Company Profile
              </PrimaryButton>
            </FormCard>
          </aside>
        </div>
      </main>
    </div>
  )
}
