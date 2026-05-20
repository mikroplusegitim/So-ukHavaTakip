import { Lightning, Warning } from "@phosphor-icons/react";

export default function PowerCutOverlay() {
  return (
    <>
      <div className="power-cut-overlay" />
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 critical-banner border border-white/20 px-6 py-3 flex items-center gap-3"
        data-testid="power-cut-banner"
      >
        <Lightning size={20} weight="fill" className="text-white" />
        <span className="font-display font-black tracking-wider text-white">
          ELEKTRİK KESİNTİSİ ALGILANDI
        </span>
        <Warning size={20} weight="fill" className="text-white" />
      </div>
    </>
  );
}
