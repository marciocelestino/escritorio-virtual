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

const REPEAT_COUNT = 3;
const NOTE_DURATION = 0.15;
const PATTERN_GAP = 0.15;

export function playPingSound() {

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const now = context.currentTime;

  const patternDuration =
    [880, 660].length * NOTE_DURATION +
    PATTERN_GAP;

  for (
    let repeat = 0;
    repeat < REPEAT_COUNT;
    repeat++
  ) {

    const patternStart =
      now + repeat * patternDuration;

    [880, 660].forEach((frequency, index) => {

      const oscillator =
        context.createOscillator();

      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const start =
        patternStart +
        index * NOTE_DURATION;

      const end = start + NOTE_DURATION;

      gain.gain.setValueAtTime(
        0.0001,
        start
      );

      gain.gain.exponentialRampToValueAtTime(
        0.3,
        start + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        end
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(end);

    });

  }
}
