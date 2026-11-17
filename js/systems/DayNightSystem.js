// 24-Hour Astronomical Day/Night Cycle & Dynamic Celestial Lighting
export class DayNightSystem {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.time = 8.5; // Hours (0.0 to 24.0), starts at 08:30 morning
        this.timeScale = 1.0; // 1 second real-time = ~1 minute in-game (24 min day)

        this.sunLight = null;
        this.hemiLight = null;
        this.ambientLight = null;
    }

    initLights(scene) {
        const THREE = this.THREE;

        this.hemiLight = new THREE.HemisphereLight(0xddeedd, 0x334433, 0.6);
        scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 250;
        this.sunLight.shadow.camera.left = -60;
        this.sunLight.shadow.camera.right = 60;
        this.sunLight.shadow.camera.top = 60;
        this.sunLight.shadow.camera.bottom = -60;
        scene.add(this.sunLight);
    }

    advanceHours(hours) {
        this.time = (this.time + hours) % 24.0;
        this.updateLighting();
    }

    get isNight() {
        return this.time < 5.8 || this.time > 19.8;
    }

    get formattedTime() {
        const hours = Math.floor(this.time);
        const mins = Math.floor((this.time - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    update(dt) {
        // Advance time: 1 real second = 0.04 in-game hours
        this.time = (this.time + dt * 0.04 * this.timeScale) % 24.0;
        this.updateLighting();
    }

    updateLighting() {
        if (!this.sunLight || !this.hemiLight) return;

        const THREE = this.THREE;
        const playerPos = this.game.player ? this.game.player.position : new THREE.Vector3();

        // Calculate sun orbit angle (0 at midnight, PI/2 at sunrise, PI at noon, 3PI/2 at sunset)
        const sunAngle = ((this.time - 6.0) / 24.0) * Math.PI * 2;
        const sunDist = 90;

        const sunX = playerPos.x + Math.cos(sunAngle) * sunDist;
        const sunY = Math.sin(sunAngle) * sunDist;
        const sunZ = playerPos.z + 40;

        this.sunLight.position.set(sunX, Math.max(-10, sunY), sunZ);
        this.sunLight.target.position.copy(playerPos);

        const scene = this.game.renderer.scene;

        if (this.time >= 6.0 && this.time <= 18.0) {
            // DAYLIGHT
            const dayFactor = Math.sin(((this.time - 6.0) / 12.0) * Math.PI);
            this.sunLight.intensity = 1.4 * dayFactor;
            this.sunLight.color.setHex(0xfffaed);
            this.hemiLight.intensity = 0.5 + 0.3 * dayFactor;

            if (scene.fog) {
                scene.fog.color.setHex(this.game.currentCountry.fogColor || 0xa8b89d);
            }
        } else if ((this.time > 18.0 && this.time < 20.0) || (this.time > 5.0 && this.time < 6.0)) {
            // SUNSET / SUNRISE GOLDEN HOUR
            this.sunLight.intensity = 0.8;
            this.sunLight.color.setHex(0xe57e45); // Orange amber
            this.hemiLight.intensity = 0.4;
            if (scene.fog) {
                scene.fog.color.setHex(0xb57855);
            }
        } else {
            // NIGHT TIME
            this.sunLight.intensity = 0.15; // Moonlight
            this.sunLight.color.setHex(0x5678a8); // Pale moon blue
            this.hemiLight.intensity = 0.18;
            if (scene.fog) {
                scene.fog.color.setHex(0x0a1410);
            }
        }
    }
}
