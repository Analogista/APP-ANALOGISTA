export class MotionDetectionService {
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isDetecting = false;
    private referenceFrame: ImageData | null = null;
    private animationFrameId: number | null = null;

    // ⬇️ PARAMETRI CALIBRATI PER STABILITÀ
    // Soglia aumentata per ignorare il respiro e i micro-movimenti (posizione neutra)
    private movementThreshold = 2000; 
    private pixelDiffThreshold = 15; 
    
    // Rapporto di dominanza: serve il 30% in più di movimento su un lato per confermare la direzione
    private dominanceRatio = 1.3; 

    // Area di rilevamento: Focus sul busto (esclude testa e gambe)
    private detectionArea = { x: 0.3, y: 0.2, width: 0.4, height: 0.6 };

    // Filtro temporale per stabilità
    private movementHistory: { direction: string; intensity: number }[] = [];
    private readonly historyLength = 6; 
    private readonly trendThreshold = 4;

    initialize(videoElement: HTMLVideoElement) {
        this.video = videoElement;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        }
    }

    setReferenceFrame() {
        if (!this.ctx || !this.video || !this.canvas) return;
        if (this.video.videoWidth > 0 && (this.canvas.width !== this.video.videoWidth)) {
             this.canvas.width = this.video.videoWidth;
             this.canvas.height = this.video.videoHeight;
        }
        
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        this.referenceFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        console.log("✅ Frame di riferimento impostato - ZERO (Neutro)");
    }

    startDetection() {
        if (!this.ctx || this.isDetecting) return;
        this.setReferenceFrame();
        this.isDetecting = true;
        this.movementHistory = [];
        this.detectMovement();
    }

    stopDetection() {
        this.isDetecting = false;
        this.referenceFrame = null;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private detectMovement = () => {
        if (!this.isDetecting || !this.video || !this.ctx || !this.canvas || !this.referenceFrame) return;

        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Analisi rispetto al frame ZERO (Reference)
        const analysisResult = this.analyzeOscillationFromReference(currentFrame, this.referenceFrame);
        
        this.movementHistory.push({ direction: analysisResult.direction, intensity: analysisResult.intensity });
        if (this.movementHistory.length > this.historyLength) {
            this.movementHistory.shift();
        }

        if (analysisResult.center.x !== 0 && analysisResult.center.y !== 0) {
            window.dispatchEvent(new CustomEvent('movementCenterUpdate', {
                detail: { center: analysisResult.center }
            }));
        }
        
        const trendMovement = this.analyzeMovementTrend();
        if (trendMovement.direction !== 'none') {
            window.dispatchEvent(new CustomEvent('movementDetected', {
                detail: { direction: trendMovement.direction, intensity: trendMovement.intensity }
            }));
            
            // Soft reset dopo un rilevamento confermato per evitare doppi trigger immediati
            // Ma NON resettiamo il referenceFrame, perché vogliamo mantenere lo zero assoluto
            this.movementHistory = []; 
        }

        this.animationFrameId = requestAnimationFrame(this.detectMovement);
    }

    private getBrightness(r: number, g: number, b: number): number {
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    private analyzeOscillationFromReference(currentFrame: ImageData, referenceFrame: ImageData): 
    { direction: string; intensity: number; center: {x: number, y: number} } {
        
        let movimentoDestra = 0; // Raw Right Side
        let movimentoSinistra = 0; // Raw Left Side
        let weightedX = 0;
        let weightedY = 0;
        let totalDiff = 0;

        const width = currentFrame.width;
        const height = currentFrame.height;
        
        const startX = Math.floor(width * this.detectionArea.x);
        const startY = Math.floor(height * this.detectionArea.y);
        const endX = startX + Math.floor(width * this.detectionArea.width);
        const endY = startY + Math.floor(height * this.detectionArea.height);
        const midX = startX + (endX - startX) / 2;
        
        for (let y = startY; y < endY; y += 2) {
            for (let x = startX; x < endX; x += 2) {
                const i = (y * width + x) * 4;

                const currentBrightness = this.getBrightness(currentFrame.data[i], currentFrame.data[i + 1], currentFrame.data[i + 2]);
                const referenceBrightness = this.getBrightness(referenceFrame.data[i], referenceFrame.data[i + 1], referenceFrame.data[i + 2]);
                const diff = Math.abs(currentBrightness - referenceBrightness);

                if (diff > this.pixelDiffThreshold) {
                    if (x > midX) {
                        movimentoDestra += diff; // Raw Right
                    } else {
                        movimentoSinistra += diff; // Raw Left
                    }
                    weightedX += x * diff;
                    weightedY += y * diff;
                    totalDiff += diff;
                }
            }
        }
        
        let centerX = 0, centerY = 0;
        if (totalDiff > this.movementThreshold * 0.1) {
            centerX = (weightedX / totalDiff / width) * 100;
            centerY = (weightedY / totalDiff / height) * 100;
        }

        const totalMovement = movimentoDestra + movimentoSinistra;
        
        // Se il movimento totale è sotto la soglia (utente fermo/respiro), ritorna NONE
        if (totalMovement < this.movementThreshold) {
            return { direction: 'none', intensity: 0, center: { x: centerX, y: centerY } };
        }
        
        // LOGICA DECISIONALE SPECCHIATA
        // Utente fisico va a Destra (Avanti) -> Telecamera vede movimento a Sinistra (Raw Left) -> Video Specchio mostra a Destra
        // Quindi: Dominanza Raw Sinistra = FORWARD (SI)
        // Utente fisico va a Sinistra (Indietro) -> Telecamera vede movimento a Destra (Raw Right) -> Video Specchio mostra a Sinistra
        // Quindi: Dominanza Raw Destra = BACKWARD (NO)
        
        if (movimentoSinistra > movimentoDestra * this.dominanceRatio) {
            return { direction: 'forward', intensity: movimentoSinistra, center: { x: centerX, y: centerY } };
        } else if (movimentoDestra > movimentoSinistra * this.dominanceRatio) {
            return { direction: 'backward', intensity: movimentoDestra, center: { x: centerX, y: centerY } };
        } else {
            // Movimento ambiguo / centrale
            return { direction: 'none', intensity: totalMovement, center: { x: centerX, y: centerY } };
        }
    }
    
    private analyzeMovementTrend(): { direction: string; intensity: number } {
        if (this.movementHistory.length < this.trendThreshold) {
            return { direction: 'none', intensity: 0 };
        }

        const recentHistory = this.movementHistory.slice(-this.trendThreshold);
        const directions = recentHistory.map(m => m.direction);
        const forwardCount = directions.filter(d => d === 'forward').length;
        const backwardCount = directions.filter(d => d === 'backward').length;
        
        if (forwardCount >= this.trendThreshold) {
            return { direction: 'forward', intensity: 100 };
        }
        if (backwardCount >= this.trendThreshold) {
            return { direction: 'backward', intensity: 100 };
        }
        
        return { direction: 'none', intensity: 0 };
    }
}