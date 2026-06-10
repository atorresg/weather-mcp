# weather-mcp

A Model Context Protocol (MCP) server that provides weather forecast data using the free [Open-Meteo](https://open-meteo.com/) API.

## Features

- **Current conditions** — temperature, feels-like, humidity, wind speed & direction
- **Daily forecast** — high/low temperatures, precipitation probability, UV index, sunrise/sunset
- **Hourly breakdown** — today's hour-by-hour temperatures and rain chance
- **Free & keyless** — no API key required
- **Multi-format** — `text` (human-readable) or `json` output

## Tools

### `get_forecast`

Returns a weather forecast for a given location.

**Arguments:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | Yes | Latitude (-90 to 90) |
| `longitude` | number | Yes | Longitude (-180 to 180) |
| `days` | number | No | Forecast days (1–16, default: 7) |
| `format` | string | No | `text` (default) or `json` |

**Example (text):**

```
Weather forecast for 40.7128, -74.0060 (America/New_York)

Current conditions (day):
  Mainly clear
  Temperature: 27.2°C (feels like 27.2°C)
  Humidity: 0%
  Wind: 13.8 km/h S

Today's hourly forecast:
  00:00: 21.9°C, Overcast
  01:00: 21.2°C, Clear sky
  ...

Daily forecast (5 days):
  2026-06-10: Dense drizzle | H:30° L:21° | 43% chance of rain (1.3mm) | UV 6.45 ⚠️
  2026-06-11: Overcast | H:36° L:22° | 53% chance of rain (0mm) | UV 6.35 ⚠️
  ...

Source: Open-Meteo.com (https://open-meteo.org/en/docs) | © Open-Meteo.com
```

**Example (JSON):**

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "timezone": "America/New_York",
  "current": {
    "temperature": 27.2,
    "apparent_temperature": 27.2,
    "humidity": 0,
    "wind_speed": 13.8,
    "wind_direction": 174,
    "wind_direction_label": "S",
    "weather_code": 1,
    "weather_description": "Mainly clear",
    "is_day": true
  },
  "daily": [...],
  "hourly_today": [...],
  "source": "open-meteo.com"
}
```

## Installation

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "weather-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "weather-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.config/windsurf/config.json` or the workspace config:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "weather-mcp"]
    }
  }
}
```

### Smithery

Install via [Smithery](https://smithery.ai/):

```bash
npx -y @smithery/cli install weather-mcp --client claude
```

### Build from source

```bash
git clone https://github.com/atorresg/weather-mcp.git
cd weather-mcp
npm install
npm run build
```

## Development

```bash
npm install
npm run dev        # Run with tsx (no build needed)
npm run lint       # Lint with ESLint
npm run lint:fix   # Auto-fix lint issues
npm run build      # Build CJS + ESM + types
```

## Attribution

Weather data provided by [Open-Meteo](https://open-meteo.com/).  
© Open-Meteo.com — CC BY-SA 4.0 (attribution required if redistributing).

## License

MIT © 2025 Alejandro Torres G.
