"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Building2, Briefcase, Code, Sparkles, User, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type CompanyProfile } from "@/lib/api"

interface CompanyDetailProps {
  company: CompanyProfile
  index: number
  onDelete: (company: CompanyProfile) => void
  onClose: () => void
}

export function CompanyDetail({ company, index, onDelete, onClose }: CompanyDetailProps) {
  const getCompanyIcon = (index: number) => {
    const icons = [User, Building2, Briefcase, Code, Sparkles]
    const Icon = icons[index % icons.length]
    return <Icon className="w-12 h-12 stroke-1 text-muted-foreground" />
  }

  const isPremiumCard = (index: number) => index % 4 === 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="mt-6 rounded-2xl border border-white/40 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/60 border border-white/40 shadow-sm">
                {getCompanyIcon(index)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {company.company_name}
                  </h2>
                  {isPremiumCard(index) && <Badge className="text-xs">Premium</Badge>}
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {company.role}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Close detail view"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(company)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Description Section */}
            {company.description && (
              <div className="rounded-xl border border-white/40 bg-white/50 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-2">
                  Description
                </h3>
                <p className="text-foreground/90 leading-relaxed text-sm">
                  {company.description}
                </p>
              </div>
            )}

            {/* Hiring Patterns Section */}
            {company.hiring_patterns && (
              <div className="rounded-xl border border-white/40 bg-white/50 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-2">
                  Hiring Patterns
                </h3>
                <p className="text-foreground/90 leading-relaxed text-sm">
                  {company.hiring_patterns}
                </p>
              </div>
            )}

            {/* Tech Stack Section */}
            {company.tech_stack && (
              <div className="rounded-xl border border-white/40 bg-white/50 p-4 shadow-sm md:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-3">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.tech_stack.split(",").map((tech, i) => (
                    <span
                      key={`${tech}-${i}`}
                      className="rounded-full bg-white/80 border border-white/60 px-3 py-1 text-xs font-medium text-foreground/90 shadow-sm"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
