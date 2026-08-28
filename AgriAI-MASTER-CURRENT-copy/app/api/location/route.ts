import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url, { cache: "no-store", headers: { "User-Agent": "AgriAI/1.0" } });
    if (!response.ok) throw new Error("Reverse geocoding provider failed.");
    const data = await response.json();

    const city = data.city || data.locality || data.principalSubdivision || "Unknown city";
    const district = data.localityInfo?.administrative?.find((x: any) => /district/i.test(String(x.description || "")))?.name || data.locality || "";

    return NextResponse.json({
      latitude: lat,
      longitude: lon,
      coordinates: { latitude: lat, longitude: lon },
      city,
      district,
      state: data.principalSubdivision || "",
      country: data.countryName || "",
      countryCode: data.countryCode || "",
      displayName: [city, data.principalSubdivision, data.countryName].filter(Boolean).join(", "),
      source: "BigDataCloud reverse geocoding",
    });
  } catch (error) {
    return NextResponse.json({
      latitude: lat,
      longitude: lon,
      coordinates: { latitude: lat, longitude: lon },
      city: "Location detected",
      district: "",
      state: "",
      country: "",
      displayName: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      source: "GPS coordinates only",
      warning: error instanceof Error ? error.message : "Reverse geocoding unavailable.",
    });
  }
}
