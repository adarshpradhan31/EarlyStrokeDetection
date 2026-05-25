import React, { useState } from 'react';
import { HealthData } from '../types';
import { db } from '../lib/db';
import {
  User, Activity, Cigarette, MapPin, ChevronRight,
  Heart, AlertTriangle, CheckCircle2, ArrowRight
} from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const STEPS = ['Personal', 'Medical', 'Lifestyle'];

export default function HealthForm({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<HealthData>({
    age: 45,
    gender: 'Male',
    hypertension: false,
    heartDisease: false,
    everMarried: true,
    workType: 'Private',
    residenceType: 'Urban',
    avgGlucoseLevel: 100,
    bmi: 25,
    smokingStatus: 'never smoked'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveHealthData(formData);
    onComplete();
  };

  const set = (key: keyof HealthData, val: any) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/6 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/6 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/30 mb-4">
            <User size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Health Profile Setup
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Your baseline data helps our AI model accurately assess stroke risk
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  i < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                  i === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20' :
                  'bg-white/5 text-slate-500 border border-white/10'
                }`}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${i <= step ? 'text-slate-300' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-5 transition-all duration-500 ${i < step ? 'bg-emerald-500/50' : 'bg-white/8'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card p-8" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSubmit}>
            {/* ── Step 0: Personal ─── */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in-up">
                <SectionTitle icon={<User size={16} />} label="Personal Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Age (years)">
                    <input
                      type="number"
                      value={formData.age}
                      min={1} max={120}
                      onChange={e => set('age', Number(e.target.value))}
                      className="input-dark"
                    />
                  </FormField>

                  <FormField label="Gender">
                    <select
                      value={formData.gender}
                      onChange={e => set('gender', e.target.value as any)}
                      className="input-dark"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>

                  <FormField label="BMI">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.bmi}
                      onChange={e => set('bmi', Number(e.target.value))}
                      className="input-dark"
                    />
                  </FormField>

                  <FormField label="Avg Glucose Level (mg/dL)">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.avgGlucoseLevel}
                      onChange={e => set('avgGlucoseLevel', Number(e.target.value))}
                      className="input-dark"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* ── Step 1: Medical ─── */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <SectionTitle icon={<Heart size={16} />} label="Medical History" />
                <p className="text-slate-500 text-xs">Select all conditions that apply to you</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ToggleCard
                    label="Hypertension"
                    desc="History of high blood pressure"
                    icon={<Activity size={18} className="text-rose-400" />}
                    checked={formData.hypertension}
                    onChange={v => set('hypertension', v)}
                    color="rose"
                  />
                  <ToggleCard
                    label="Heart Disease"
                    desc="Prior cardiovascular conditions"
                    icon={<Heart size={18} className="text-rose-400" />}
                    checked={formData.heartDisease}
                    onChange={v => set('heartDisease', v)}
                    color="rose"
                  />
                  <ToggleCard
                    label="Ever Married"
                    desc="Marital status"
                    icon={<User size={18} className="text-blue-400" />}
                    checked={formData.everMarried}
                    onChange={v => set('everMarried', v)}
                    color="blue"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Lifestyle ─── */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <SectionTitle icon={<Cigarette size={16} />} label="Lifestyle & Residence" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Smoking Status">
                    <select
                      value={formData.smokingStatus}
                      onChange={e => set('smokingStatus', e.target.value as any)}
                      className="input-dark"
                    >
                      <option value="never smoked">Never Smoked</option>
                      <option value="formerly smoked">Formerly Smoked</option>
                      <option value="smokes">Currently Smokes</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </FormField>

                  <FormField label="Residence Type">
                    <select
                      value={formData.residenceType}
                      onChange={e => set('residenceType', e.target.value as any)}
                      className="input-dark"
                    >
                      <option value="Urban">Urban</option>
                      <option value="Rural">Rural</option>
                    </select>
                  </FormField>

                  <FormField label="Work Type">
                    <select
                      value={formData.workType}
                      onChange={e => set('workType', e.target.value)}
                      className="input-dark"
                    >
                      <option value="Private">Private</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Govt_job">Government Job</option>
                      <option value="children">Student / Child</option>
                      <option value="Never_worked">Never Worked</option>
                    </select>
                  </FormField>
                </div>

                {/* Summary preview */}
                <div className="rounded-xl bg-white/3 border border-white/7 p-4 mt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Profile Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>Age: <span className="text-slate-200 font-semibold">{formData.age}</span></div>
                    <div>BMI: <span className="text-slate-200 font-semibold">{formData.bmi}</span></div>
                    <div>Glucose: <span className="text-slate-200 font-semibold">{formData.avgGlucoseLevel} mg/dL</span></div>
                    <div>Smoking: <span className="text-slate-200 font-semibold capitalize">{formData.smokingStatus}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="btn-ghost flex-1"
                >
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="btn-primary flex-1"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn-primary flex-1">
                  Start Monitoring <ArrowRight size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-white/6">
      <span className="text-blue-400">{icon}</span>
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{label}</h3>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ToggleCard({
  label, desc, icon, checked, onChange, color
}: {
  label: string; desc: string; icon: React.ReactNode;
  checked: boolean; onChange: (v: boolean) => void; color: 'rose' | 'blue';
}) {
  const activeClass = color === 'rose'
    ? 'bg-rose-500/8 border-rose-500/30'
    : 'bg-blue-500/8 border-blue-500/30';
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 ${
        checked ? activeClass : 'bg-white/3 border-white/8 hover:border-white/16'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checked ? (color === 'rose' ? 'bg-rose-500/15' : 'bg-blue-500/15') : 'bg-white/5'}`}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      {/* Toggle */}
      <div className={`w-10 h-5 rounded-full relative transition-all duration-200 flex-shrink-0 ${checked ? (color === 'rose' ? 'bg-rose-500' : 'bg-blue-500') : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
    </button>
  );
}
