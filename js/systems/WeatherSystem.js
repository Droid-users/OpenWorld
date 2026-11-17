// Dynamic Weather Engine & 3D Atmospheric Particle Systems
export class WeatherSystem {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.currentWeather = 'Clear';
        this.timer = 0;
        this.weatherDuration = 180; // seconds before shifting weather

        // Particle System for Rain & Dust
        this.particles = null;
        this.particleCount = 1800;
        this.particleGroup = new THREE.Group();
        this.setupParticles();
    }

    setupParticles() {
        const THREE = this.THREE;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xbed0d4,
            size: 0.35,
            transparent: true,
            opacity: 0.0
        });

        this.particles = new THREE.Points(geom, mat);
        this.particleGroup.add(this.particles);
        this.game.renderer.scene.add(this.particleGroup);
    }

    setWeather(weatherName) {
        this.currentWeather = weatherName;
        this.timer = 0;

        // Adjust renderer fog and scene lighting
        const renderer = this.game.renderer;
        if (!renderer || !renderer.scene) return;

        if (weatherName.includes('Fog')) {
            renderer.scene.fog.density = 0.016;
            this.particles.material.opacity = 0.0;
        } else if (weatherName.includes('Monsoon') || weatherName.includes('Rain') || weatherName.includes('Thunderstorm')) {
            renderer.scene.fog.density = 0.009;
            this.particles.material.color.setHex(0xbed0d4);
            this.particles.material.opacity = weatherName.includes('Monsoon') ? 0.8 : 0.5;
        } else if (weatherName.includes('Dust')) {
            renderer.scene.fog.density = 0.014;
            renderer.scene.fog.color.setHex(0xc2b38e);
            this.particles.material.color.setHex(0xb59b6b);
            this.particles.material.opacity = 0.65;
        } else {
            // Clear / Cloudy
            renderer.scene.fog.density = 0.004;
            this.particles.material.opacity = 0.0;
        }

        this.game.ui.showToast(`🌦 Weather changed to ${weatherName}`);
    }

    update(dt, playerPos) {
        this.timer += dt;

        // Shift weather periodically
        if (this.timer > this.weatherDuration) {
            const types = this.game.currentCountry.weatherTypes || ['Clear', 'Rain', 'Fog'];
            const next = types[Math.floor(Math.random() * types.length)];
            this.setWeather(next);
        }

        // Center particle group around player
        this.particleGroup.position.set(playerPos.x, 0, playerPos.z);

        // Animate particles falling or blowing
        if (this.particles.material.opacity > 0) {
            const pos = this.particles.geometry.attributes.position;
            const isRain = this.currentWeather.includes('Rain') || this.currentWeather.includes('Monsoon') || this.currentWeather.includes('Thunderstorm');

            for (let i = 0; i < this.particleCount; i++) {
                let y = pos.getY(i);
                let x = pos.getX(i);

                if (isRain) {
                    y -= dt * 38.0; // Fast falling rain
                    x += dt * 4.0;  // Wind drift
                } else {
                    // Dust Storm swirling
                    y -= dt * 4.0;
                    x += dt * 18.0;
                }

                if (y < 0) y = 40;
                if (x > 60) x = -60;

                pos.setY(i, y);
                pos.setX(i, x);
            }
            pos.needsUpdate = true;
        }
    }
}
