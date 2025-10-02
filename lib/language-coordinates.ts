// Mapping of languages to approximate geographic coordinates
export const LANGUAGE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // East Asian
  Japanese: { lat: 36.2048, lng: 138.2529 },
  Chinese: { lat: 35.8617, lng: 104.1954 },
  Korean: { lat: 35.9078, lng: 127.7669 },
  Cantonese: { lat: 23.1291, lng: 113.2644 },
  Mandarin: { lat: 39.9042, lng: 116.4074 },

  // Southeast Asian
  Indonesian: { lat: -0.7893, lng: 113.9213 },
  Malay: { lat: 4.2105, lng: 101.9758 },
  Thai: { lat: 15.8700, lng: 100.9925 },
  Vietnamese: { lat: 14.0583, lng: 108.2772 },
  Tagalog: { lat: 12.8797, lng: 121.7740 },
  Filipino: { lat: 12.8797, lng: 121.7740 },

  // South Asian
  Hindi: { lat: 20.5937, lng: 78.9629 },
  Urdu: { lat: 30.3753, lng: 69.3451 },
  Bengali: { lat: 23.6850, lng: 90.3563 },
  Tamil: { lat: 10.8505, lng: 78.6389 },
  Punjabi: { lat: 31.1471, lng: 75.3412 },
  Sanskrit: { lat: 20.5937, lng: 78.9629 },

  // European Romance
  Italian: { lat: 41.8719, lng: 12.5674 },
  Spanish: { lat: 40.4637, lng: -3.7492 },
  French: { lat: 46.2276, lng: 2.2137 },
  Portuguese: { lat: 39.3999, lng: -8.2245 },
  Romanian: { lat: 45.9432, lng: 24.9668 },
  Catalan: { lat: 41.5912, lng: 1.5209 },

  // European Germanic
  German: { lat: 51.1657, lng: 10.4515 },
  Dutch: { lat: 52.1326, lng: 5.2913 },
  Swedish: { lat: 60.1282, lng: 18.6435 },
  Norwegian: { lat: 60.4720, lng: 8.4689 },
  Danish: { lat: 56.2639, lng: 9.5018 },
  Icelandic: { lat: 64.9631, lng: -19.0208 },

  // European Slavic
  Russian: { lat: 61.5240, lng: 105.3188 },
  Polish: { lat: 51.9194, lng: 19.1451 },
  Czech: { lat: 49.8175, lng: 15.4730 },
  Ukrainian: { lat: 48.3794, lng: 31.1656 },
  Bulgarian: { lat: 42.7339, lng: 25.4858 },
  Serbian: { lat: 44.0165, lng: 21.0059 },
  Croatian: { lat: 45.1, lng: 15.2 },

  // Other European
  Greek: { lat: 39.0742, lng: 21.8243 },
  Finnish: { lat: 61.9241, lng: 25.7482 },
  Hungarian: { lat: 47.1625, lng: 19.5033 },
  Turkish: { lat: 38.9637, lng: 35.2433 },

  // Middle Eastern
  Arabic: { lat: 23.8859, lng: 45.0792 },
  Hebrew: { lat: 31.0461, lng: 34.8516 },
  Persian: { lat: 32.4279, lng: 53.6880 },
  Farsi: { lat: 32.4279, lng: 53.6880 },

  // African
  Swahili: { lat: -6.3690, lng: 34.8888 },
  Yoruba: { lat: 7.3775, lng: 3.9470 },
  Zulu: { lat: -28.4792, lng: 24.6727 },
  Amharic: { lat: 9.1450, lng: 40.4897 },

  // Celtic
  Irish: { lat: 53.4129, lng: -8.2439 },
  Welsh: { lat: 52.1307, lng: -3.7837 },
  Scottish: { lat: 56.4907, lng: -4.2026 },

  // Others
  Basque: { lat: 43.0, lng: -2.5 },
  Yiddish: { lat: 50.4501, lng: 30.5234 },
  Inuit: { lat: 64.2823, lng: -51.7440 },
  Hawaiian: { lat: 21.3099, lng: -157.8581 },
  Māori: { lat: -40.9006, lng: 174.8860 },
}
