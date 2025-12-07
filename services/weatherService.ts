
export const getWeather = async (lat: number = 41.0082, lon: number = 28.9784): Promise<string> => {
  try {
    // Using Open-Meteo (Free, no API key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    const data = await response.json();
    
    if (!data.current) return "Veri alınamadı";

    const temp = data.current.temperature_2m;
    const code = data.current.weather_code;
    
    // WMO Weather interpretation code
    let condition = "Açık";
    if (code >= 1 && code <= 3) condition = "Parçalı Bulutlu";
    else if (code >= 45 && code <= 48) condition = "Sisli";
    else if (code >= 51 && code <= 67) condition = "Yağmurlu";
    else if (code >= 71 && code <= 77) condition = "Karlı";
    else if (code >= 95) condition = "Fırtınalı";

    return `${condition}, ${temp}°C`;
  } catch (error) {
    console.error("Weather fetch error:", error);
    return "Hava durumu servisi hatası";
  }
};
