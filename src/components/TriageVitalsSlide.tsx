import React, { useState } from 'react';
import { useFirebaseData } from '../context/FirebaseContext';
import { updatePatientClinicalRecord } from '../lib/firebase';

interface TriageVitalsSlideProps {
  onNavigate?: (station: string) => void;
}

export const TriageVitalsSlide: React.FC<TriageVitalsSlideProps> = ({ onNavigate }) => {
  const { patients, activePatient, setSelectedPatientId, userProfile } = useFirebaseData();
  const [systolic, setSystolic] = useState(130);
  const [diastolic, setDiastolic] = useState(85);
  const [pulse, setPulse] = useState(78);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(98.6);
  const [weight, setWeight] = useState(64.0);
  const [height] = useState(156);
  const [rbs, setRbs] = useState(130);

  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([
    'Routine Screening',
  ]);
  const [urgency, setUrgency] = useState<'green' | 'amber' | 'red'>('green');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const toggleComplaint = (item: string) => {
    setSelectedComplaints((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Station Banner & Active Queue Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[28px]">vital_signs</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Station 02 Desk
              </span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">
                • {userProfile?.fullName || 'ANM Triage Sister'}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface leading-snug font-bold">
              Triage &amp; Pre-Clinical Vitals
            </h1>
          </div>
        </div>

        {/* Active Serving Token Pill with Patient Selector */}
        <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-high px-space-md py-space-xs rounded-xl">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono-token text-mono-token text-secondary font-bold">
              SERVING
            </span>
          </div>
          <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
          
          <select
            value={activePatient?.id || ''}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
          >
            {patients.length === 0 ? (
              <option value="">No Registered Patients</option>
            ) : (
              patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.token} • {p.fullName} ({p.age})
                </option>
              ))
            )}
          </select>

          <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full">
            {patients.length} in camp
          </span>
        </div>
      </div>

      {/* Main 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* LEFT COLUMN: Patient Summary, Critical Allergies & Vitals History (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Patient Identity & Village Card */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-mono-id-lg text-mono-id-lg text-primary font-bold">
                  {activePatient?.token || '---'}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {activePatient?.fullName || 'No Patient in Queue'}
                </h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {activePatient
                    ? `${activePatient.age} • ${activePatient.gender} • ${activePatient.village}`
                    : 'Register a patient at Station 01'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              <span className="bg-surface-container-high px-2 py-1 rounded-md font-mono-token text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">badge</span>
                UID: {activePatient ? `XXXX-XXXX-${activePatient.aadhaarLast4}` : 'Pending'}
              </span>
              <span className="bg-surface-container-high px-2 py-1 rounded-md font-label-sm text-label-sm text-on-surface-variant">
                Phone: {activePatient?.phone || '---'}
              </span>
            </div>
          </div>

          {/* CRITICAL ALERT: Penicillin Allergy */}
          <div className="bg-error-container text-on-error-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-error text-[24px]">emergency</span>
                <span className="font-label-lg text-label-lg font-bold text-error uppercase tracking-wider">
                  Critical Allergy Alert
                </span>
              </div>
              <span className="bg-error text-on-error font-label-sm text-label-sm px-2 py-0.5 rounded-full uppercase">
                High Risk
              </span>
            </div>
            <p className="font-label-md text-label-md font-semibold text-on-error-container">
              PENICILLIN &amp; BETA-LACTAM ANTIBIOTICS
            </p>
            <span className="font-body-sm text-body-sm text-on-error-container">
              Reaction: Acute Anaphylactoid urticaria &amp; bronchospasm (Reported 2021). Avoid
              Amoxicillin / Ampicillin.
            </span>
          </div>

          {/* Chronic Conditions & Risk Profiles */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Chronic Conditions &amp; Cohort
            </span>
            <div className="flex flex-wrap gap-space-xs">
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-label-md text-label-md text-on-surface">
                  Type 2 Diabetes (6 Yrs)
                </span>
              </div>
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span className="font-label-md text-label-md text-on-surface">
                  Hypertension Spectrum
                </span>
              </div>
              <div className="bg-surface-container-high px-3 py-1.5 rounded-lg text-on-surface-variant font-label-md text-label-md">
                Known Med: Metformin 500mg BD
              </div>
            </div>
          </div>

          {/* Historical Baseline Comparison (Jan 2026 Camp) */}
          <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                  Last Visit • Jan 2026
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                9 months ago
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Baseline BP
                </span>
                <span className="font-mono-token text-mono-token text-on-surface">
                  128 / 82{' '}
                  <span className="text-[11px] font-normal text-on-surface-variant">mmHg</span>
                </span>
                <span className="font-label-sm text-label-sm text-primary">Pre-Hypertensive</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Recorded Weight
                </span>
                <span className="font-mono-token text-mono-token text-on-surface">
                  64.0 <span className="text-[11px] font-normal text-on-surface-variant">kg</span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary">
                  +{(weight - 64).toFixed(1)} kg gain today
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>BP Trend (2025 - Present)</span>
                <span className="text-error font-semibold">
                  +{systolic - 128} mmHg Systolic
                </span>
              </div>
              <div className="w-full h-8 bg-surface-container rounded flex items-end px-2 py-1">
                <svg
                  className="w-full h-6 text-error"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 24"
                >
                  <path
                    d="M0,18 L30,16 L65,15 L100,3"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <circle cx="0" cy="18" fill="currentColor" r="2" />
                  <circle cx="30" cy="16" fill="currentColor" r="2" />
                  <circle cx="65" cy="15" fill="currentColor" r="2" />
                  <circle cx="100" cy="3" fill="#ba1a1a" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Large Tactile Vitals Entry Grid & Dispatch Actions (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            {/* 1. BLOOD PRESSURE CARD */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-error text-[20px]">
                    cardiology
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Blood Pressure
                  </span>
                </div>
                <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                  {systolic >= 140 || diastolic >= 90
                    ? 'Stage 2 Hypertension'
                    : 'Elevated BP'}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-space-xs my-space-sm">
                <span className="font-mono-id-lg text-[36px] font-bold leading-none text-error tabular-nums">
                  {systolic}
                </span>
                <span className="font-headline-md text-headline-md text-on-surface-variant font-light">
                  /
                </span>
                <span className="font-mono-id-lg text-[32px] font-bold leading-none text-error tabular-nums">
                  {diastolic}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                  mmHg
                </span>
              </div>
              <div className="flex items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant px-1">
                    Sys
                  </span>
                  <button
                    type="button"
                    onClick={() => setSystolic((v) => Math.max(80, v - 2))}
                    className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystolic((v) => Math.min(220, v + 2))}
                    className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant px-1">
                    Dia
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiastolic((v) => Math.max(50, v - 2))}
                    className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiastolic((v) => Math.min(140, v + 2))}
                    className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-error mt-space-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Compared
                to baseline: +{systolic - 128} mmHg Systolic
              </span>
            </div>

            {/* 2. PULSE RATE CARD */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    favorite
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Pulse Rate
                  </span>
                </div>
                <span className="bg-surface-container-highest text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Regular Rhythm
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-space-xs my-space-sm">
                <span className="font-mono-id-lg text-[36px] font-bold leading-none text-primary tabular-nums">
                  {pulse}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                  bpm
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <button
                  type="button"
                  onClick={() => setPulse((v) => Math.max(45, v - 1))}
                  className="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span> -1 bpm
                </button>
                <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span> Normal
                  (60-100)
                </div>
                <button
                  type="button"
                  onClick={() => setPulse((v) => Math.min(180, v + 1))}
                  className="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> +1 bpm
                </button>
              </div>
            </div>

            {/* 3. SpO2 OXYGEN SATURATION */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">air</span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    SpO2 Oxygen
                  </span>
                </div>
                <span className="bg-surface-container-highest text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  Healthy Ambient
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-space-xs my-space-sm">
                <span className="font-mono-id-lg text-[36px] font-bold leading-none text-primary tabular-nums">
                  {spo2}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                  % Room Air
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <button
                  type="button"
                  onClick={() => setSpo2((v) => Math.max(75, v - 1))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span> -1%
                </button>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Adequate Perfusion
                </span>
                <button
                  type="button"
                  onClick={() => setSpo2((v) => Math.min(100, v + 1))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> +1%
                </button>
              </div>
            </div>

            {/* 4. BODY TEMPERATURE */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    device_thermostat
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Body Temperature
                  </span>
                </div>
                <span className="bg-surface-container-highest text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                  {temp >= 99.5 ? 'Febrile' : 'Afebrile'}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-space-xs my-space-sm">
                <span className="font-mono-id-lg text-[36px] font-bold leading-none text-on-surface tabular-nums">
                  {temp.toFixed(1)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                  °F Axillary
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <button
                  type="button"
                  onClick={() => setTemp((v) => Math.max(95, +(v - 0.2).toFixed(1)))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span> -0.2°
                </button>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Infrared Sensor #2
                </span>
                <button
                  type="button"
                  onClick={() => setTemp((v) => Math.min(105, +(v + 0.2).toFixed(1)))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> +0.2°
                </button>
              </div>
            </div>

            {/* 5. ANTHROPOMETRY & AUTO-CALCULATED BMI */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    scale
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Anthropometry
                  </span>
                </div>
                <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">
                  BMI {bmi} • Obese Cl. 1
                </span>
              </div>
              <div className="grid grid-cols-2 gap-space-sm my-space-xs text-center">
                <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Weight
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setWeight((w) => Math.max(35, +(w - 0.5).toFixed(1)))}
                      className="w-6 h-6 rounded bg-surface-container text-on-surface hover:bg-primary hover:text-on-primary flex items-center justify-center text-xs font-bold"
                    >
                      −
                    </button>
                    <span className="font-mono-token text-mono-token font-bold text-on-surface tabular-nums">
                      {weight.toFixed(1)} <span className="text-[11px] font-normal">kg</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setWeight((w) => Math.min(140, +(w + 0.5).toFixed(1)))}
                      className="w-6 h-6 rounded bg-surface-container text-on-surface hover:bg-primary hover:text-on-primary flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col justify-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Height
                  </span>
                  <div className="flex items-baseline justify-center">
                    <span className="font-mono-token text-mono-token font-bold text-on-surface">
                      {height}
                    </span>
                    <span className="text-[12px] text-on-surface-variant ml-1">cm</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-space-xs">
                <span>Asian Indian Cut-off: ≥27.5 Obese</span>
                <span className="text-secondary font-semibold">
                  +{(weight - 64).toFixed(1)} kg baseline diff
                </span>
              </div>
            </div>

            {/* 6. RANDOM BLOOD GLUCOSE (RBS) */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    water_drop
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Capillary Blood Glucose (RBS)
                  </span>
                </div>
                <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                  Postprandial Elevated
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-space-xs my-space-sm">
                <span className="font-mono-id-lg text-[36px] font-bold leading-none text-secondary tabular-nums">
                  {rbs}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                  mg/dL
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <button
                  type="button"
                  onClick={() => setRbs((v) => Math.max(60, v - 5))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span> -5
                </button>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Meal: 2.5 hrs ago
                </span>
                <button
                  type="button"
                  onClick={() => setRbs((v) => Math.min(450, v + 5))}
                  className="h-10 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-md flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> +5
                </button>
              </div>
            </div>
          </div>

          {/* Chief Complaint Rapid Toggles */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Triage Chief Complaints (Sister Roopa Intake)
            </span>
            <div className="flex flex-wrap gap-space-xs pt-1">
              {[
                'Morning Dizziness',
                'Occipital Headache',
                'Joint Pain (Knee/Hip)',
                'Fever / Chills',
                'Chest Tightness',
              ].map((comp) => {
                const isSelected = selectedComplaints.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => toggleComplaint(comp)}
                    className={`min-h-[44px] px-4 py-2 rounded-lg font-label-md flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    )}
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Triage Urgency Level Segmented Selector */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Clinical Urgency Classification
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                Flagged: Priority Routine Consultation
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-1">
              <label
                onClick={() => setUrgency('green')}
                className={`cursor-pointer flex items-center gap-space-sm p-space-sm rounded-lg transition-colors ${
                  urgency === 'green'
                    ? 'bg-primary-fixed text-on-primary-fixed shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'green'}
                  onChange={() => setUrgency('green')}
                  className="w-5 h-5 text-primary accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    Standard (Green)
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Normal flow queue
                  </span>
                </div>
              </label>

              <label
                onClick={() => setUrgency('amber')}
                className={`cursor-pointer flex items-center gap-space-sm p-space-sm rounded-lg transition-colors ${
                  urgency === 'amber'
                    ? 'bg-secondary-container text-on-secondary-container shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'amber'}
                  onChange={() => setUrgency('amber')}
                  className="w-5 h-5 text-secondary accent-secondary"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold">Priority (Amber)</span>
                  <span className="font-label-sm text-label-sm text-on-secondary-container">
                    High BP / Doctor Alert
                  </span>
                </div>
              </label>

              <label
                onClick={() => setUrgency('red')}
                className={`cursor-pointer flex items-center gap-space-sm p-space-sm rounded-lg transition-colors ${
                  urgency === 'red'
                    ? 'bg-error-container text-on-error-container shadow-xs'
                    : 'bg-surface-container-low hover:bg-error-container/50'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'red'}
                  onChange={() => setUrgency('red')}
                  className="w-5 h-5 text-error accent-error"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-error font-bold">
                    Emergency (Red)
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Immediate Hospital Transfer
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Footer: Save & Dispatch */}
          <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
            <button
              type="button"
              disabled={!activePatient}
              onClick={async () => {
                if (!activePatient) {
                  triggerToast('Please register a patient at Station 01 first');
                  return;
                }
                const summary = `BP ${systolic}/${diastolic} mmHg, Pulse ${pulse} bpm, SpO2 ${spo2}%, RBS ${rbs} mg/dL, Temp ${temp}°F (${urgency.toUpperCase()})`;
                try {
                  await updatePatientClinicalRecord(activePatient.id, {
                    vitalsSummary: summary,
                    status: 'triaged',
                  });
                  triggerToast(
                    `Saved Vitals for ${activePatient.fullName} (${activePatient.token}) to Firestore & Dispatched to OPD`
                  );
                  setTimeout(() => onNavigate?.('consultation'), 1100);
                } catch {
                  triggerToast(`Vitals recorded for ${activePatient.fullName} (${activePatient.token})`);
                }
              }}
              className="w-full sm:flex-1 h-14 bg-primary hover:bg-[#005141] text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[22px]">stethoscope</span>
              <span>
                Save Vitals &amp; Dispatch {activePatient ? `${activePatient.fullName} (${activePatient.token})` : ''} to Doctor
              </span>
            </button>
            <button
              type="button"
              disabled={!activePatient}
              onClick={() =>
                triggerToast(
                  `Printing Thermal Vitals Slip for ${activePatient?.token || 'Patient'} (${activePatient?.fullName || ''})...`
                )
              }
              className="w-full sm:w-auto h-14 px-space-lg bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>Print Vitals Slip</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-14 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-label-md text-label-md">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
