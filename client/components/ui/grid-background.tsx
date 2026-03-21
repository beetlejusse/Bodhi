/**
 * Reusable animated grid background component
 * Used across all pages for consistent branding
 */
export function GridBackground() {
  return (
    <>
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #37322F 1px, transparent 1px),
              linear-gradient(to bottom, #37322F 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E8E3DF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float pointer-events-none" />
      <div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DED9D5] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float pointer-events-none" 
        style={{ animationDelay: "2s" }} 
      />
    </>
  )
}
