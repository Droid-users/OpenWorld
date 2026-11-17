// Backpack Inventory, Weight Restrictions & Field Crafting
import { ALL_ITEMS } from '../world/Locations.js';

export class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = {
            food: 3,
            water: 2,
            fruit: 2,
            bandage: 2,
            kit: 1,
            scrap: 4
        };
    }

    get maxWeight() {
        const storageTier = this.game.bicycle ? this.game.bicycle.upgrades.storage : 1;
        return 14.0 + storageTier * 8.0; // 22kg to 38kg
    }

    get currentWeight() {
        let total = 0;
        for (const [id, count] of Object.entries(this.items)) {
            const def = ALL_ITEMS[id];
            if (def && count > 0) {
                total += def.weight * count;
            }
        }
        return parseFloat(total.toFixed(1));
    }

    has(itemId, count = 1) {
        return (this.items[itemId] || 0) >= count;
    }

    add(itemId, count = 1) {
        const def = ALL_ITEMS[itemId];
        if (!def) return false;

        if (this.currentWeight + def.weight * count > this.maxWeight) {
            this.game.ui.showToast('Backpack too heavy! Discard items first.');
            return false;
        }

        this.items[itemId] = (this.items[itemId] || 0) + count;
        return true;
    }

    remove(itemId, count = 1) {
        if (!this.has(itemId, count)) return false;
        this.items[itemId] -= count;
        if (this.items[itemId] <= 0) {
            delete this.items[itemId];
        }
        return true;
    }

    use(itemId) {
        const def = ALL_ITEMS[itemId];
        if (!def || !this.has(itemId)) return;

        const vitals = this.game.player.vitals;

        if (def.type === 'food') {
            vitals.hunger = Math.min(100, vitals.hunger + def.value);
            if (itemId === 'fruit') vitals.stamina = Math.min(100, vitals.stamina + 10);
            this.remove(itemId, 1);
            this.game.audio.playItemUse();
            this.game.ui.showToast(`Consumed ${def.name}. Hunger +${def.value}`);
        } else if (def.type === 'water') {
            vitals.thirst = Math.min(100, vitals.thirst + def.value);
            this.remove(itemId, 1);
            this.game.audio.playItemUse();
            this.game.ui.showToast(`Drank ${def.name}. Thirst +${def.value}`);
        } else if (def.type === 'medical') {
            vitals.health = Math.min(100, vitals.health + def.value);
            this.remove(itemId, 1);
            this.game.audio.playItemUse();
            this.game.ui.showToast(`Applied ${def.name}. Health +${def.value}`);
        } else if (itemId === 'kit') {
            this.game.bicycle.repair(def.value);
            this.remove(itemId, 1);
            this.game.audio.playItemUse();
            this.game.ui.showToast(`Repaired bicycle with ${def.name}. Condition +${def.value}%`);
        } else {
            this.game.ui.showToast(`${def.name} cannot be consumed directly.`);
        }

        this.game.ui.renderInventory();
    }

    craft(recipeName) {
        if (recipeName === 'kit') {
            if (this.has('scrap', 3) && this.has('battery', 1)) {
                this.remove('scrap', 3);
                this.remove('battery', 1);
                this.add('kit', 1);
                this.game.audio.playItemUse();
                this.game.ui.showToast('Crafted 1x Bicycle Repair Kit!');
                this.game.ui.renderInventory();
            } else {
                this.game.ui.showToast('Missing materials: Need 3x Scrap Metal + 1x Battery');
            }
        }
    }
}
