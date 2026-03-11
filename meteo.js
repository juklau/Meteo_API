// état global
let meteoData = null;
let currentSort = 'date';
let chartInstances = {};

// éléments de DOM
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const searchSection = document.getElementById('search-section');
const resultDiv = document.getElementById('result');
const villeTitle = document.getElementById('ville-titre');
const resultMeteo = document.getElementById('result-meteo');
const mapSection = document.getElementById('map-section');
const sortSection = document.getElementById('sortSection');
const chartsSection = document.getElementById('chartsSection');
const sortButtons = document.querySelectorAll('.sort-btn');

// icons météo
const iconMap = {
    0: { icon: '☀️', text: 'Ciel dégagé' },
    1: { icon: '🌤️', text: 'Peu nuageux' },
    2: { icon: '⛅', text: 'Partiellement nuageux' },
    3: { icon: '☁️', text: 'Couvert' },
    45: { icon: '🌫️', text: 'Brouillard' },
    48: { icon: '🌫️', text: 'Brouillard givrant' },
    51: { icon: '🌧️', text: 'Bruine légère' },
    53: { icon: '🌧️', text: 'Bruine modérée' },
    55: { icon: '🌧️', text: 'Bruine dense' },
    61: { icon: '🌧️', text: 'Pluie légère' },
    63: { icon: '🌧️', text: 'Pluie modérée' },
    65: { icon: '⛈️', text: 'Pluie forte' },
    80: { icon: '🌧️', text: 'Averses légères' },
    81: { icon: '🌧️', text: 'Averses modérées' },
    82: { icon: '⛈️', text: 'Averses violentes' },
    85: { icon: '🌨️', text: 'Averses de neige légères' },
    86: { icon: '🌨️', text: 'Averses de neige fortes' },
    71: { icon: '🌨️', text: 'Neige légère' },
    73: { icon: '🌨️', text: 'Neige modérée' },
    75: { icon: '🌨️', text: 'Neige forte' },
    77: { icon: '🌨️', text: 'Grains de neige' },
    80: { icon: '🌧️', text: 'Averses légères' },
    81: { icon: '🌧️', text: 'Averses modérées' },
    82: { icon: '⛈️', text: 'Averses violentes' },
    95: { icon: '⛈️', text: 'Orage' },
    96: { icon: '⛈️', text: 'Orage avec grésil' },
    99: { icon: '⛈️', text: 'Orage avec grésil' }
};

// écouteurs d'événements
searchForm.addEventListener('submit', handleSearch);
sortButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {

        //retirer la classe 'active' de tous les boutons
        sortButtons.forEach(b => b.classList.remove('active'));

        //remettre active uniquement sur le bouton cliqué => bouton parent
        e.target.closest('.sort-btn').classList.add('active');

        //list le data-sort
        currentSort = e.target.closest('.sort-btn').dataset.sort;
        displayWeatherCards(meteoData);
    });
});

