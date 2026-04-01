import { HealthData, SensorData, RiskPrediction, AlertSettings } from '../types';

const HEALTH_DATA_KEY = 'stroke_guard_health_data';
const SENSOR_LOGS_KEY = 'stroke_guard_sensor_logs';
const PREDICTIONS_KEY = 'stroke_guard_predictions';
const ALERT_SETTINGS_KEY = 'stroke_guard_alert_settings';

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  heartRateThreshold: 120,
  systolicBPThreshold: 160,
  temperatureThreshold: 38.5,
  movementThreshold: 70,
  riskScoreThreshold: 60,
  enableWebsiteAlerts: true,
  enableTelegramAlerts: true,
  alertOnHeartRate: true,
  alertOnBP: true,
  alertOnTemp: true,
  alertOnMovement: true,
  alertOnRisk: true
};

export const db = {
  saveHealthData: (data: HealthData) => {
    localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(data));
  },
  getHealthData: (): HealthData | null => {
    const data = localStorage.getItem(HEALTH_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },
  saveSensorData: (data: SensorData) => {
    const logs = db.getSensorLogs();
    logs.push(data);
    // Keep only last 100 logs
    if (logs.length > 100) logs.shift();
    localStorage.setItem(SENSOR_LOGS_KEY, JSON.stringify(logs));
  },
  getSensorLogs: (): SensorData[] => {
    const data = localStorage.getItem(SENSOR_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  savePrediction: (prediction: RiskPrediction) => {
    const predictions = db.getPredictions();
    predictions.push(prediction);
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
  },
  getPredictions: (): RiskPrediction[] => {
    const data = localStorage.getItem(PREDICTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveAlertSettings: (settings: AlertSettings) => {
    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(settings));
  },
  getAlertSettings: (): AlertSettings => {
    const data = localStorage.getItem(ALERT_SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_ALERT_SETTINGS;
  }
};
