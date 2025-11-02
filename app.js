// WeatherGuard - Emergency Weather System
// Real-time weather data from NOAA/NWS API

class WeatherGuard {
    constructor() {
        this.currentLocation = null;
        this.weatherData = null;
        this.map = null;
        this.radarLayer = null;
        this.initializeEventListeners();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('locationBtn').addEventListener('click', () => this.detectLocation());
        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        document.getElementById('retryBtn')?.addEventListener('click', () => this.handleSearch());
        document.getElementById('closeEmergency')?.addEventListener('click', () => this.closeEmergencyBanner());
    }

    // Show loading state
    showLoading() {
        this.hideElement('weatherContent');
        this.hideElement('errorState');
        this.showElement('loadingState');
    }

    // Show error state
    showError(title, message) {
        this.hideElement('weatherContent');
        this.hideElement('loadingState');
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
        this.showElement('errorState');
    }

    // Show weather content
    showWeatherContent() {
        this.hideElement('loadingState');
        this.hideElement('errorState');
        this.showElement('weatherContent');
    }

    // Utility functions for showing/hiding elements
    showElement(id) {
        document.getElementById(id)?.classList.remove('hidden');
    }

    hideElement(id) {
        document.getElementById(id)?.classList.add('hidden');
    }

    // Handle location search
    async handleSearch() {
        const input = document.getElementById('locationInput').value.trim();

        if (!input) {
            this.showError('Location Required', 'Please enter a city, state, or ZIP code.');
            return;
        }

        this.showLoading();

        try {
            // Geocode the location
            const coords = await this.geocodeLocation(input);
            this.currentLocation = { name: input, ...coords };

            // Fetch weather data
            await this.fetchWeatherData(coords.lat, coords.lon);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Location Not Found', `Unable to find weather data for "${input}". Please try a different location or use your current location.`);
        }
    }

