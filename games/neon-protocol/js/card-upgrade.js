// Card Upgrade System
function upgradeCard(card) {
    if (card.upgraded) {
        console.log('Card already upgraded');
        return;
    }

    card.upgraded = true;

    // Enhance effects based on card type
    const cardData = CARD_DATABASE[card.id];
    if (!cardData) return;

    if (cardData.effect) {
        // Attack cards: +3 damage
        if (cardData.effect.damage) {
            card.effect = card.effect || {};
            card.effect.damage = (cardData.effect.damage || 0) + 3;
        }

        // Defense/Skill cards: +2 firewall
        if (cardData.effect.firewall) {
            card.effect = card.effect || {};
            card.effect.firewall = (cardData.effect.firewall || 0) + 2;
        }

        // Reduce cost by 1 (min 0)
        card.cost = Math.max(0, card.cost - 1);
    }

    // Update description
    card.description = `[★] ${cardData.description}`;
}

function showCardUpgradeModal(onUpgrade) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.zIndex = '2100';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = '<h2>アップグレードするカードを選択</h2><div id="upgrade-container" class="shop-items" style="justify-content:center; max-height: 60vh; overflow-y: auto;"></div>';

    const container = content.querySelector('#upgrade-container');

    gameState.player.programStack.forEach((card) => {
        if (card.upgraded) return; // Skip already upgraded cards

        const cardEl = document.createElement('div');
        cardEl.className = `card type-${card.type}`;
        cardEl.style.cursor = 'pointer';
        cardEl.innerHTML = `
            <div class="card-header"><div class="card-name">${card.name}</div><div class="card-cost">${card.cost}</div></div>
            <div class="card-description">${card.description}</div>
        `;
        cardEl.onclick = () => {
            onUpgrade(card);
            modal.remove();
        };
        container.appendChild(cardEl);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style.marginTop = '1rem';
    cancelBtn.onclick = () => modal.remove();
    content.appendChild(cancelBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);
}
