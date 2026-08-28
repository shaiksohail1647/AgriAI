import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Weather provider request failed." }, { status: 502 });
  }

  const data = await upstream.json();

  return NextResponse.json({
    source: "Open-Meteo",
    coordinates: { latitude: lat, longitude: lon },
    timezone: data.timezone,
    current: data.current,
    daily: data.daily
  });
}
