// Geographic coordinates for major districts in Maharashtra and Gujarat to compute real-world distances
export interface DistrictCoords {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const DISTRICT_COORDINATES: Record<string, DistrictCoords> = {
  // Maharashtra
  "nashik": { name: "Nashik", state: "Maharashtra", lat: 20.0056, lng: 73.7898 },
  "pune": { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  "mumbai": { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  "nagpur": { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  "jalgaon": { name: "Jalgaon", state: "Maharashtra", lat: 21.0077, lng: 75.5626 },
  "kolhapur": { name: "Kolhapur", state: "Maharashtra", lat: 16.7050, lng: 74.2433 },
  // Gujarat
  "anand": { name: "Anand", state: "Gujarat", lat: 22.5645, lng: 72.9289 },
  "ahmedabad": { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  "surat": { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  "rajkot": { name: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  "mehsana": { name: "Mehsana", state: "Gujarat", lat: 23.5880, lng: 72.3693 },
  "amreli": { name: "Amreli", state: "Gujarat", lat: 21.6033, lng: 71.2148 }
};

// Calculate geodesic distance between two coordinate points using the Haversine formula
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.max(1, Math.round(distance * 100) / 100); // round to 2 decimal places
}

export function getDistanceBetweenDistricts(dist1: string, dist2: string): number {
  const d1 = DISTRICT_COORDINATES[dist1.toLowerCase().trim()];
  const d2 = DISTRICT_COORDINATES[dist2.toLowerCase().trim()];
  
  if (!d1 || !d2) {
    return 120;
  }
  
  return calculateHaversineDistance(d1.lat, d1.lng, d2.lat, d2.lng);
}

// Calculate distance using exact GPS coordinates if available, else district fallbacks
export function getDistanceBetweenLocations(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
  fallbackDist1?: string,
  fallbackDist2?: string
): number {
  if (
    lat1 != null &&
    lon1 != null &&
    lat2 != null &&
    lon2 != null &&
    !isNaN(lat1) &&
    !isNaN(lon1) &&
    !isNaN(lat2) &&
    !isNaN(lon2) &&
    (lat1 !== 0 || lon1 !== 0)
  ) {
    const dist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    if (dist > 0) return dist;
  }

  if (fallbackDist1 && fallbackDist2) {
    return getDistanceBetweenDistricts(fallbackDist1, fallbackDist2);
  }

  return 40; // Default intra-district fallback distance in km
}

// Calculate transport fee based on load (quintals), distance (km), and transport mode (Shared vs Dedicated)
export function calculateTransportFee(
  weight: number, // in quintals
  distance: number, // in km
  mode: "SHARED" | "DEDICATED"
): number {
  let fee = 0;
  
  if (mode === "DEDICATED") {
    const base = 800; // flat vehicle hiring base fee
    const perKm = 12 * distance;
    fee = base + perKm;
  } else {
    // Shared transport pools multiple farmers, so pricing is per-unit
    const basePerQuintal = 100;
    const perKmPerQuintal = 1.5 * distance;
    fee = weight * (basePerQuintal + perKmPerQuintal);
  }
  
  return Math.round(fee * 100) / 100;
}
