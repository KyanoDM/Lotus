// Biscoff L23 app - automatische berekening en visuele tanks
function updateBiscoffL23() {
    const cremeType = document.getElementById('cremeType').value;

    // Valideer en corrigeer vulgraad inputs (max 100%)
    const premixInput = document.getElementById('premix');
    const beluchtingInput = document.getElementById('beluchting');

    let premixValue = Number(premixInput.value);
    let beluchtingValue = Number(beluchtingInput.value);

    // Beperk waarden tussen 0 en 100 en update het veld als nodig
    if (premixValue > 100) {
        premixValue = 100;
        premixInput.value = 100;
    }
    if (beluchtingValue > 100) {
        beluchtingValue = 100;
        beluchtingInput.value = 100;
    }

    const premix = Math.min(100, Math.max(0, premixValue));
    const beluchting = Math.min(100, Math.max(0, beluchtingValue));
    const hoyers = Math.max(0, Number(document.getElementById('hoyers').value));
    const verbreken = Math.max(0, Number(document.getElementById('verbreken').value));
    const cookieWeight = Math.max(0, Number(document.getElementById('cookieWeight').value || 50.5));
    const tijdNu = document.getElementById('tijdNu').value.trim();

    // Standaard waarden
    const standaardCookieGewicht = 50.5; // g voor 5 koekjes
    const standaardCremePerKoekje = 3.1; // g crème per koekje

    // Bereken de crème ratio op basis van koekjesgewicht
    const cookieRatio = cookieWeight / standaardCookieGewicht;
    const cremePerKoekje = standaardCremePerKoekje * cookieRatio;
    const cremePercentage = (cremePerKoekje * 5) / cookieWeight * 100;

    // Max kg per creme type, aangepast voor koekjesgewicht
    const basisMaxKg = {
        biscoff: 1180,
        vanille: 1210,
        melkchocolade: 1240
    }[cremeType];

    // Als koekjes zwaarder zijn, is er relatief minder crème nodig per koekje
    const maxKg = basisMaxKg * (standaardCookieGewicht / cookieWeight);

    // Voorraad berekening
    const voorraadPremix = (premix / 100) * maxKg;
    const voorraadBeluchting = (beluchting / 100) * maxKg;
    const totaleVoorraad = voorraadPremix + voorraadBeluchting + hoyers + verbreken;

    // 1kg = 0.28 minuten voorraad
    const minutenVoorraad = totaleVoorraad * 0.28;
    const urenVoorraad = minutenVoorraad / 60;

    // Tijd nu + urenVoorraad
    let [uren, minuten] = tijdNu.split(/[.:]/).map(Number);
    let eindTijd = "--:--";

    if (isNaN(uren) || isNaN(minuten)) {
        document.getElementById('resultaten').innerHTML = `
        <span style="color:red;">Ongeldige tijd invoer.</span>
        <div style="margin-bottom:8px;"><b>Totale voorraad:</b> ${totaleVoorraad.toFixed(2)} kg</div>
        <div style="margin-bottom:8px;"><b>Voorraad crème:</b> ${minutenVoorraad.toFixed(2)} minuten (${urenVoorraad.toFixed(2)} uur)</div>
        `;
        document.getElementById('cremeTot').innerHTML = eindTijd;
        return;
    }

    let totaalMinuten = uren * 60 + minuten + minutenVoorraad;
    let eindUur = Math.floor(totaalMinuten / 60) % 24;
    let eindMin = Math.round(totaalMinuten % 60);

    // Fix voor wanneer minuten 60 worden (moet naar het volgende uur)
    if (eindMin >= 60) {
        eindUur = (eindUur + 1) % 24;
        eindMin = 0;
    }

    eindTijd = `${eindUur.toString().padStart(2, '0')}:${eindMin.toString().padStart(2, '0')}`;

    document.getElementById('resultaten').innerHTML = `
        <div style="margin-bottom:8px;"><b>Totale voorraad:</b> ${totaleVoorraad.toFixed(2)} kg</div>
        <div style="margin-bottom:8px;"><b>Voorraad crème:</b> ${minutenVoorraad.toFixed(2)} minuten (${urenVoorraad.toFixed(2)} uur)</div>
    `;

    // Update Crème tot display
    document.getElementById('cremeTot').innerHTML = eindTijd;

    // Update tank visuals
    document.getElementById('premixFill').style.height = premix + '%';
    document.getElementById('beluchtingFill').style.height = beluchting + '%';

    // Update tank percentage displays
    document.getElementById('premixPercentage').textContent = premix + '%';
    document.getElementById('beluchtingPercentage').textContent = beluchting + '%';

    // Reset tank kleur classes
    const fillClasses = ['tank-biscoff', 'tank-vanille', 'tank-melkchocolade'];
    const cremeClass = {
        biscoff: 'tank-biscoff',
        vanille: 'tank-vanille',
        melkchocolade: 'tank-melkchocolade'
    }[cremeType];
    [document.getElementById('premixFill'), document.getElementById('beluchtingFill')].forEach(el => {
        el.classList.remove(...fillClasses);
        el.classList.add(cremeClass);
    });
}