    // Detect user's current location
    async detectLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation Not Supported', 'Your browser does not support location detection. Please enter a location manually.');
            return;
        }

        this.showLoading();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocode to get location name
                    const locationName = await this.reverseGeocode(latitude, longitude);
                    this.currentLocation = { name: locationName, lat: latitude, lon: longitude };

                    // Fetch weather data
                    await this.fetchWeatherData(latitude, longitude);
                } catch (error) {
                    console.error('Location detection error:', error);
                    this.showError('Location Error', 'Unable to fetch weather data for your location. Please try entering a location manually.');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showError('Location Access Denied', 'Please enable location access or enter a location manually.');
            }
        );
    }

    // Geocode location string to coordinates
    async geocodeLocation(location) {
        // Using OpenStreetMap Nominatim API for geocoding
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'WeatherGuard Emergency Weather App'
            }
        });

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        if (data.length === 0) {
            throw new Error('Location not found');
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    }

    // Reverse geocode coordinates to location name
    async reverseGeocode(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'WeatherGuard Emergency Weather App'
            }
        });

        if (!response.ok) {
            return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }

        const data = await response.json();
        const address = data.address;

        if (address.city && address.state) {
            return `${address.city}, ${address.state}`;
        } else if (address.town && address.state) {
            return `${address.town}, ${address.state}`;
        } else if (address.county && address.state) {
            return `${address.county}, ${address.state}`;
        }

        return data.display_name.split(',').slice(0, 2).join(',');
    }

    // Fetch weather data from NOAA API
    async fetchWeatherData(lat, lon) {
        try {
            // Step 1: Get grid point data
            const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
            const pointsResponse = await fetch(pointsUrl);

            if (!pointsResponse.ok) {
                throw new Error('Unable to fetch weather grid data');
            }

            const pointsData = await pointsResponse.json();

            // Step 2: Get forecast and alerts URLs
            const forecastUrl = pointsData.properties.forecast;
            const forecastHourlyUrl = pointsData.properties.forecastHourly;
            const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
            const observationStationsUrl = pointsData.properties.observationStations;

            // Step 3: Fetch all data in parallel
            const [forecastData, hourlyData, alertsData, stationsData] = await Promise.all([
                fetch(forecastUrl).then(r => r.json()),
                fetch(forecastHourlyUrl).then(r => r.json()),
                fetch(alertsUrl).then(r => r.json()),
                fetch(observationStationsUrl).then(r => r.json())
            ]);

            // Step 4: Get current observations from nearest station
            let currentObservations = null;
            if (stationsData.features && stationsData.features.length > 0) {
                const stationId = stationsData.features[0].properties.stationIdentifier;
                const observationsUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
                const obsResponse = await fetch(observationsUrl);
                if (obsResponse.ok) {
                    currentObservations = await obsResponse.json();
                }
            }

            // Store weather data
            this.weatherData = {
                forecast: forecastData.properties.periods,
                hourly: hourlyData.properties.periods,
                alerts: alertsData.features,
                current: currentObservations?.properties || null,
                location: pointsData.properties
            };

            // Render all weather information
            this.renderWeather();
            this.showWeatherContent();

        } catch (error) {
            console.error('Weather fetch error:', error);
            throw error;
        }
    }

    // Render all weather information
    renderWeather() {
        this.renderLocation();
        this.renderAlerts();
        this.renderCurrentWeather();
        this.renderForecast();
        this.renderHourlyForecast();
        this.initializeMap();
    }

    // Render location information
    renderLocation() {
        const locationTitle = document.getElementById('currentLocation');
        const lastUpdated = document.getElementById('lastUpdated');

        locationTitle.textContent = this.currentLocation.name;

        const now = new Date();
        lastUpdated.textContent = `Last updated: ${now.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    }

    // Render weather alerts - V2 ENHANCED with MEGA prominent display
    renderAlerts() {
        const emergencyAlertsSection = document.getElementById('emergencyAlertsSection');
        const emergencyAlertsContainer = document.getElementById('emergencyAlertsContainer');
        const emergencyBanner = document.getElementById('emergencyBanner');

        if (!this.weatherData.alerts || this.weatherData.alerts.length === 0) {
            // Show "All Clear" message
            emergencyAlertsContainer.innerHTML = `
                <div class="no-alerts-message">
                    <h3>✅ No Active Weather Alerts</h3>
                    <p>Weather conditions are normal for ${this.currentLocation.name}</p>
                </div>
            `;
            this.showElement('emergencyAlertsSection');
            emergencyBanner.classList.add('hidden');
            return;
        }

        // Sort alerts by severity
        const severityOrder = { 'Extreme': 0, 'Severe': 1, 'Moderate': 2, 'Minor': 3 };
        const sortedAlerts = [...this.weatherData.alerts].sort((a, b) => {
            const severityA = severityOrder[a.properties.severity] || 4;
            const severityB = severityOrder[b.properties.severity] || 4;
            return severityA - severityB;
        });

        // Show emergency banner for severe alerts
        const topAlert = sortedAlerts[0];
        if (topAlert.properties.severity === 'Extreme' || topAlert.properties.severity === 'Severe') {
            document.getElementById('emergencyTitle').textContent = topAlert.properties.event;
            document.getElementById('emergencyMessage').textContent = topAlert.properties.headline || topAlert.properties.description;
            emergencyBanner.classList.remove('hidden');
        }

        // Clear container
        emergencyAlertsContainer.innerHTML = '';

        // Show alerts section
        this.showElement('emergencyAlertsSection');

        // Render MEGA emergency alerts
        sortedAlerts.forEach((alert, index) => {
            const props = alert.properties;
            const severity = (props.severity || 'Minor').toLowerCase();

            // Get warning icon based on event type
            const icon = this.getAlertIcon(props.event);

            // Create MEGA alert card
            const alertCard = document.createElement('div');
            alertCard.className = `emergency-alert-mega ${severity}`;

            const effectiveDate = new Date(props.effective).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const expiresDate = props.ends ? new Date(props.ends).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }) : 'Until further notice';

            alertCard.innerHTML = `
                <div class="emergency-alert-header">
                    <div class="emergency-alert-icon">${icon}</div>
                    <div class="emergency-alert-header-text">
                        <h2>⚠️ WEATHER ALERT ⚠️</h2>
                        <span class="emergency-alert-severity-badge">${props.severity || 'Alert'} WARNING</span>
                    </div>
                </div>

                <div class="emergency-alert-content">
                    <div class="emergency-alert-event">${props.event}</div>
                    <div class="emergency-alert-description">
                        ${props.headline || props.description}
                    </div>

                    <div class="emergency-alert-meta">
                        <div class="emergency-alert-meta-item">
                            <span>📍</span>
                            <span><strong>Area:</strong> ${props.areaDesc || this.currentLocation.name}</span>
                        </div>
                        <div class="emergency-alert-meta-item">
                            <span>🕐</span>
                            <span><strong>Effective:</strong> ${effectiveDate}</span>
                        </div>
                        <div class="emergency-alert-meta-item">
                            <span>⏰</span>
                            <span><strong>Expires:</strong> ${expiresDate}</span>
                        </div>
                        ${props.urgency ? `
                        <div class="emergency-alert-meta-item">
                            <span>⚡</span>
                            <span><strong>Urgency:</strong> ${props.urgency}</span>
                        </div>
                        ` : ''}
                    </div>

                    ${props.instruction ? `
                    <div class="emergency-alert-description" style="margin-top: 1rem;">
                        <strong>⚠️ INSTRUCTIONS:</strong><br>
                        ${props.instruction}
                    </div>
                    ` : ''}
                </div>
            `;

            emergencyAlertsContainer.appendChild(alertCard);
        });
    }

    // Get appropriate icon for alert type
    getAlertIcon(eventType) {
        const event = eventType.toLowerCase();

        if (event.includes('tornado')) return '🌪️';
        if (event.includes('hurricane')) return '🌀';
        if (event.includes('flood')) return '🌊';
        if (event.includes('thunder') || event.includes('storm')) return '⛈️';
        if (event.includes('winter') || event.includes('snow') || event.includes('blizzard')) return '❄️';
        if (event.includes('heat')) return '🔥';
        if (event.includes('wind')) return '💨';
        if (event.includes('freeze') || event.includes('frost')) return '🧊';
        if (event.includes('fire')) return '🔥';
        if (event.includes('dust')) return '🌫️';

        return '⚠️';
    }

    // Close emergency banner
    closeEmergencyBanner() {
        document.getElementById('emergencyBanner').classList.add('hidden');
    }

    // Render current weather conditions
    renderCurrentWeather() {
        const current = this.weatherData.current;
        const forecast = this.weatherData.forecast[0];

        if (current) {
            // Use actual observations
            const tempC = current.temperature?.value;
            const tempF = tempC !== null ? this.celsiusToFahrenheit(tempC) : null;

            document.getElementById('currentTemp').textContent = tempF !== null ? Math.round(tempF) : '--';
            document.getElementById('currentCondition').textContent = current.textDescription || forecast.shortForecast;

            const feelsLikeC = current.windChill?.value || current.heatIndex?.value || tempC;
            const feelsLikeF = feelsLikeC !== null ? this.celsiusToFahrenheit(feelsLikeC) : null;
            document.getElementById('feelsLike').textContent = feelsLikeF !== null ? Math.round(feelsLikeF) : '--';

            document.getElementById('humidity').textContent =
                current.relativeHumidity?.value ? `${Math.round(current.relativeHumidity.value)}%` : '--%';

            const windSpeedMs = current.windSpeed?.value;
            const windSpeedMph = windSpeedMs !== null ? this.metersPerSecondToMph(windSpeedMs) : null;
            document.getElementById('windSpeed').textContent =
                windSpeedMph !== null ? `${Math.round(windSpeedMph)} mph ${current.windDirection?.value ? this.degreesToDirection(current.windDirection.value) : ''}` : '-- mph';

            const pressurePa = current.barometricPressure?.value;
            const pressureMb = pressurePa !== null ? (pressurePa / 100).toFixed(1) : null;
            document.getElementById('pressure').textContent = pressureMb !== null ? `${pressureMb} mb` : '-- mb';

            const visibilityM = current.visibility?.value;
            const visibilityMi = visibilityM !== null ? this.metersToMiles(visibilityM) : null;
            document.getElementById('visibility').textContent =
                visibilityMi !== null ? `${visibilityMi.toFixed(1)} mi` : '-- mi';
        } else {
            // Use forecast data
            document.getElementById('currentTemp').textContent = forecast.temperature || '--';
            document.getElementById('currentCondition').textContent = forecast.shortForecast;
            document.getElementById('feelsLike').textContent = forecast.temperature || '--';
            document.getElementById('humidity').textContent = '--%';
            document.getElementById('windSpeed').textContent = forecast.windSpeed || '-- mph';
            document.getElementById('pressure').textContent = '-- mb';
            document.getElementById('visibility').textContent = '-- mi';
        }
    }

    // Render 7-day forecast
    renderForecast() {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Show up to 7 periods (usually includes day and night)
        const periods = this.weatherData.forecast.slice(0, 14);

        periods.forEach(period => {
            const card = document.createElement('div');
            card.className = 'forecast-card';

            const icon = this.getWeatherIcon(period.shortForecast);

            card.innerHTML = `
                <div class="forecast-day">${period.name}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">
                    <span class="${period.isDaytime ? 'temp-high' : 'temp-low'}">${period.temperature}°</span>
                </div>
                <div class="forecast-description">${period.shortForecast}</div>
            `;

            forecastContainer.appendChild(card);
        });
    }

    // Render hourly forecast
    renderHourlyForecast() {
        const hourlyContainer = document.getElementById('hourlyContainer');
        hourlyContainer.innerHTML = '';

        // Show next 24 hours
        const hours = this.weatherData.hourly.slice(0, 24);

        hours.forEach(hour => {
            const card = document.createElement('div');
            card.className = 'hourly-card';

            const time = new Date(hour.startTime);
            const timeString = time.toLocaleString('en-US', { hour: 'numeric', hour12: true });
            const icon = this.getWeatherIcon(hour.shortForecast);

            card.innerHTML = `
                <div class="hourly-time">${timeString}</div>
                <div class="hourly-icon">${icon}</div>
                <div class="hourly-temp">${hour.temperature}°</div>
            `;

            hourlyContainer.appendChild(card);
        });
    }

    // Get weather icon based on description
    getWeatherIcon(description) {
        const desc = description.toLowerCase();

        if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
        if (desc.includes('rain') || desc.includes('shower')) return '🌧️';
        if (desc.includes('snow') || desc.includes('flurries')) return '❄️';
        if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
        if (desc.includes('cloud') || desc.includes('overcast')) return '☁️';
        if (desc.includes('partly')) return '⛅';
        if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
        if (desc.includes('wind')) return '💨';

        return '🌤️';
    }

    // Conversion utilities
    celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    metersPerSecondToMph(mps) {
        return mps * 2.237;
    }

    metersToMiles(meters) {
        return meters * 0.000621371;
    }

    degreesToDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    // Initialize interactive map with weather radar
    initializeMap() {
        const mapContainer = document.getElementById('radarMap');

        // Clear existing map if any
        if (this.map) {
            this.map.remove();
        }

        // Create map centered on current location
        this.map = L.map('radarMap').setView(
            [this.currentLocation.lat, this.currentLocation.lon],
            8
        );

        // Add base map layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add location marker
        const marker = L.marker([this.currentLocation.lat, this.currentLocation.lon])
            .addTo(this.map)
            .bindPopup(`<strong>${this.currentLocation.name}</strong><br>Your selected location`)
            .openPopup();

        // Add NOAA Weather Radar Layer
        // Using NOAA's WMS (Web Map Service) for radar data
        this.radarLayer = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi', {
            layers: 'nexrad-n0r-900913',
            format: 'image/png',
            transparent: true,
            attribution: 'NOAA/NWS Radar',
            opacity: 0.6
        }).addTo(this.map);

        // Add map controls info
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <strong>Weather Radar</strong><br>
                    <small>Live NOAA radar data</small>
                </div>
            `;
            return div;
        };
        legend.addTo(this.map);

        // Add alert zones if there are active alerts
        if (this.weatherData.alerts && this.weatherData.alerts.length > 0) {
            this.weatherData.alerts.forEach(alert => {
                const geometry = alert.geometry;
                if (geometry && geometry.coordinates) {
                    try {
                        // NOAA alerts use GeoJSON format
                        L.geoJSON(geometry, {
                            style: {
                                color: '#d83933',
                                weight: 2,
                                fillColor: '#d83933',
                                fillOpacity: 0.2
                            }
                        }).addTo(this.map).bindPopup(`
                            <strong>${alert.properties.event}</strong><br>
                            ${alert.properties.headline || ''}
                        `);
                    } catch (e) {
                        console.log('Could not render alert zone:', e);
                    }
                }
            });
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherGuard();

    // Load a default location (or show instructions)
    console.log('WeatherGuard Emergency Weather System initialized');
});
