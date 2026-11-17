// Dynamic Narrative Quest Engine, Objective Tracking & Lore Collector
export class QuestSystem {
    constructor(game) {
        this.game = game;
        this.activeQuest = null;
        this.currentStageIndex = 0;
        this.completedQuests = [];
        this.collectedDocuments = [];
    }

    loadQuestForCountry(countryConfig) {
        if (countryConfig.quest) {
            this.activeQuest = countryConfig.quest;
            this.currentStageIndex = 0;
        } else {
            this.activeQuest = null;
        }
    }

    get currentObjective() {
        if (!this.activeQuest) return 'Explore the wasteland and locate survivor outposts.';
        if (this.currentStageIndex >= this.activeQuest.stages.length) {
            return 'Mission Complete. Return to the survivor camp.';
        }
        return this.activeQuest.stages[this.currentStageIndex];
    }

    advanceStage() {
        if (!this.activeQuest) return;
        this.currentStageIndex++;
        if (this.currentStageIndex >= this.activeQuest.stages.length) {
            this.completeQuest();
        } else {
            this.game.ui.showToast(`🎯 Journal Updated: ${this.currentObjective}`);
            this.game.audio.playQuestComplete();
        }
        this.game.ui.updateQuestHUD();
    }

    completeQuest() {
        if (!this.activeQuest) return;
        this.game.audio.playQuestComplete();
        this.game.ui.showToast(`🎉 Quest Complete: ${this.activeQuest.title}!`);

        // Grant rewards
        if (this.activeQuest.rewardItem) {
            this.game.inventory.add(this.activeQuest.rewardItem, 1);
        }
        if (this.activeQuest.rewardScrap) {
            this.game.inventory.add('scrap', this.activeQuest.rewardScrap);
        }

        this.completedQuests.push(this.activeQuest.id);
        this.activeQuest = null;
        this.game.ui.updateQuestHUD();
    }

    collectDocument(doc) {
        if (!this.collectedDocuments.some(d => d.id === doc.id)) {
            this.collectedDocuments.push(doc);
            this.game.audio.playRadioStatic();
            this.game.ui.showToast(`📄 New Lore Document Discovered: "${doc.title}"`);
        }
    }
}
