import React, { useState, useEffect } from 'react';
import {
  AlertCircle, X, Phone, MessageSquare, Brain,
  Heart, Activity, Thermometer, Zap, Droplets, ShieldAlert
} from 'lucide-react';
import { SensorData, RiskPrediction } from '../types';
import { sendTelegramAlert } from '../services/strokeService';
import { db } from '../lib/db';

interface Props {
  sensorAlert: SensorData | null;
  riskAlert: RiskPrediction | null;
  onClear: () => void;
}

export default function AlertSystem({ sensorAlert, riskAlert, onClear }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const settings = db.getAlertSettings();
    if (!settings.enableWebsiteAlerts) return;

    if (sensorAlert || riskAlert) {
      setVisible(true);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});

      if (settings.enableTelegramAlerts) {
        let message = '';
        if (sensorAlert) {
          message = `⚠️ CRITICAL HEALTH ALERT ⚠️\n\nAbnormal readings detected:\n- Heart Rate: ${Math.round(sensorAlert.heartRate)} BPM\n- Blood Pressure: ${Math.round(sensorAlert.systolicBP)}/${Math.round(sensorAlert.diastolicBP)} mmHg\n- Movement: ${Math.round(sensorAlert.movement)}/100\n\nPlease check on the patient immediately!`;
        } else if (riskAlert) {
          message = `🧠 AI RISK ALERT 🧠\n\nHigh stroke risk detected: ${riskAlert.riskScore}%\n\nPrediction: ${riskAlert.prediction}\n\nPlease review recommendations in the dashboard.`;
        }
        sendTelegramAlert(message);
      }
    }
  }, [sensorAlert, riskAlert]);

  const dismiss = () => { setVisible(false); onClear(); };

  if ((!sensorAlert && !riskAlert) || !visible) return null;

  const isRisk = !!riskAlert && !sensorAlert;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(12px)' }}>
      {/* Ambient glow behind modal */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-opacity ${isRisk ? 'bg-violet-600/20' : 'bg-rose-600/20'}`} />

      <div className="relative w-full max-w-md animate-scale-in" style={{ boxShadow: isRisk ? '0 0 80px rgba(124,58,237,0.3)' : '0 0 80px rgba(244,63,94,0.3)' }}>
        <div className="glass-card overflow-hidden">
          {/* Header strip */}
          <div
            className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
            style={{
              background: isRisk
                ? 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(109,40,217,0.12) 100%)'
                : 'linear-gradient(135deg, rgba(244,63,94,0.25) 0%, rgba(220,38,38,0.12) 100%)',
              borderBottom: isRisk ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(244,63,94,0.2)'
            }}
          >
            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 animate-heartbeat"
              style={{
                background: isRisk ? 'rgba(139,92,246,0.15)' : 'rgba(244,63,94,0.15)',
                border: isRisk ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(244,63,94,0.3)',
                boxShadow: isRisk ? '0 0 40px rgba(139,92,246,0.3)' : '0 0 40px rgba(244,63,94,0.3)'
              }}
            >
              {isRisk
                ? <Brain size={34} className="text-violet-400" />
                : <AlertCircle size={34} className="text-rose-400" />
              }
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {isRisk ? 'High Risk Detected' : 'Emergency Alert'}
            </h2>
            <p className="text-sm mt-1" style={{ color: isRisk ? '#a78bfa' : '#fb7185' }}>
              {isRisk ? 'AI stroke risk score exceeded threshold' : 'Critical health parameters detected'}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Sensor Readings Grid */}
            {sensorAlert && (
              <div className="grid grid-cols-2 gap-3">
                <AlertMetric
                  icon={<Heart size={14} className="text-rose-400" />}
                  label="Heart Rate"
                  value={`${Math.round(sensorAlert.heartRate)}`}
                  unit="BPM"
                  color="rose"
                />
                <AlertMetric
                  icon={<Activity size={14} className="text-indigo-400" />}
                  label="Systolic BP"
                  value={`${Math.round(sensorAlert.systolicBP)}`}
                  unit="mmHg"
                  color="indigo"
                />
                {sensorAlert.spo2 !== undefined && (
                  <AlertMetric
                    icon={<Droplets size={14} className="text-cyan-400" />}
                    label="SpO2"
                    value={`${(sensorAlert.spo2).toFixed(1)}`}
                    unit="%"
                    color="cyan"
                  />
                )}
                <AlertMetric
                  icon={<Zap size={14} className="text-amber-400" />}
                  label="Movement"
                  value={`${Math.round(sensorAlert.movement)}`}
                  unit="/100"
                  color="amber"
                />
              </div>
            )}

            {/* Risk score large display */}
            {riskAlert && (
              <div className="rounded-2xl p-5 text-center border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-violet-500 mb-1">Stroke Risk Score</p>
                <div className="text-5xl font-black text-violet-400 mb-2">{riskAlert.riskScore}<span className="text-2xl">%</span></div>
                <p className="text-xs text-violet-400/70 italic">"{riskAlert.prediction}"</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={isRisk ? 'tel:+15550123' : 'tel:911'}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: isRisk
                    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                    : 'linear-gradient(135deg, #f43f5e, #be123c)',
                  boxShadow: isRisk ? '0 4px 20px rgba(124,58,237,0.4)' : '0 4px 20px rgba(244,63,94,0.4)'
                }}
              >
                <Phone size={16} />
                {isRisk ? 'Call Dr. Sarah Johnson' : 'Call Emergency (911)'}
              </a>

              <button
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-slate-200 border border-white/10 bg-white/4 hover:bg-white/8 transition-all"
                onClick={dismiss}
              >
                <MessageSquare size={16} />
                Notify Family Member
              </button>
            </div>

            {/* Telegram status */}
            <p className="text-center text-[11px]" style={{ color: '#475569' }}>
              {db.getAlertSettings().enableTelegramAlerts
                ? '✓ Telegram alert dispatched to emergency contact'
                : 'Telegram alerts are disabled in settings'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const alertColorMap = {
  rose:   { bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)',  text: '#fb7185'  },
  indigo: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#818cf8'  },
  cyan:   { bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)',  text: '#22d3ee'  },
  amber:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24'  },
};

function AlertMetric({
  icon, label, value, unit, color
}: {
  icon: React.ReactNode; label: string; value: string; unit: string; color: keyof typeof alertColorMap;
}) {
  const c = alertColorMap[color];
  return (
    <div className="p-4 rounded-2xl border" style={{ background: c.bg, borderColor: c.border }}>
      <div className="flex items-center gap-1.5 mb-2 opacity-80">{icon}<span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</span></div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black" style={{ color: c.text }}>{value}</span>
        <span className="text-xs text-slate-600">{unit}</span>
      </div>
    </div>
  );
}
