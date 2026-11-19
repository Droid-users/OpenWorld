// AFTER THE ROADS — Save & Load System
export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.STORAGE_KEY = 'after_the_roads_save';
    }

    save() {
        const g = this.game;
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            player: {
                vitals: { ...g.player.vitals },
                position: { x: g.player.position.x, y: g.player.position.y, z: g.player.position.z },
                rotation: g.player.rotation,
                isRiding: g.player.isRiding
            },
            bicycle: {
                position: { x: g.bicycle.position.x, y: g.bicycle.position.y, z: g.bicycle.position.z },
                rotation: g.bicycle.rotation,
                condition: g.bicycle.condition,
                upgrades: { ...g.bicycle.upgrades }
            },
            inventory: { ...g.inventory.items },
            quest: {
                stageIndex: g.quest.currentStageIndex,
                activeQuestId: g.quest.activeQuest ? g.quest.activeQuest.id : null,
                completedQuests: [...g.quest.completedQuests],
                collectedDocuments: [...g.quest.collectedDocuments]
            },
            time: g.dayNight.time
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            g.ui.showToast('💾 Game Saved Successfully');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            g.ui.showToast('❌ Failed to save game');
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to load save:', e);
            return null;
        }
    }

    hasSave() {
        return this.load() !== null;
    }

    applySaveData(data) {
        const g = this.game;

        if (data.player) {
            if (data.player.vitals) Object.assign(g.player.vitals, data.player.vitals);
            if (data.player.position) g.player.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
            if (data.player.rotation !== undefined) g.player.rotation = data.player.rotation;
            // Restore player mounted/riding state (KAN-24)
            if (data.player.isRiding && g.player.mountBicycle && g.bicycle) {
                g.player.mountBicycle(g.bicycle);
            }
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
            // Rehydrate active quest matching saved activeQuestId (KAN-24)
            if (data.quest.activeQuestId && typeof LOCATIONS !== 'undefined') {
                g.quest.activeQuest = LOCATIONS.find(l => l.id === data.quest.activeQuestId) || null;
            }
        }

        if (data.time) {
            g.dayNight.time = data.time;
        }

        g.ui.showToast('✅ Save file loaded.');
    }
}