// recherche les villes
async function handleSearch(e) {
    e.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) return;
    
    showLoading();
    hideError();
    
    try {

        //détecter si le saisie est un code postal
        const estCodePostal =  /^\d{5}$/.test(city);

        let geoUrl

        // Récupérer les coordonnées de la ville

        if(estCodePostal){
            //postalcode et countrycodes en pluriel
            geoUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(city)}&countrycodes=fr&format=json&limit=1&addressdetails=1`;
        }else{
            //q et countrycodes en pluriel
            geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=fr&format=json&limit=1&addressdetails=1`;
        }

        const geoResponse = await fetch(geoUrl, {
            headers: {'Accept-Language': 'fr'}
        });
        const geoData = await geoResponse.json();
        
        if (!geoData || geoData.length === 0) {
            showError('Ville non trouvée. Veuillez vérifier le nom ou le code postal.');
            hideLoading();
            return;
        }
        
        const location = geoData[0];
        const latitude = parseFloat(location.lat);
        const longitude = parseFloat(location.lon);
        const name = location.address?.city
                    || location.address?.town
                    || location.address?.village
                    || location.display_name.split(',')[0]; // => fallback
        const country = location.address?.country || 'France';
        // const { latitude, longitude, name, country } = location;
        
        // Récupérer la météo 7 jours => par défaut il retourne 7jours
        const wheaterUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,sunrise,sunset&timezone=Europe/Paris`;
        const weatherResponse = await fetch(wheaterUrl);
        const weatherData = await weatherResponse.json();
        
        meteoData = {
            location: { name, country, latitude, longitude },
            weather: weatherData.daily
        };
        
        displayResults();
        hideLoading();
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de la récupération des données.');
        hideLoading();
    }
}

// afficher les résultats 
function displayResults() {

    // Titre de la ville
    villeTitle.innerHTML = `<i class="bi bi-geo-alt-fill me-2"></i>${meteoData.location.name}, ${meteoData.location.country}`;
    
    // Statistiques moyennes
    displayAverages();
    
    // Cartes météo
    displayWeatherCards(meteoData);
    
    // Graphiques
    displayCharts();
    
    // Afficher les sections
    sortSection.classList.remove('d-none');
    chartsSection.classList.remove('d-none');
    mapSection.classList.remove('d-none');
    
    // Carte
    displayMap();
}

// afficher les moyennes
function displayAverages() {
    const temps = meteoData.weather.temperature_2m_mean;
    const humidity = meteoData.weather.relative_humidity_2m_max;
    const wind = meteoData.weather.wind_speed_10m_max;
    const precipitation = meteoData.weather.precipitation_sum;
    
    //somme de tous les élémnets => reduce() parcourt le tableau et accumule un résultat => équivalent de somme avec foreach
    //toFixed(1) => arrondit  à 1 chiffre après virgule et retourne une string
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const avgHumidity = Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length);

    //Math.max n'accepte pas un tableau => [x, y, z] => avec ...wind => x, y, z
    const maxWind = Math.max(...wind).toFixed(1);
    const totalPrecip = precipitation.reduce((a, b) => a + b, 0).toFixed(1);
    
    resultDiv.innerHTML = `
        <div class="col-lg-3 col-md-4 col-6">
            <div class="moyenne-card text-center">
                <div class="label text-uppercase">Temp. moyenne</div>
                <div class="valeur ${avgTemp > 15 ? 'chaud' : 'froid'}">${avgTemp}°C</div>
            </div>
        </div>
        <div class="col-lg-3 col-md-4 col-6">
            <div class="moyenne-card text-center">
                <div class="label text-uppercase">Humidité moy.</div>
                <div class="valeur">${avgHumidity}%</div>
            </div>
        </div>
        <div class="col-lg-3 col-md-4 col-6">
            <div class="moyenne-card text-center">
                <div class="label text-uppercase">Vent max</div>
                <div class="valeur">${maxWind} km/h</div>
            </div>
        </div>
        <div class="col-lg-3 col-md-4 col-6">
            <div class="moyenne-card text-center">
                <div class="label text-uppercase">Précipitations</div>
                <div class="valeur">${totalPrecip} mm</div>
            </div>
        </div>
    `;
}

// afficher les cartes météo trié
function displayWeatherCards(data) {
    const dates = data.weather.time;
    const temps = data.weather.temperature_2m_max;
    const tempsMin = data.weather.temperature_2m_min;
    const humidity = data.weather.relative_humidity_2m_max;
    const wind = data.weather.wind_speed_10m_max;
    const precipitation = data.weather.precipitation_sum;
    const weather_code = data.weather.weather_code;
    const sunrise = data.weather.sunrise;
    const sunset = data.weather.sunset;
    
    // Créer les objets de données
    let weatherCards = dates.map((date, index) => ({
        date,
        tempMax: temps[index],
        tempMin: tempsMin[index],
        humidity: humidity[index],
        windSpeed: wind[index],
        precipitation: precipitation[index],
        weatherCode: weather_code[index],
        sunrise: sunrise[index],
        sunset: sunset[index],
        index
    }));
    
    // Trier selon le critère sélectionné
    weatherCards.sort((a, b) => {
        switch(currentSort) {
            case 'tempMax':
                return b.tempMax - a.tempMax;
            case 'tempMin':
                return b.tempMin - a.tempMin;
            case 'humidity':
                return b.humidity - a.humidity;
            case 'windSpeed':
                return b.windSpeed - a.windSpeed;
            case 'precipitation':
                return b.precipitation - a.precipitation;
            case 'date':
            default:
                return a.index - b.index;
        }
    });
    
    // Générer l'HTML
    resultMeteo.innerHTML = weatherCards.map((card, idx) => {
        const dateObj = new Date(card.date);
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
        const dateStr = dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const meteoInfo = iconMap[card.weatherCode] || { icon: '❓', text: 'Inconnu' };

        const sunriseStr = new Date(card.sunrise).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'});
        const sunsetStr = new Date(card.sunset).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'});
        
        return `
            <div class="col-lg-3 col-md-4 col-6">
                <div class="weather-card text-center">
                    <div class="date-titre text-capitalize">${dayName} ${dateStr}</div>
                    <div class="icone-meteo d-block" style="font-size: 2.5rem;">${meteoInfo.icon}</div>
                    <div class="description fst-italic">${meteoInfo.text}</div>
                    <div class="info-ligne">
                        <i class="bi bi-thermometer-high"></i>
                        <span>${card.tempMax.toFixed(1)}°C</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-thermometer-low"></i>
                        <span>${card.tempMin.toFixed(1)}°C</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-droplet"></i>
                        <span>${card.humidity}%</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-wind"></i>
                        <span>${card.windSpeed.toFixed(1)} km/h</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-cloud-rain"></i>
                        <span>${card.precipitation.toFixed(1)} mm</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-sunrise-fill"></i>
                        <span>${sunriseStr}</span>
                    </div>
                    <div class="info-ligne d-flex alig-items-center justify-content-center">
                        <i class="bi bi-sunset-fill"></i>
                        <span>${sunsetStr}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// afficher les graphiques
