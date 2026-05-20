import { useMemo } from "react";

export default function FrostParticles({ count = 40 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 14 + 12,
      delay: Math.random() * -20,
      drift: (Math.random() - 0.5) * 80,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, [count]);

  return (
    <div className="frost-particles" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
