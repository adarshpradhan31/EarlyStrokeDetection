export interface HealthData {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  hypertension: boolean;
  heartDisease: boolean;
  everMarried: boolean;
  workType: string;
  residenceType: 'Urban' | 'Rural';
  avgGlucoseLevel: number;
  bmi: number;
  smokingStatus: 'formerly smoked' | 'never smoked' | 'smokes' | 'Unknown';
}

export interface SensorData {
  timestamp: number;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  temperature: number;
  movement: number; // 0-100 scale of sudden movement
}

export interface RiskPrediction {
  riskScore: number; // 0-100
  prediction: string;
  recommendations: string[];
  timestamp: number;
}

export interface AlertSettings {
  heartRateThreshold: number;
  systolicBPThreshold: number;
  temperatureThreshold: number;
  movementThreshold: number;
  riskScoreThreshold: number;
  enableWebsiteAlerts: boolean;
  enableTelegramAlerts: boolean;
  alertOnHeartRate: boolean;
  alertOnBP: boolean;
  alertOnTemp: boolean;
  alertOnMovement: boolean;
  alertOnRisk: boolean;
}
