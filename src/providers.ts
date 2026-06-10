/**
 * Open-Meteo weather provider layer.
 *
 * Open-Meteo is a free, open-source weather API with global coverage.
 * No API key required. Attribution required: "© Open-Meteo.com"
 *
 * Docs: https://open-meteo.org/en/docs
 */

const REQUEST_TIMEOUT_MS = 5000;

export type LocationSource = 'open-meteo.com';

export type CurrentWeather = {
  temperature: number;
  apparent_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  wind_direction_label: string;
  weather_code: number;
  weather_description: string;
  is_day: boolean;
};

export type DailyForecast = {
  date: string;
  weather_code: number;
  weather_description: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability_max: number;
  precipitation_sum_mm: number;
  wind_speed_max_kmh: number;
  uv_index_max: number;
  sunrise: string;
  sunset: string;
};

export type HourlyBreakdown = {
  hour: string;
  temperature: number;
  precipitation_probability: number;
  weather_description: string;
};

export type Forecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly_today: HourlyBreakdown[];
  source: LocationSource;
};

// === WMO Weather Code translations ===

function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function wmoToDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56: return 'Light freezing drizzle';
    case 57: return 'Dense freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66: return 'Light freezing rain';
    case 67: return 'Heavy freezing rain';
    case 71: return 'Slight snow fall';
    case 73: return 'Moderate snow fall';
    case 75: return 'Heavy snow fall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return `Unknown weather (code ${code})`;
  }
}

// === Open-Meteo API client ===

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather?: {
    temperature: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    uv_index?: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

export class ProviderError extends Error {
  constructor(
    public readonly provider: LocationSource | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      let body = '';
      try { body = (await response.text()).slice(0, 200); } catch { /* ignore */ }
      throw new ProviderError('unknown', `HTTP ${response.status} ${response.statusText}${body ? `: ${body}` : ''}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProviderError('unknown', `Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new ProviderError('unknown', `Network error: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getForecast(
  latitude: number,
  longitude: number,
  days = 7,
): Promise<Forecast> {
  const hourlyFields = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation_probability',
    'weather_code',
    'wind_speed_10m',
    'uv_index',
  ].join(',');

  const dailyFields = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_probability_max',
    'precipitation_sum',
    'wind_speed_10m_max',
    'uv_index_max',
    'sunrise',
    'sunset',
  ].join(',');

  const url =
    `${OPEN_METEO_BASE}` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    '&current_weather=true' +
    `&hourly=${hourlyFields}` +
    `&daily=${dailyFields}` +
    '&timezone=auto' +
    `&forecast_days=${days}`;

  const data = await fetchJson<OpenMeteoResponse>(url);

  if (!data.current_weather) {
    throw new ProviderError('open-meteo.com', 'Response missing current_weather data');
  }

  const cw = data.current_weather;
  const current: CurrentWeather = {
    temperature: cw.temperature,
    apparent_temperature: cw.apparent_temperature ?? cw.temperature,
    humidity: cw.relative_humidity_2m ?? 0,
    wind_speed: cw.windspeed,
    wind_direction: cw.winddirection,
    wind_direction_label: getWindDirectionLabel(cw.winddirection),
    weather_code: cw.weathercode,
    weather_description: wmoToDescription(cw.weathercode),
    is_day: cw.is_day === 1,
  };

  const daily: DailyForecast[] = [];
  if (data.daily) {
    const d = data.daily;
    for (let i = 0; i < d.time.length; i++) {
      daily.push({
        date: d.time[i],
        weather_code: d.weather_code[i],
        weather_description: wmoToDescription(d.weather_code[i]),
        temperature_max: d.temperature_2m_max[i],
        temperature_min: d.temperature_2m_min[i],
        precipitation_probability_max: d.precipitation_probability_max[i] ?? 0,
        precipitation_sum_mm: d.precipitation_sum[i] ?? 0,
        wind_speed_max_kmh: d.wind_speed_10m_max[i],
        uv_index_max: d.uv_index_max[i] ?? 0,
        sunrise: d.sunrise[i],
        sunset: d.sunset[i],
      });
    }
  }

  const hourly_today: HourlyBreakdown[] = [];
  if (data.hourly) {
    const h = data.hourly;
    // Today's date string to filter
    const todayStr = daily[0]?.date ?? '';
    for (let i = 0; i < h.time.length; i++) {
      if (!h.time[i].startsWith(todayStr)) continue;
      hourly_today.push({
        hour: h.time[i].slice(11, 16), // "2026-06-10T14:00" → "14:00"
        temperature: h.temperature_2m[i],
        precipitation_probability: h.precipitation_probability[i] ?? 0,
        weather_description: wmoToDescription(h.weather_code[i]),
      });
    }
  }

  return {
    latitude,
    longitude,
    timezone: data.timezone,
    current,
    daily,
    hourly_today,
    source: 'open-meteo.com',
  };
}