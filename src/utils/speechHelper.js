// Web Audio API Announcement Chime (Ding-Dong sound without needing external audio files)
export function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return Promise.resolve();

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tone 1: High chime (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2: Low chime (440.00 Hz - A4)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440.00, now + 0.25);
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 1.1);

    return new Promise(resolve => setTimeout(resolve, 800));
  } catch (e) {
    console.warn('AudioContext chime error:', e);
    return Promise.resolve();
  }
}

// Speak text using Web Speech API with bilingual support (id-ID & en-US)
export async function speakText(text, lang = 'id', onStart, onEnd) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Play chime first
  await playChime();

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langCode = lang === 'en' ? 'en-US' : 'id-ID';
  utterance.lang = langCode;
  utterance.rate = lang === 'en' ? 0.95 : 1.0;
  utterance.pitch = 1.0;

  // Find best available voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(lang === 'en' ? 'en' : 'id'));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) {
    utterance.onstart = () => onStart();
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
