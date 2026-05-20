// Web-Audio based alarm — no external assets needed.

let audioCtx = null;
let alarmInterval = null;
let isPlaying = false;

const getCtx = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
};

const beep = (freq = 880, duration = 0.18, type = "square", gain = 0.08) => {
  const ctx = getCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration);
};

export const startAlarm = () => {
  if (isPlaying) return;
  isPlaying = true;
  const cycle = () => {
    beep(880, 0.18, "square", 0.1);
    setTimeout(() => beep(660, 0.18, "square", 0.1), 220);
  };
  cycle();
  alarmInterval = setInterval(cycle, 900);
};

export const stopAlarm = () => {
  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = null;
  isPlaying = false;
};

export const isAlarmPlaying = () => isPlaying;

export const chime = () => {
  beep(1200, 0.08, "sine", 0.05);
  setTimeout(() => beep(1600, 0.08, "sine", 0.05), 100);
};
