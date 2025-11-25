import { MotionDetectionService } from './MotionDetectionService';

export type AutomatedResponse = 'SI' | 'NO' | 'NON_RILEVATO';

export class AdvancedVoiceService {
    private synthesis: SpeechSynthesis;
    private motionDetector: MotionDetectionService;
    private isWaitingForResponse = false;
    private responseTimeout: number | null = null;
    private movementHandler: ((event: any) => void) | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;
        this.motionDetector = new MotionDetectionService();
    }

    initializeDetector(videoElement: HTMLVideoElement) {
        this.motionDetector.initialize(videoElement);
    }

    public startManualDetection() {
        this.motionDetector.startDetection();
    }

    public stopManualDetection() {
        this.motionDetector.stopDetection();
    }

    askQuestion(question: string, userName = ''): Promise<AutomatedResponse> {
        return new Promise(async (resolve) => {
            this.isWaitingForResponse = true;
            let questionText = question.replace(/\(nome\)/g, userName);

            await this.speak(questionText);

            // Wait a moment after speaking before detecting
            setTimeout(() => {
                this.startResponseDetection(resolve);
            }, 1500);
        });
    }

    private startResponseDetection(resolve: (value: AutomatedResponse) => void) {
        this.motionDetector.startDetection();

        this.movementHandler = (event: CustomEvent) => {
            if (this.isWaitingForResponse) {
                const direction = event.detail.direction;
                this.stopResponseDetection();

                let response: AutomatedResponse;
                if (direction === 'forward') response = 'SI';
                else if (direction === 'backward') response = 'NO';
                else response = 'NON_RILEVATO';
                
                resolve(response);
            }
        };

        window.addEventListener('movementDetected', this.movementHandler);

        this.responseTimeout = window.setTimeout(() => {
            if (this.isWaitingForResponse) {
                this.stopResponseDetection();
                resolve('NON_RILEVATO');
            }
        }, 10000); // 10-second timeout
    }

    private stopResponseDetection() {
        this.isWaitingForResponse = false;
        this.motionDetector.stopDetection();

        if (this.movementHandler) {
            window.removeEventListener('movementDetected', this.movementHandler);
            this.movementHandler = null;
        }

        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
    }

    public stopSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.stopResponseDetection();
    }

    speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.synthesis.speaking) {
                this.synthesis.cancel();
            }

            // A short delay to ensure cancellation has processed
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'it-IT';
                utterance.rate = 0.95;
                
                // Find a "sweet, melodious" male Italian voice.
                const voices = this.synthesis.getVoices();
                // We'll prioritize common high-quality male voices like "Luca", then other male voices, then fall back to any other Italian voice.
                const preferredMaleVoice = voices.find(voice => voice.lang === 'it-IT' && /luca|paolo|giorgio/i.test(voice.name));
                const anyItalianMaleVoice = voices.find(voice => voice.lang === 'it-IT' && /uomo|male/i.test(voice.name));
                const anyItalianVoice = voices.find(voice => voice.lang === 'it-IT');

                if (preferredMaleVoice) {
                    utterance.voice = preferredMaleVoice;
                } else if (anyItalianMaleVoice) {
                    utterance.voice = anyItalianMaleVoice;
                } else if (anyItalianVoice) {
                    utterance.voice = anyItalianVoice; // Fallback to the first available Italian voice
                }
                // If no Italian voice is found, the browser will use its default for the specified lang.

                utterance.onend = () => resolve();
                utterance.onerror = (e) => reject(e);

                this.synthesis.speak(utterance);
            }, 100);
        });
    }
}