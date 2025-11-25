export class MotionDetectionService {
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isDetecting = false;
    private referenceFrame: ImageData | null = null; 
    private animationFrameId: number | null = null;

    // ⬇️ PARAMETRI DI TOLLERANZA CALIBRATI
    // Aumentato per ignorare piccoli movimenti (respiro, vestiti)
    private movementThreshold = 1500; 
    // Differenza di colore minima per considerare un pixel "cambiato" (ignora ombre leggere)
    private pixelDiffThreshold = 20; 
    // Area di interesse (ROI) - Focus sul busto centrale
    private detectionArea = { x: 0.25, y: 0.2, width: 0.5, height: 0.6 }; 

    // ⬇️ ZONA MORTA CENTRALE (Tolleranza oscillazione)
    // Il baricentro del movimento deve spostarsi di almeno il 10% dal centro per essere valido
    private deadZonePercent = 0.10; 

    // Filtro temporale (Debounce)
    private movementHistory: { direction: string; intensity: number }[] = [];
    private readonly historyLength = 6; 
    private readonly trendThreshold = 4; // Richiede coerenza per 4 frame su 6

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
        
        console.log("✅ Frame di riferimento impostato - utente fermo (Neutro)");
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

        // Disegna frame attuale
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Analisi
        const analysisResult = this.analyzeOscillationFromReference(currentFrame, this.referenceFrame);
        
        // Dispatch raw level for UI Gauge (feedback visivo)
        // Se siamo nella zona morta, l'intensità visiva c'è ma la direzione è 'none'
        window.dispatchEvent(new CustomEvent('movementLevel', {
            detail: {
                intensity: analysisResult.rawIntensity,
                direction: analysisResult.direction
            }
        }));
        
        // Aggiungi alla storia solo se c'è un movimento significativo fuori dalla zona morta
        if (analysisResult.direction !== 'none') {
             this.movementHistory.push({ direction: analysisResult.direction, intensity: analysisResult.rawIntensity });
        } else {
             // Se siamo tornati neutri, pushiamo 'none' per rompere la catena di rilevamento precedente
             this.movementHistory.push({ direction: 'none', intensity: 0 });
        }

        if (this.movementHistory.length > this.historyLength) {
            this.movementHistory.shift();
        }

        // Tracking centro movimento (per pallino blu UI)
        if (analysisResult.center.x !== 0) {
            window.dispatchEvent(new CustomEvent('movementCenterUpdate', {
                detail: { center: analysisResult.center }
            }));
        }
        
        // Analisi del Trend (conferma decisione)
        const trendMovement = this.analyzeMovementTrend();
        if (trendMovement.direction !== 'none') {
            window.dispatchEvent(new CustomEvent('movementDetected', {
                detail: { direction: trendMovement.direction, intensity: trendMovement.intensity }
            }));
            
            // Reset soft: svuota la storia per evitare rilevamenti doppi immediati, 
            // ma NON resettare il frame di riferimento (perché l'utente potrebbe essere ancora sbilanciato)
            this.movementHistory = []; 
        }

        this.animationFrameId = requestAnimationFrame(this.detectMovement);
    }

    private analyzeOscillationFromReference(currentFrame: ImageData, referenceFrame: ImageData): 
    { direction: string; rawIntensity: number; center: {x: number, y: number} } {
        
        let weightedX = 0;
        let weightedY = 0;
        let totalDiff = 0;

        const width = currentFrame.width;
        const height = currentFrame.height;
        
        // Analizziamo solo la ROI (Region of Interest) centrale
        const startX = Math.floor(width * this.detectionArea.x);
        const startY = Math.floor(height * this.detectionArea.y);
        const endX = startX + Math.floor(width * this.detectionArea.width);
        const endY = startY + Math.floor(height * this.detectionArea.height);
        
        // Scansione pixel con passo 4 (ottimizzazione performance)
        for (let y = startY; y < endY; y += 4) {
            for (let x = startX; x < endX; x += 4) {
                const i = (y * width + x) * 4;

                // Calcolo luminosità (Grayscale)
                const currLum = 0.299 * currentFrame.data[i] + 0.587 * currentFrame.data[i + 1] + 0.114 * currentFrame.data[i + 2];
                const refLum = 0.299 * referenceFrame.data[i] + 0.587 * referenceFrame.data[i + 1] + 0.114 * referenceFrame.data[i + 2];
                
                const diff = Math.abs(currLum - refLum);

                if (diff > this.pixelDiffThreshold) {
                    weightedX += x * diff;
                    weightedY += y * diff;
                    totalDiff += diff;
                }
            }
        }
        
        let centerXPercent = 50; // Default centro
        let centerYPercent = 50;

        if (totalDiff > this.movementThreshold) {
            // Calcolo Baricentro del Movimento
            const avgX = weightedX / totalDiff;
            const avgY = weightedY / totalDiff;
            
            // Normalizza in percentuale rispetto alla ROI
            centerXPercent = ((avgX - startX) / (endX - startX)) * 100; // 0% sinistra ROI, 100% destra ROI
            
            // Coordinate globali schermo per UI (pallino blu)
            const globalCenterX = (avgX / width) * 100;
            const globalCenterY = (avgY / height) * 100;

            // Logica Direzionale con ZONA MORTA
            // Il centro della ROI è 50%.
            // Deadzone: da (50 - deadZone) a (50 + deadZone)
            const deadZoneLow = 50 - (this.deadZonePercent * 100);
            const deadZoneHigh = 50 + (this.deadZonePercent * 100);

            let direction = 'none';

            // REVERT: Inversione logica su richiesta utente.
            // Prima: Sinistra(<Low) = Forward, Destra(>High) = Backward.
            // Ora: Sinistra(<Low) = Backward, Destra(>High) = Forward.
            
            if (centerXPercent < deadZoneLow) {
                 // Baricentro spostato a Sinistra nel frame (specchiato) -> Interpretato come Indietro/NO
                 direction = 'backward'; 
            } else if (centerXPercent > deadZoneHigh) {
                 // Baricentro spostato a Destra nel frame (specchiato) -> Interpretato come Avanti/SI
                 direction = 'forward';
            }

            return { 
                direction: direction, 
                rawIntensity: totalDiff, 
                center: { x: globalCenterX, y: globalCenterY } 
            };
        }

        // Sotto soglia movimento
        return { direction: 'none', rawIntensity: 0, center: { x: 0, y: 0 } };
    }
    
    private analyzeMovementTrend(): { direction: string; intensity: number } {
        if (this.movementHistory.length < this.trendThreshold) {
            return { direction: 'none', intensity: 0 };
        }

        const recentHistory = this.movementHistory.slice(-this.trendThreshold);
        const directions = recentHistory.map(m => m.direction);
        
        const forwardCount = directions.filter(d => d === 'forward').length;
        const backwardCount = directions.filter(d => d === 'backward').length;
        
        // Richiedi una maggioranza qualificata per confermare
        if (forwardCount >= this.trendThreshold) {
            return { direction: 'forward', intensity: 100 };
        }
        if (backwardCount >= this.trendThreshold) {
            return { direction: 'backward', intensity: 100 };
        }
        
        return { direction: 'none', intensity: 0 };
    }
}