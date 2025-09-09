// Dashboard logic and app loader
function showApp(appName) {
    if (appName === 'biscoffL23') {
        loadBiscoffL23();
    }
}

function loadBiscoffL23() {
    document.getElementById('appContainer').innerHTML = `
        <h2>Biscoff Sandwich L23 - Crème Voorraad</h2>
        <div class="creme-selector">
            <label for="cremeType">Kies crème:</label>
            <select id="cremeType">
                <option value="biscoff">Biscoff</option>
                <option value="vanille">Vanille</option>
                <option value="melkchocolade">Melkchocolade</option>
            </select>
        </div>
        <div class="input-row">
            <label>Vulgraad Premix-tank (%): <input type="number" id="premix" min="0" max="100" value="50"></label>
            <label>Vulgraad Beluchtingstank (%): <input type="number" id="beluchting" min="0" max="100" value="100"></label>
        </div>
        <div class="input-row">
            <label>Gewicht Hoyers (kg): <input type="number" id="hoyers" min="0" value="70"></label>
            <label>Gewicht Verbreken Container (kg): <input type="number" id="verbreken" min="0" value="70"></label>
        </div>
        <div class="input-row">
            <label>Tijd nu (24u, bv. 22.35): <input type="text" id="tijdNu" value="22.35"></label>
        </div>
        <button onclick="berekenVoorraad()">Bereken</button>
        <div id="resultaten" style="margin-top:2rem;"></div>
        <div style="margin-top:2rem;text-align:center;">
            <img src='https://www.lotusbakeries.com/sites/default/files/styles/large/public/2021-09/lotus_biscoff_sandwich_milk_chocolate.png' alt='Biscoff Sandwich' style='max-width:200px;'>
        </div>
    `;
}

function berekenVoorraad() {
    const cremeType = document.getElementById('cremeType').value;
    const premix = Math.min(100, Math.max(0, Number(document.getElementById('premix').value)));
    const beluchting = Math.min(100, Math.max(0, Number(document.getElementById('beluchting').value)));
    const hoyers = Math.max(0, Number(document.getElementById('hoyers').value));
    const verbreken = Math.max(0, Number(document.getElementById('verbreken').value));
    const tijdNu = document.getElementById('tijdNu').value.trim();

    // Max kg per creme type
    const maxKg = {
        biscoff: 1180,
        vanille: 1210,
        melkchocolade: 1240
    }[cremeType];

    // Voorraad berekening
    const voorraadPremix = (premix / 100) * maxKg;
    const voorraadBeluchting = (beluchting / 100) * maxKg;
    const totaleVoorraad = voorraadPremix + voorraadBeluchting + hoyers + verbreken;

    // 1kg = 0.28 minuten voorraad
    const minutenVoorraad = totaleVoorraad * 0.28;
    const urenVoorraad = minutenVoorraad / 60;

    // Tijd nu + urenVoorraad
    let [uren, minuten] = tijdNu.split(/[.:]/).map(Number);
    if (isNaN(uren) || isNaN(minuten)) {
        document.getElementById('resultaten').innerHTML = '<span style="color:red;">Ongeldige tijd invoer.</span>';
        return;
    }
    let totaalMinuten = uren * 60 + minuten + minutenVoorraad;
    let eindUur = Math.floor(totaalMinuten / 60) % 24;
    let eindMin = Math.round(totaalMinuten % 60);
    let eindTijd = `${eindUur.toString().padStart(2, '0')}:${eindMin.toString().padStart(2, '0')}`;

    document.getElementById('resultaten').innerHTML = `
        <b>Totale voorraad:</b> ${totaleVoorraad.toFixed(2)} kg<br>
        <b>Voorraad crème:</b> ${minutenVoorraad.toFixed(2)} minuten (${urenVoorraad.toFixed(2)} uur)<br>
        <b>Crème tot:</b> ${eindTijd} u.
    `;
}
