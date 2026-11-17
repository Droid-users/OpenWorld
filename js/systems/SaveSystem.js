// Persistence Engine - Save, Load & Slot Management
const SAVE_STORAGE_KEY = 'after_the_roads_save_v2';

export class SaveSystem {
    constructor(game) {
        this.game = game;
    }

    save(isManual = false) {
        try {
            const g = this.game;
            const saveData = {
                version: 2,
                savedAt: Date.now(),
                countryId: g.currentCountry.id,
                player: {
                    position: { x: g.player.position.x, y: g.player.position.y, z: g.player.position.z },
                    rotation: g.player.rotation,
                    isRiding: g.player.isRiding,
                    vitals: { ...g.player.vitals }
                },
                bicycle: {
                    position: { x: g.bicycle.position.x, y: g.bicycle.position.y, z: g.bicycle.position.z },
                    rotation: g.bicycle.rotation,
                    condition: g.bicycle.condition,
                    upgrades: { ...g.bicycle.upgrades }
                },
                inventory: { ...g.inventory.items },
                quest: {
                    activeQuestId: g.quest.activeQuest ? g.quest.activeQuest.id : null,
                    stageIndex: g.quest.currentStageIndex,
                    completedQuests: [...g.quest.completedQuests],
                    collectedDocuments: [...g.quest.collectedDocuments]
                },
                time: g.dayNight.time
            };

            localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
            if (isManual) {
                g.ui.showToast('💾 Journey saved successfully.');
            }
            return true;
        } catch (err) {
            console.warn('Save failed:', err);
            if (isManual) {
                g.ui.showToast('⚠️ Storage unavailable or full.');
            }
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || data.version !== 2) return null;
            return data;
        } catch (err) {
            console.warn('Load failed:', err);
            return null;
        }
    }

    hasSave() {
        return this.load() !== null;
    }

    applySaveData(data) {
        const g = this.game;

        if (data.player && data.player.vitals) {
            Object.assign(g.player.vitals, data.player.vitals);
            g.player.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
            g.player.rotation = data.player.rotation;
        }

        if (data.bicycle) {
            g.bicycle.position.set(data.bicycle.position.x, data.bicycle.position.y, data.bicycle.position.z);
            g.bicycle.rotation = data.bicycle.rotation;
            g.bicycle.condition = data.bicycle.condition;
            if (data.bicycle.upgrades) {
                Object.assign(g.bicycle.upgrades, data.bicycle.upgrades);
            }
        }

        if (data.inventory) {
            g.inventory.items = { ...data.inventory };
        }

        if (data.quest) {
            g.quest.currentStageIndex = data.quest.stageIndex || 0;
            g.quest.completedQuests = data.quest.completedQuests || [];
            g.quest.collectedDocuments = data.quest.collectedDocuments || [];
        }

        if (data.time) {
            g.dayNight.time = data.time;
        }

        g.ui.showToast('✅ Save file loaded.');
    }
}
