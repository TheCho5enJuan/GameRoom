/* Deal or No Deal career persistence */
'use strict';
// --- Persistence System ---
    const Ranks = ["Intern", "Assistant", "Contestant", "Pro", "Star", "Idol", "Mogul", "Tycoon", "Legend", "Billionaire"];
    let career = { earnings: 0, level: 1, xp: 0 };
    
    function loadCareer() {
        const saved = localStorage.getItem('dond_gold_career_v5');
        if (saved) career = JSON.parse(saved);
        updateProgUI();
    }

    function saveCareer(win) {
        career.earnings += win;
        const gainedXP = Math.floor(win / 100);
        career.xp += gainedXP;
        while (career.xp >= career.level * 1000) {
            career.xp -= career.level * 1000;
            career.level++;
        }
        localStorage.setItem('dond_gold_career_v5', JSON.stringify(career));
        return gainedXP;
    }

    function updateProgUI() {
        document.getElementById('career-total').innerText = '$' + career.earnings.toLocaleString();
        document.getElementById('rank-name').innerText = Ranks[Math.min(career.level - 1, 9)].toUpperCase();
        const xpTarget = career.level * 1000;
        const xpPerc = (career.xp / xpTarget) * 100;
        document.getElementById('xp-bar-inner').style.width = xpPerc + '%';
    }
