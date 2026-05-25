import React, { useEffect, useState } from 'react';
import { RiskPrediction } from '../types';
import { predictStrokeRisk } from '../services/strokeService';
import { db } from '../lib/db';
import {
  Brain, ShieldAlert, CheckCircle, Loader2,
  ChevronRight, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';

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
      setErrorMsg('Please complete your health profile first.');
      return;
    }
    if (logs.length === 0) {
      setErrorMsg('Waiting for initial sensor readings...');
      return;
    }

    const latestSensor = logs[logs.length - 1];
    if (latestSensor.heartRate === 0) {
      setErrorMsg('Pulse sensor inactive. Place your finger on the MAX30102 to run AI stroke analysis.');
      return;
    }

    setLoading(true);
    try {
      const result = await predictStrokeRisk(health, latestSensor);
      const newPrediction: RiskPrediction = { ...result, timestamp: Date.now() };
      db.savePrediction(newPrediction);
      setPrediction(newPrediction);

      const settings = db.getAlertSettings();
      if (settings.alertOnRisk && newPrediction.riskScore > settings.riskScoreThreshold) {
        onAlert(newPrediction);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMsg('Error generating prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = db.getPredictions();
    if (saved.length > 0) setPrediction(saved[saved.length - 1]);
    runAnalysis();
    const interval = setInterval(runAnalysis, 30000);
    return () => clearInterval(interval);
  }, []);

  const score = prediction?.riskScore ?? 0;
  const isHigh = score > 60;
  const isMid  = score > 30 && score <= 60;

  const scoreColor = isHigh ? '#f43f5e' : isMid ? '#f59e0b' : '#10b981';
  const scoreBg    = isHigh ? 'rgba(244,63,94,0.12)'  : isMid ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
  const scoreBorder = isHigh ? 'rgba(244,63,94,0.3)'  : isMid ? 'rgba(245,158,11,0.3)'  : 'rgba(16,185,129,0.3)';

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (circumference * score) / 100;

  if (!prediction && !loading && !errorMsg) return null;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/12 border border-violet-500/20">
            <Brain size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Risk Analysis</h3>
            <p className="text-[10px] text-slate-500">Gemini-powered stroke prediction</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          title="Refresh Analysis"
          className="p-2 rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <RefreshCw size={14} />
          }
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2 animate-fade-in">
          <ShieldAlert size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <div className="p-5">
        {prediction ? (
          <>
            {/* Score Ring + Label */}
            <div className="flex items-center gap-5 mb-5">
              {/* SVG Ring */}
              <div className="relative flex-shrink-0 w-24 h-24">
                {/* Glow */}
                <div className="absolute inset-3 rounded-full blur-md opacity-40 transition-all duration-500"
                  style={{ background: scoreColor }} />
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Track */}
                  <circle cx="50" cy="50" r="40"
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  {/* Progress */}
                  <circle cx="50" cy="50" r="40"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black" style={{ color: scoreColor }}>{score}%</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold">Risk</span>
                </div>
              </div>

              {/* Risk Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {isHigh
                    ? <TrendingUp size={14} className="text-rose-400" />
                    : <TrendingDown size={14} className="text-emerald-400" />
                  }
                  <h4 className="text-sm font-bold" style={{ color: scoreColor }}>
                    {isHigh ? 'High Risk' : isMid ? 'Moderate Risk' : 'Low Risk'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-3">
                  "{prediction.prediction}"
                </p>
                <div className="mt-2 text-[10px] text-slate-600">
                  Updated {new Date(prediction.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Risk meter bar */}
            <div className="mb-5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    background: `linear-gradient(90deg, #10b981, ${isHigh ? '#f43f5e' : isMid ? '#f59e0b' : '#10b981'})`,
                    boxShadow: `0 0 8px ${scoreColor}80`
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[9px] text-slate-600 font-semibold uppercase tracking-wider">
                <span>Low</span><span>Moderate</span><span>High</span>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <CheckCircle size={11} className="text-blue-400" /> AI Recommendations
              </h5>
              <div className="space-y-2">
                {prediction.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-white/6 text-xs text-slate-400 leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.025)', animationDelay: `${i * 0.05}s` }}
                  >
                    <ChevronRight size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Placeholder when no predictions yet */
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Brain size={28} className="text-violet-400/60 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">AI Ready for Analysis</p>
              <p className="text-xs text-slate-600 mt-1 max-w-[220px] leading-relaxed">
                Place your finger on the MAX30102 pulse sensor to run your first stroke risk assessment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
