import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, ShieldAlert, Phone, CheckSquare, Square, Play, SquareTerminal,
  Activity, AlertTriangle, AlertCircle, RefreshCw, Volume2, UserCheck
} from 'lucide-react';

interface DrillStep {
  title: string;
  timeframe: string;
  icon: React.ReactNode;
  description: string;
  actions: string[];
}

export default function EmergencyDrill() {
  const [drillActive, setDrillActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [activeStep, setActiveStep] = useState(0);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const DRILL_STEPS: DrillStep[] = [
    {
      title: "Confirm FAST Symptoms",
      timeframe: "Minute 0–2",
      icon: <Volume2 className="text-rose-400" />,
      description: "Quickly screen the patient using the FAST protocol. Identify the exact time symptoms started.",
      actions: [
        "Check Face: Smile check for one-sided droop.",
        "Check Arms: Hold arms up check for downward drift.",
        "Check Speech: Ask to repeat a simple phrase and check for slurred pronunciation.",
        "Verify onset: Document the exact time the patient was last seen normal."
      ]
    },
    {
      title: "Activate Emergency EMS",
      timeframe: "Minute 2–5",
      icon: <Phone className="text-blue-400 animate-pulse" />,
      description: "Call 911 or localized emergency services immediately. State that you suspect an acute stroke.",
      actions: [
        "Dial 911 / EMS dispatch immediately.",
        "Explicitly tell the operator: 'I am calling to report a suspected stroke.'",
        "State the exact time of symptom onset.",
        "Provide clear directions and gate codes for the ambulance."
      ]
    },
    {
      title: "Acute Stroke First Aid",
      timeframe: "Minute 5–15",
      icon: <Activity className="text-amber-400" />,
      description: "Position the patient safely. Monitor breathing and stay near the patient.",
      actions: [
        "Lay patient flat on their side with head elevated slightly (protects airway).",
        "DO NOT give food, drink, or any medications (including Aspirin, as it can worsen hemorrhagic strokes).",
        "Loosen tight clothing around the neck.",
        "Ensure room is well-ventilated and the patient remains calm."
      ]
    },
    {
      title: "Compile Patient History",
      timeframe: "Minute 15–30",
      icon: <UserCheck className="text-violet-400" />,
      description: "Collect critical medical information for the incoming emergency response team.",
      actions: [
        "Gather patient's age and health card / ID.",
        "Document current list of medications (especially blood thinners/anticoagulants).",
        "Document existing conditions (e.g. high BP, diabetes, prior strokes).",
        "Write down the exact onset time clearly on a sheet of paper."
      ]
    },
    {
      title: "Caregiver & Family Sync",
      timeframe: "Minute 30–60",
      icon: <ShieldAlert className="text-emerald-400" />,
      description: "Ensure family members and caregivers are alerted. Clear path for EMS.",
      actions: [
        "Send critical Telegram dispatch alert to primary family contact.",
        "Unlock front door and turn on exterior porch lights.",
        "Tie up any pets and clear pathways for the stretcher.",
        "Appoint someone to ride in the ambulance if possible."
      ]
    }
  ];

  // Tick countdown timer
  useEffect(() => {
    if (drillActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setDrillActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [drillActive]);

  const handleStartDrill = () => {
    setDrillActive(true);
    setTimeLeft(3600);
    setActiveStep(0);
    setCompletedActions({});
  };

  const handleStopDrill = () => {
    setDrillActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleAction = (stepIndex: number, actionIndex: number) => {
    const key = `${stepIndex}-${actionIndex}`;
    setCompletedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute overall drill completion percentage
  const totalActions = DRILL_STEPS.reduce((acc, step) => acc + step.actions.length, 0);
  const completedCount = Object.values(completedActions).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalActions) * 100);

  return (
    <div className="space-y-6">
      {/* ── Header View ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-rose-400 animate-pulse" /> Stroke Emergency Drill & FAST Protocol
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Practice emergency protocols and countdown the critical "Golden Hour" response</p>
        </div>
        {!drillActive ? (
          <button
            onClick={handleStartDrill}
            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-lg shadow-rose-500/20 text-xs font-bold bg-gradient-to-br from-rose-500 to-red-600 self-start sm:self-center"
          >
            <Play size={13} fill="white" /> Start Active Drill
          </button>
        ) : (
          <button
            onClick={handleStopDrill}
            className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 self-start sm:self-center border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <AlertCircle size={13} /> Terminate Drill
          </button>
        )}
      </div>

      {!drillActive ? (
        /* ── Non-Active Drill Splash Screen ─── */
        <div className="glass-card p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 animate-float">
            <Clock size={32} />
          </div>
          <div>
            <h3 className="text-base font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              FAST Rescue Training & Emergency Practice
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              When a stroke occurs, every single minute saves 1.9 million brain cells. The <strong>"Golden Hour"</strong> drill helps families familiarize themselves with the stress, timelines, and checklists of emergency response.
            </p>
          </div>
          <button
            onClick={handleStartDrill}
            className="btn-primary py-3 px-6 text-sm font-bold bg-gradient-to-br from-rose-500 to-red-600 shadow-xl shadow-rose-500/25 mt-2"
          >
            Launch Emergency Simulation
          </button>
        </div>
      ) : (
        /* ── Active Drill Panel ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active timer and timeline steps (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Ticking Timer Card */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border-rose-500/25">
              <div className="absolute inset-5 rounded-full blur-[80px] bg-rose-500/15 pointer-events-none" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 z-10 mb-2">Golden Hour Countdown</p>
              <div
                className="text-5xl font-black text-rose-400 tracking-tight z-10 mb-4 animate-pulse"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {formatTime(timeLeft)}
              </div>

              {/* Progress bar */}
              <div className="w-full z-10 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span>Drill Checklist</span>
                  <span>{progressPercent}% Done</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, boxShadow: '0 0 8px rgba(244,63,94,0.5)' }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist Tabs */}
            <div className="glass-card p-3 space-y-1 relative z-10">
              {DRILL_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center justify-between gap-3 ${
                    activeStep === idx
                      ? 'bg-rose-500/8 border-rose-500/25 text-rose-300'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeStep === idx ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold">{step.title}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold">{step.timeframe}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active step workspace (8 cols) */}
          <div className="lg:col-span-8">
            <div className="glass-card p-6 border-l-4 border-rose-500/40 animate-scale-in">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/4 border border-white/8">{DRILL_STEPS[activeStep].icon}</div>
                  <div>
                    <h3 className="text-base font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {DRILL_STEPS[activeStep].title}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{DRILL_STEPS[activeStep].timeframe}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Active Task
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6 italic">
                "{DRILL_STEPS[activeStep].description}"
              </p>

              <div className="divider mb-5" />

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-1.5">
                <CheckSquare size={12} className="text-blue-400" /> Actions Required to Proceed
              </h4>

              <div className="space-y-3">
                {DRILL_STEPS[activeStep].actions.map((action, actionIdx) => {
                  const key = `${activeStep}-${actionIdx}`;
                  const isChecked = !!completedActions[key];

                  return (
                    <button
                      key={actionIdx}
                      onClick={() => toggleAction(activeStep, actionIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all duration-150 ${
                        isChecked
                          ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-300'
                          : 'bg-white/3 border-white/6 text-slate-300 hover:border-white/12 hover:bg-white/4'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 text-slate-400">
                        {isChecked ? (
                          <CheckSquare size={16} className="text-emerald-400" />
                        ) : (
                          <Square size={16} />
                        )}
                      </div>
                      <span className="text-xs leading-relaxed">{action}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation inside steps */}
              <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-white/6">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(s => s - 1)}
                  className="btn-ghost py-1.5 px-3.5 disabled:opacity-30 text-xs font-semibold"
                >
                  Previous Phase
                </button>
                {activeStep < DRILL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setActiveStep(s => s + 1)}
                    className="btn-primary py-2 px-4 text-xs font-bold bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/10"
                  >
                    Next Phase
                  </button>
                ) : (
                  <button
                    onClick={handleStopDrill}
                    disabled={progressPercent < 100}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                      progressPercent === 100
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 border-white/8 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Complete Practice Drill!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
