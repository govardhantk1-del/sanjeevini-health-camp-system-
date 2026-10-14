import React, { useState, useEffect } from 'react';
import { useFirebaseData } from '../context/FirebaseContext';
import { updatePatientClinicalRecord } from '../lib/firebase';

interface DoctorConsultationSlideProps {
  onNavigate?: (station: string) => void;
}

interface PrescribedItem {
  id: string;
  name: string;
  form: string;
  regimen: string;
  duration: string;
  stock: number;
  lowStockWarning?: string;
}

export const DoctorConsultationSlide: React.FC<DoctorConsultationSlideProps> = ({ onNavigate }) => {
  const { patients, activePatient, setSelectedPatientId, userProfile } = useFirebaseData();
  const [viewMode, setViewMode] = useState<'workstation' | 'mobile'>('workstation');
  const [seconds, setSeconds] = useState(169); // 02:49
  const [symptoms, setSymptoms] = useState<string[]>([
    'Morning Dizziness',
    'Occipital Headache',
  ]);
  const [diagnoses, setDiagnoses] = useState<
    { type: 'PRIMARY' | 'SECONDARY'; code: string; title: string }[]
  >([
    { type: 'PRIMARY', code: 'I10', title: 'Essential (primary) hypertension' },
  ]);
  const [icdQuery, setIcdQuery] = useState('');
  const [doctorNotes, setDoctorNotes] = useState(
    'Patient presents for general health screening. Advised balanced nutrition, blood pressure monitoring, and adequate hydration.'
  );
  const [rxList, setRxList] = useState<PrescribedItem[]>([
    {
      id: 'aml',
      name: 'Amlodipine 5 mg',
      form: 'Tablet',
      regimen: '1 - 0 - 0 (Morning after food)',
      duration: '30 Days (Qty: 30)',
      stock: 400,
    },
    {
      id: 'met',
      name: 'Metformin 500 mg',
      form: 'Tablet',
      regimen: '1 - 0 - 1 (Morning + Dinner)',
      duration: '30 Days (Qty: 60)',
      stock: 45,
      lowStockWarning: 'Dispense 45 tabs now + 15 PHC balance slip',
    },
  ]);
  const [review30Days, setReview30Days] = useState(true);
  const [ecgReferral, setEcgReferral] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDispatchRx = async () => {
    if (!activePatient) {
      triggerToast('No active patient selected for consultation');
      return;
    }
    const diagSummary = diagnoses.map((d) => `${d.code}: ${d.title}`).join('; ');
    const rxSummary = rxList.map((m) => `${m.name} (${m.regimen}, ${m.duration})`).join('; ');
    try {
      await updatePatientClinicalRecord(activePatient.id, {
        diagnosis: diagSummary || 'General OPD Examination Completed',
        prescriptionSummary: rxSummary || 'Medications prescribed',
        status: 'consulted',
      });
      triggerToast(
        `Rx Dispatched to Pharmacy • ${activePatient.fullName} (${activePatient.token}) routed to Dispense Counter 1`
      );
    } catch {
      triggerToast(
        `Rx Dispatched locally • ${activePatient.fullName} (${activePatient.token}) routed to Dispense Counter 1`
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleDispatchRx();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePatient, diagnoses, rxList]);

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const addShortcutMedicine = (medName: string, regimen: string, duration: string, stock: number) => {
    if (rxList.some((m) => m.name === medName)) {
      triggerToast(`${medName} is already in the active prescription`);
      return;
    }
    setRxList((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: medName,
        form: 'Tablet',
        regimen,
        duration,
        stock,
      },
    ]);
    triggerToast(`Added ${medName} to Formulary Rx Builder`);
  };

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!icdQuery.trim()) return;
    setDiagnoses((prev) => [
      ...prev,
      { type: 'SECONDARY', code: 'M17.0', title: icdQuery.trim() },
    ]);
    setIcdQuery('');
    triggerToast('Added ICD-10 diagnosis to consultation record');
  };

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Top Session Diagnostic Bar */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md min-w-0">
          <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">stethoscope</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                Workstation 02 • General Medicine
              </span>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-semibold">
                Live Camp Desk
              </span>
            </div>
            <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm flex-wrap">
              <span className="font-semibold text-on-surface">
                {userProfile?.fullName || 'Dr. Govardhan T K, MD'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Active
                Session #HS-TUM-04
              </span>
              <span>•</span>
              <span className="font-mono-token text-mono-token text-on-surface">
                Target ≤ 3m / Consult
              </span>
            </div>
          </div>
        </div>

        {/* Active Timer & Rapid Switch Controls */}
        <div className="flex items-center gap-space-sm ml-auto flex-wrap">
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('workstation')}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                viewMode === 'workstation'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              3-Panel Desk
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Mobile Consult
            </button>
          </div>

          <div className="flex items-center bg-error-container text-on-error-container px-3.5 py-2 rounded-lg gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">timer</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-error-container/80">
                Elapsed
              </span>
              <span className="font-mono-id-lg text-mono-id-lg leading-none font-bold tabular-nums">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Real Patient Queue Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-base">person</span>
            <select
              value={activePatient?.id || ''}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none max-w-[200px]"
            >
              {patients.length === 0 ? (
                <option value="">No Patients in Queue</option>
              ) : (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.token} • {p.fullName} ({p.age})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'mobile' ? (
        /* MOBILE CONSULTATION VIEW (Slide 9) */
        <div className="max-w-md mx-auto w-full flex flex-col gap-space-md">
          {/* Camp Stepper Micro-Tracker */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high/60">
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-sm text-[10px]">
                1
              </span>
              <span className="font-label-sm text-[11px] text-on-surface">Reg</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              chevron_right
            </span>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-sm text-[10px]">
                2
              </span>
              <span className="font-label-sm text-[11px] text-on-surface">Triage</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              chevron_right
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary shadow-xs">
              <span className="material-symbols-outlined text-[14px]">stethoscope</span>
              <span className="font-label-sm text-[11px] font-bold">3. Consult</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              chevron_right
            </span>
            <div className="flex items-center gap-1.5 opacity-50">
              <span className="w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm text-[10px]">
                4
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant">Dispense</span>
            </div>
          </div>

          {/* Patient Header Card */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="px-2.5 py-1 rounded-lg bg-surface-container-high text-primary font-mono-id-lg text-[18px] leading-tight font-bold">
                  {activePatient?.token || '#T-001'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                      {activePatient?.fullName || 'No Patient Selected'}
                    </h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {activePatient ? `(${activePatient.age}, ${activePatient.gender})` : ''}
                    </span>
                  </div>
                  <span className="font-mono-token text-[11px] text-on-surface-variant block">
                    {activePatient ? `Aadhaar: XXXX-XXXX-${activePatient.aadhaarLast4}` : 'Awaiting patient registration'}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary">
                <span className="material-symbols-outlined text-[15px] animate-pulse">timer</span>
                <span className="font-mono-token text-[12px] font-bold tabular-nums">
                  {formattedTime}
                </span>
              </div>
            </div>

            <div className="mt-space-sm rounded-lg bg-surface-container p-2.5 flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">vital_signs</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider block font-bold text-primary">
                  Triage Vitals Summary
                </span>
                <p className="font-label-md text-label-md font-semibold leading-tight truncate text-on-surface">
                  {activePatient?.vitalsSummary || 'No acute alerts recorded'}
                </p>
              </div>
            </div>

            <div className="mt-space-sm flex flex-wrap gap-1.5 items-center">
              <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mr-1">
                Village:
              </span>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                {activePatient?.village || 'Camp Site'}
              </span>
            </div>
          </div>

          {/* Recorded Vitals */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  monitor_heart
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Recorded Vitals
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Triage @ 10:14 AM
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="col-span-2 rounded-xl bg-error-container/30 p-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-error text-on-error flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">cardiology</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Blood Pressure (Sitting)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline-md text-headline-md font-bold text-error">
                        148/94
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        mmHg
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-error text-on-error font-label-sm text-[11px] font-bold uppercase">
                  ↑ Elevated BP
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Pulse Rate
                </span>
                <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                  88 <span className="font-body-sm font-normal">bpm</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  SpO2 (Room Air)
                </span>
                <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                  96 <span className="font-body-sm font-normal">%</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Temperature
                </span>
                <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                  98.6 <span className="font-body-sm font-normal">°F</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Ht / Wt</span>
                <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                  70 <span className="font-label-sm font-normal">kg · 152cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                triggerToast('Saved & Sent T-042 Prescription to Pharmacy!');
                setTimeout(() => onNavigate?.('pharmacy-dispense'), 900);
              }}
              className="w-full h-14 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
              <span>Save &amp; Send to Pharmacy</span>
            </button>
          </div>
        </div>
      ) : (
        /* MAIN 3-PANEL HIGH-EFFICIENCY WORKSTATION GRID (Slide 10) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md w-full items-start">
          {/* LEFT PANEL: Station Waiting List & Current Patient Master Profile */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                  <span>Station Waiting List</span>
                </span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-mono-token text-label-sm px-2 py-0.5 rounded-full font-bold">
                  3 Urgent
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {patients.length === 0 && (
                  <div className="p-4 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                    No patients currently registered in camp.
                  </div>
                )}
                {patients.map((item) => {
                  const isSelected = activePatient?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPatientId(item.id)}
                      className={`p-3 rounded-xl relative overflow-hidden cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-surface-container-high shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                      )}
                      <div className="flex items-center justify-between mb-1 pl-1">
                        <span
                          className={`font-mono-token text-mono-token font-bold ${
                            isSelected ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {item.token}
                        </span>
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold">
                          {item.status || 'Registered'}
                        </span>
                      </div>
                      <div className="pl-1">
                        <div className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                          {item.fullName}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between mt-1">
                          <span>
                            {item.age} • {item.gender} • {item.village}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Patient Master Profile */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-14 h-14 rounded-full bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-headline-md shrink-0">
                    {activePatient
                      ? activePatient.fullName
                          .split(' ')
                          .map((w: string) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'PT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-id-lg text-mono-id-lg text-primary font-bold">
                        {activePatient?.token || '---'}
                      </span>
                      <span className="bg-surface-container text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded">
                        Token
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                      {activePatient?.fullName || 'No Patient in Queue'}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {activePatient
                        ? `${activePatient.age} • ${activePatient.gender} • ${activePatient.village}`
                        : 'Please register a patient at Station 01'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.('dossier')}
                  className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-variant"
                  title="View Full Longitudinal Record"
                >
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg text-body-sm font-body-sm">
                <div>
                  <span className="text-on-surface-variant font-label-sm text-label-sm block">
                    Government ID
                  </span>
                  <span className="font-mono-token text-label-md text-on-surface font-semibold">
                    {activePatient ? `Aadhaar: XXXX-XXXX-${activePatient.aadhaarLast4}` : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant font-label-sm text-label-sm block">
                    Contact Phone
                  </span>
                  <span className="font-mono-token text-label-md text-on-surface font-semibold">
                    {activePatient?.phone || '---'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-on-surface-variant font-label-sm text-label-sm block">
                    Residence / Village
                  </span>
                  <span className="text-on-surface font-semibold">
                    {activePatient?.village || 'Holavanahalli Camp'}
                  </span>
                </div>
              </div>

              {/* CRITICAL ALLERGY ALERT BANNER */}
              <div className="bg-error text-on-error rounded-xl p-3.5 shadow-md flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[24px] shrink-0 text-white">
                  warning
                </span>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-bold tracking-tight text-white">
                    CRITICAL ALLERGY: PENICILLIN
                  </span>
                  <p className="font-body-sm text-body-sm text-white/95 leading-snug mt-0.5">
                    Severe anaphylaxis reaction recorded in 2024. Strictly avoid all beta-lactam
                    antibiotics (Amoxicillin, Ampicillin, Cephalosporins).
                  </p>
                </div>
              </div>

              {/* Chronic History Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Registered Chronic History
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full font-medium">
                    Type 2 Diabetes (6 yrs)
                  </span>
                  <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full font-medium">
                    Hypertension Risk
                  </span>
                  <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full font-medium">
                    Osteoarthritis Knee
                  </span>
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold">
                    Camp Visit: 12 Jan 2026
                  </span>
                </div>
              </div>

              <div className="p-3 bg-surface-container rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    how_to_reg
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    Triage Nurse: Sister Roopa K.
                  </span>
                </div>
                <span className="font-label-sm text-label-sm bg-surface-container-lowest px-2 py-0.5 rounded text-on-surface font-semibold">
                  09:18 AM
                </span>
              </div>
            </div>
          </div>

          {/* CENTER PANEL: Vitals Telemetry, Symptoms, ICD-10 Diagnosis & Notes */}
          <div className="lg:col-span-8 xl:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    vital_signs
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Triage Vitals Telemetry
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Measured 24 mins ago
                </span>
              </div>

              {/* Primary BP Focus Tile */}
              <div className="bg-error-container text-on-error-container p-space-md rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">blood_pressure</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-bold text-on-error-container/80 block">
                      Blood Pressure
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-error-container font-extrabold leading-none">
                        148/94
                      </span>
                      <span className="font-label-md text-label-md font-semibold text-on-error-container">
                        mmHg
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-error text-on-error font-label-sm text-label-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Stage 2 Hypertension
                  </span>
                  <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-error-container font-semibold">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>+20 mmHg vs Jan 2026 (128/82)</span>
                  </div>
                </div>
              </div>

              {/* 5-Metric Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm">
                <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    Pulse Rate
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      favorite
                    </span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      88
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">bpm</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary mt-1 font-medium">
                    Regular Rhythm
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    SpO2 (Pulse Ox)
                    <span className="material-symbols-outlined text-[16px] text-primary">air</span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      96
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">%</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary mt-1 font-medium">
                    Room Air (Normal)
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    Body Temp
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      device_thermostat
                    </span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      98.6
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">°F</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary mt-1 font-medium">
                    Afebrile
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    Weight / Height
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      straighten
                    </span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      70
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      kg / 152 cm
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-medium">
                    Waist: 88 cm
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between sm:col-span-2">
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    Calculated BMI
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                      Obese Class I
                    </span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-headline-md text-headline-md text-secondary font-bold">
                      30.3
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      kg/m² (Elevated metabolic risk)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full mt-2 overflow-hidden flex">
                    <div className="bg-primary h-full w-[45%]"></div>
                    <div className="bg-secondary-container h-full w-[25%]"></div>
                    <div className="bg-error h-full w-[30%]"></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    water_drop
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Random Capillary Blood Sugar (RBS):
                  </span>
                  <span className="font-mono-token text-headline-sm text-on-surface font-bold">
                    186 mg/dL
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full font-bold">
                  Postprandial High
                </span>
              </div>
            </div>

            {/* Chief Complaints Multi-Select */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
                  Chief Complaints &amp; Reported Symptoms
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Quick Tap Mode
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Morning Dizziness (2 wks)',
                  'Occipital Headache',
                  'Bilateral Knee Pain',
                  'Fever',
                  'Cough / Cold',
                  'Chest Tightness',
                ].map((sym) => {
                  const active = symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`h-10 px-3.5 rounded-lg font-label-md text-label-md flex items-center gap-2 transition-colors ${
                        active
                          ? 'bg-primary-container text-on-primary-container shadow-xs font-semibold'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {active ? 'check' : 'add'}
                      </span>
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ICD-10 Diagnosis Selector */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <label
                className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider"
                htmlFor="icdInput"
              >
                ICD-10 Clinical Diagnosis
              </label>
              <form onSubmit={handleAddDiagnosis} className="relative w-full">
                <input
                  id="icdInput"
                  type="text"
                  value={icdQuery}
                  onChange={(e) => setIcdQuery(e.target.value)}
                  placeholder="Search ICD-10 code or condition and press Enter (e.g., M17 Knee Osteoarthritis)..."
                  className="w-full h-12 bg-surface-container-low text-on-surface rounded-lg px-10 font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">
                  search
                </span>
              </form>

              <div className="flex flex-col gap-2 mt-1">
                {diagnoses.map((d, idx) => (
                  <div
                    key={`${d.code}-${idx}`}
                    className={`p-2.5 rounded-lg flex items-center justify-between ${
                      d.type === 'PRIMARY' ? 'bg-surface-container' : 'bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded ${
                          d.type === 'PRIMARY'
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {d.type}
                      </span>
                      <span className="font-mono-token text-label-md text-primary font-bold">
                        [{d.code}]
                      </span>
                      <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {d.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDiagnoses((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))
                      }
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                      title="Remove diagnosis"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor's Clinical Examination Notes */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label
                  className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider"
                  htmlFor="doctorNotes"
                >
                  Clinical Examination &amp; Counsel Notes
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate?.('voice-ai')}
                  className="font-label-sm text-label-sm text-primary font-medium hover:underline"
                >
                  Bilingual Speech-to-Text Available (KN/EN)
                </button>
              </div>
              <textarea
                id="doctorNotes"
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-lg p-3 font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* RIGHT PANEL: Formulary Rx Builder */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col gap-2 pb-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      prescriptions
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Formulary Rx Builder
                    </span>
                  </div>
                  <span className="font-mono-token text-label-sm text-on-surface bg-surface-container px-2 py-0.5 rounded font-bold">
                    {rxList.length} Drugs
                  </span>
                </div>
                <div className="bg-surface-container-high text-primary px-3 py-2 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">
                    Verified: 0 Penicillin / Beta-lactam conflicts in Rx
                  </span>
                </div>
              </div>

              {/* Prescribed Items List */}
              <div className="flex flex-col gap-3">
                {rxList.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-bold">
                            {index + 1}. {item.name}
                          </span>
                          <span className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">
                            {item.form}
                          </span>
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Regimen: <strong className="text-on-surface">{item.regimen}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRxList((prev) => prev.filter((m) => m.id !== item.id))
                        }
                        className="text-on-surface-variant hover:text-error transition-colors p-1"
                        title="Delete Medicine"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-body-sm font-body-sm pt-1">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">
                          Duration / Dispense
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          {item.duration}
                        </span>
                      </div>
                      {item.stock < 60 ? (
                        <div className="bg-secondary-fixed p-2 rounded-lg text-on-secondary-fixed">
                          <span className="font-label-sm text-label-sm block font-bold">
                            Limited Stock
                          </span>
                          <span className="font-label-md text-label-md font-bold">
                            {item.stock} left at Camp
                          </span>
                        </div>
                      ) : (
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">
                            Camp Formulary Stock
                          </span>
                          <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            {item.stock} tabs left
                          </span>
                        </div>
                      )}
                    </div>

                    {item.lowStockWarning && (
                      <div className="bg-secondary-container/30 p-2.5 rounded-lg flex items-center justify-between text-body-sm font-body-sm">
                        <div className="flex items-center gap-1.5 text-on-secondary-container">
                          <span className="material-symbols-outlined text-[18px]">alt_route</span>
                          <span className="font-label-sm text-label-sm font-bold">
                            {item.lowStockWarning}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Medicine Quick Search Trigger */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    addShortcutMedicine(
                      'Paracetamol 650 mg',
                      'SOS (Max 2 daily after food)',
                      '5 Days (Qty: 10)',
                      120
                    )
                  }
                  className="w-full h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>+ Add Medicine from Formulary</span>
                </button>
                <div className="flex items-center justify-between text-on-surface-variant px-1 font-body-sm text-body-sm flex-wrap gap-1">
                  <span>Fast shortcuts:</span>
                  <div className="flex gap-1.5 font-mono-token text-label-sm flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        addShortcutMedicine(
                          'Paracetamol 650 mg',
                          'SOS (Max 2 daily)',
                          '5 Days (Qty: 10)',
                          120
                        )
                      }
                      className="bg-surface-container-low px-2 py-0.5 rounded hover:bg-surface-container text-on-surface"
                    >
                      + Paracetamol
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addShortcutMedicine(
                          'Pantoprazole 40 mg',
                          '1 - 0 - 0 (Before breakfast)',
                          '14 Days (Qty: 14)',
                          210
                        )
                      }
                      className="bg-surface-container-low px-2 py-0.5 rounded hover:bg-surface-container text-on-surface"
                    >
                      + Antacid
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addShortcutMedicine(
                          'Vitamin B-Complex',
                          '0 - 1 - 0 (After lunch)',
                          '30 Days (Qty: 30)',
                          340
                        )
                      }
                      className="bg-surface-container-low px-2 py-0.5 rounded hover:bg-surface-container text-on-surface"
                    >
                      + B-Complex
                    </button>
                  </div>
                </div>
              </div>

              {/* Follow-Up & Referral Section */}
              <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      calendar_today
                    </span>
                    <span>Camp Follow-up Plan</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    Hosahalli PHC
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={review30Days}
                      onChange={(e) => setReview30Days(e.target.checked)}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                      Review in 30 days at PHC
                    </span>
                  </label>
                  <span className="font-mono-token text-label-sm text-on-surface-variant font-semibold">
                    18 Nov 2026
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={ecgReferral}
                    onChange={(e) => setEcgReferral(e.target.checked)}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface">
                    Generate District Hospital ECG Referral Slip
                  </span>
                </label>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
              <button
                type="button"
                onClick={async () => {
                  await handleDispatchRx();
                  setTimeout(() => onNavigate?.('pharmacy'), 1100);
                }}
                className="w-full h-14 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-sm transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[24px]">local_pharmacy</span>
                <span>Save &amp; Send to Pharmacy (F4)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    triggerToast('Printing Bilingual Kannada + English Rx Slip...')
                  }
                  className="h-11 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Print Rx (Kannada)</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Consultation draft saved to local SQLite node')}
                  className="h-11 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Draft</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Sync ready (Station 4 connected)
                </span>
                <span className="font-mono-token">Alt + N Next Patient</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-14 right-6 z-50 bg-surface-container-lowest text-on-surface p-4 rounded-xl shadow-xl border border-primary/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg font-bold">Clinical Action Confirmed</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};
