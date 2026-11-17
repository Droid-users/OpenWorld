// Main Game Engine Bootstrap & Orchestrator
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { LOCATIONS } from './world/Locations.js';
import { AudioSystem } from './engine/Audio.js';
import { InputManager } from './engine/Input.js';
import { Renderer } from './engine/Renderer.js';
import { Bicycle } from './entities/Bicycle.js';
import { Player } from './entities/Player.js';
import { WildlifeManager } from './entities/Wildlife.js';
import { WorldGenerator } from './world/WorldGenerator.js';
import { SurvivalSystem } from './systems/SurvivalSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { WeatherSystem } from './systems/WeatherSystem.js';
import { DayNightSystem } from './systems/DayNightSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { UIManager } from './ui/UIManager.js';

class GameEngine {
    constructor() {
        this.started = false;
        this.currentCountry = LOCATIONS.india;
        this.selectedCountryId = 'india';
        this.currentSurface = 'Dirt';
        this.lastTime = performance.now();

        // Core Subsystems
        this.audio = new AudioSystem();
        this.input = new InputManager();
        this.renderer = new Renderer(THREE, document.getElementById('scene'));
        this.worldGen = new WorldGenerator(THREE, this);
        this.bicycle = new Bicycle(THREE, this);
        this.player = new Player(THREE, this);
        this.wildlife = new WildlifeManager(THREE, this);

        this.survival = new SurvivalSystem(this);
        this.inventory = new InventorySystem(this);
        this.quest = new QuestSystem(this);
        this.weather = new WeatherSystem(THREE, this);
        this.dayNight = new DayNightSystem(THREE, this);
        this.save = new SaveSystem(this);
        this.ui = new UIManager(this);

        window.game = this; // Expose for UI onclick callbacks
        this.setupEventListeners();
        this.renderMenuCountries();

        // Hide Boot Screen
        const boot = document.getElementById('boot-loader');
        if (boot) boot.classList.add('hidden');
    }

    setupEventListeners() {
        // Input events
        this.input.on('mountToggle', () => {
            if (!this.started) return;
            if (this.player.isRiding) {
                this.player.dismountBicycle(this.renderer.scene, this.bicycle);
                this.ui.showToast('Dismounted bicycle.');
            } else {
                const distToBike = Math.hypot(
                    this.player.position.x - this.bicycle.position.x,
                    this.player.position.z - this.bicycle.position.z
                );
                if (distToBike < 3.2) {
                    this.player.mountBicycle(this.bicycle);
                    this.ui.showToast('Mounted bicycle.');
                } else {
                    this.ui.showToast('Too far from bicycle to mount.');
                }
            }
        });

        this.input.on('interact', () => {
            this.ui.handleInteractKey();
        });

        this.input.on('lightToggle', () => {
            if (!this.started) return;
            const on = this.bicycle.toggleHeadlight();
            this.ui.showToast(on ? 'Bicycle Headlight ON' : 'Bicycle Headlight OFF');
        });

        this.input.on('bell', () => {
            if (!this.started) return;
            this.audio.playBell();
        });

        this.input.on('hop', () => {
            if (!this.started) return;
            if (this.player.isRiding && this.bicycle.hop()) {
                this.audio.playHop();
            }
        });

        this.input.on('gearChange', (gear) => {
            if (!this.started) return;
            if (this.bicycle.setGear(gear)) {
                this.audio.playChainClick(10);
                this.ui.showToast(`Shifted to Gear ${gear}`);
            }
        });

        this.input.on('inventoryToggle', () => {
            if (!this.started) return;
            this.ui.toggleModal('inventory');
        });

        this.input.on('mapToggle', () => {
            if (!this.started) return;
            this.ui.toggleModal('map');
        });

        this.input.on('journalToggle', () => {
            if (!this.started) return;
            this.ui.toggleModal('journal');
        });

        this.input.on('pauseToggle', () => {
            if (!this.started) return;
            if (this.ui.activeModal) {
                this.ui.closeModal();
            } else {
                this.ui.openMenu();
            }
        });
    }

