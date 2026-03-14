interface StatusMessageProps {
  message: string
  type?: "success" | "error"
}

export function StatusMessage({ message, type = "success" }: StatusMessageProps) {
  const isSuccess = type === "success"
  
  return (
    <div
      className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium border animate-fade-in-up ${
        isSuccess
          ? "bg-[rgba(55,50,47,0.04)] border-[rgba(55,50,47,0.12)] text-[#37322F]"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {message}
    </div>
  )
}
