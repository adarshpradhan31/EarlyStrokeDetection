import React, { useEffect, useState } from 'react';
import { HealthData, SensorData, RiskPrediction } from '../types';
import { predictStrokeRisk } from '../services/strokeService';
import { db } from '../lib/db';
import { Brain, ShieldAlert, CheckCircle, Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  onAlert: (prediction: RiskPrediction) => void;
}

export default function RiskAnalysis({ onAlert }: Props) {
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async () => {
    setErrorMsg(null);
    const health = db.getHealthData();
    const logs = db.getSensorLogs();
    if (!health) {
      setErrorMsg("Please complete your health profile first.");
      return;
    }
    if (logs.length === 0) {
      setErrorMsg("Waiting for initial sensor readings...");
      return;
    }

    const latestSensor = logs[logs.length - 1];
    
    // Stop false detection and run detection only when pulse sensor is active (heartRate > 0)
    if (latestSensor.heartRate === 0) {
      setErrorMsg("Pulse sensor inactive. Place your finger on the heart rate sensor (MAX30102) to run AI stroke risk analysis.");
      return;
    }

    setLoading(true);
    try {
      const result = await predictStrokeRisk(health, latestSensor);
      
      const newPrediction: RiskPrediction = {
        ...result,
        timestamp: Date.now()
      };
      
      db.savePrediction(newPrediction);
      setPrediction(newPrediction);

      // Check custom risk threshold
      const settings = db.getAlertSettings();
      if (settings.alertOnRisk && newPrediction.riskScore > settings.riskScoreThreshold) {
        onAlert(newPrediction);
      }
    } catch (err) {
      console.error("Analysis execution error:", err);
      setErrorMsg("Error generating risk prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load last prediction from DB on mount
    const saved = db.getPredictions();
    if (saved.length > 0) {
      setPrediction(saved[saved.length - 1]);
    }

    runAnalysis();
    const interval = setInterval(runAnalysis, 30000); // Analyze every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!prediction && !loading && !errorMsg) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-slate-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-blue-400" />
          <h3 className="font-bold">AI Risk Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-blue-400" />
          ) : (
            <button
              onClick={runAnalysis}
              title="Run AI Risk Analysis"
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
          <ShieldAlert size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6">
        {prediction ? (
          <>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 gap-2">
            <Brain size={32} className="text-blue-500/40 animate-pulse" />
            <span className="text-xs font-semibold px-4">AI Ready for Analysis</span>
            <span className="text-[11px] max-w-[250px] leading-relaxed text-slate-400">
              Please place your finger on the pulse sensor (MAX30102) to run your first early stroke detection analysis.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
