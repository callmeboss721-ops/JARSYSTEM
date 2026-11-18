const STAFF_SOUND_KEY = "jaguar-staff-success-sound";
let staffAudioContext: AudioContext | null = null;
let staffSoundPreferenceInMemory = false;

export function readStaffSoundPreference() {
  if (typeof window === "undefined") return false;
  try {
    staffSoundPreferenceInMemory = window.localStorage.getItem(STAFF_SOUND_KEY) === "on";
    return staffSoundPreferenceInMemory;
  } catch {
    return staffSoundPreferenceInMemory;
  }
}

export function saveStaffSoundPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  staffSoundPreferenceInMemory = enabled;
  try {
    window.localStorage.setItem(STAFF_SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // Sound feedback remains available for this session if storage is disabled.
  }
  if (enabled) primeStaffSuccessSound();
}

export function primeStaffSuccessSound() {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    staffAudioContext ??= new window.AudioContext();
    if (staffAudioContext.state === "suspended") {
      void staffAudioContext.resume().catch(() => undefined);
    }
  } catch {
    staffAudioContext = null;
  }
}

export function playStaffSuccessSound() {
  if (!readStaffSoundPreference()) return;
  primeStaffSuccessSound();
  const context = staffAudioContext;
  if (!context) return;
  if (context.state !== "running") {
    void context.resume().then(() => {
      if (context.state === "running") scheduleSuccessTone(context);
    }).catch(() => undefined);
    return;
  }

  scheduleSuccessTone(context);
}

function scheduleSuccessTone(context: AudioContext) {
  const now = context.currentTime;
  const tone = context.createOscillator();
  const volume = context.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(660, now);
  tone.frequency.exponentialRampToValueAtTime(880, now + 0.07);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.025, now + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  tone.connect(volume);
  volume.connect(context.destination);
  tone.start(now);
  tone.stop(now + 0.17);
}
