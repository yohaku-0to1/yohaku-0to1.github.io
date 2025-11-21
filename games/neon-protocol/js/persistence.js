// LocalStorage による永続化

const SAVE_KEY = 'neon_protocol_save';

// ゲームデータを保存
function saveGame() {
    try {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            player: {
                integrity: gameState.player.integrity,
                maxIntegrity: gameState.player.maxIntegrity,
                credits: gameState.player.credits,
                phase: gameState.player.phase,
                programStack: gameState.player.programStack.map(c => c.id),
                relics: gameState.player.relics,
                evolutionStats: gameState.player.evolutionStats
            },
            map: {
                currentLayer: gameState.map.currentLayer
            }
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('Game saved successfully');
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

// ゲームデータを読み込み
function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (!savedData) {
            console.log('No save data found');
            return false;
        }

        const saveData = JSON.parse(savedData);

        // データを復元
        gameState.player.integrity = saveData.player.integrity;
        gameState.player.maxIntegrity = saveData.player.maxIntegrity;
        gameState.player.credits = saveData.player.credits || 100;
        gameState.player.phase = saveData.player.phase;
        gameState.player.relics = saveData.player.relics || [];
        gameState.player.evolutionStats = saveData.player.evolutionStats || {};

        // デッキを復元
        gameState.player.programStack = saveData.player.programStack.map(cardId => createCardInstance(cardId));

        gameState.map.currentLayer = saveData.player.map?.currentLayer || saveData.map.currentLayer;

        console.log('Game loaded successfully');
        return true;
    } catch (e) {
        console.error('Failed to load game:', e);
        return false;
    }
}

// セーブデータを削除
function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log('Save data deleted');
    } catch (e) {
        console.error('Failed to delete save:', e);
    }
}

// セーブデータの存在確認
function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// 戦闘終了後などに自動保存
function autoSave() {
    if (gameState.combat.inCombat) {
        return; // 戦闘中は保存しない
    }
    saveGame();
}
