import React, { useState } from 'react';
import { AlertSettings } from '../types';
import { db } from '../lib/db';
import {
  Bell, Save, X, Smartphone, Globe,
  Activity, Heart, Thermometer, Zap, Brain, Droplets,
  CheckCircle2, SlidersHorizontal
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AlertSettingsUI({ onClose }: Props) {
  const [settings, setSettings] = useState<AlertSettings>(db.getAlertSettings());
  const [saved, setSaved] = useState(false);

  const set = (key: keyof AlertSettings, val: any) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    db.saveAlertSettings(settings);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,6,12,0.8)', backdropFilter: 'blur(14px)' }}
    >
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-xl animate-scale-in" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div className="glass-card overflow-hidden">

          {/* ── Header ─── */}
          <div className="px-6 py-5 border-b border-white/6 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/12 border border-blue-500/20">
                <SlidersHorizontal size={17} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Alert Settings</h2>
                <p className="text-[11px] text-slate-500">Customize thresholds and notification channels</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Body ─── */}
          <div className="p-6 space-y-7 max-h-[70vh] overflow-y-auto">

            {/* Notification Channels */}
            <section className="space-y-3">
              <SectionLabel icon={<Bell size={12} />} label="Notification Channels" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ChannelToggle
                  icon={<Globe size={18} className="text-blue-400" />}
                  label="Website Alerts"
                  desc="Show popups on this dashboard"
                  enabled={settings.enableWebsiteAlerts}
                  onChange={v => set('enableWebsiteAlerts', v)}
                  color="blue"
                />
                <ChannelToggle
                  icon={<Smartphone size={18} className="text-emerald-400" />}
                  label="Telegram Alerts"
                  desc="Send to your Telegram bot"
                  enabled={settings.enableTelegramAlerts}
                  onChange={v => set('enableTelegramAlerts', v)}
                  color="emerald"
                />
              </div>
            </section>

            <Divider />

            {/* Sensor Thresholds */}
            <section className="space-y-3">
              <SectionLabel icon={<Activity size={12} />} label="Sensor Thresholds" />
              <div className="space-y-2.5">
                <ThresholdRow
                  icon={<Heart size={15} className="text-rose-400" />}
                  label="Heart Rate"
                  unit="BPM"
                  desc="Alert when heart rate exceeds"
                  value={settings.heartRateThreshold}
                  enabled={settings.alertOnHeartRate}
                  onToggle={v => set('alertOnHeartRate', v)}
                  onChange={v => set('heartRateThreshold', v)}
                  color="rose"
                />
                <ThresholdRow
                  icon={<Droplets size={15} className="text-cyan-400" />}
                  label="SpO2"
                  unit="%"
                  desc="Alert when SpO2 drops below"
                  value={settings.spo2Threshold}
                  enabled={settings.alertOnSpo2}
                  onToggle={v => set('alertOnSpo2', v)}
                  onChange={v => set('spo2Threshold', v)}
                  color="cyan"
                />
                <ThresholdRow
                  icon={<Activity size={15} className="text-indigo-400" />}
                  label="Systolic BP"
                  unit="mmHg"
                  desc="Alert when systolic pressure exceeds"
                  value={settings.systolicBPThreshold}
                  enabled={settings.alertOnBP}
                  onToggle={v => set('alertOnBP', v)}
                  onChange={v => set('systolicBPThreshold', v)}
                  color="indigo"
                />
                <ThresholdRow
                  icon={<Thermometer size={15} className="text-orange-400" />}
                  label="Temperature"
                  unit="°C"
                  desc="Alert when temperature exceeds"
                  value={settings.temperatureThreshold}
                  enabled={settings.alertOnTemp}
                  onToggle={v => set('alertOnTemp', v)}
                  onChange={v => set('temperatureThreshold', v)}
                  color="orange"
                />
                <ThresholdRow
                  icon={<Zap size={15} className="text-amber-400" />}
                  label="Movement Index"
                  unit="idx"
                  desc="Alert when movement exceeds"
                  value={settings.movementThreshold}
                  enabled={settings.alertOnMovement}
                  onToggle={v => set('alertOnMovement', v)}
                  onChange={v => set('movementThreshold', v)}
                  color="amber"
                />
              </div>
            </section>

            <Divider />

            {/* AI Risk Threshold */}
            <section className="space-y-3">
              <SectionLabel icon={<Brain size={12} />} label="AI Risk Threshold" />
              <ThresholdRow
                icon={<Brain size={15} className="text-violet-400" />}
                label="Risk Score"
                unit="%"
                desc="Alert when AI risk score exceeds"
                value={settings.riskScoreThreshold}
                enabled={settings.alertOnRisk}
                onToggle={v => set('alertOnRisk', v)}
                onChange={v => set('riskScoreThreshold', v)}
                color="violet"
              />
            </section>
          </div>

          {/* ── Footer ─── */}
          <div className="px-6 py-4 border-t border-white/6 flex items-center justify-end gap-3"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saved}
              className="btn-primary px-6 py-2.5 text-sm"
              style={saved ? { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' } : {}}
            >
              {saved ? (
                <><CheckCircle2 size={15} /> Saved!</>
              ) : (
                <><Save size={15} /> Save Settings</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-slate-500">{icon}</span>
      <h3 className="section-label">{label}</h3>
    </div>
  );
}

function Divider() {
  return <div className="divider" />;
}

const channelColors = {
  blue:    { active: 'bg-blue-500/8 border-blue-500/25',    dot: 'bg-blue-500',    knob: 'bg-blue-500' },
  emerald: { active: 'bg-emerald-500/8 border-emerald-500/25', dot: 'bg-emerald-500', knob: 'bg-emerald-500' },
};

function ChannelToggle({
  icon, label, desc, enabled, onChange, color
}: {
  icon: React.ReactNode; label: string; desc: string;
  enabled: boolean; onChange: (v: boolean) => void; color: keyof typeof channelColors;
}) {
  const c = channelColors[color];
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 ${
        enabled ? c.active : 'bg-white/3 border-white/8 hover:border-white/16'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${enabled ? 'bg-white/8' : 'bg-white/4'}`}>{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      {/* Toggle pill */}
      <div className={`w-10 h-5 rounded-full relative transition-all duration-200 flex-shrink-0 ${enabled ? c.knob : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${enabled ? 'left-5' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

const thresholdColors: Record<string, { bg: string; border: string; text: string }> = {
  rose:   { bg: 'rgba(244,63,94,0.06)',  border: 'rgba(244,63,94,0.2)',  text: '#fb7185' },
  cyan:   { bg: 'rgba(6,182,212,0.06)',  border: 'rgba(6,182,212,0.2)',  text: '#22d3ee' },
  indigo: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)', text: '#818cf8' },
  orange: { bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.2)', text: '#fb923c' },
  amber:  { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24' },
  violet: { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
};

function ThresholdRow({
  icon, label, unit, desc, value, enabled, onToggle, onChange, color
}: {
  icon: React.ReactNode; label: string; unit: string; desc: string;
  value: number; enabled: boolean;
  onToggle: (v: boolean) => void; onChange: (v: number) => void;
  color: string;
}) {
  const c = thresholdColors[color] ?? thresholdColors.blue;
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
      style={{
        background: enabled ? c.bg : 'rgba(255,255,255,0.02)',
        borderColor: enabled ? c.border : 'rgba(255,255,255,0.07)',
        opacity: enabled ? 1 : 0.55
      }}
    >
      {/* Checkbox + icon + label */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            enabled ? 'border-transparent' : 'border-white/20 bg-transparent'
          }`}
          style={enabled ? { background: c.text } : {}}
        >
          {enabled && <CheckCircle2 size={13} className="text-[#080b14]" strokeWidth={3} />}
        </button>
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-200 truncate">{label}</div>
          <div className="text-[10px] text-slate-600 truncate">{desc}</div>
        </div>
      </div>

      {/* Number input */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number"
          disabled={!enabled}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 px-3 py-2 rounded-xl text-center font-bold text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${enabled ? c.border : 'rgba(255,255,255,0.07)'}`,
            color: enabled ? c.text : '#475569',
          }}
        />
        <span className="text-[10px] text-slate-600 uppercase font-semibold w-8">{unit}</span>
      </div>
    </div>
  );
}
