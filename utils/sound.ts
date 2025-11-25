
export const playFeedbackSound = (type: 'positive' | 'negative') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'positive') {
      // Tono alto e allegro (SI / AVANTI)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.1); // C6
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } else {
      // Tono basso e grave (NO / INDIETRO)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.1); // A2
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
