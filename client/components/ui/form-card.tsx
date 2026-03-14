import { FormHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormCardProps extends FormHTMLAttributes<HTMLFormElement> {
  title: string
  children: ReactNode
  delay?: string
  columns?: "single" | "double"
  className?: string
}

export function FormCard({
  title,
  children,
  delay = "0.1s",
  columns = "double",
  className,
  ...props
}: FormCardProps) {
  return (
    <form
      className={cn(
        "grid rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-6 shadow-[0px_2px_8px_rgba(55,50,47,0.06)] mb-8 animate-fade-in-up",
        columns === "double" ? "gap-3 sm:grid-cols-2" : "gap-5 grid-cols-1",
        className,
      )}
      style={{ animationDelay: delay }}
      {...props}
    >
      <h2 className="col-span-full text-[#37322F] text-base font-semibold mb-1">
        {title}
      </h2>
      {children}
    </form>
  )
}
