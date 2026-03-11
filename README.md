# 🌤️ Météo 7 jours — Application Web

> Application web de prévisions météo sur 7 jours pour les villes de France.  
> Réalisation Professionnelle n°6 — BTS SIO SLAM

---

## Présentation

Cette application permet à l'utilisateur de rechercher une ville française (par nom ou code postal) et d'afficher les prévisions météo détaillées sur 7 jours, accompagnées de graphiques de tendances et d'une carte interactive.

---

## Fonctionnalités

-  **Recherche** par nom de ville ou code postal français (ex : `Paris`, `06000`)
-  **Prévisions sur 7 jours** : température, humidité, vent, précipitations, lever/coucher du soleil
-  **Statistiques moyennes** : température moyenne, humidité moyenne, vent max, précipitations totales
-  **Graphiques interactifs** (Chart.js) : températures, humidité, vent, précipitations
-  **Tri des cartes** par date, température max/min, humidité, vent ou précipitations
-  **Carte interactive** (Leaflet / OpenStreetMap) centrée sur la ville recherchée
-  **Animation d'étoiles** en arrière-plan (canvas HTML5)
-  **Interface responsive** (Bootstrap 5)

---

## Technologies utilisées

| Technologie               | Rôle                                  |
|---------------------------|---------------------------------------|
| HTML5 / CSS3              | Structure et mise en forme            |
| JavaScript (ES6+)         | Logique applicative                   |
| Bootstrap 5               | Interface responsive                  |
| Bootstrap Icons           | Icônes                                |
| Chart.js                  | Graphiques de tendances               |
| Leaflet.js                | Carte interactive                     |
| Open-Meteo API            | Données météo (gratuite, sans clé)    |
| Nominatim (OpenStreetMap) | Géocodage ville → coordonnées GPS     |
| Google Fonts              | Typographie (Montserrat, Open Sans)   |

---

## Structure du projet

```
meteo-7jours/
│
├── index.html       # Structure HTML de l'application
├── style.css        # Styles CSS (variables, animations, responsive)
├── meteo.js         # Logique JavaScript (API, affichage, graphiques)
└── README.md        # Documentation du projet
```

---

## Installation et utilisation

Aucune installation requise. Le projet fonctionne directement dans le navigateur.

**1. Cloner le dépôt**
```bash
git clone https://github.com/juklau/Meteo_API.git
```

**2. Ouvrir le fichier**
```bash
cd Meteo_API
# Ouvrir index.html dans un navigateur
```

> ⚠️ Pour éviter les erreurs CORS, il est recommandé d'utiliser un serveur local comme [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (extension VS Code).

---

## APIs utilisées

### Open-Meteo — Prévisions météo
- **URL** : `https://api.open-meteo.com/v1/forecast`
- **Gratuite**, sans clé API
- Retourne les données **daily** sur 7 jours par défaut

**Paramètres demandés :**
```
weather_code, temperature_2m_max, temperature_2m_min, temperature_2m_mean,
relative_humidity_2m_max, precipitation_sum, wind_speed_10m_max, sunrise, sunset
```

### Nominatim (OpenStreetMap) — Géocodage
- **URL** : `https://nominatim.openstreetmap.org/search`
- **Gratuite**, sans clé API
- Utilisé pour convertir un nom de ville ou un code postal en coordonnées GPS

**Recherche par code postal :**
```
?postalcode=06220&countrycodes=fr&format=json&limit=1&addressdetails=1
```

**Recherche par nom de ville :**
```
?q=Paris&countrycodes=fr&format=json&limit=1&addressdetails=1
```

---

## Architecture JavaScript

Le fichier `meteo.js` est organisé en 5 parties distinctes :

```
1. État global          → variables partagées (meteoData, currentSort, chartInstances)
2. Éléments DOM         → références aux éléments HTML
3. Données de référence → table des icônes météo (iconMap)
4. Écouteurs            → gestion des événements (formulaire, boutons de tri)
5. Fonctions            → handleSearch, displayResults, displayAverages,
                          displayWeatherCards, displayCharts, displayMap
```

**Flux d'exécution principal :**
```
Soumission formulaire
    → handleSearch()
        → fetch Nominatim (géocodage)
        → fetch Open-Meteo (météo)
        → displayResults()
            ├── displayAverages()     (statistiques)
            ├── displayWeatherCards() (cartes journalières)
            ├── displayCharts()       (graphiques Chart.js)
            └── displayMap()          (carte Leaflet)
```

---

## Points techniques notables

**Détection code postal vs nom de ville :**
```javascript
const estCodePostal = /^\d{5}$/.test(city); // true si exactement 5 chiffres
```

**Calcul de moyennes avec reduce() :**
```javascript
const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
```

**Valeur maximale avec spread operator :**
```javascript
const maxWind = Math.max(...wind).toFixed(1); // ...wind déverse le tableau en valeurs séparées
```

**Tri dynamique des cartes :**
```javascript
weatherCards.sort((a, b) => {
    switch(currentSort) {
        case 'tempMax': return b.tempMax - a.tempMax;
        case 'windSpeed': return b.windSpeed - a.windSpeed;
        // ...
    }
});
```

**Animation étoiles (canvas HTML5) :**
```javascript
requestAnimationFrame(animer); // boucle ~60fps, plus fluide que setInterval
```

---

## Aperçu

| Section       | Description                                                   |
|---------------|---------------------------------------------------------------|
| En-tête       | Logo + titre avec fond dégradé                                |
| Formulaire    | Champ de recherche + bouton                                   |
| Statistiques  | 4 cartes : temp. moyenne, humidité, vent max, précipitations  |
| Tri           | 6 boutons de tri des cartes météo                             |
| Cartes météo  | 7 cartes journalières avec emoji météo                        |
| Graphiques    | 4 graphiques Chart.js (ligne + barres)                        |
| Carte         | Carte Leaflet interactive avec marqueur                       |

---

## Gestion des erreurs

| Cas d'erreur       | Comportement                                                     |
|--------------------|------------------------------------------------------------------|
| Ville introuvable  | Message d'erreur affiché sous le formulaire                      |
| Erreur réseau      | Message d'erreur + log console                                   |
| Code postal ambigu | Paramètre `postalcode` + `countrycodes=fr` pour forcer la France |
| Code météo inconnu | Icône `❓` + texte `Inconnu` par défaut                         |

---

##  Auteur

Projet réalisé dans le cadre du **BTS SIO option SLAM**  
Réalisation Professionnelle n°6 — Développement d'une interface Web consommant une API
