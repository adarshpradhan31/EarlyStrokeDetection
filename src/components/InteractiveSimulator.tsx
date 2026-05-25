import React, { useState, useEffect } from 'react';
import { HealthData, SensorData } from '../types';
import {
  Sliders, Activity, ShieldAlert, Cpu, Heart, CheckCircle2,
  AlertTriangle, RefreshCw, Thermometer, User, Flame
} from 'lucide-react';

export default function InteractiveSimulator() {
  // Baseline health data state
  const [age, setAge] = useState(55);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [hypertension, setHypertension] = useState(false);
  const [heartDisease, setHeartDisease] = useState(false);
  const [glucose, setGlucose] = useState(105);
  const [bmi, setBmi] = useState(26.5);
  const [smoking, setSmoking] = useState<'never smoked' | 'formerly smoked' | 'smokes' | 'Unknown'>('never smoked');

  // Real-time sensor state
  const [heartRate, setHeartRate] = useState(72);
  const [systolicBP, setSystolicBP] = useState(120);
  const [diastolicBP, setDiastolicBP] = useState(80);
  const [spo2, setSpo2] = useState(98.5);
  const [temp, setTemp] = useState(36.6);
  const [movement, setMovement] = useState(12);

  const [riskScore, setRiskScore] = useState(0);

  // Dynamic risk calculation
  useEffect(() => {
    let score = 0;
    
    // Age weights
    if (age > 75) score += 25;
    else if (age > 60) score += 18;
    else if (age > 45) score += 10;
    else if (age > 30) score += 4;

    // Hypertension & elevated BP
    if (hypertension) {
      score += 15;
    } else if (systolicBP > 140 || diastolicBP > 90) {
      score += 8;
    }
    
    // Emergency hypertensive crisis
    if (systolicBP > 165 || diastolicBP > 105) {
      score += 18;
    }

    // Cardiovascular history
    if (heartDisease) score += 15;

    // Pulse rates (Tachycardia / Bradycardia)
    if (heartRate > 120 || heartRate < 45) score += 12;
    else if (heartRate > 100) score += 6;

    // SpO2 levels (Hypoxia)
    if (spo2 < 90) score += 18;
    else if (spo2 < 94) score += 8;

    // Glucose levels (Diabetic risk)
    if (glucose > 200) score += 12;
    else if (glucose > 140) score += 6;

    // Body Mass Index (Obesity weight)
    if (bmi > 30) score += 8;
    else if (bmi > 25) score += 3;

    // Nicotine usage
    if (smoking === 'smokes') score += 10;
    else if (smoking === 'formerly smoked') score += 5;

    // Natural lower/upper bounds
    setRiskScore(Math.max(3, Math.min(97, score)));
  }, [
    age, hypertension, heartDisease, glucose, bmi, smoking,
    heartRate, systolicBP, diastolicBP, spo2, temp, movement
  ]);

  const handleReset = () => {
    setAge(55);
    setGender('Male');
    setHypertension(false);
    setHeartDisease(false);
    setGlucose(105);
    setBmi(26.5);
    setSmoking('never smoked');
    setHeartRate(72);
    setSystolicBP(120);
    setDiastolicBP(80);
    setSpo2(98.5);
    setTemp(36.6);
    setMovement(12);
  };

  const isHigh = riskScore > 60;
  const isMid  = riskScore > 30 && riskScore <= 60;

  const scoreColor = isHigh ? '#f43f5e' : isMid ? '#f59e0b' : '#10b981';
  const scoreBg    = isHigh ? 'rgba(244,63,94,0.12)'  : isMid ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
  const scoreBorder = isHigh ? 'rgba(244,63,94,0.3)'  : isMid ? 'rgba(245,158,11,0.3)'  : 'rgba(16,185,129,0.3)';

  return (
    <div className="space-y-6">
      {/* ── Header View ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-violet-400" /> "What-If" Stroke Risk Simulator
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Tweak medical and physical values dynamically to simulate stroke warnings</p>
        </div>
        <button
          onClick={handleReset}
          className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 self-start sm:self-center"
        >
          <RefreshCw size={12} /> Reset to Normal Vitals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Sliders Panel (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section 1: Demographics & Medical History */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={13} className="text-blue-400" /> Patient History & Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderInput
                label="Age (Years)"
                val={age}
                min={18} max={95}
                onChange={setAge}
                unit="yrs"
              />
              <SliderInput
                label="Glucose Level"
                val={glucose}
                min={70} max={280}
                onChange={setGlucose}
                unit="mg/dL"
              />
              <SliderInput
                label="BMI"
                val={bmi}
                min={15} max={45}
                onChange={setBmi}
                unit=""
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Smoking Status</label>
                <select
                  value={smoking}
                  onChange={(e: any) => setSmoking(e.target.value)}
                  className="input-dark text-xs py-2 px-3"
                >
                  <option value="never smoked">Never Smoked</option>
                  <option value="formerly smoked">Formerly Smoked</option>
                  <option value="smokes">Currently Smokes</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Diagnostic Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <ToggleCard
                label="Hypertension History"
                checked={hypertension}
                onChange={setHypertension}
              />
              <ToggleCard
                label="Heart Disease History"
                checked={heartDisease}
                onChange={setHeartDisease}
              />
            </div>
          </div>

          {/* Section 2: Simulated Vital Telemetry */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={13} className="text-rose-400" /> Simulated Live Vitals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderInput
                label="Heart Rate"
                val={heartRate}
                min={40} max={180}
                onChange={setHeartRate}
                unit="BPM"
                warning={heartRate > 100 || heartRate < 50}
              />
              <SliderInput
                label="Systolic BP"
                val={systolicBP}
                min={90} max={210}
                onChange={setSystolicBP}
                unit="mmHg"
                warning={systolicBP > 140}
              />
              <SliderInput
                label="Diastolic BP"
                val={diastolicBP}
                min={55} max={120}
                onChange={setDiastolicBP}
                unit="mmHg"
                warning={diastolicBP > 90}
              />
              <SliderInput
                label="SpO2 Level"
                val={spo2}
                min={80} max={100}
                step={0.5}
                onChange={setSpo2}
                unit="%"
                warning={spo2 < 94}
              />
              <SliderInput
                label="Body Temperature"
                val={temp}
                min={35.0} max={40.5}
                step={0.1}
                onChange={setTemp}
                unit="°C"
                warning={temp > 38.0}
              />
              <SliderInput
                label="Sudden Movement"
                val={movement}
                min={0} max={100}
                onChange={setMovement}
                unit="idx"
                warning={movement > 50}
              />
            </div>
          </div>
        </div>

        {/* ── Right Results Gauges (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Ambient circular glow */}
            <div
              className="absolute inset-10 rounded-full blur-[80px] opacity-40 transition-all duration-500"
              style={{ background: scoreColor }}
            />

            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest relative z-10 mb-4">Predicted Stroke Risk</h3>

            {/* Score Ring */}
            <div className="relative w-36 h-36 flex-shrink-0 z-10 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 - (2 * Math.PI * 40 * riskScore) / 100}
                  style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {riskScore}%
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Simulator</span>
              </div>
            </div>

            {/* Badge */}
            <div
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border z-10 mb-4"
              style={{ background: scoreBg, borderColor: scoreBorder, color: scoreColor }}
            >
              {isHigh ? '🚨 High Risk' : isMid ? '⚠ Moderate Risk' : '✓ Low Risk'}
            </div>

            <div className="divider mb-4 w-full" />

            <div className="z-10 w-full space-y-2.5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-left">Clinical Implications</h4>
              {isHigh ? (
                <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-xs text-rose-300 text-left leading-relaxed">
                  <ShieldAlert size={14} className="inline mr-1 -mt-0.5 text-rose-400 animate-pulse" />
                  <strong>Simulated Emergency:</strong> Under these clinical conditions, a stroke alert triggers, initiating automated Telegram reports to caregivers and direct 911 dispatch tools.
                </div>
              ) : isMid ? (
                <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 text-left leading-relaxed">
                  <AlertTriangle size={14} className="inline mr-1 -mt-0.5 text-amber-400" />
                  <strong>Clinical Concern:</strong> Elevated blood pressure, high glucose, or minor hypoxia creates moderate stroke risk. Requires continuous tracking and lifestyle modifications.
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-300 text-left leading-relaxed">
                  <CheckCircle2 size={14} className="inline mr-1 -mt-0.5 text-emerald-400" />
                  <strong>Healthy Base:</strong> Vitals and medical history show stable parameters. Low risk, maintain standard activity.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderInput({
  label, val, min, max, step = 1, onChange, unit, warning
}: {
  label: string; val: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit: string; warning?: boolean;
}) {
  return (
    <div className="space-y-1.5 p-3 rounded-xl border border-white/4 bg-white/2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-400">{label}</span>
        <span className={`font-bold ${warning ? 'text-rose-400' : 'text-slate-300'}`}>
          {val.toFixed(step % 1 === 0 ? 0 : 1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={val}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/8 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

function ToggleCard({
  label, checked, onChange
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 text-xs font-bold transition-all w-full ${
        checked
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          : 'bg-white/3 border-white/6 text-slate-400 hover:border-white/12 hover:text-slate-300'
      }`}
    >
      <span>{label}</span>
      <div className={`w-8 h-4 rounded-full relative transition-all duration-200 ${checked ? 'bg-blue-500' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${checked ? 'left-4.5' : 'left-0.5'}`} />
      </div>
    </button>
  );
}
