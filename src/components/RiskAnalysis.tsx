import React, { useEffect, useState } from 'react';
import { HealthData, SensorData, RiskPrediction } from '../types';
import { predictStrokeRisk } from '../services/strokeService';
import { db } from '../lib/db';
import { Brain, ShieldAlert, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  onAlert: (prediction: RiskPrediction) => void;
}

export default function RiskAnalysis({ onAlert }: Props) {
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    const health = db.getHealthData();
    const logs = db.getSensorLogs();
    if (!health || logs.length === 0) return;

    setLoading(true);
    const latestSensor = logs[logs.length - 1];
    const result = await predictStrokeRisk(health, latestSensor);
    
    const newPrediction: RiskPrediction = {
      ...result,
      timestamp: Date.now()
    };
    
    db.savePrediction(newPrediction);
    setPrediction(newPrediction);
    setLoading(false);

    // Check custom risk threshold
    const settings = db.getAlertSettings();
    if (settings.alertOnRisk && newPrediction.riskScore > settings.riskScoreThreshold) {
      onAlert(newPrediction);
    }
  };

  useEffect(() => {
    runAnalysis();
    const interval = setInterval(runAnalysis, 30000); // Analyze every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!prediction && !loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-slate-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-blue-400" />
          <h3 className="font-bold">AI Risk Analysis</h3>
        </div>
        {loading && <Loader2 size={16} className="animate-spin" />}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * (prediction?.riskScore || 0)) / 100}
                className={prediction?.riskScore && prediction.riskScore > 50 ? 'text-red-500' : 'text-green-500'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{prediction?.riskScore}%</span>
              <span className="text-[10px] text-slate-400 uppercase">Risk</span>
            </div>
          </div>

          <div className="flex-1">
            <h4 className={`text-lg font-bold mb-1 ${prediction?.riskScore && prediction.riskScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
              {prediction?.riskScore && prediction.riskScore > 50 ? 'High Risk Detected' : 'Low Risk Level'}
            </h4>
            <p className="text-slate-600 text-sm italic">"{prediction?.prediction}"</p>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-500" /> AI Recommendations
          </h5>
          <div className="grid grid-cols-1 gap-2">
            {prediction?.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-100">
                <ChevronRight size={14} className="mt-1 text-blue-500 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
