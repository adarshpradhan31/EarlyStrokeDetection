import React, { useState } from 'react';
import {
  Brain, ShieldAlert, Compass, Eye, Speech,
  Activity, Clock, Smile, UserCheck, CheckCircle
} from 'lucide-react';

interface LobeInfo {
  id: string;
  name: string;
  color: string;
  bgGlow: string;
  svgPath: string;
  description: string;
  symptoms: string[];
  fastLink: string;
}

const LOBES: LobeInfo[] = [
  {
    id: 'frontal',
    name: 'Frontal Lobe',
    color: '#60a5fa',
    bgGlow: 'rgba(96,165,250,0.15)',
    svgPath: 'M 40 45 C 30 55, 30 75, 45 90 C 55 98, 75 98, 85 90 C 95 82, 95 65, 85 55 C 75 45, 55 40, 40 45 Z',
    description: 'Responsible for executive function, decision-making, motor control, and speech production (Broca\'s area).',
    symptoms: [
      'Sudden weakness or paralysis in the opposite arm, leg, or face.',
      'Slurred speech, difficulty finding words, or muteness.',
      'Sudden confusion, personality changes, or loss of judgment.'
    ],
    fastLink: 'Speech difficulty & Arm weakness'
  },
  {
    id: 'parietal',
    name: 'Parietal Lobe',
    color: '#a78bfa',
    bgGlow: 'rgba(167,139,250,0.15)',
    svgPath: 'M 88 53 C 98 62, 102 75, 112 85 C 122 95, 130 92, 135 80 C 140 70, 135 55, 125 45 C 115 35, 98 42, 88 53 Z',
    description: 'Processes sensory input such as touch, temperature, pain, and handles spatial orientation.',
    symptoms: [
      'Sudden numbness or "pins-and-needles" on one side of the body.',
      'Spatial neglect (e.g., ignoring things on one side of the visual field).',
      'Difficulty coordinating movements or writing.'
    ],
    fastLink: 'Arm numbness & Face numbness'
  },
  {
    id: 'temporal',
    name: 'Temporal Lobe',
    color: '#22d3ee',
    bgGlow: 'rgba(34,211,238,0.15)',
    svgPath: 'M 52 94 C 42 105, 52 120, 68 125 C 85 130, 95 120, 105 110 C 112 102, 108 90, 95 88 C 80 85, 62 82, 52 94 Z',
    description: 'Manages memory, emotion, hearing, and the comprehension of language (Wernicke\'s area).',
    symptoms: [
      'Difficulty understanding speech (words sound like a foreign language).',
      'Sudden auditory hallucinations or sensory confusion.',
      'Acute memory gaps or inability to recall recent events.'
    ],
    fastLink: 'Speech comprehension'
  },
  {
    id: 'occipital',
    name: 'Occipital Lobe',
    color: '#fb7185',
    bgGlow: 'rgba(251,113,133,0.15)',
    svgPath: 'M 137 77 C 145 82, 155 90, 158 100 C 160 112, 150 120, 142 118 C 132 115, 124 105, 116 95 C 120 85, 128 72, 137 77 Z',
    description: 'The visual processing center of the brain.',
    symptoms: [
      'Sudden blurriness, dimming, or complete loss of vision in one or both eyes.',
      'Double vision or loss of peripheral vision (bumping into doorframes).',
      'Visual illusions or distorted shapes/colors.'
    ],
    fastLink: 'Eye & vision loss'
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    color: '#fbbf24',
    bgGlow: 'rgba(245,158,11,0.15)',
    svgPath: 'M 102 124 C 95 135, 105 150, 120 152 C 135 154, 145 142, 142 130 C 138 120, 122 115, 102 124 Z',
    description: 'Coordinates voluntary movements, posture, balance, and fine motor skills.',
    symptoms: [
      'Sudden severe dizziness, vertigo, or spinning sensation.',
      'Loss of balance, stumbling, or absolute inability to walk straight.',
      'Extreme clumsiness in one arm or leg (ataxia).'
    ],
    fastLink: 'Loss of Balance & Coordination'
  },
  {
    id: 'stem',
    name: 'Brain Stem',
    color: '#f43f5e',
    bgGlow: 'rgba(244,63,94,0.15)',
    svgPath: 'M 82 130 C 80 145, 85 165, 88 175 C 92 180, 100 180, 102 172 C 105 160, 98 145, 96 130 Z',
    description: 'Controls fundamental autonomic functions such as breathing, heart rate, swallowing, and blood pressure.',
    symptoms: [
      'Sudden difficulty swallowing (dysphagia) or choking.',
      'Explosive, severe headache with no known cause.',
      'Fainting, drop in consciousness, or sudden severe nausea.'
    ],
    fastLink: 'Critical emergency - FAST protocol'
  }
];

