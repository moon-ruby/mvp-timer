// Alert sounds synthesized with the Web Audio API, so no audio files are needed.
// Each sound is a list of [frequency(s), start, duration, wave] notes.

export const SOUNDS = [
  { id: 'bell', label: 'Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'ping', label: 'Ping' },
  { id: 'arcade', label: 'Arcade beep' },
  { id: 'alarm', label: 'Alarm' },
  { id: 'buzzer', label: 'Buzzer' },
  { id: 'klaxon', label: 'Klaxon' },
  { id: 'siren', label: 'Siren' },
]

const PATTERNS = {
  bell: [[[880, 1320], 0, 1.2, 'sine']],
  chime: [[[659], 0, 0.5, 'sine'], [[784], 0.18, 0.5, 'sine'], [[1047], 0.36, 0.8, 'sine']],
  ping: [[[1760], 0, 0.35, 'sine']],
  arcade: [[[523], 0, 0.09, 'square'], [[659], 0.1, 0.09, 'square'], [[784], 0.2, 0.09, 'square'], [[1047], 0.3, 0.18, 'square']],
  alarm: [0, 0.25, 0.5, 0.75].map((t) => [[988], t, 0.15, 'square']),
  buzzer: [[[110, 113], 0, 0.7, 'sawtooth']],
  klaxon: [[[220, 277], 0, 0.45, 'sawtooth'], [[220, 277], 0.55, 0.45, 'sawtooth']],
  siren: 'siren',
}

const PATTERN_LENGTH = { bell: 1.3, chime: 1.2, ping: 0.4, arcade: 0.5, alarm: 0.95, buzzer: 0.75, klaxon: 1.05, siren: 1.6 }

let ctx = null
function audio() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Browsers block audio until the user interacts with the page once.
export function unlockAudio() {
  try {
    audio()
  } catch {}
}

function playOnce(id, volume, at) {
  const ac = audio()
  const master = ac.createGain()
  master.gain.value = volume * 0.35
  master.connect(ac.destination)

  if (PATTERNS[id] === 'siren') {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, at)
    osc.frequency.linearRampToValueAtTime(1200, at + 0.75)
    osc.frequency.linearRampToValueAtTime(600, at + 1.5)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(1, at + 0.05)
    g.gain.setValueAtTime(1, at + 1.45)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.55)
    osc.connect(g).connect(master)
    osc.start(at)
    osc.stop(at + 1.6)
    return
  }

  for (const [freqs, start, dur, wave] of PATTERNS[id] ?? PATTERNS.bell) {
    for (const f of freqs) {
      const osc = ac.createOscillator()
      osc.type = wave
      osc.frequency.value = f
      const g = ac.createGain()
      const t0 = at + start
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(1 / freqs.length, t0 + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.connect(g).connect(master)
      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    }
  }
}

export function playSound(id, { volume = 0.7, repeat = 1 } = {}) {
  try {
    const ac = audio()
    const len = (PATTERN_LENGTH[id] ?? 1.2) + 0.15
    const times = Math.min(5, Math.max(1, repeat))
    for (let i = 0; i < times; i++) playOnce(id, volume, ac.currentTime + 0.02 + i * len)
  } catch {}
}
