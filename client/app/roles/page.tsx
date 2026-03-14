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
import { DataTable } from "@/components/ui/data-table"
import { type Role, listRoles, createRole, deleteRole } from "@/lib/api"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"success" | "error">("success")

  const [form, setForm] = useState({
    role_name: "",
    description: "",
    focus_areas: "",
    typical_topics: "",
  })

  const load = () => {
    setLoading(true)
    listRoles()
      .then(setRoles)
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
      await createRole(form)
      setForm({
        role_name: "",
        description: "",
        focus_areas: "",
        typical_topics: "",
      })
      load()
      setMsg("Role created successfully")
      setMsgType("success")
    } catch (err) {
      setMsg(String(err))
      setMsgType("error")
    }
  }

  const handleDelete = async (role: Role) => {
    try {
      await deleteRole(role.role_name)
      load()
    } catch (err) {
      setMsg(String(err))
      setMsgType("error")
    }
  }

  const columns = [
    { header: "Name", accessor: "role_name" as keyof Role },
    {
      header: "Description",
      accessor: "description" as keyof Role,
      hideOnMobile: true,
    },
    {
      header: "Focus Areas",
      accessor: "focus_areas" as keyof Role,
      hideOnTablet: true,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F5F3] font-sans">
      <Navbar />

      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <PageHeader
          title="Role Profiles"
          description="Define roles you're applying for so Bodhi can tailor interview questions and feedback."
        />

        {msg && <StatusMessage message={msg} type={msgType} />}

        <FormCard title="Add Role" onSubmit={handleCreate}>
          <FormInput
            placeholder="Role name * (e.g. Senior Software Engineer)"
            required
            value={form.role_name}
            onChange={(e) => setForm({ ...form, role_name: e.target.value })}
            fullWidth
          />
          <FormInput
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <FormInput
            placeholder="Focus areas (e.g. System Design, DSA)"
            value={form.focus_areas}
            onChange={(e) => setForm({ ...form, focus_areas: e.target.value })}
          />
          <FormInput
            placeholder="Typical topics"
            value={form.typical_topics}
            onChange={(e) =>
              setForm({ ...form, typical_topics: e.target.value })
            }
            fullWidth
          />
          <PrimaryButton type="submit" fullWidth>
            Save Role Profile
          </PrimaryButton>
        </FormCard>

        <div style={{ animationDelay: "0.2s" }}>
          {loading ? (
            <LoadingSpinner />
          ) : roles.length === 0 ? (
            <EmptyState message="No role profiles yet. Add one above to personalise your interviews." />
          ) : (
            <DataTable
              columns={columns}
              data={roles}
              onDelete={handleDelete}
              getKey={(r) => r.id}
            />
          )}
        </div>
      </main>
    </div>
  )
}
