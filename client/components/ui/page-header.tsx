interface PageHeaderProps {
  title: string
  description: string
  delay?: string
}

export function PageHeader({ title, description, delay = "0s" }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: delay }}>
      <h1 className="text-[#37322F] text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-[rgba(55,50,47,0.6)] text-sm leading-6">
        {description}
      </p>
    </div>
  )
}