export default function BrainMap() {
  const [selectedLobe, setSelectedLobe] = useState<LobeInfo>(LOBES[0]);
  const [hoveredLobe, setHoveredLobe] = useState<LobeInfo | null>(null);

  const activeLobe = hoveredLobe || selectedLobe;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Left Lobe Interactive View (5 cols) ─── */}
      <div className="lg:col-span-5 glass-card p-6 flex flex-col items-center justify-center relative min-h-[380px]">
        {/* Glow backdrop matching active lobe */}
        <div
          className="absolute inset-10 rounded-full blur-[70px] opacity-35 transition-all duration-700 pointer-events-none"
          style={{ background: activeLobe.color }}
        />

        <div className="text-center mb-4 relative z-10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-center">
            <Brain size={13} className="text-blue-400" /> Interactive Brain Anatomy
          </h3>
          <p className="text-[10px] text-slate-600 mt-0.5">Click/Hover lobes to explore local stroke symptoms</p>
        </div>

        {/* SVG Brain */}
        <svg
          viewBox="0 0 200 200"
          className="w-56 h-56 relative z-10 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {/* Base brain background mesh */}
          <path
            d="M 40 45 C 10 70, 20 120, 60 130 C 80 135, 90 180, 110 180 C 130 180, 150 160, 155 140 C 170 120, 170 60, 120 40 C 90 30, 60 30, 40 45 Z"
            fill="rgba(255,255,255,0.015)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {LOBES.map((lobe) => {
            const isSelected = selectedLobe.id === lobe.id;
            const isHovered = hoveredLobe?.id === lobe.id;
            const isActive = isSelected || isHovered;

            return (
              <path
                key={lobe.id}
                d={lobe.svgPath}
                fill={isActive ? lobe.color : 'rgba(255,255,255,0.06)'}
                stroke={isActive ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isActive ? '2' : '1'}
                style={{
                  cursor: 'pointer',
                  fillOpacity: isActive ? 0.35 : 0.08,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={() => setSelectedLobe(lobe)}
                onMouseEnter={() => setHoveredLobe(lobe)}
                onMouseLeave={() => setHoveredLobe(null)}
              />
            );
          })}
        </svg>

        {/* Lobe Pill Selector */}
        <div className="flex flex-wrap gap-1.5 justify-center mt-6 relative z-10">
          {LOBES.map((lobe) => (
            <button
              key={lobe.id}
              onClick={() => setSelectedLobe(lobe)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider transition-all"
              style={{
                background: selectedLobe.id === lobe.id ? `${lobe.color}15` : 'rgba(255,255,255,0.02)',
                borderColor: selectedLobe.id === lobe.id ? lobe.color : 'rgba(255,255,255,0.06)',
                color: selectedLobe.id === lobe.id ? lobe.color : '#64748b'
              }}
            >
              {lobe.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right Detailed Description and FAST Symptoms (7 cols) ─── */}
      <div className="lg:col-span-7 space-y-6">
        {/* Lobe Symptom details */}
        <div
          className="glass-card p-6 border-l-4 transition-all duration-500 animate-scale-in"
          style={{ borderLeftColor: activeLobe.color }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeLobe.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 italic">
                {activeLobe.description}
              </p>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border flex-shrink-0"
              style={{
                color: activeLobe.color,
                borderColor: `${activeLobe.color}30`,
                background: `${activeLobe.color}08`
              }}
            >
              {activeLobe.id === 'stem' ? 'Critical Lobe' : 'Cerebral Lobe'}
            </span>
          </div>

          <div className="divider mb-4" />

          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-rose-400 animate-pulse" /> Stroke Symptoms Checklist
          </h4>

          <div className="space-y-2.5">
            {activeLobe.symptoms.map((symptom, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-white/6 text-xs text-slate-400 leading-relaxed bg-white/2"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: activeLobe.color }}
                />
                <span className="text-slate-300">{symptom}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
            <span>Primary alert:</span>
            <span className="px-2 py-0.5 rounded-md bg-white/4 text-slate-400 border border-white/6">{activeLobe.fastLink}</span>
          </div>
        </div>

        {/* FAST Quick Screening Guide */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" /> FAST Stroke Screening Guide
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FastCard
              icon={<Smile size={18} className="text-rose-400" />}
              letter="F"
              word="Face"
              desc="Ask to smile. Does one side droop?"
            />
            <FastCard
              icon={<UserCheck size={18} className="text-amber-400" />}
              letter="A"
              word="Arms"
              desc="Raise arms. Does one drift downward?"
            />
            <FastCard
              icon={<Speech size={18} className="text-cyan-400" />}
              letter="S"
              word="Speech"
              desc="Repeat sentence. Is speech slurred?"
            />
            <FastCard
              icon={<Clock size={18} className="text-emerald-400" />}
              letter="T"
              word="Time"
              desc="If positive, call 911 immediately!"
              highlight
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FastCard({
  icon, letter, word, desc, highlight
}: {
  icon: React.ReactNode; letter: string; word: string; desc: string; highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border text-center relative overflow-hidden transition-all duration-200 ${
        highlight
          ? 'bg-emerald-500/8 border-emerald-500/35 shadow-lg shadow-emerald-500/10'
          : 'bg-white/3 border-white/6 hover:border-white/12'
      }`}
    >
      <div className="flex justify-center mb-2.5">
        <div className={`p-1.5 rounded-lg ${highlight ? 'bg-emerald-500/12' : 'bg-white/5'}`}>{icon}</div>
      </div>
      <div className="text-base font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        <span className={highlight ? 'text-emerald-400' : 'text-blue-400'}>{letter}</span> — {word}
      </div>
      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
