#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { GET_FORECAST } from './tools.js';
import { Forecast, getForecast, ProviderError } from './providers.js';

// === Formatters ===

function formatForecastText(f: Forecast): string {
  const lines: string[] = [];
  const { current, daily, hourly_today, timezone } = f;

  lines.push(`Weather forecast for ${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)} (${timezone})`);
  lines.push('');

  // Current conditions
  const dayNight = current.is_day ? '(day)' : '(night)';
  lines.push(`Current conditions ${dayNight}:`);
  lines.push(`  ${current.weather_description}`);
  lines.push(`  Temperature: ${current.temperature}°C (feels like ${current.apparent_temperature}°C)`);
  lines.push(`  Humidity: ${current.humidity}%`);
  lines.push(`  Wind: ${current.wind_speed} km/h ${current.wind_direction_label}`);
  lines.push('');

  // Today's hourly
  if (hourly_today.length > 0) {
    lines.push("Today's hourly forecast:");
    for (const h of hourly_today.slice(0, 8)) {
      const precip = h.precipitation_probability > 0 ? ` | ${h.precipitation_probability}% rain` : '';
      lines.push(`  ${h.hour}: ${h.temperature}°C, ${h.weather_description}${precip}`);
    }
    lines.push('');
  }

  // Daily forecast
  lines.push(`Daily forecast (${daily.length} days):`);
  for (const day of daily.slice(0, 7)) {
    const precip = day.precipitation_probability_max > 0
      ? ` | ${day.precipitation_probability_max}% chance of rain (${day.precipitation_sum_mm}mm)`
      : '';
    const uv = day.uv_index_max >= 3 ? ` | UV ${day.uv_index_max} ⚠️` : '';
    lines.push(
      `  ${day.date}: ${day.weather_description} | ` +
        `H:${day.temperature_max.toFixed(0)}° L:${day.temperature_min.toFixed(0)}°${precip}${uv}`,
    );
  }

  if (daily.length > 7) {
    lines.push('');
    lines.push(`(Extended forecast available for ${daily.length - 7} more days in JSON format)`);
  }

  lines.push('');
  lines.push('Source: Open-Meteo.com (https://open-meteo.org/en/docs) | © Open-Meteo.com');

  return lines.join('\n');
}

function formatForecastJson(f: Forecast): string {
  return JSON.stringify(f, null, 2);
}

function errorMessage(error: unknown): string {
  if (error instanceof ProviderError) return `${error.provider}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

// === Server ===

const server = new McpServer(
  { name: 'weather-mcp', version: '0.1.0' },
  { capabilities: { tools: {}, logging: {} } },
);

server.registerTool(
  GET_FORECAST.name,
  {
    description: GET_FORECAST.description,
    inputSchema: GET_FORECAST.schema,
  },
  async (args) => {
    try {
      const forecast = await getForecast(args.latitude, args.longitude, args.days);
      const text =
        args.format === 'json' ? formatForecastJson(forecast) : formatForecastText(forecast);
      return {
        content: [{ type: 'text' as const, text }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${errorMessage(error)}` }],
        isError: true,
      };
    }
  },
);

async function runServer() {
  try {
    process.stdout.write('Starting Weather MCP server...\n');
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error starting Weather MCP server: ${message}\n`);
    process.exit(1);
  }
}

runServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error running Weather MCP server: ${message}\n`);
  process.exit(1);
});