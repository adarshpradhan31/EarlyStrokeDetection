import { HealthData, SensorData } from "../types";

let ai: any = null;

export async function predictStrokeRisk(health: HealthData, sensor: SensorData) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Fallback for static deploys without API key
    console.log('Using fallback stroke prediction (no API key)');
    const riskScore = Math.max(0, Math.min(100, 
      (sensor.heartRate > 120 ? 30 : 0) + 
      (sensor.systolicBP > 160 ? 30 : 0) + 
      (health.age > 65 ? 20 : 0) + 
      (health.hypertension ? 20 : 0) +
      (Math.random() * 20)
    ));
    
    return {
      riskScore: Math.round(riskScore),
      prediction: riskScore > 70 ? 'HIGH RISK - Emergency alert!' : 
                 riskScore > 40 ? 'Moderate risk - Monitor closely' : 
                 'Low risk - Continue monitoring',
      recommendations: [
        riskScore > 70 && 'Call emergency services immediately!',
        'Check blood pressure regularly',
        'Rest if feeling dizzy or confused',
        'Contact your doctor',
        'Stay hydrated and avoid smoking'
      ].filter(Boolean)
    };
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    if (!ai) {
      ai = new GoogleGenAI({ apiKey });
    }

    const prompt = `Analyze the following health and real-time sensor data to predict stroke risk.
    
Health Profile:
- Age: ${health.age}
- Gender: ${health.gender}
- Hypertension: ${health.hypertension ? 'Yes' : 'No'}
- Heart Disease: ${health.heartDisease ? 'Yes' : 'No'}
- Average Glucose Level: ${health.avgGlucoseLevel}
- BMI: ${health.bmi}
- Smoking Status: ${health.smokingStatus}

Real-time Sensor Data:
- Heart Rate: ${sensor.heartRate} bpm
- Blood Pressure: ${sensor.systolicBP}/${sensor.diastolicBP} mmHg
- Body Temperature: ${sensor.temperature} °C
- Sudden Movement Index: ${sensor.movement}/100

Provide a JSON response with:
1. riskScore (0-100)
2. prediction (A brief summary of the risk)
3. recommendations (A list of 3-5 actionable steps)

Return ONLY the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Prediction Error:", error);
    // Use fallback logic
    const riskScore = Math.max(0, Math.min(100, 
      (sensor.heartRate > 120 ? 30 : 0) + 
      (sensor.systolicBP > 160 ? 30 : 0) + 
      (health.age > 65 ? 20 : 0) + 
      (health.hypertension ? 20 : 0)
    ));
    
    return {
      riskScore: Math.round(riskScore),
      prediction: riskScore > 70 ? 'HIGH RISK - Emergency!' : 'Monitor',
      recommendations: [
        'Check vitals regularly',
        'Contact doctor if symptoms',
        'Rest and hydrate'
      ]
    };
  }
}

export async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials not set - skipping alert");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🚨 STROKE ALERT 🚨\n\n${message}`,
        parse_mode: 'Markdown'
      })
    });
    console.log('Alert sent to Telegram');
  } catch (error) {
    console.error("Telegram Alert Error:", error);
  }
}

