import { Lightning, Warning } from "@phosphor-icons/react";

export default function PowerCutOverlay() {
  return (
    <>
      <div className="power-cut-overlay" />
      <div
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 critical-banner px-6 py-3 rounded-full border border-white/30 flex items-center gap-3 shadow-2xl backdrop-blur-md"
        data-testid="power-cut-banner"
      >
        <Lightning size={18} weight="fill" className="text-white" />
        <span className="font-serif-display text-lg tracking-wide text-white">
          Elektrik Kesintisi <span className="font-serif-italic font-light opacity-90">algılandı</span>
        </span>
        <Warning size={18} weight="fill" className="text-white" />
      </div>
    </>
  );
}