    renderMenuCountries() {
        const countryContainer = document.getElementById('country-cards');
        if (!countryContainer) return;

        let html = '';
        for (const [id, c] of Object.entries(LOCATIONS)) {
            html += `
                <div class="country-card ${id === this.selectedCountryId ? 'active' : ''}" data-country="${id}">
                    <div class="country-card-header">
                        <span class="country-flag">${c.flag}</span>
                        <span>${c.name.toUpperCase()}</span>
                    </div>
                    <div class="country-tag">${c.subtitle}</div>
                </div>
            `;
        }
        countryContainer.innerHTML = html;

        document.querySelectorAll('.country-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-country');
                this.selectCountry(id);
            });
        });

        document.querySelectorAll('.map-pin').forEach(pin => {
            pin.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-country');
                this.selectCountry(id);
            });
        });

        this.updateCountryDetails();
    }

    selectCountry(id) {
        if (!LOCATIONS[id]) return;
        this.selectedCountryId = id;
        document.querySelectorAll('.country-card').forEach(c => {
            if (c.getAttribute('data-country') === id) c.classList.add('active');
            else c.classList.remove('active');
        });
        document.querySelectorAll('.map-pin').forEach(p => {
            if (p.getAttribute('data-country') === id) p.classList.add('active');
            else p.classList.remove('active');
        });
        this.updateCountryDetails();
    }

    updateCountryDetails() {
        const c = LOCATIONS[this.selectedCountryId];
        if (!c) return;

        document.getElementById('dest-title').textContent = c.name;
        document.getElementById('dest-subtitle').textContent = c.area;
        document.getElementById('dest-desc').textContent = c.description;

        document.getElementById('stat-terrain').textContent = c.terrain;
        document.getElementById('stat-danger').textContent = c.danger;
        document.getElementById('stat-resources').textContent = c.resources;
        document.getElementById('stat-climate').textContent = c.climate;
    }

    startJourney(countryId, isLoadedSave = false) {
        this.currentCountry = LOCATIONS[countryId] || LOCATIONS.india;
        this.started = true;
        this.audio.init();

        // 1. Build 3D World for selected country
        this.renderer.scene.clear();
        this.dayNight.initLights(this.renderer.scene);
        this.weather.setupParticles();

        const worldGroup = this.worldGen.generate(this.currentCountry);
        this.renderer.scene.add(worldGroup);

        // 2. Setup Bicycle and Player
        this.bicycle.position.set(0, this.worldGen.getHeight(0, 0), 0);
        this.bicycle.rotation = 0;
        this.bicycle.speed = 0;
        this.renderer.scene.add(this.bicycle.mesh);

        this.player.mountBicycle(this.bicycle);

        // 3. Spawn Wildlife
        this.wildlife.spawnAnimalsForCountry(this.currentCountry, (x, z) => this.worldGen.getHeight(x, z));
        this.renderer.scene.add(this.wildlife.group);

        // 4. Setup Quest & Lore
        this.quest.loadQuestForCountry(this.currentCountry);
        if (this.currentCountry.documents) {
            this.currentCountry.documents.forEach(doc => this.quest.collectDocument(doc));
        }

        // 5. Initial Weather
        this.weather.setWeather(this.currentCountry.weatherTypes[0] || 'Clear');

        // 6. Apply Saved Game if continuing
        if (isLoadedSave) {
            const data = this.save.load();
            if (data) this.save.applySaveData(data);
        }

        // Close Menu, Show HUD
        this.ui.closeMenu();
        this.ui.updateQuestHUD();
        this.ui.showToast(`Arrived in ${this.currentCountry.name}. Safe travels.`);

        // Request Pointer Lock on Canvas
        this.input.requestPointerLock(this.renderer.webgl.domElement);

        // Start Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    tuneBike(type) {
        const b = this.bicycle;
        const inv = this.inventory;

        if (type === 'repair') {
            if (inv.has('scrap', 2)) {
                inv.remove('scrap', 2);
                b.repair(35);
                this.audio.playItemUse();
                this.ui.showToast('Repaired bicycle condition +35%');
            } else {
                this.ui.showToast('Need at least 2x Scrap Metal.');
            }
        } else if (type === 'frame' && b.upgrades.frame < 3) {
            if (inv.has('scrap', 4)) {
                inv.remove('scrap', 4);
                b.upgrades.frame++;
                this.audio.playItemUse();
                this.ui.showToast('Frame Upgraded! Durability & protection increased.');
            } else this.ui.showToast('Need 4x Scrap Metal.');
        } else if (type === 'tires' && b.upgrades.tires < 3) {
            if (inv.has('scrap', 3)) {
                inv.remove('scrap', 3);
                b.upgrades.tires++;
                this.audio.playItemUse();
                this.ui.showToast('All-Terrain Tires Installed!');
            } else this.ui.showToast('Need 3x Scrap Metal.');
        } else if (type === 'brakes' && b.upgrades.brakes < 2) {
            if (inv.has('scrap', 4)) {
                inv.remove('scrap', 4);
                b.upgrades.brakes++;
                this.audio.playItemUse();
                this.ui.showToast('Hydraulic Disc Brakes Installed!');
            } else this.ui.showToast('Need 4x Scrap Metal.');
        } else if (type === 'storage' && b.upgrades.storage < 3) {
            if (inv.has('scrap', 5)) {
                inv.remove('scrap', 5);
                b.upgrades.storage++;
                this.audio.playItemUse();
                this.ui.showToast('Expedition Panniers Installed! Carry capacity +8kg.');
            } else this.ui.showToast('Need 5x Scrap Metal.');
        }

        this.ui.renderWorkshop();
    }

    loop(now) {
        const dt = Math.min(0.1, (now - this.lastTime) / 1000);
        this.lastTime = now;

        if (this.started) {
            // Determine terrain surface
            const activePos = this.player.isRiding ? this.bicycle.position : this.player.position;
            this.currentSurface = this.worldGen.getSurface(
                activePos.x,
                activePos.z,
                this.weather.currentWeather
            );

            // Update Systems
            const heightFn = (x, z) => this.worldGen.getHeight(x, z);

            if (this.player.isRiding) {
                this.bicycle.update(dt, this.input, heightFn, this.currentSurface, this.player.vitals.stamina);
                this.player.update(dt, this.input, this.bicycle, heightFn, this.currentSurface);
            } else {
                this.player.update(dt, this.input, this.bicycle, heightFn, this.currentSurface);
            }

            // Wildlife AI
            this.wildlife.update(dt, activePos, this.bicycle.speedKmh, heightFn);

            // Survival, DayNight, Weather
            this.survival.update(dt, this.player, this.bicycle, this.weather, this.currentSurface);
            this.dayNight.update(dt);
            this.weather.update(dt, activePos);

            // Audio synthesis
            this.audio.update(
                dt,
                this.bicycle.speedKmh,
                this.currentSurface,
                this.weather.currentWeather,
                this.dayNight.isNight,
                this.player.isRiding,
                this.input.brake
            );

            // Camera follow
            const mouseDelta = this.input.consumeMouseDelta();
            this.renderer.updateCamera(
                dt,
                activePos,
                this.player.isRiding ? this.bicycle.rotation : this.player.rotation,
                mouseDelta,
                this.player.isRiding
            );

            // HUD
            this.ui.updateHUD();

            // Render 3D frame
            this.renderer.render();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new GameEngine();
});