function displayCharts() {
    const dates = meteoData.weather.time.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    });
    
    // Detruire les anciens graphiques s'ils existent
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    
    // Graphique Températures
    const tempCtx = document.getElementById('tempChart').getContext('2d'); //=> 2 dimensions


    chartInstances.temp = new Chart(tempCtx, {
        type: 'line',  //=> graphique en courbe
        data: {
            labels: dates,
            datasets: [ //les courbes à tracer
                {
                    label: 'Temp max',
                    data: meteoData.weather.temperature_2m_max,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,             //=> épaisseur de la ligne
                    fill: true,                 //=> pour remplir la zone sous la courbe
                    tension: 0.3                // arrindi de la courbe
                },
                {
                    label: 'Temp min',
                    data: meteoData.weather.temperature_2m_min,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,  //garder les proportions
            plugins: {
                legend: {
                    display: true,          // afficher la légende
                    labels: { font: { size: 11, weight: '600' } }
                }
            },
            scales: {
                y: {
                    ticks: { callback: v => v + '°C' }  // ajouter la valeur sur l'axe y
                }
            }
        }
    });
    
    // Graphique Humidité
    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    chartInstances.humidity = new Chart(humidityCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Humidité (%)',
                data: meteoData.weather.relative_humidity_2m_max,
                backgroundColor: 'rgba(63, 81, 181, 0.6)',
                borderColor: '#3f51b5',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
    
    // Graphique Vent
    const windCtx = document.getElementById('windChart').getContext('2d');
    chartInstances.wind = new Chart(windCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Vitesse vent (km/h)',
                data: meteoData.weather.wind_speed_10m_max,
                backgroundColor: 'rgba(76, 175, 80, 0.6)',
                borderColor: '#4caf50',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
    
    // Graphique Précipitations
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    chartInstances.precip = new Chart(precipCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Précipitations (mm)',
                data: meteoData.weather.precipitation_sum,
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: '#2196f3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

// afficher la carte
let map = null;
function displayMap() {
    if (map) {
        map.remove();
    }
    
    // Latitude, longitude et niveau de zoom initial
    map = L.map('map').setView([meteoData.location.latitude, meteoData.location.longitude], 10);
    
    // Ajouter les tuiles (tiles) OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
     // Ajouter un marqueur sur la carte
    L.marker([meteoData.location.latitude, meteoData.location.longitude])
        .addTo(map)
        .bindPopup(`<b>${meteoData.location.name}</b>`);
}

// utilitaires
function showLoading() {
    loading.style.display = 'flex';
    resultDiv.innerHTML = '';
    villeTitle.innerHTML = '';
    resultMeteo.innerHTML = '';
    sortSection.classList.add('d-none');
    chartsSection.classList.add('d-none');
    mapSection.classList.add('d-none');
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Focus sur input au chargement
window.addEventListener('load', () => {
    cityInput.focus();
});



//background => étoiles animées

const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');

//adaptation le canvas à la taille de l'écran

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//redimensionner la fenêtre en cas de changement de la taille d'écran
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

//créer les étoiles
const NB_ETOILES = 100;
const etoiles = [];

for(let i = 0; i < NB_ETOILES; i++){

    etoiles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rayon :  Math.random() * 2 + 0.5, //taille entre 0.5 et 2.5
        vitesse :  Math.random() * 0.4 + 0.1, //vitesse entre 0.1 et 0.5
        opacite : Math.random()
    });
}


//animation
function animer(){

    // effacer le canvas à chaque frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    etoiles.forEach(etoile => {

        //pour dessiner étoiles 
        ctx.beginPath();
        ctx.arc(etoile.x, etoile.y, etoile.rayon, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${etoile.opacite})`;
        ctx.fill();

        //pour faire monter étoile
        etoile.y -= etoile.vitesse;

        //faire 'csillogni'
        etoile.opacite += (Math.random() - 0.5) * 0.05;
        etoile.opacite = Math.max(0.1, Math.min(1, etoile.opacite)); // => 0.1 <= x <= 1


        // si l'étoile sort par le haut => faire apparaitre en bas
        if(etoile.y < 0){
            etoile.y = canvas.height;
            etoile.x = Math.random() * canvas.width;

        }
    });

    //boucle d'animation => *60/ seconde
    requestAnimationFrame(animer);

}

animer();



