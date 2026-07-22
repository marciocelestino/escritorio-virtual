let sharedContext: AudioContext | null = null;

function getAudioContext() {

  if (typeof window === "undefined") {
    return null;
  }

  if (!sharedContext) {
    sharedContext = new AudioContext();
  }

  return sharedContext;
}

export function playPingSound() {

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const now = context.currentTime;

  [880, 660].forEach((frequency, index) => {

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const start = now + index * 0.15;
    const end = start + 0.15;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(start);
    oscillator.stop(end);

  });
}
