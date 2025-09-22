// Biscoff L23 app - automatische berekening en visuele tanks
function updateBiscoffL23() {
    const cremeType = document.getElementById('cremeType').value;
    const currentLine = document.getElementById('currentLineSpan')?.textContent || 'L23';

    // Line specific data
    const lineData = {
        'L22': { minutesPerKg: 0.26 },
        'L23': { minutesPerKg: 0.28 },
        'L24': { minutesPerKg: 0.234 } // Berekend: 60/((3597/60)) = 0.234
    };

    const minutesPerKg = lineData[currentLine]?.minutesPerKg || 0.28;

    // Update display
    if (document.getElementById('minutesPerKg')) {
        document.getElementById('minutesPerKg').textContent = minutesPerKg;
    }

    // Get input values
    const premixInput = document.getElementById('premix');
    const beluchtingInput = document.getElementById('beluchting');

    let premixValue = Number(premixInput.value);
    let beluchtingValue = Number(beluchtingInput.value);

    // Beperk waarden tussen 0 en 100
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
    const tijdNu = document.getElementById('tijdNu').value.trim();

    // Max kg per creme type
    const maxKgPerType = {
        biscoff: 1180,
        vanille: 1210,
        melkchocolade: 1240
    };

    const maxKg = maxKgPerType[cremeType];

    // Voorraad berekening met pumping logica - laatste 10% is onbruikbaar
    let voorraadPremix = premix > 10 ? ((premix - 10) / 100) * maxKg : 0;
    let voorraadBeluchting = beluchting > 10 ? ((beluchting - 10) / 100) * maxKg : 0;

    // Store original premix voor "leeg om" berekening
    const oorspronkelijkeVoorraadPremix = voorraadPremix;

    console.log(`Debug: premix=${premix}%, beluchting=${beluchting}%, maxKg=${maxKg}`);
    console.log(`Debug: voorraadPremix=${voorraadPremix}kg, voorraadBeluchting=${voorraadBeluchting}kg`);

    // Premix pump logica: pompt pas over als premix onder 70% zit
    let premixWillPump = false;
    let pumpAmount = 0;

    // Pump logica: pompt als BELUCHTINGSTANK < 70% (niet premix!)
    if (beluchting < 70) {
        premixWillPump = true;
        // Pompt altijd 10% van premix over (als er genoeg is)
        const availableInPremix = premix > 10 ? premix - 10 : 0; // Laatste 10% is onbruikbaar
        const ruimteInBeluchting = 100 - beluchting; // Hoeveel % ruimte er is

        // Pompt 10% van premix (of wat er beschikbaar is, of wat er past)
        const te_pompen_percentage = Math.min(10, availableInPremix, ruimteInBeluchting);
        pumpAmount = (te_pompen_percentage / 100) * maxKg;

        console.log(`Debug PUMP: beluchting=${beluchting}% < 70%, pompt ${te_pompen_percentage}% (${pumpAmount}kg)`);
        console.log(`Debug VOOR pompen: voorraadPremix=${voorraadPremix}kg, voorraadBeluchting=${voorraadBeluchting}kg`);

        // Na pompen
        voorraadPremix = Math.max(0, voorraadPremix - pumpAmount);
        voorraadBeluchting = Math.min(maxKg, voorraadBeluchting + pumpAmount);

        console.log(`Debug NA pompen: voorraadPremix=${voorraadPremix}kg, voorraadBeluchting=${voorraadBeluchting}kg`);
    } else {
        console.log(`Debug: Beluchtingstank ${beluchting}% >= 70%, geen pompen`);
    }
    // Totale voorraad berekening
    const totaleVoorraad = voorraadPremix + voorraadBeluchting + hoyers + verbreken;

    // Voorraad in minuten en uren
    const minutenVoorraad = totaleVoorraad * minutesPerKg;
    const urenVoorraad = minutenVoorraad / 60;
    const urenDisplay = Math.floor(urenVoorraad);
    const minutenDisplay = Math.round((urenVoorraad - urenDisplay) * 60);

    // Tijd berekeningen
    let eindTijd = "--:--";
    let premixLeegTijd = "--:--";

    let [uren, minuten] = tijdNu.split(/[.:]/).map(Number);

    if (!isNaN(uren) && !isNaN(minuten)) {
        // Crème beschikbaar tot
        let totaalMinuten = uren * 60 + minuten + minutenVoorraad;
        let eindUur = Math.floor(totaalMinuten / 60) % 24;
        let eindMin = Math.round(totaalMinuten % 60);

        if (eindMin >= 60) {
            eindUur = (eindUur + 1) % 24;
            eindMin = 0;
        }

        eindTijd = `${eindUur.toString().padStart(2, '0')}:${eindMin.toString().padStart(2, '0')}`;

        // Premix leeg om - rekening houdend met pomplogica
        if (oorspronkelijkeVoorraadPremix > 0) {
            let effectievePremixVoorraad = oorspronkelijkeVoorraadPremix;

            if (beluchting >= 70) {
                // Beluchtingstank ≥ 70%, er wordt NIET gepompt
                // Premix gaat normale snelheid leeg (alleen consumptie)
                console.log(`Debug PREMIX TIJD: Beluchtingstank ${beluchting}% >= 70%, GEEN pompen → normale snelheid`);
            } else {
                // Beluchtingstank < 70%, er wordt WEL gepompt
                // Premix gaat SNELLER leeg omdat hij wegpompt naar beluchtingstank
                effectievePremixVoorraad = oorspronkelijkeVoorraadPremix * 0.8; // 20% sneller door wegpompen
                console.log(`Debug PREMIX TIJD: Beluchtingstank ${beluchting}% < 70%, WEL pompen → SNELLER leeg door wegpompen`);
            }

            const premixMinuten = effectievePremixVoorraad * minutesPerKg;
            console.log(`Debug: effectievePremixVoorraad=${effectievePremixVoorraad}kg, premixMinuten=${premixMinuten}`);

            let premixTotaalMinuten = uren * 60 + minuten + premixMinuten;
            let premixEindUur = Math.floor(premixTotaalMinuten / 60) % 24;
            let premixEindMin = Math.round(premixTotaalMinuten % 60);

            if (premixEindMin >= 60) {
                premixEindUur = (premixEindUur + 1) % 24;
                premixEindMin = 0;
            }

            premixLeegTijd = `${premixEindUur.toString().padStart(2, '0')}:${premixEindMin.toString().padStart(2, '0')}`;
        }
    }

    // Update result displays
    if (document.getElementById('totaleVoorraad')) {
        document.getElementById('totaleVoorraad').textContent = `${totaleVoorraad.toFixed(1)} kg`;
    }
    if (document.getElementById('voorraadMinuten')) {
        document.getElementById('voorraadMinuten').textContent = `${minutenVoorraad.toFixed(0)} min`;
    }
    if (document.getElementById('voorraadUren')) {
        document.getElementById('voorraadUren').textContent = `${urenDisplay}:${minutenDisplay.toString().padStart(2, '0')}`;
    }
    if (document.getElementById('cremeTot')) {
        document.getElementById('cremeTot').textContent = eindTijd;
    }
    // Update the small premix time under the tank
    if (document.getElementById('premixLeegTime')) {
        document.getElementById('premixLeegTime').textContent = premixLeegTijd;
    }

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
    // Save to Firebase when time is set
    saveToFirebase();
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

    // Firebase save functionaliteit
    async function saveToFirebase() {
        if (!window.firebaseDB) {
            console.error('Firebase not initialized yet');
            return;
        }

        try {
            // Huidige lijn ophalen
            const currentLine = document.getElementById('currentLine').textContent;

            // Alle form data verzamelen
            const formData = {
                cremeType: document.getElementById('cremeType').value,
                premix: Number(document.getElementById('premix').value) || 0,
                beluchting: Number(document.getElementById('beluchting').value) || 0,
                hoyers: Number(document.getElementById('hoyers').value) || 0,
                verbreken: Number(document.getElementById('verbreken').value) || 0,
                cookieWeight: Number(document.getElementById('cookieWeight').value) || 50.5,
                tijdNu: document.getElementById('tijdNu').value,
                timestamp: window.firestoreFunctions.serverTimestamp(),
                lastUpdated: new Date().toLocaleString('nl-NL')
            };

            // Save naar Firebase in structuur: cremevoorraad/[L22|L23|L24]
            const docRef = window.firestoreFunctions.doc(window.firebaseDB, 'cremevoorraad', currentLine);
            await window.firestoreFunctions.setDoc(docRef, formData);

            console.log(`Data saved to Firebase for ${currentLine}:`, formData);

        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }



    // Auto-save wanneer waarden veranderen
    const formInputs = ['cremeType', 'premix', 'beluchting', 'hoyers', 'verbreken', 'cookieWeight', 'tijdNu'];
    formInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', () => {
                setTimeout(saveToFirebase, 500); // Kleine delay om typing te voorkomen
            });
        }
    });

    // Firebase load functionaliteit
    async function loadFromFirebase(lineToLoad) {
        if (!window.firebaseDB) {
            console.log('Firebase not initialized yet, skipping load');
            return;
        }

        try {
            const docRef = window.firestoreFunctions.doc(window.firebaseDB, 'cremevoorraad', lineToLoad);
            const docSnap = await window.firestoreFunctions.getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`Loading data for ${lineToLoad}:`, data);

                // Vul form in met opgehaalde data (stil zonder events triggeren)
                const cremeType = document.getElementById('cremeType');
                const premix = document.getElementById('premix');
                const beluchting = document.getElementById('beluchting');
                const hoyers = document.getElementById('hoyers');
                const verbreken = document.getElementById('verbreken');
                const cookieWeight = document.getElementById('cookieWeight');
                const tijdNu = document.getElementById('tijdNu');

                // Update waarden zonder change events
                cremeType.value = data.cremeType || 'biscoff';
                premix.value = data.premix || 0;
                beluchting.value = data.beluchting || 0;
                hoyers.value = data.hoyers || 0;
                verbreken.value = data.verbreken || 0;
                cookieWeight.value = data.cookieWeight || 50.5;
                tijdNu.value = data.tijdNu || '';

                // Eenmalig update berekeningen na alle waarden zijn geladen
                setTimeout(() => updateBiscoffL23(), 50);

            } else {
                console.log(`No data found for ${lineToLoad}, using defaults`);
                // Reset naar default waarden
                resetAllFields();
            }
        } catch (error) {
            console.error(`Error loading data for ${lineToLoad}:`, error);
        }
    }

    // Line switch functionaliteit
    const lineButtons = document.querySelectorAll('.line-btn');
    const currentLineSpan = document.getElementById('currentLine');
    const switchBackground = document.querySelector('.line-switch-bg');

    // Functie om de sliding background te positioneren
    function updateSwitchBackground(activeButton) {
        const buttonIndex = Array.from(lineButtons).indexOf(activeButton);
        let translateX = buttonIndex * 62.5; // 50px button width + 5px gap

        // Kleine correctie voor L22 positie
        if (buttonIndex === 0) { // L22 is de eerste button
            translateX += 3; // 3px naar rechts voor betere uitlijning
        }

        switchBackground.style.transform = `translateX(${translateX}px)`;
    }

    // Initiële positie van de background (voor L23 als default)
    const initialActiveButton = document.querySelector('.line-btn.active');
    if (initialActiveButton) {
        updateSwitchBackground(initialActiveButton);
    }

    lineButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const selectedLine = this.getAttribute('data-line');
            const currentActiveLine = document.querySelector('.line-btn.active')?.getAttribute('data-line');

            // Save huidige lijn data voordat we switchen
            if (currentActiveLine && currentActiveLine !== selectedLine) {
                await saveToFirebase();
            }

            // Verwijder active class van alle buttons
            lineButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Voeg active class toe aan geselecteerde button
            this.classList.add('active');

            // Slide de background naar de nieuwe positie
            updateSwitchBackground(this);

            // Update de titel met fade effect
            currentLineSpan.style.opacity = '0.5';
            setTimeout(async () => {
                currentLineSpan.textContent = selectedLine;
                // Also update the span in the info box
                const currentLineSpanInfo = document.getElementById('currentLineSpan');
                if (currentLineSpanInfo) {
                    currentLineSpanInfo.textContent = selectedLine;
                }
                currentLineSpan.style.opacity = '1';

                // Update calculations with new line data
                updateBiscoffL23();

                // Laad data voor nieuwe lijn
                await loadFromFirebase(selectedLine);
            }, 200);

            // Sla de keuze op in localStorage
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
            // Positioneer de background correct
            updateSwitchBackground(savedButton);
        }
    }

    // Initialisatie met Firebase data loading
    // Eerst een snelle update om iets te tonen
    updateBiscoffL23();

    // Dan Firebase data laden (korter delay)
    setTimeout(() => {
        const currentActiveLine = document.querySelector('.line-btn.active')?.getAttribute('data-line') || 'L23';
        loadFromFirebase(currentActiveLine);
    }, 300);
});
