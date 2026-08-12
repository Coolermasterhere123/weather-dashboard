// Weather Dashboard App
// API keys are read from environment variables at runtime

// DOM elements
var cityInput = document.getElementById('cityInput');
var searchBtn = document.getElementById('searchBtn');
var locationBtn = document.getElementById('locationBtn');
var loading = document.getElementById('loading');
var errorMessage = document.getElementById('errorMessage');
var currentWeather = document.getElementById('currentWeather');
var forecast = document.getElementById('forecast');
var cityName = document.getElementById('cityName');
var weatherDate = document.getElementById('weatherDate');
var temperature = document.getElementById('temperature');
var weatherDesc = document.getElementById('weatherDesc');
var humidity = document.getElementById('humidity');
var windSpeed = document.getElementById('windSpeed');
var feelsLike = document.getElementById('feelsLike');
var pressure = document.getElementById('pressure');
var aiSummary = document.getElementById('aiSummary');
var refreshAiBtn = document.getElementById('refreshAiBtn');
var forecastList = document.getElementById('forecastList');
var recentCities = document.getElementById('recentCities');

// State
var currentCity = '';
var recentSearches = JSON.parse(localStorage.getItem('weather_recent') || '[]');
var currentWeatherData = null;
var API_KEY = '';
var GROQ_KEY = '';

// Fetch API keys from server
function fetchApiKeys() {
  return fetch('/api/config')
    .then(function(response) { return response.json(); })
    .then(function(config) {
      API_KEY = config.openweather_api_key || '';
      GROQ_KEY = config.groq_api_key || '';
      console.log('API keys loaded');
    })
    .catch(function(error) {
      console.error('Error loading API keys:', error);
      API_KEY = window.OPENWEATHER_API_KEY || '';
      GROQ_KEY = window.GROQ_API_KEY || '';
    });
}

function init() {
  console.log('Initializing...');
  fetchApiKeys().then(function() {
    renderRecentSearches();
    if (recentSearches.length > 0) {
      currentCity = recentSearches[0];
      fetchWeather(currentCity);
    }
  });
  
  searchBtn.addEventListener('click', function() {
    var city = cityInput.value.trim();
    if (city) fetchWeather(city);
  });
  
  cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchBtn.click();
  });
  
  locationBtn.addEventListener('click', getLocationWeather);
  refreshAiBtn.addEventListener('click', function() {
    if (currentWeatherData) getAISummary(currentWeatherData);
  });
}

function fetchWeather(city) {
  console.log('Fetching weather for:', city);
  showLoading();
  hideError();
  if (!API_KEY) {
    showError('API key not configured.');
    hideLoading();
    return;
  }
  
  var url = 'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&units=metric&appid=' + API_KEY;
  
  fetch(url)
    .then(function(response) {
      if (!response.ok) {
        if (response.status === 404) showError('City not found.');
        else if (response.status === 401) showError('Invalid API key.');
        else showError('Failed to fetch weather.');
        hideLoading();
        return;
      }
      return response.json();
    })
    .then(function(data) {
      if (!data) return;
      currentCity = data.name;
      currentWeatherData = data;
      displayCurrentWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
      getAISummary(data);
      addRecentSearch(data.name);
      hideLoading();
      currentWeather.style.display = 'block';
      forecast.style.display = 'block';
    })
    .catch(function(error) {
      console.error('Fetch error:', error);
      showError('Network error.');
      hideLoading();
    });
}

function fetchForecast(lat, lon) {
  var url = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&units=metric&appid=' + API_KEY;
  
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      var dailyForecast = {};
      data.list.forEach(function(item) {
        var date = new Date(item.dt * 1000);
        var day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyForecast[day]) {
          dailyForecast[day] = {
            temp_min: item.main.temp_min,
            temp_max: item.main.temp_max,
            description: item.weather[0].description
          };
        } else {
          dailyForecast[day].temp_min = Math.min(dailyForecast[day].temp_min, item.main.temp_min);
          dailyForecast[day].temp_max = Math.max(dailyForecast[day].temp_max, item.main.temp_max);
        }
      });
      displayForecast(dailyForecast);
    })
    .catch(function(error) {
      console.error('Forecast error:', error);
    });
}

