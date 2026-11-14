import { AudioManager } from './AudioManager';

export interface RadioCommsEvent {
  speaker: string;
  callsign: string;
  message: string;
  active: boolean;
  timestamp: number;
}

type RadioCommsListener = (event: RadioCommsEvent | null) => void;

class VoiceAnnouncerEngine {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;
  private listeners: RadioCommsListener[] = [];
  private clearTimer: number | null = null;
  private lastAnnouncedTime: Record<string, number> = {};

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize deep, authoritative male voices
    const preferredNames = [
      'Daniel',
      'Alex',
      'Google US English Male',
      'Microsoft David',
      'Fred',
      'Oliver',
      'Aaron',
    ];

    for (const name of preferredNames) {
      const match = voices.find((v) => v.name.includes(name) || v.name.toLowerCase().includes('male'));
      if (match) {
        this.selectedVoice = match;
        return;
      }
    }

    // Fallback to any English voice
    this.selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  public subscribe(listener: RadioCommsListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(event: RadioCommsEvent | null) {
    this.listeners.forEach((l) => l(event));
  }

  public speak(message: string, priority: boolean = false, cooldownSecs: number = 0, customSpeaker: string = 'CMDR. VANCE') {
    const now = Date.now();
    const key = message.slice(0, 15);
    if (cooldownSecs > 0 && this.lastAnnouncedTime[key]) {
      if (now - this.lastAnnouncedTime[key] < cooldownSecs * 1000) {
        return;
      }
    }
    this.lastAnnouncedTime[key] = now;

    // Tactical radio chirp sound effect
    AudioManager.playRadioChirp();

    // Broadcast event to UI HUD
    const event: RadioCommsEvent = {
      speaker: customSpeaker,
      callsign: 'TACTICAL FLIGHT OPS',
      message: message.toUpperCase(),
      active: true,
      timestamp: now,
    };
    this.notify(event);

    if (this.clearTimer !== null) {
      clearTimeout(this.clearTimer);
    }
    // Auto clear HUD comms after 4.2 seconds
    this.clearTimer = window.setTimeout(() => {
      this.notify(null);
    }, 4200);

    // Web Speech synthesis with deep pitch and punchy pace
    if (this.synth) {
      if (priority && this.synth.speaking) {
        this.synth.cancel();
      }

      try {
        const utter = new SpeechSynthesisUtterance(message);
        if (this.selectedVoice) {
          utter.voice = this.selectedVoice;
        }
        // Deep masculine resonance and aggressive pacing
        utter.pitch = 0.65;
        utter.rate = 1.05;
        utter.volume = 1.0;

        utter.onstart = () => {
          this.isSpeaking = true;
        };
        utter.onend = () => {
          this.isSpeaking = false;
        };
        utter.onerror = () => {
          this.isSpeaking = false;
        };

        this.synth.speak(utter);
      } catch {
        // Speech API blocked or unsupported
      }
    }
  }

  // --- SITUATIONAL RACE CALLOUTS ---

  public announceCountdown(val: number) {
    if (val === 3) this.speak('Three.', true);
    else if (val === 2) this.speak('Two.', true);
    else if (val === 1) this.speak('One.', true);
    else if (val === 0) this.speak('IGNITION! BURN RUBBER, PILOT! GO GO GO!', true);
  }

  public announceWelcome() {
    AudioManager.playWelcomePowerUp();
    this.speak('Welcome to Gravity Rush. Defy gravity. Control the impossible.', true, 3, 'SYSTEM AI');
  }

  public announceStart() {
    this.speak('Thrusters nominal! Chase down the pack!', false, 5);
  }

  public announceVictory() {
    AudioManager.playVictory();
    this.speak('VICTORY! UNSTOPPABLE! You just dominated the entire grid! You are a racing legend, pilot!', true);
  }

  public announcePodium(pos: number) {
    AudioManager.playVictory();
    this.speak(`Podium finish! Ranked ${pos === 2 ? 'second' : 'third'}! Outstanding driving, pilot!`, true);
  }

  public announceDefeat() {
    AudioManager.playDefeat();
    this.speak('DEFEAT! Tough break out there, pilot. Head to the garage, tune up your engine, and come back hungry!', true);
  }

  public announceNitro() {
    const lines = [
      'Hyper-drive engaged!',
      'Maximum nitro thrust!',
      'Eat my vapor trails!',
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    this.speak(pick, false, 8);
  }

  public announceGravitySwitch(type: string) {
    if (type === 'right_wall' || type === 'left_wall') {
      this.speak('Wall-ride locked in! Hold your grip!', false, 10);
    } else if (type === 'ceiling') {
      this.speak('Ceiling inversion active! Defy the physics!', false, 10);
    } else if (type === 'zero_g') {
      this.speak('Zero-gravity vacuum gap! Fire attitude thrusters!', false, 10);
    }
  }

  public announceCoinPickup() {
    const lines = [
      'Quantum cell secured!',
      'Energy harvested!',
      'Nitro restored!',
      'Bonus credits in the bank!',
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    this.speak(pick, false, 12);
  }

  public announceFinalLap() {
    this.speak('FINAL LAP! Put everything on the line, pilot!', true, 10);
  }

  public announcePositionChange(pos: number, prevPos: number) {
    if (pos < prevPos) {
      // Overtake!
      AudioManager.playOvertake();
      if (pos === 1) {
        this.speak("YOU'RE IN FIRST PLACE! DEFEND THE LEAD!", true, 8);
      } else {
        this.speak(`Clean overtake! Up into ${pos === 2 ? 'second' : 'third'}!`, false, 6);
      }
    } else if (pos > prevPos) {
      // Lost position
      this.speak('You have been overtaken! Reclaim the line, pilot!', false, 8);
    }
  }
}

export const VoiceAnnouncer = new VoiceAnnouncerEngine();
