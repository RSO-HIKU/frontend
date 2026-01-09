import { getServiceUrl } from "./appConfig";

export type WeatherDto = {
  temp?: string | null;
  wind_kmh?: string | null;
  wind_dir?: string;
  icon?: string;
  desc?: string;
  snow_var_desc?: string;
  snow_var_unit?: string;
};

const API_URL = getServiceUrl("/api/weather");

export async function fetchWeatherData(): Promise<WeatherDto> {
    console.log(`[fetchWeatherData] Fetching from: ${API_URL}/current`);
  try {
    const res = await fetch(`${API_URL}/current`);
    if (!res.ok) {
      console.error(`Weather fetch failed with status ${res.status}`);
      return {};
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return {};
  }
}
