

const Overview = () => {
  return (
    <main className="flex flex-col">
        <div 
        aria-hidden
        className='pointer-events-none absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 rounded-full blur-[120px] opacity-20'
        style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }}
         />

               {/* ── Hero ── */}
        <div className="relative z-10 flex flex-col items-center text-center mb-10 select-none">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-violet-400/70 mb-4">
            Document Intelligence
            </p>
            <h1
            className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-white/90"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
            What can I help you with?
            </h1>
            <p className="mt-4 text-[14px] text-white/35 max-w-sm leading-relaxed">
            Upload a document and ask anything — contracts, reports, research papers, and more.
            </p>
        </div>
    </main>
    

  )
}

export default Overview