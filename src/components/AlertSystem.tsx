import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, X, Phone, MessageSquare, Brain } from 'lucide-react';
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
      audio.play().catch(() => {}); // Browser might block autoplay

      // Send Telegram Alert if enabled
      if (settings.enableTelegramAlerts) {
        let message = "";
        if (sensorAlert) {
          message = `⚠️ CRITICAL HEALTH ALERT ⚠️\n\nAbnormal readings detected:\n- Heart Rate: ${Math.round(sensorAlert.heartRate)} BPM\n- Blood Pressure: ${Math.round(sensorAlert.systolicBP)}/${Math.round(sensorAlert.diastolicBP)} mmHg\n- Sudden Movement: ${Math.round(sensorAlert.movement)}/100\n\nPlease check on the patient immediately!`;
        } else if (riskAlert) {
          message = `🧠 AI RISK ALERT 🧠\n\nHigh stroke risk detected: ${riskAlert.riskScore}%\n\nPrediction: ${riskAlert.prediction}\n\nPlease review recommendations in the dashboard.`;
        }
        sendTelegramAlert(message);
      }
    }
  }, [sensorAlert, riskAlert]);

  if ((!sensorAlert && !riskAlert) || !visible) return null;

  const isRisk = !!riskAlert && !sensorAlert;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className={`${isRisk ? 'bg-purple-600' : 'bg-red-600'} p-6 text-white text-center relative`}>
          <button 
            onClick={() => { setVisible(false); onClear(); }}
            className="absolute top-4 right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            {isRisk ? <Brain size={32} /> : <AlertCircle size={32} />}
          </div>
          <h2 className="text-2xl font-bold">{isRisk ? 'AI Risk Alert!' : 'Emergency Alert!'}</h2>
          <p className="opacity-90">{isRisk ? 'High stroke risk score detected' : 'Critical health parameters detected'}</p>
        </div>

        <div className="p-6 space-y-6">
          {sensorAlert && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-red-600 text-xs font-bold uppercase mb-1">Heart Rate</div>
                <div className="text-2xl font-bold text-red-700">{Math.round(sensorAlert.heartRate)} <span className="text-sm font-normal">BPM</span></div>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-red-600 text-xs font-bold uppercase mb-1">Systolic BP</div>
                <div className="text-2xl font-bold text-red-700">{Math.round(sensorAlert.systolicBP)}</div>
              </div>
            </div>
          )}

          {riskAlert && (
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
              <div className="text-purple-600 text-xs font-bold uppercase mb-1">Risk Score</div>
              <div className="text-4xl font-black text-purple-700">{riskAlert.riskScore}%</div>
              <p className="text-sm text-purple-600 mt-2 italic">"{riskAlert.prediction}"</p>
            </div>
          )}

          <div className="space-y-3">
            <button className={`w-full flex items-center justify-center gap-3 ${isRisk ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white font-bold py-4 rounded-2xl shadow-lg transition-all`}>
              <Phone size={20} /> {isRisk ? 'Consult Doctor' : 'Call Emergency (911)'}
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all">
              <MessageSquare size={20} /> Notify Family
            </button>
          </div>

          <p className="text-center text-slate-400 text-xs">
            {db.getAlertSettings().enableTelegramAlerts ? 'Telegram alert has been sent to your emergency contact.' : 'Telegram alerts are currently disabled in settings.'}
          </p>
        </div>
      </div>
    </div>
  );
}
