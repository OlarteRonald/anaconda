const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Ooea5089a/";

const AIManager = {
    model: null,
    webcam: null,
    labelContainer: null,
    maxPredictions: 0,
    currentGesture: 'Neutral',
    confidence: 0,
    onGestureDetected: null,
    isRunning: false,

    async init() {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";

        try {
            this.model = await tmImage.load(modelURL, metadataURL);
            this.maxPredictions = this.model.getTotalClasses();
            
            // Setup webcam
            const flip = true; 
            const width = 300;
            const height = 300;
            this.webcam = new tmImage.Webcam(width, height, flip);
            await this.webcam.setup(); 
            await this.webcam.play();
            
            this.isRunning = true;
            this.loop();
            
            const webcamElement = this.webcam.canvas;
            webcamElement.style.width = "100%";
            webcamElement.style.height = "100%";
            webcamElement.style.objectFit = "cover";
            document.getElementById('camera-preview').parentNode.replaceChild(webcamElement, document.getElementById('camera-preview'));
            webcamElement.id = 'camera-preview';

            document.getElementById('camera-loading').style.display = 'none';

        } catch (error) {
            console.error("AI Model Init Error:", error);
            alert("Error al cargar la cámara o el modelo IA.");
        }
    },

    async loop() {
        if (!this.isRunning) return;
        this.webcam.update(); 
        await this.predict();
        window.requestAnimationFrame(() => this.loop());
    },

    async predict() {
        if (!this.model) return;
        const prediction = await this.model.predict(this.webcam.canvas);
        
        let bestPrediction = null;
        let maxProb = 0;

        for (let i = 0; i < this.maxPredictions; i++) {
            if (prediction[i].probability > maxProb) {
                maxProb = prediction[i].probability;
                bestPrediction = prediction[i];
            }
        }

        if (bestPrediction && maxProb > 0.70) { // Lower threshold for better sensitivity
            const label = bestPrediction.className;
            console.log("AI Detected:", label, Math.round(maxProb * 100), "%");
            
            this.updateGestureStatus(label, maxProb);
            
            if (this.onGestureDetected) {
                this.onGestureDetected(label);
            }
        } else {
             this.updateGestureStatus('Neutral', maxProb);
        }
    },

    updateGestureStatus(label, prob) {
        this.currentGesture = label;
        this.confidence = prob;
        const labelEl = document.getElementById('detected-gesture');
        const barEl = document.getElementById('confidence-bar');
        
        if (labelEl) labelEl.innerText = this.translateGesture(label);
        if (barEl) barEl.style.width = `${prob * 100}%`;
    },

    translateGesture(label) {
        const gestures = {
            'arriba': '👍 Pulgar Arriba',
            'derecha': '👉 Pulgar Derecha',
            'abajo': '👎 Pulgar Abajo',
            'izquierda': '👈 Pulgar Izquierda',
            'spoon_up': '👍 Pulgar Arriba', // Compatibility
            'Neutral': 'Esperando...',
            'none': 'Esperando...'
        };
        return gestures[label] || `Gesto: ${label}`;
    },

    stop() {
        this.isRunning = false;
        if (this.webcam) this.webcam.stop();
    }
};