// Huidige tijd formatteren voor input veld (HH:MM formaat)
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Alle invoervelden leegmaken
function resetAllFields() {
    document.getElementById('cremeType').value = 'biscoff'; // Behoud default creme type
    document.getElementById('premix').value = '';
    document.getElementById('beluchting').value = '';
    document.getElementById('hoyers').value = '';
    document.getElementById('verbreken').value = '';
    document.getElementById('cookieWeight').value = '50.5'; // Reset naar standaard koekjesgewicht
    document.getElementById('tijdNu').value = '';
    updateBiscoffL23();
}

// Vul huidige tijd in
function setCurrentTime() {
    document.getElementById('tijdNu').value = getCurrentTime();
    updateBiscoffL23();
}

// Validatie functie voor vulgraad inputs
function validateVulgraadInput(input) {
    let value = Number(input.value);
    if (value > 100) {
        input.value = 100;
        input.style.borderColor = '#e74c3c';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    } else if (value < 0) {
        input.value = 0;
        input.style.borderColor = '#e74c3c';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    }
}

// Event listeners voor alle inputs
window.addEventListener('DOMContentLoaded', () => {
    // Invoervelden
    ['cremeType', 'premix', 'beluchting', 'hoyers', 'verbreken', 'cookieWeight', 'tijdNu'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateBiscoffL23);
    });

    // Extra validatie voor vulgraad inputs
    ['premix', 'beluchting'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('blur', () => validateVulgraadInput(input));
        input.addEventListener('input', () => {
            if (Number(input.value) > 100) {
                validateVulgraadInput(input);
            }
        });
    });

    // Reset knop
    document.getElementById('resetButton').addEventListener('click', resetAllFields);

    // Huidige tijd knop
    document.getElementById('nowButton').addEventListener('click', setCurrentTime);

    // Line switch functionaliteit
    const lineButtons = document.querySelectorAll('.line-btn');
    const currentLineSpan = document.getElementById('currentLine');

    lineButtons.forEach(button => {
        button.addEventListener('click', function () {
            const selectedLine = this.getAttribute('data-line');

            // Verwijder active class van alle buttons
            lineButtons.forEach(btn => btn.classList.remove('active'));

            // Voeg active class toe aan geselecteerde button
            this.classList.add('active');

            // Update de titel
            currentLineSpan.textContent = selectedLine;

            // Optioneel: Sla de keuze op in localStorage
            localStorage.setItem('selectedLine', selectedLine);

            console.log(`Switched to line: ${selectedLine}`);
        });
    });

    // Laad opgeslagen line keuze bij opstarten
    const savedLine = localStorage.getItem('selectedLine');
    if (savedLine && ['L22', 'L23', 'L24'].includes(savedLine)) {
        // Update de UI naar opgeslagen keuze
        lineButtons.forEach(btn => btn.classList.remove('active'));
        const savedButton = document.querySelector(`[data-line="${savedLine}"]`);
        if (savedButton) {
            savedButton.classList.add('active');
            currentLineSpan.textContent = savedLine;
        }
    }

    // Initialisatie
    updateBiscoffL23();
});
