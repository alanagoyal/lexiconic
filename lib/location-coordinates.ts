// Mapping of locations to approximate geographic coordinates
export const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Japan
  "Japan": { lat: 36.2048, lng: 138.2529 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Kyoto": { lat: 35.0116, lng: 135.7681 },
  "Osaka": { lat: 34.6937, lng: 135.5023 },
  "Ogimi": { lat: 26.6644, lng: 128.1711 },
  "Yokohama": { lat: 35.4437, lng: 139.6380 },
  "Toyota": { lat: 35.0833, lng: 137.1556 },

  // China
  "China": { lat: 35.8617, lng: 104.1954 },
  "Beijing": { lat: 39.9042, lng: 116.4074 },
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Xi'an": { lat: 34.3416, lng: 108.9398 },
  "Luoyang": { lat: 34.6197, lng: 112.4540 },
  "Anyang": { lat: 36.0960, lng: 114.3929 },

  // Korea
  "Seoul": { lat: 37.5665, lng: 126.9780 },
  "Andong": { lat: 36.5684, lng: 128.7294 },

  // Germany
  "Germany": { lat: 51.1657, lng: 10.4515 },
  "Berlin": { lat: 52.5200, lng: 13.4050 },
  "Munich": { lat: 48.1351, lng: 11.5820 },
  "Lübeck": { lat: 53.8655, lng: 10.6866 },
  "Freiburg": { lat: 47.9990, lng: 7.8421 },
  "Wolfsburg": { lat: 52.4227, lng: 10.7865 },
  "Mainz": { lat: 49.9929, lng: 8.2473 },
  "Bayreuth": { lat: 49.9480, lng: 11.5783 },
  "Weimar": { lat: 50.9795, lng: 11.3235 },

  // France
  "France": { lat: 46.2276, lng: 2.2137 },
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Burgundy": { lat: 47.0504, lng: 4.8720 },

  // Italy
  "Italy": { lat: 41.8719, lng: 12.5674 },
  "Rome": { lat: 41.9028, lng: 12.4964 },
  "Naples": { lat: 40.8518, lng: 14.2681 },
  "Florence": { lat: 43.7696, lng: 11.2558 },
  "Urbino": { lat: 43.7262, lng: 12.6364 },
  "Alexandria": { lat: 31.2001, lng: 29.9187 },

  // Spain
  "Spain": { lat: 40.4637, lng: -3.7492 },
  "Madrid": { lat: 40.4168, lng: -3.7038 },
  "Burgos": { lat: 42.3439, lng: -3.6969 },
  "Granada": { lat: 37.1773, lng: -3.5986 },

  // Sweden
  "Sweden": { lat: 60.1282, lng: 18.6435 },
  "Stockholm": { lat: 59.3293, lng: 18.0686 },
  "Uppsala": { lat: 59.8586, lng: 17.6389 },

  // Norway
  "Norway": { lat: 60.4720, lng: 8.4689 },
  "Oslo": { lat: 59.9139, lng: 10.7522 },

  // United Kingdom
  "Edinburgh": { lat: 55.9533, lng: -3.1883 },
  "Highlands": { lat: 57.4778, lng: -4.2247 },
  "Belfast": { lat: 54.5973, lng: -5.9301 },
  "Inverness": { lat: 57.4778, lng: -4.2247 },
  "Scotland": { lat: 56.4907, lng: -4.2026 },
  "Stornoway": { lat: 58.2096, lng: -6.3850 },
  "Gwynedd": { lat: 52.9169, lng: -4.1337 },

  // Turkey
  "Istanbul": { lat: 41.0082, lng: 28.9784 },

  // Greece
  "Athens": { lat: 37.9838, lng: 23.7275 },
  "Ionia": { lat: 38.0, lng: 27.0 },

  // Netherlands
  "Netherlands": { lat: 52.1326, lng: 5.2913 },
  "Amsterdam": { lat: 52.3676, lng: 4.9041 },
  "Scheveningen": { lat: 52.1063, lng: 4.2761 },

  // Denmark
  "Copenhagen": { lat: 55.6761, lng: 12.5683 },

  // Iceland
  "Reykjavík": { lat: 64.1466, lng: -21.9426 },

  // Finland
  "Finland": { lat: 61.9241, lng: 25.7482 },
  "Helsinki": { lat: 60.1699, lng: 24.9384 },
  "Rovaniemi": { lat: 66.5039, lng: 25.7294 },
  "Kuopio": { lat: 62.8924, lng: 27.6782 },
  "Tampere": { lat: 61.4978, lng: 23.7610 },

  // Poland
  "Kraków": { lat: 50.0647, lng: 19.9450 },
  "Warsaw": { lat: 52.2297, lng: 21.0122 },

  // Czech Republic
  "Prague": { lat: 50.0755, lng: 14.4378 },

  // Hungary
  "Hungary": { lat: 47.1625, lng: 19.5033 },
  "Budapest": { lat: 47.4979, lng: 19.0402 },

  // Romania
  "Iași": { lat: 47.1585, lng: 27.6014 },

  // Lithuania
  "Vilnius": { lat: 54.6872, lng: 25.2797 },

  // Latvia
  "Riga": { lat: 56.9496, lng: 24.1052 },

  // Estonia
  "Tallinn": { lat: 59.4370, lng: 24.7536 },

  // Russia
  "Russia": { lat: 61.5240, lng: 105.3188 },
  "Moscow": { lat: 55.7558, lng: 37.6173 },
  "Petrozavodsk": { lat: 61.7849, lng: 34.3469 },

  // Ukraine
  "Kyiv": { lat: 50.4501, lng: 30.5234 },
  "Kiev": { lat: 50.4501, lng: 30.5234 },

  // Slovenia
  "Ljubljana": { lat: 46.0569, lng: 14.5058 },

  // Portugal
  "Lisbon": { lat: 38.7223, lng: -9.1393 },

  // Basque Country
  "Donostia": { lat: 43.3183, lng: -1.9812 },

  // Middle East
  "Jerusalem": { lat: 31.7683, lng: 35.2137 },
  "Tiberias": { lat: 32.7956, lng: 35.5312 },
  "Tehran": { lat: 35.6892, lng: 51.3890 },
  "Mecca": { lat: 21.3891, lng: 39.8579 },
  "Cairo": { lat: 30.0444, lng: 31.2357 },
  "Wasit": { lat: 32.4929, lng: 45.8225 },

  // India
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Punjab": { lat: 31.1471, lng: 75.3412 },
  "Vrindavan": { lat: 27.5806, lng: 77.7006 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Mangalore": { lat: 12.9141, lng: 74.8560 },
  "Madurai": { lat: 9.9252, lng: 78.1198 },

  // Thailand
  "Bangkok": { lat: 13.7563, lng: 100.5018 },

  // Indonesia
  "Jakarta": { lat: -6.2088, lng: 106.8456 },
  "Yogyakarta": { lat: -7.7956, lng: 110.3695 },

  // Malaysia
  "Kuala Lumpur": { lat: 3.1390, lng: 101.6869 },
  "Malacca": { lat: 2.1896, lng: 102.2501 },

  // Philippines
  "Manila": { lat: 14.5995, lng: 120.9842 },

  // New Zealand
  "Wellington": { lat: -41.2865, lng: 174.7762 },
  "Rotorua": { lat: -38.1368, lng: 176.2497 },
  "Auckland": { lat: -36.8485, lng: 174.7633 },

  // Hawaii
  "Hawaii": { lat: 21.3099, lng: -157.8581 },
  "Honolulu": { lat: 21.3099, lng: -157.8581 },

  // Latin America
  "Latin America": { lat: -8.7832, lng: -55.4915 },
  "Mexico City": { lat: 19.4326, lng: -99.1332 },
  "Salvador": { lat: -12.9714, lng: -38.5014 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Cusco": { lat: -13.5319, lng: -71.9675 },
  "Veracruz": { lat: 19.1738, lng: -96.1342 },
  "Lara, Venezuela": { lat: 10.0647, lng: -69.3371 },

  // South America
  "Ushuaia": { lat: -54.8019, lng: -68.3030 },

  // Africa
  "Zanzibar": { lat: -6.1659, lng: 39.2026 },
  "Durban": { lat: -29.8587, lng: 31.0218 },
  "Kumasi": { lat: 6.6885, lng: -1.6244 },
  "Ile-Ife": { lat: 7.4905, lng: 4.5521 },
  "Kananga": { lat: -5.8961, lng: 22.4167 },
  "Shkodër": { lat: 42.0683, lng: 19.5126 },
  "Tbilisi": { lat: 41.7151, lng: 44.8271 },

  // Pacific
  "Samoa": { lat: -13.7590, lng: -172.1046 },
  "Apia": { lat: -13.8506, lng: -171.7513 },
  "Hanga Roa": { lat: -27.1500, lng: -109.4333 },
  "Kiriwina": { lat: -8.5167, lng: 151.0667 },
  "Nuku'alofa": { lat: -21.1393, lng: -175.2018 },

  // Canada
  "Iqaluit": { lat: 63.7467, lng: -68.5170 },

  // Australia
  "Pine Creek": { lat: -13.8239, lng: 131.8306 },

  // Namibia
  "Rundu": { lat: -17.9333, lng: 19.7667 },

  // South Africa
  "Groblersdal": { lat: -25.1667, lng: 29.3833 },

  // United States
  "New York": { lat: 40.7128, lng: -74.0060 },
}
