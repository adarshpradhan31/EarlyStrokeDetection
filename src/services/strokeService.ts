import { GoogleGenAI } from "@google/genai";
import { HealthData, SensorData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function predictStrokeRisk(health: HealthData, sensor: SensorData) {
  const prompt = `
    Analyze the following health and real-time sensor data to predict stroke risk.
    
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
    
    Return ONLY the JSON.
  `;

  try {
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
    return {
      riskScore: 0,
      prediction: "Unable to generate prediction at this time.",
      recommendations: ["Consult a doctor immediately if you feel unwell."]
    };
  }
}

export async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials not set.");
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
  } catch (error) {
    console.error("Telegram Alert Error:", error);
  }
}
