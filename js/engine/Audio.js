// Procedural Web Audio Synthesizer - Zero External Assets Required
export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.masterGain = null;
        this.ambientGain = null;
        this.bikeGain = null;
        this.weatherGain = null;

        // Sound state generators
        this.chainTimer = 0;
        this.birdTimer = 0;
        this.insectTimer = 0;
        this.thunderTimer = 0;

        // Active nodes
        this.windSource = null;
        this.windFilter = null;
        this.rainSource = null;
        this.rainFilter = null;
        this.tireSource = null;
        this.tireFilter = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.2;
        this.ambientGain.connect(this.masterGain);

        this.bikeGain = this.ctx.createGain();
        this.bikeGain.gain.value = 0.35;
        this.bikeGain.connect(this.masterGain);

        this.weatherGain = this.ctx.createGain();
        this.weatherGain.gain.value = 0.0;
        this.weatherGain.connect(this.masterGain);

        this.setupContinuousNoise();
        this.enabled = true;
    }

    setupContinuousNoise() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // 1. Wind ambience
        this.windSource = this.ctx.createBufferSource();
        this.windSource.buffer = noiseBuffer;
        this.windSource.loop = true;
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.value = 240;
        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0.15;
        this.windSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.ambientGain);
        this.windSource.start();

        // 2. Tire roll noise
        this.tireSource = this.ctx.createBufferSource();
        this.tireSource.buffer = noiseBuffer;
        this.tireSource.loop = true;
        this.tireFilter = this.ctx.createBiquadFilter();
        this.tireFilter.type = 'bandpass';
        this.tireFilter.frequency.value = 180;
        this.tireGain = this.ctx.createGain();
        this.tireGain.gain.value = 0.0;
        this.tireSource.connect(this.tireFilter);
        this.tireFilter.connect(this.tireGain);
        this.tireGain.connect(this.bikeGain);
        this.tireSource.start();

        // 3. Rain noise
        this.rainSource = this.ctx.createBufferSource();
        this.rainSource.buffer = noiseBuffer;
        this.rainSource.loop = true;
        this.rainFilter = this.ctx.createBiquadFilter();
        this.rainFilter.type = 'highpass';
        this.rainFilter.frequency.value = 900;
        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.value = 0.0;
        this.rainSource.connect(this.rainFilter);
        this.rainFilter.connect(this.rainGain);
        this.rainGain.connect(this.weatherGain);
        this.rainSource.start();
    }

    resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    update(dt, speedKmh, surface, weatherName, isNight, isRiding, isBraking) {
        if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;

        const absSpeed = Math.abs(speedKmh);
        const speedNorm = Math.min(1.0, absSpeed / 40.0);

        // Modulate tire roll noise
        if (isRiding && absSpeed > 1.0) {
            let baseFreq = 200;
            let gainLevel = 0.08 + speedNorm * 0.22;

            if (surface === 'Dirt' || surface === 'Gravel') {
                baseFreq = 350 + speedNorm * 300;
                gainLevel *= 1.35;
            } else if (surface === 'Mud') {
                baseFreq = 160 + speedNorm * 120;
                gainLevel *= 1.5;
            } else if (surface === 'Water') {
                baseFreq = 420;
                gainLevel *= 1.8;
            } else if (surface === 'Sand') {
                baseFreq = 280;
                gainLevel *= 1.1;
            }

            this.tireFilter.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
            this.tireGain.gain.setTargetAtTime(gainLevel, this.ctx.currentTime, 0.1);

            // Chain clicks
            this.chainTimer += dt * (2.0 + absSpeed * 0.4);
            if (this.chainTimer > 1.0) {
                this.chainTimer = 0;
                this.playChainClick(absSpeed);
            }
        } else {
            this.tireGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.15);
        }

        // Brake squeal
        if (isBraking && absSpeed > 6.0) {
            this.playBrakeSqueal(absSpeed);
        }

        // Wind modulation based on speed
        const windFreq = 220 + speedNorm * 450;
        this.windFilter.frequency.setTargetAtTime(windFreq, this.ctx.currentTime, 0.2);

        // Rain weather audio
        const isRain = weatherName.includes('Rain') || weatherName.includes('Monsoon') || weatherName.includes('Thunderstorm');
        const rainIntensity = weatherName.includes('Monsoon') ? 0.35 : weatherName.includes('Thunderstorm') ? 0.4 : isRain ? 0.18 : 0.0;
        this.weatherGain.gain.setTargetAtTime(rainIntensity, this.ctx.currentTime, 0.5);

        // Thunderstorm lightning claps
        if (weatherName.includes('Thunderstorm')) {
            this.thunderTimer += dt;
            if (this.thunderTimer > 12.0 + Math.random() * 8.0) {
                this.thunderTimer = 0;
                this.playThunder();
            }
        }

        // Daylight birds & nighttime crickets
        if (!isRain) {
            if (!isNight) {
                this.birdTimer += dt;
                if (this.birdTimer > 5.0 + Math.random() * 6.0) {
                    this.birdTimer = 0;
                    this.playBirdChirp();
                }
            } else {
                this.insectTimer += dt;
                if (this.insectTimer > 0.8) {
                    this.insectTimer = 0;
                    this.playCricket();
                }
            }
        }
    }

    playChainClick(speed) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + speed * 4, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.025);
        osc.connect(gain);
        gain.connect(this.bikeGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }

    playBrakeSqueal(speed) {
        if (Math.random() > 0.15) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200 + Math.random() * 400, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.bikeGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playBell() {
        this.resume();
        if (!this.ctx) return;
        const freqs = [1568, 2093]; // G6, C7 twin chime
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + i * 0.08 + 0.7);
            osc.connect(gain);
            gain.connect(this.bikeGain);
            osc.start(this.ctx.currentTime + i * 0.08);
            osc.stop(this.ctx.currentTime + i * 0.08 + 0.75);
        });
    }

    playHop() {
        this.resume();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.bikeGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playBirdChirp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.16);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playCricket() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4200 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.008, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playThunder() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 2.0);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.weatherGain);
        noise.start(now);
        noise.stop(now + 2.3);
    }

    playItemUse() {
        this.resume();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playQuestComplete() {
        this.resume();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.07, this.ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(this.ctx.currentTime + idx * 0.1);
            osc.stop(this.ctx.currentTime + idx * 0.1 + 0.45);
        });
    }

    playRadioStatic() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
    }
}
