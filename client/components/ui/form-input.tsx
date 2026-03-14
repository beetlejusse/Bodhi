import { InputHTMLAttributes } from "react"

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean
}

export function FormInput({ fullWidth, className = "", ...props }: FormInputProps) {
  const baseClasses =
    "rounded-xl border border-[rgba(55,50,47,0.15)] bg-[#F7F5F3] px-3 py-2.5 text-sm text-[#37322F] placeholder-[rgba(55,50,47,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(55,50,47,0.15)] transition font-sans"
  
  return (
    <input
      className={`${baseClasses} ${fullWidth ? "col-span-full" : ""} ${className}`}
      {...props}
    />
  )
}
