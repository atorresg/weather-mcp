import { z } from 'zod/v4';

export const GET_FORECAST = {
  name: 'get_forecast',
  description:
    'Get the weather forecast for a location given its latitude and longitude coordinates. ' +
    'Returns current conditions (temperature, feels-like, humidity, wind, weather condition) ' +
    'plus a multi-day daily forecast (up to 16 days) and today\'s hourly breakdown. ' +
    'Weather data is sourced from Open-Meteo (https://open-meteo.org), a free open-source API ' +
    'with global coverage and no API key required. ' +
    'Use this when the user asks about weather, forecast, temperature, rain, snow, or any ' +
    'weather-related query. Chain with location-mcp if you only have a city name.',
  schema: z.object({
    latitude: z
      .number()
      .min(-90)
      .max(90)
      .describe(
        'Latitude of the location in decimal degrees. Range: -90 (South) to 90 (North). ' +
          'Example: 40.7128 for New York City.',
      ),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe(
        'Longitude of the location in decimal degrees. Range: -180 (West) to 180 (East). ' +
          'Example: -74.0060 for New York City.',
      ),
    days: z
      .number()
      .int()
      .min(1)
      .max(16)
      .default(7)
      .describe(
        'Number of forecast days to return (1–16). Default: 7. ' +
          'Use 1 for today only, 7 for a week, 14–16 for extended forecasts.',
      ),
    format: z
      .enum(['text', 'json'])
      .default('text')
      .describe('Output format. "text" returns a human-readable summary; "json" returns raw structured data.'),
  }),
} as const;