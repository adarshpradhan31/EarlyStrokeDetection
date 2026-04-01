import React, { useState, useEffect } from 'react';
import { AlertSettings } from '../types';
import { db } from '../lib/db';
import { Bell, Settings, Save, X, Smartphone, Globe, Activity, Heart, Thermometer, Zap, Brain } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AlertSettingsUI({ onClose }: Props) {
  const [settings, setSettings] = useState<AlertSettings>(db.getAlertSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    db.saveAlertSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Bell size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">Alert Customization</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Notification Channels */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Notification Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleCard 
                icon={<Globe size={20} className="text-blue-500" />}
                label="Website Alerts"
                description="Show popups on this dashboard"
                enabled={settings.enableWebsiteAlerts}
                onChange={val => setSettings({ ...settings, enableWebsiteAlerts: val })}
              />
              <ToggleCard 
                icon={<Smartphone size={20} className="text-green-500" />}
                label="Telegram Alerts"
                description="Send alerts to your bot"
                enabled={settings.enableTelegramAlerts}
                onChange={val => setSettings({ ...settings, enableTelegramAlerts: val })}
              />
            </div>
          </section>

          {/* Sensor Thresholds */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sensor Thresholds</h3>
            <div className="space-y-4">
              <ThresholdInput 
                icon={<Heart size={18} className="text-red-500" />}
                label="Heart Rate"
                unit="BPM"
                value={settings.heartRateThreshold}
                enabled={settings.alertOnHeartRate}
                onToggle={val => setSettings({ ...settings, alertOnHeartRate: val })}
                onChange={val => setSettings({ ...settings, heartRateThreshold: val })}
              />
              <ThresholdInput 
                icon={<Activity size={18} className="text-blue-500" />}
                label="Systolic BP"
                unit="mmHg"
                value={settings.systolicBPThreshold}
                enabled={settings.alertOnBP}
                onToggle={val => setSettings({ ...settings, alertOnBP: val })}
                onChange={val => setSettings({ ...settings, systolicBPThreshold: val })}
              />
              <ThresholdInput 
                icon={<Thermometer size={18} className="text-orange-500" />}
                label="Temperature"
                unit="°C"
                value={settings.temperatureThreshold}
                enabled={settings.alertOnTemp}
                onToggle={val => setSettings({ ...settings, alertOnTemp: val })}
                onChange={val => setSettings({ ...settings, temperatureThreshold: val })}
              />
              <ThresholdInput 
                icon={<Zap size={18} className="text-yellow-500" />}
                label="Movement Index"
                unit="Scale"
                value={settings.movementThreshold}
                enabled={settings.alertOnMovement}
                onToggle={val => setSettings({ ...settings, alertOnMovement: val })}
                onChange={val => setSettings({ ...settings, movementThreshold: val })}
              />
            </div>
          </section>

          {/* AI Risk Threshold */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Risk Threshold</h3>
            <ThresholdInput 
              icon={<Brain size={18} className="text-purple-500" />}
              label="Risk Score"
              unit="%"
              value={settings.riskScoreThreshold}
              enabled={settings.alertOnRisk}
              onToggle={val => setSettings({ ...settings, alertOnRisk: val })}
              onChange={val => setSettings({ ...settings, riskScoreThreshold: val })}
            />
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saved}
            className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
          >
            {saved ? <><Save size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleCard({ icon, label, description, enabled, onChange }: { icon: React.ReactNode, label: string, description: string, enabled: boolean, onChange: (val: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!enabled)}
      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${enabled ? 'bg-white border-blue-200 ring-1 ring-blue-100' : 'bg-slate-50 border-slate-100 grayscale'}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-800">{label}</div>
          <div className="text-[10px] text-slate-500 uppercase">{description}</div>
        </div>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
      </div>
    </button>
  );
}

function ThresholdInput({ icon, label, unit, value, enabled, onToggle, onChange }: { icon: React.ReactNode, label: string, unit: string, value: number, enabled: boolean, onToggle: (val: boolean) => void, onChange: (val: number) => void }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${enabled ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-center gap-3 flex-1">
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={e => onToggle(e.target.checked)}
          className="w-4 h-4 rounded text-blue-600"
        />
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div className="text-sm font-bold text-slate-700">{label}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          disabled={!enabled}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />
        <span className="text-xs font-medium text-slate-400 uppercase">{unit}</span>
      </div>
    </div>
  );
}
