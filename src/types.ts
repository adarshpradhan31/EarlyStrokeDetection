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
  movement: number;     // 0-100 scale of sudden movement
  spo2?: number;        // Blood oxygen saturation (%) — from MAX30102
  accelX?: number;      // Accelerometer X axis (m/s²) — from MPU6050
  accelY?: number;      // Accelerometer Y axis (m/s²) — from MPU6050
  accelZ?: number;      // Accelerometer Z axis (m/s²) — from MPU6050
  gyroX?: number;       // Gyroscope X axis (°/s) — from MPU6050
  gyroY?: number;       // Gyroscope Y axis (°/s) — from MPU6050
  gyroZ?: number;       // Gyroscope Z axis (°/s) — from MPU6050
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
  spo2Threshold: number;        // Alert when SpO2 drops below this (default 94%)
  riskScoreThreshold: number;
  enableWebsiteAlerts: boolean;
  enableTelegramAlerts: boolean;
  alertOnHeartRate: boolean;
  alertOnBP: boolean;
  alertOnTemp: boolean;
  alertOnMovement: boolean;
  alertOnSpo2: boolean;         // NEW
  alertOnRisk: boolean;
}
