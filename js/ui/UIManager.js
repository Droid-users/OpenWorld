// UI Manager - Modern Minimalist HUD, Modals, Topographic Map & Dialogue
import { ALL_ITEMS } from '../world/Locations.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.activeModal = null;
        this.toastTimer = null;
        this.customWaypoint = null;

        this.setupDOM();
        this.setupEventListeners();
    }

    setupDOM() {
        // Cache HUD elements
        this.el = {
            hud: document.getElementById('hud'),
            healthFill: document.getElementById('meter-health'),
            healthVal: document.getElementById('health-val'),
            staminaFill: document.getElementById('meter-stamina'),
            staminaVal: document.getElementById('stamina-val'),
            waterFill: document.getElementById('meter-water'),
            waterVal: document.getElementById('water-val'),
            foodFill: document.getElementById('meter-food'),
            foodVal: document.getElementById('food-val'),
            fatigueVal: document.getElementById('fatigue-val'),
            clock: document.getElementById('hud-clock'),
            weather: document.getElementById('hud-weather'),
            region: document.getElementById('hud-region'),
            compass: document.getElementById('compass-tape'),
            navDist: document.getElementById('destination-hud'),
            speed: document.getElementById('speed-val'),
            bikeCondition: document.getElementById('bike-condition-val'),
            surface: document.getElementById('surface-val'),
            travelMode: document.getElementById('travel-mode-val'),
            gearPills: document.querySelectorAll('.gear-pill'),
            questTitle: document.getElementById('hud-quest-title'),
            questDesc: document.getElementById('hud-quest-desc'),
            prompt: document.getElementById('hud-prompt'),
            promptText: document.getElementById('prompt-text'),
            toast: document.getElementById('toast'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            menu: document.getElementById('menu')
        };
    }

    setupEventListeners() {
        // Menu Buttons
        document.getElementById('btn-continue')?.addEventListener('click', () => {
            if (this.game.save.hasSave()) {
                const data = this.game.save.load();
                this.game.startJourney(data.countryId, true);
            } else {
                this.showToast('No saved journey found.');
            }
        });

        document.getElementById('btn-begin-journey')?.addEventListener('click', () => {
            const selectedId = this.game.selectedCountryId || 'india';
            this.game.startJourney(selectedId);
        });

        // HUD Quick Action Buttons
        document.querySelectorAll('[data-ui]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-ui');
                if (action === 'map') this.toggleModal('map');
                if (action === 'inventory') this.toggleModal('inventory');
                if (action === 'workshop') this.toggleModal('workshop');
                if (action === 'journal') this.toggleModal('journal');
                if (action === 'save') this.game.save.save(true);
                if (action === 'menu') this.openMenu();
            });
        });

        // Modal Close Button
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });
    }

    showToast(msg) {
        if (!this.el.toast) return;
        this.el.toast.textContent = msg;
        this.el.toast.classList.remove('hidden');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.el.toast.classList.add('hidden');
        }, 3200);
    }

    updateHUD() {
        if (!this.game.started) return;

        const p = this.game.player;
        const b = this.game.bicycle;
        const dn = this.game.dayNight;
        const w = this.game.weather;

        // Vitals
        const v = p.vitals;
        this.el.healthFill.style.width = `${v.health}%`;
        this.el.healthVal.textContent = Math.round(v.health);
        this.el.staminaFill.style.width = `${(v.stamina / v.maxStamina) * 100}%`;
        this.el.staminaVal.textContent = Math.round(v.stamina);
        this.el.waterFill.style.width = `${v.thirst}%`;
        this.el.waterVal.textContent = Math.round(v.thirst);
        this.el.foodFill.style.width = `${v.hunger}%`;
        this.el.foodVal.textContent = Math.round(v.hunger);
        this.el.fatigueVal.textContent = `${Math.round(v.fatigue)}%`;

        // Environment
        this.el.clock.textContent = dn.formattedTime;
        this.el.weather.textContent = `${w.currentWeather} · ${Math.round(v.temperature)}°C`;
        this.el.region.textContent = this.game.currentCountry.area || 'THE WASTELAND';

        // Compass Heading
        const headingDeg = ((-p.rotation * 180 / Math.PI) + 360) % 360;
        const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const cardinalIndex = Math.round(headingDeg / 45) % 8;
        this.el.compass.textContent = `· ${cardinals[cardinalIndex]} · ${Math.round(headingDeg)}°`;

        // Telemetry
        const displaySpeed = p.isRiding ? Math.round(Math.abs(b.speedKmh)) : Math.round(p.speed * 3.6);
        this.el.speed.innerHTML = `${displaySpeed} <small>KM/H</small>`;
        this.el.bikeCondition.textContent = `BIKE INTEGRITY: ${Math.round(b.condition)}%`;
        this.el.surface.textContent = `SURFACE: ${this.game.currentSurface.toUpperCase()}`;
        this.el.travelMode.textContent = p.isRiding ? 'RIDING BICYCLE' : 'ON FOOT';

        // Gears
        this.el.gearPills.forEach(pill => {
            const gear = parseInt(pill.getAttribute('data-gear'), 10);
            if (gear === b.currentGear) pill.classList.add('active');
            else pill.classList.remove('active');
        });

        // Destination Distance
        const targetPoi = this.customWaypoint || (this.game.quest.activeQuest ? this.getPoi(this.game.quest.activeQuest.targetPoi) : null);
        if (targetPoi) {
            const dist = Math.hypot(p.position.x - targetPoi.x, p.position.z - targetPoi.z);
            const distKm = (dist / 100).toFixed(1);
            this.el.navDist.textContent = `TARGET: ${targetPoi.name || 'WAYPOINT'} · ${distKm} KM`;
        } else {
            this.el.navDist.textContent = 'EXPLORING UNCHARTED TERRITORY';
        }

        // Interaction Proximity Checks
        this.checkInteractions();
    }

    getPoi(id) {
        return this.game.worldGen.pois.find(p => p.id === id);
    }

    checkInteractions() {
        const p = this.game.player.position;

        // 1. NPC Interaction (within 3.5m)
        const npcDist = Math.hypot(p.x - 1.6, p.z - (-1.8));
        if (npcDist < 3.5) {
            this.showPrompt(`Talk to ${this.game.currentCountry.npc.name}`);
            this.currentInteraction = { type: 'npc' };
            return;
        }

        // 2. Workbench Interaction (within 3.0m of (3.5, 1.5))
        const benchDist = Math.hypot(p.x - 3.5, p.z - 1.5);
        if (benchDist < 3.0) {
            this.showPrompt('Open Bicycle Workshop');
            this.currentInteraction = { type: 'workshop' };
            return;
        }

        // 3. Resting Cot (within 3.0m of (-3.8, -2.5))
        const tentDist = Math.hypot(p.x - (-3.8), p.z - (-2.5));
        if (tentDist < 3.0) {
            this.showPrompt('Rest at Camp Cot (8h)');
            this.currentInteraction = { type: 'rest' };
            return;
        }

        // 4. Loot Caches (within 2.8m)
        const cache = this.game.worldGen.caches.find(c => Math.hypot(p.x - c.x, p.z - c.z) < 2.8);
        if (cache) {
            this.showPrompt(`Search ${cache.name}`);
            this.currentInteraction = { type: 'cache', cache };
            return;
        }

        this.hidePrompt();
        this.currentInteraction = null;
    }

    showPrompt(text) {
        this.el.promptText.textContent = text;
        this.el.prompt.classList.remove('hidden');
    }

    hidePrompt() {
        this.el.prompt.classList.add('hidden');
    }

    handleInteractKey() {
        if (!this.currentInteraction) return;

        if (this.currentInteraction.type === 'npc') {
            this.openDialogue();
        } else if (this.currentInteraction.type === 'workshop') {
            this.toggleModal('workshop');
        } else if (this.currentInteraction.type === 'rest') {
            this.game.survival.restAtCamp(8);
        } else if (this.currentInteraction.type === 'cache') {
            this.lootCache(this.currentInteraction.cache);
        }
    }

    lootCache(cache) {
        let lootedAny = false;
        for (const [item, count] of Object.entries(cache.loot)) {
            if (count > 0 && this.game.inventory.add(item, count)) {
                lootedAny = true;
                delete cache.loot[item];
            }
        }

        if (lootedAny) {
            this.game.audio.playItemUse();
            this.showToast(`Collected supplies from ${cache.name}!`);

            // Check quest objectives
            if (this.game.quest.activeQuest && this.game.quest.activeQuest.targetItem) {
                const questItem = this.game.quest.activeQuest.targetItem;
                if (this.game.inventory.has(questItem)) {
                    this.game.quest.advanceStage();
                }
            }
        }
    }

    updateQuestHUD() {
        if (this.game.quest.activeQuest) {
            this.el.questTitle.textContent = this.game.quest.activeQuest.title;
            this.el.questDesc.textContent = this.game.quest.currentObjective;
        } else {
            this.el.questTitle.textContent = 'FREE EXPLORATION';
            this.el.questDesc.textContent = 'Search ruined infrastructure and uncover what happened to the old world.';
        }
    }

    toggleModal(type) {
        if (this.activeModal === type) {
            this.closeModal();
            return;
        }
        this.openModal(type);
    }

    openModal(type) {
        this.activeModal = type;
        this.el.modalOverlay.classList.remove('hidden');
        this.game.input.exitPointerLock();

        if (type === 'inventory') this.renderInventory();
        if (type === 'workshop') this.renderWorkshop();
        if (type === 'map') this.renderMap();
        if (type === 'journal') this.renderJournal();
    }

    closeModal() {
        this.activeModal = null;
        this.el.modalOverlay.classList.add('hidden');
    }

    openMenu() {
        this.closeModal();
        this.el.hud.classList.add('hidden');
        this.el.menu.classList.remove('hidden');
        this.game.input.exitPointerLock();
    }

    closeMenu() {
        this.el.menu.classList.add('hidden');
        this.el.hud.classList.remove('hidden');
    }

    renderInventory() {
        this.el.modalTitle.textContent = `BACKPACK (${this.game.inventory.currentWeight} / ${this.game.inventory.maxWeight} KG)`;
        const items = this.game.inventory.items;

        let html = `
            <div class="inventory-grid">
        `;

        for (const [id, count] of Object.entries(items)) {
            const def = ALL_ITEMS[id];
            if (!def || count <= 0) continue;

            html += `
                <div class="inventory-slot">
                    <div class="slot-icon">${def.icon}</div>
                    <div class="slot-name">${def.name}</div>
                    <div class="slot-qty">×${count} (${(def.weight * count).toFixed(1)} kg)</div>
                    <div class="slot-actions">
                        ${['food', 'water', 'medical', 'tool'].includes(def.type) ? `<button class="primary" style="padding:4px 8px;font-size:10px;" onclick="window.game.inventory.use('${id}')">USE</button>` : ''}
                    </div>
                </div>
            `;
        }

        html += `
            </div>
            <div style="margin-top:24px;border-top:1px solid var(--panel-border);padding-top:16px;">
                <h3 style="margin-bottom:10px;">FIELD CRAFTING</h3>
                <div style="display:flex;gap:10px;">
                    <button class="secondary" onclick="window.game.inventory.craft('kit')">
                        Craft Bike Repair Kit (3x Scrap + 1x Battery)
                    </button>
                </div>
            </div>
        `;

        this.el.modalBody.innerHTML = html;
    }

    renderWorkshop() {
        this.el.modalTitle.textContent = 'BICYCLE WORKBENCH & TUNING';
        const b = this.game.bicycle;
        const scrapCount = this.game.inventory.items['scrap'] || 0;

        const html = `
            <div style="margin-bottom:16px;background:rgba(255,255,255,0.03);padding:12px;border:1px solid var(--panel-border);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong>BICYCLE CONDITION: ${Math.round(b.condition)}%</strong>
                    <div style="font-size:11px;color:var(--paper-muted);">Available Scrap Metal: ${scrapCount} units</div>
                </div>
                <button class="primary" onclick="window.game.tuneBike('repair')">FIELD REPAIR (2x Scrap)</button>
            </div>
            <div class="workshop-grid">
                <div class="upgrade-card">
                    <div class="upgrade-card-title"><span>FRAME UPGRADE</span><span class="upgrade-level">TIER ${b.upgrades.frame}/3</span></div>
                    <div class="upgrade-desc">Reinforced alloy structure. Decreases crash damage and increases durability.</div>
                    <div class="upgrade-cost">Cost: 4x Scrap Metal</div>
                    <button class="secondary" onclick="window.game.tuneBike('frame')" ${b.upgrades.frame >= 3 ? 'disabled' : ''}>UPGRADE FRAME</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-card-title"><span>ALL-TERRAIN TIRES</span><span class="upgrade-level">TIER ${b.upgrades.tires}/3</span></div>
                    <div class="upgrade-desc">Improves traction on loose dirt, mud, and sand trails.</div>
                    <div class="upgrade-cost">Cost: 3x Scrap Metal</div>
                    <button class="secondary" onclick="window.game.tuneBike('tires')" ${b.upgrades.tires >= 3 ? 'disabled' : ''}>UPGRADE TIRES</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-card-title"><span>HYDRAULIC BRAKES</span><span class="upgrade-level">TIER ${b.upgrades.brakes}/2</span></div>
                    <div class="upgrade-desc">Increases braking force by 60% on steep mountain descents.</div>
                    <div class="upgrade-cost">Cost: 4x Scrap Metal</div>
                    <button class="secondary" onclick="window.game.tuneBike('brakes')" ${b.upgrades.brakes >= 2 ? 'disabled' : ''}>UPGRADE BRAKES</button>
                </div>
                <div class="upgrade-card">
                    <div class="upgrade-card-title"><span>EXPEDITION PANNIERS</span><span class="upgrade-level">TIER ${b.upgrades.storage}/3</span></div>
                    <div class="upgrade-desc">Expands backpack carry capacity by +8 kg per tier.</div>
                    <div class="upgrade-cost">Cost: 5x Scrap Metal</div>
                    <button class="secondary" onclick="window.game.tuneBike('storage')" ${b.upgrades.storage >= 3 ? 'disabled' : ''}>INSTALL PANNIERS</button>
                </div>
            </div>
        `;

        this.el.modalBody.innerHTML = html;
    }

    renderMap() {
        this.el.modalTitle.textContent = `TOPOGRAPHIC MAP · ${this.game.currentCountry.name.toUpperCase()}`;
        this.el.modalBody.innerHTML = `
            <canvas id="map-canvas" width="800" height="480"></canvas>
            <div class="map-legend">
                <div class="legend-item"><span style="color:#bdd09a">▲</span> Player</div>
                <div class="legend-item"><span style="color:#e5b367">🏕</span> Survivor Camp</div>
                <div class="legend-item"><span style="color:#78a8d1">💧</span> Water Source</div>
                <div class="legend-item"><span style="color:#dd7163">📡</span> Relay Tower</div>
                <div class="legend-item"><span style="color:#ffffff">⭐</span> Waypoint (Click Map to Place)</div>
            </div>
        `;

        const canvas = document.getElementById('map-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Draw Map
        const scale = 480 / 600; // 600m world to 480px
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Background
        ctx.fillStyle = '#0f1814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(189, 208, 154, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Draw Roads
        ctx.strokeStyle = '#4a544f';
        ctx.lineWidth = 6;
        this.game.worldGen.roads.forEach(r => {
            ctx.beginPath();
            if (r.axis === 'z') {
                ctx.moveTo(cx + r.x * scale, cy - (r.l / 2) * scale);
                ctx.lineTo(cx + r.x * scale, cy + (r.l / 2) * scale);
            } else {
                ctx.moveTo(cx - (r.l / 2) * scale, cy + r.z * scale);
                ctx.lineTo(cx + (r.l / 2) * scale, cy + r.z * scale);
            }
            ctx.stroke();
        });

        // Draw POIs
        this.game.worldGen.pois.forEach(poi => {
            const px = cx + poi.x * scale;
            const py = cy + poi.z * scale;
            ctx.fillStyle = poi.type === 'camp' ? '#e5b367' : poi.type === 'tower' ? '#dd7163' : poi.type === 'water' ? '#78a8d1' : '#a4ad9d';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px Inter';
            ctx.fillText(poi.name, px + 8, py + 3);
        });

        // Draw Custom Waypoint
        if (this.customWaypoint) {
            const wx = cx + this.customWaypoint.x * scale;
            const wy = cy + this.customWaypoint.z * scale;
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText('⭐', wx - 6, wy + 5);
        }

        // Draw Player Arrow
        const p = this.game.player;
        const ppx = cx + p.position.x * scale;
        const ppy = cy + p.position.z * scale;

        ctx.save();
        ctx.translate(ppx, ppy);
        ctx.rotate(-p.rotation);
        ctx.fillStyle = '#bdd09a';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Click to place waypoint
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const worldX = (clickX - cx) / scale;
            const worldZ = (clickY - cy) / scale;

            this.customWaypoint = { x: worldX, z: worldZ, name: 'Custom Waypoint' };
            this.showToast('Waypoint set on topographic map.');
            this.renderMap();
        };
    }

    renderJournal() {
        this.el.modalTitle.textContent = 'EXPEDITION JOURNAL & DISCOVERED LORE';
        const docs = this.game.quest.collectedDocuments;

        let html = `
            <div style="margin-bottom:20px;">
                <h3>ACTIVE EXPEDITION</h3>
                <p><strong>${this.game.quest.activeQuest ? this.game.quest.activeQuest.title : 'Free Exploration'}</strong></p>
                <p>${this.game.quest.currentObjective}</p>
            </div>
            <hr style="border:0;border-top:1px solid var(--panel-border);margin:16px 0;">
            <h3>DISCOVERED ARCHIVES & RECORDINGS (${docs.length})</h3>
        `;

        if (docs.length === 0) {
            html += '<p style="font-style:italic;">No documents found yet. Search ruined desks, radios, and government facilities.</p>';
        } else {
            docs.forEach(doc => {
                html += `
                    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--panel-border);padding:14px;margin-bottom:10px;">
                        <div style="font-weight:700;color:var(--green-accent);margin-bottom:4px;">${doc.title}</div>
                        <div style="font-size:12px;line-height:1.6;color:var(--paper);">${doc.text}</div>
                    </div>
                `;
            });
        }

        this.el.modalBody.innerHTML = html;
    }

    openDialogue() {
        const npc = this.game.currentCountry.npc;
        this.el.modalTitle.textContent = `${npc.name.toUpperCase()} · ${npc.title.toUpperCase()}`;

        const q = this.game.quest.activeQuest;
        let dialogueText = npc.dialogue.intro;
        if (q && this.game.quest.currentStageIndex === 0) dialogueText = npc.dialogue.questPrompt;
        if (q && this.game.quest.currentStageIndex > 0 && this.game.quest.currentStageIndex < q.stages.length) dialogueText = npc.dialogue.questActive;

        const html = `
            <div class="dialogue-box">
                <div class="npc-avatar">${npc.avatar}</div>
                <div class="dialogue-body">
                    <div class="npc-name">${npc.name}</div>
                    <div class="dialogue-text">${dialogueText}</div>
                    <div class="dialogue-choices">
                        ${q && this.game.quest.currentStageIndex === 0 ? `<button class="dialogue-choice-btn" onclick="window.game.quest.advanceStage(); window.game.ui.openDialogue();">Accept Mission: "${q.title}"</button>` : ''}
                        <button class="dialogue-choice-btn" onclick="window.game.ui.toggleModal('workshop');">"I need to tune and repair my bicycle."</button>
                        <button class="dialogue-choice-btn" onclick="window.game.survival.restAtCamp(8); window.game.ui.closeModal();">"I need to rest at the camp cot."</button>
                        <button class="dialogue-choice-btn" onclick="window.game.ui.closeModal();">"Safe roads. I'll be moving on."</button>
                    </div>
                </div>
            </div>
        `;

        this.el.modalBody.innerHTML = html;
        this.el.modalOverlay.classList.remove('hidden');
    }
}
