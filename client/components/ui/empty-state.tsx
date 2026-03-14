interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(55,50,47,0.12)] bg-white p-12 text-center animate-fade-in-up">
      <p className="text-[rgba(55,50,47,0.45)] text-sm">{message}</p>
    </div>
  )
}
