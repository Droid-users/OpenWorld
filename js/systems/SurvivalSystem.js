// Survival Vitals, Metabolic Drain & Crash Physics
export class SurvivalSystem {
    constructor(game) {
        this.game = game;
    }

    update(dt, player, bicycle, weather, currentSurface) {
        const v = player.vitals;

        // Temperature adjustments based on weather and climate
        let targetTemp = this.game.currentCountry.baseTemp || 22;
        const wName = weather?.currentWeather || 'Clear';
        if (wName.includes('Monsoon') || wName.includes('Rain')) {
            targetTemp -= 6;
        } else if (wName.includes('Heat Wave')) {
            targetTemp += 10;
        }

        // Body temp seeks target ambient temp slowly
        v.temperature += (targetTemp - v.temperature) * (0.005 * dt);

        // Accelerated thirst in extreme heat (>32C)
        if (v.temperature > 32) {
            v.thirst = Math.max(0, v.thirst - 0.22 * dt);
        }

        // Stamina penalty when fatigued (>75% fatigue)
        if (v.fatigue > 75) {
            v.maxStamina = 70;
            v.stamina = Math.min(v.maxStamina, v.stamina);
        } else {
            v.maxStamina = 100;
        }

        // Crash damage check when riding at high speed into obstacles
        if (player.isRiding && Math.abs(bicycle.speedKmh) > 28.0) {
            const isColliding = this.game.worldGen.isBlocked(bicycle.position.x, bicycle.position.z, 0.9);
            if (isColliding) {
                const impactSpeed = Math.abs(bicycle.speedKmh);
                const damage = Math.floor(impactSpeed * 1.2);

                v.health = Math.max(0, v.health - damage);
                bicycle.condition = Math.max(0, bicycle.condition - damage * 0.8);
                bicycle.speed = 0;

                this.game.ui.showToast(`⚠️ High-Speed Crash! -${damage} Health!`);
                this.game.audio.playHop();
            }
        }
    }

    restAtCamp(hours = 8) {
        const v = this.game.player.vitals;
        v.fatigue = Math.max(0, v.fatigue - hours * 12);
        v.stamina = v.maxStamina;
        v.hunger = Math.max(0, v.hunger - hours * 3);
        v.thirst = Math.max(0, v.thirst - hours * 5);

        // Advance in-game time
        this.game.dayNight.advanceHours(hours);
        this.game.ui.showToast(`Rested for ${hours} hours. Energy restored.`);
    }
}