function displayCurrentWeather(data) {
  cityName.textContent = data.name + ', ' + data.sys.country;
  weatherDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  temperature.textContent = Math.round(data.main.temp) + '°C';
  weatherDesc.textContent = data.weather[0].description;
  humidity.textContent = data.main.humidity + '%';
  windSpeed.textContent = Math.round(data.wind.speed * 3.6) + ' km/h';
  feelsLike.textContent = Math.round(data.main.feels_like) + '°C';
  pressure.textContent = data.main.pressure + ' hPa';
}

function displayForecast(forecastData) {
  var days = Object.keys(forecastData);
  var html = '';
  days.forEach(function(day) {
    var data = forecastData[day];
    var avgTemp = Math.round((data.temp_min + data.temp_max) / 2);
    html += '<div class="forecast-item">';
    html += '<div class="day">' + day + '</div>';
    html += '<div class="temp">' + avgTemp + '°C</div>';
    html += '<div class="desc">' + data.description + '</div>';
    html += '<div style="font-size:0.75rem;color:var(--gray-400);">';
    html += '↑' + Math.round(data.temp_max) + '° ↓' + Math.round(data.temp_min) + '°';
    html += '</div></div>';
  });
  forecastList.innerHTML = html;
}

// SIMPLIFIED AI SUMMARY - NO COMPLEX STRINGS
function getAISummary(weatherData) {
  aiSummary.textContent = 'Generating AI analysis...';
  
  if (!GROQ_KEY) {
    aiSummary.textContent = '💡 Groq API key not configured.';
    return;
  }
  
  // Build message using array join (avoid string concatenation issues)
  var parts = [
    'Provide a brief weather insight for',
    weatherData.name + ', Canada.',
    'Current conditions:',
    weatherData.weather[0].description + ',',
    Math.round(weatherData.main.temp) + '°C,',
    'humidity ' + weatherData.main.humidity + '%,',
    'wind ' + Math.round(weatherData.wind.speed * 3.6) + ' km/h.'
  ];
  var userMessage = parts.join(' ');
  
  // Build request body
  var requestBody = {
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a weather expert. Provide helpful, concise weather insights for British Columbia residents.' },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 150
  };
  
  // Make API call
  fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_KEY
    },
    body: JSON.stringify(requestBody)
  })
  .then(function(response) { return response.json(); })
  .then(function(data) {
    if (data.choices && data.choices[0]) {
      aiSummary.textContent = data.choices[0].message.content;
    } else {
      aiSummary.textContent = 'Unable to generate AI analysis.';
    }
  })
  .catch(function(error) {
    console.error('AI summary error:', error);
    aiSummary.textContent = '⚠️ AI analysis unavailable.';
  });
}

function getLocationWeather() {
  if (!navigator.geolocation) {
    showError('Geolocation not supported.');
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&units=metric&appid=' + API_KEY;
      fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(data) {
          cityInput.value = data.name;
          fetchWeather(data.name);
        })
        .catch(function() {
          showError('Failed to get weather for your location.');
          hideLoading();
        });
    },
    function() {
      showError('Unable to access location.');
      hideLoading();
    }
  );
}

function addRecentSearch(city) {
  recentSearches = recentSearches.filter(function(c) { return c !== city; });
  recentSearches.unshift(city);
  if (recentSearches.length > 5) recentSearches.pop();
  localStorage.setItem('weather_recent', JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  if (recentSearches.length === 0) {
    recentCities.innerHTML = '<span style="color:var(--gray-400);font-size:0.875rem;">No recent searches</span>';
    return;
  }
  var html = '';
  recentSearches.forEach(function(city) {
    html += '<span class="recent-tag" onclick="fetchWeather('' + city + '')">' + city + '</span>';
  });
  recentCities.innerHTML = html;
}

function showLoading() {
  loading.style.display = 'block';
  currentWeather.style.display = 'none';
  forecast.style.display = 'none';
}

function hideLoading() {
  loading.style.display = 'none';
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = '❌ ' + message;
}

function hideError() {
  errorMessage.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);