import React, { useState } from 'react';
import { useFirebaseData } from '../context/FirebaseContext';

export const PatientDossierSlide: React.FC = () => {
  const { patients, activePatient, setSelectedPatientId } = useFirebaseData();
  const [selectedVisitId, setSelectedVisitId] = useState<number>(1);
  const [modalDoc, setModalDoc] = useState<{
    title: string;
    description: string;
    imageUrl: string;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const patient = activePatient || patients[0];
  const initials = patient?.fullName
    ? patient.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PT';

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Top Action & Patient Identification Bar */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-md">
          {/* Patient Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            <select
              value={patient?.id || ''}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
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
          </div>

          <div className="flex items-center gap-space-xs bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
            <span className="font-mono-token text-mono-token text-primary tracking-wider">
              {patient?.token || 'HC-2026-LIVE'}
            </span>
          </div>
          <div className="h-6 w-[2px] bg-surface-container-highest hidden sm:block"></div>
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
              {patient?.fullName || 'No Patient in Queue'}
            </span>
            <span className="font-body-md text-on-surface-variant font-medium">
              ({patient ? `${patient.age}, ${patient.gender}` : 'Register a patient'})
            </span>
          </div>
          <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">bloodtype</span>
            Blood Group: B+
          </span>
          <div className="flex items-center gap-1 font-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">call</span>
            <span>{patient?.phone || 'No phone entered'}</span>
          </div>
          <span className="bg-primary-container/15 text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Aadhaar: {patient ? `XXXX-XXXX-${patient.aadhaarLast4}` : 'Pending'}
          </span>
        </div>

        {/* Quick Tool Actions */}
        <div className="flex items-center gap-space-sm self-end xl:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => triggerToast(`Sending Clinical Summary for ${patient?.fullName || 'Patient'} to Print Spooler...`)}
            className="h-10 px-4 bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Clinical Summary</span>
          </button>
          <button
            type="button"
            onClick={() =>
              triggerToast(`${patient?.token || 'Token'}_${patient?.fullName || 'Patient'}_Dossier.pdf generated successfully.`)
            }
            className="h-10 px-4 bg-primary text-on-primary hover:bg-primary/95 font-label-md text-label-md rounded-lg flex items-center gap-2 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export Full Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* 3-Column Focused Longitudinal Medical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* COLUMN 1: Profile & Risk Factors (3 of 12 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center gap-space-sm mb-space-md">
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-lg text-headline-lg font-bold shadow-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                  {patient?.fullName || 'Awaiting Patient'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {patient?.gender === 'Male' ? 'male' : 'female'}
                  </span>
                  {patient ? `${patient.age} • ${patient.village}` : '---'}
                </span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  {patient ? `Token: ${patient.token}` : 'Station 01'}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-sm flex items-start gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                home_pin
              </span>
              <span className="font-body-sm text-body-sm leading-snug">
                {patient?.village ? `${patient.village}, Tumakuru District, Karnataka` : 'Residence address will display here once registered.'}
              </span>
            </div>
          </div>

          {/* CRITICAL ALLERGY ALERT */}
          <div className="bg-error-container text-on-error-container rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-error text-[22px]">warning</span>
                <span className="font-label-md text-label-md uppercase tracking-wider font-bold text-error">
                  Critical Allergy
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm">
                High Risk
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-error-container mt-1 font-bold">
              Penicillin &amp; β-Lactams
            </p>
            <p className="font-body-sm text-body-sm mt-1 text-on-error-container/90 leading-tight">
              Severe anaphylaxis &amp; angioedema documented during rural camp IV administration in
              March 2024. Strictly contraindicated.
            </p>
          </div>

          {/* Chronic Conditions */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Chronic Conditions
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                2 Active
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Type 2 Diabetes Mellitus
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Diagnosed 6 yrs ago (2020)
                    </p>
                  </div>
                </div>
                <span className="font-mono-token text-[12px] bg-surface-container px-2 py-0.5 rounded text-on-surface font-bold">
                  ICD: E11.9
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0"></span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Stage 2 Hypertension
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Uncontrolled • High Escalation Risk
                    </p>
                  </div>
                </div>
                <span className="font-mono-token text-[12px] bg-surface-container px-2 py-0.5 rounded text-on-surface font-bold">
                  ICD: I10
                </span>
              </div>
            </div>
          </div>

          {/* Longitudinal Vitals Trends */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Longitudinal Trends
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Jan 2026 → Oct 2026
              </span>
            </div>

            {/* BP Trend */}
            <div className="bg-surface-container-low rounded-lg p-space-sm mb-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Systolic BP Trend
                </span>
                <span className="font-label-sm text-label-sm text-error font-bold flex items-center">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  +20 mmHg
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono-token text-body-sm text-on-surface-variant">128/82</span>
                <span className="font-mono-token text-headline-sm text-error font-bold">
                  148/94{' '}
                  <span className="text-[12px] font-normal text-on-surface-variant">mmHg</span>
                </span>
              </div>
              <div className="w-full h-10 mt-1">
                <svg
                  className="w-full h-full overflow-visible text-error"
                  fill="none"
                  viewBox="0 0 200 40"
                >
                  <path
                    d="M 0 32 L 50 28 L 100 24 L 150 14 L 200 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <circle className="fill-current text-primary" cx="0" cy="32" r="3.5" />
                  <circle className="fill-current text-on-surface-variant" cx="50" cy="28" r="3" />
                  <circle className="fill-current text-on-surface-variant" cx="100" cy="24" r="3" />
                  <circle className="fill-current text-secondary" cx="150" cy="14" r="3" />
                  <circle className="fill-current text-error" cx="200" cy="6" r="4.5" />
                </svg>
              </div>
            </div>

            {/* Weight Trend */}
            <div className="bg-surface-container-low rounded-lg p-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Body Weight Trend
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  +6 kg (+9.3%)
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono-token text-body-sm text-on-surface-variant">
                  64.0 kg
                </span>
                <span className="font-mono-token text-headline-sm text-on-surface font-bold">
                  70.0 <span className="text-[12px] font-normal text-on-surface-variant">kg</span>
                </span>
              </div>
              <div className="w-full h-10 mt-1">
                <svg
                  className="w-full h-full overflow-visible text-secondary"
                  fill="none"
                  viewBox="0 0 200 40"
                >
                  <path
                    d="M 0 30 L 70 25 L 140 18 L 200 8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <circle className="fill-current text-primary" cx="0" cy="30" r="3.5" />
                  <circle className="fill-current text-on-surface-variant" cx="70" cy="25" r="3" />
                  <circle className="fill-current text-secondary" cx="140" cy="18" r="3" />
                  <circle className="fill-current text-secondary" cx="200" cy="8" r="4.5" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* COLUMN 2: Camp Visit Chronological Timeline (4 of 12 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">history</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Longitudinal Visits
                </h2>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-full text-on-surface font-semibold">
                3 Encounters
              </span>
            </div>

            <div className="relative pl-6 flex flex-col gap-space-md">
              <div className="absolute left-2.5 top-3 bottom-4 w-0.5 bg-surface-container-highest"></div>

              {/* Visit Entry 1 */}
              <div
                onClick={() => setSelectedVisitId(1)}
                className="relative group cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center ring-4 ring-surface-container-lowest shadow-xs z-10">
                  <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                </div>
                <div
                  className={`rounded-xl p-space-md transition-all ${
                    selectedVisitId === 1
                      ? 'bg-tertiary-container/10 shadow-[0_2px_12px_rgba(0,124,112,0.12)] ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <span className="inline-block bg-primary text-on-primary font-label-sm text-[11px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        Active Consultation
                      </span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-1">
                        18 Oct 2026 (Today)
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-container/20 px-2 py-0.5 rounded-full">
                      Sanjeevini Camp
                    </span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5 my-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      stethoscope
                    </span>
                    <span>Dr. Meera Nair • General Medicine</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface mt-2 bg-surface-container-lowest/80 p-space-xs rounded-lg">
                    <strong className="text-on-surface font-semibold">Primary Complaint:</strong>{' '}
                    Morning dizziness, severe occipital headache for 4 days.
                  </p>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-label-sm text-label-sm">
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">local_pharmacy</span>
                      Rx Sent to Pharmacy
                    </span>
                    <span className="text-on-surface-variant font-mono-token text-[11px]">
                      Station #4 Queued
                    </span>
                  </div>
                </div>
              </div>

              {/* Visit Entry 2 */}
              <div
                onClick={() => setSelectedVisitId(2)}
                className="relative group cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-4 ring-surface-container-lowest z-10">
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                </div>
                <div
                  className={`rounded-xl p-space-md transition-all ${
                    selectedVisitId === 2
                      ? 'bg-tertiary-container/10 shadow-[0_2px_12px_rgba(0,124,112,0.12)] ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        9 Months Ago
                      </span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">
                        12 Jan 2026
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      Hosahalli Primary
                    </span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5 my-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>Dr. Meera Nair • Triage Camp</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                    <strong className="text-on-surface">Chief Complaint:</strong> Acute viral fever,
                    generalized myalgia, chills.
                  </p>
                  <div className="mt-space-sm flex items-center justify-between text-label-sm text-label-sm bg-surface-container-lowest/80 p-2 rounded-lg">
                    <span className="text-primary font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Dispensed Paracetamol 650mg
                    </span>
                    <span className="text-on-surface-variant">Resolved</span>
                  </div>
                </div>
              </div>

              {/* Visit Entry 3 */}
              <div
                onClick={() => setSelectedVisitId(3)}
                className="relative group cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-4 ring-surface-container-lowest z-10">
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                </div>
                <div
                  className={`rounded-xl p-space-md transition-all ${
                    selectedVisitId === 3
                      ? 'bg-tertiary-container/10 shadow-[0_2px_12px_rgba(0,124,112,0.12)] ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Outreach Camp
                      </span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">
                        14 Aug 2025
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      Tumakuru Taluk
                    </span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5 my-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>Dr. Suresh Babu • Internal Medicine</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                    <strong className="text-on-surface">Diagnostic:</strong> Initial diabetic
                    community screening. Random Blood Sugar:{' '}
                    <span className="text-secondary font-mono-token font-bold">192 mg/dL</span>.
                  </p>
                  <div className="mt-space-sm flex items-center justify-between text-label-sm text-label-sm bg-surface-container-lowest/80 p-2 rounded-lg">
                    <span className="text-secondary font-medium">
                      Referred for HbA1c Lab Confirmation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">insights</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold">
                Compliance Adherence: Fair
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                Patient has maintained 100% attendance across 3 scheduled rural checkup cycles in
                14 months.
              </span>
            </div>
          </div>
        </section>

        {/* COLUMN 3: Selected Visit Clinical Details & Diagnostics (5 of 12 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm flex-wrap gap-2">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                  Encounter Details
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {selectedVisitId === 1
                    ? '18 Oct 2026 • Clinical Assessment'
                    : selectedVisitId === 2
                    ? '12 Jan 2026 • Triage Encounter'
                    : '14 Aug 2025 • Taluk Outreach'}
                </h2>
              </div>
              <span className="bg-primary text-on-primary text-label-sm px-3 py-1 rounded-full font-semibold">
                Triage Validated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-xs mt-space-sm">
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center flex flex-col justify-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Blood Pressure
                </span>
                <span className="font-mono-token text-mono-token text-error font-bold mt-0.5">
                  {selectedVisitId === 1 ? '148/94' : '128/82'}
                </span>
                <span className="text-[10px] text-error font-medium">
                  {selectedVisitId === 1 ? 'Stage 2' : 'Pre-HTN'}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center flex flex-col justify-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Pulse Rate
                </span>
                <span className="font-mono-token text-mono-token text-on-surface font-bold mt-0.5">
                  {selectedVisitId === 1 ? '88' : '84'}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  bpm • Regular
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center flex flex-col justify-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Body Temp
                </span>
                <span className="font-mono-token text-mono-token text-on-surface font-bold mt-0.5">
                  {selectedVisitId === 2 ? '99.1°F' : '98.6°F'}
                </span>
                <span className="text-[10px] text-primary font-medium">
                  {selectedVisitId === 2 ? 'Mild Fever' : 'Afebrile'}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center flex flex-col justify-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  SpO2 Oxygen
                </span>
                <span className="font-mono-token text-mono-token text-on-surface font-bold mt-0.5">
                  96%
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">Room Air</span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Body Mass Index
                </span>
                <span className="font-mono-token text-mono-token text-secondary font-bold mt-0.5">
                  30.3
                </span>
                <span className="text-[10px] text-secondary font-medium">Class 1 Obese</span>
              </div>
            </div>
          </div>

          {/* Confirmed Clinical Diagnoses */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Confirmed Clinical Diagnoses
            </span>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low gap-2">
                <div className="flex items-center gap-space-sm">
                  <span className="font-mono-token text-label-md bg-primary-container text-on-primary-container px-2.5 py-1 rounded font-bold">
                    I10
                  </span>
                  <span className="font-headline-sm text-body-lg text-on-surface font-semibold">
                    Essential (Primary) Hypertension
                  </span>
                </div>
                <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-2 py-0.5 rounded font-medium shrink-0">
                  Acute Exacerbation
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low gap-2">
                <div className="flex items-center gap-space-sm">
                  <span className="font-mono-token text-label-md bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded font-bold">
                    E11.9
                  </span>
                  <span className="font-headline-sm text-body-lg text-on-surface font-semibold">
                    Type 2 Diabetes Mellitus without Complications
                  </span>
                </div>
                <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded font-medium shrink-0">
                  Sub-optimal Control
                </span>
              </div>
            </div>
          </div>

          {/* Prescribed Formulary */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  medication
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Prescribed Formulary
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Direct Camp Pharmacy Issue
              </span>
            </div>
            <div className="flex flex-col gap-space-sm">
              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-start gap-space-sm">
                  <span className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center font-bold text-label-md shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-bold">
                      Amlodipine Besylate 5mg
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Oral Tablet • Once daily morning (1-0-0) after food
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono-token text-body-sm bg-surface-container px-3 py-1 rounded text-on-surface font-semibold">
                    Qty: 30 Tab
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    30 Days
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-start gap-space-sm">
                  <span className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center font-bold text-label-md shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-bold">
                      Metformin HCl 500mg SR
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Oral Tablet • Twice daily (1-0-1) with meals
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono-token text-body-sm bg-surface-container px-3 py-1 rounded text-on-surface font-semibold">
                    Qty: 60 Tab
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    30 Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Diagnostic Documents */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  attachment
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Attached Diagnostic Documents
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                2 Verified Reports
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {/* HbA1c Lab Report Card */}
              <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between group hover:bg-surface-container transition-all">
                <div className="relative w-full h-32 rounded-lg bg-surface-container-highest overflow-hidden mb-space-xs flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    alt="HbA1c Lab Report"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDafqS7NeX8qW_f4weR1th13DwxHoDfDoGbeV-lDDBECcO6_M3PS9iOROPKQfHrRQC2KoZzddJPLGGWttlI3snD-yVwvtTX43v2wgovHCL7rPqthngm72nnYVFInYNE_QBiEPf_FPbgmraVjAhr2hHP_xfcNY1IUeJciuM70R31d6JUtobpMiBD9vuVC95U6ObvZYQOO6TtnQu_mSOuiUyI4eyzQtxxqGgnkYyk545ZKVIS4VFhj12V"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: 'HbA1c Lab Report (7.8%)',
                          description:
                            'Laboratory confirmed HbA1c glycated hemoglobin analyzed at Tumakuru District Hospital reference laboratory on 17-Oct-2026. Result indicates elevated glycemic control requiring medication adjustment.',
                          imageUrl:
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDafqS7NeX8qW_f4weR1th13DwxHoDfDoGbeV-lDDBECcO6_M3PS9iOROPKQfHrRQC2KoZzddJPLGGWttlI3snD-yVwvtTX43v2wgovHCL7rPqthngm72nnYVFInYNE_QBiEPf_FPbgmraVjAhr2hHP_xfcNY1IUeJciuM70R31d6JUtobpMiBD9vuVC95U6ObvZYQOO6TtnQu_mSOuiUyI4eyzQtxxqGgnkYyk545ZKVIS4VFhj12V',
                        })
                      }
                      className="h-9 px-3 bg-surface-container-lowest text-primary rounded-lg font-label-sm text-label-sm flex items-center gap-1 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">zoom_in</span> Full
                      Preview
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                      Lab Report
                    </span>
                    <span className="font-mono-token text-[11px] text-on-surface-variant">
                      PDF • 1.2 MB
                    </span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface font-bold mt-0.5">
                    HbA1c Glycated Hemoglobin
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono-token text-body-md text-secondary font-bold">
                      Value: 7.8%
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Elevated
                    </span>
                  </div>
                </div>
              </div>

              {/* 12-Lead ECG Strip Card */}
              <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between group hover:bg-surface-container transition-all">
                <div className="relative w-full h-32 rounded-lg bg-surface-container-highest overflow-hidden mb-space-xs flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    alt="12-Lead ECG Strip Rhythm"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2ua6ISUyBzbl1VIFaJrqXNSy_Es5hQQcLR2MYJQ6av_TnT3p07BxFqSD7YmWYSaVVdRZ14Ra6eT9NUpt7JCzB4pjNjVbfkwFe7_rDuhBYNFiG4NSb6SddL1rOjqvkQRK1D1-jMp0-G0VrzK2SdsGBweqLED39AYPFaf-DS0qWiduB4XWXxaQ7lcsvGeaCvrNOUK4aT1nKXIqnGAX0bkahYHaQZsX5inv6c-zOODhgUEEBrcjz5coK"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: '12-Lead ECG Telemetry Strip',
                          description:
                            '12-lead resting electrocardiogram obtained at triage station by nursing staff. Heart rate 88 bpm. Normal axis, normal PR interval, no acute ST-T segment elevation or ischemic changes observed.',
                          imageUrl:
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuA2ua6ISUyBzbl1VIFaJrqXNSy_Es5hQQcLR2MYJQ6av_TnT3p07BxFqSD7YmWYSaVVdRZ14Ra6eT9NUpt7JCzB4pjNjVbfkwFe7_rDuhBYNFiG4NSb6SddL1rOjqvkQRK1D1-jMp0-G0VrzK2SdsGBweqLED39AYPFaf-DS0qWiduB4XWXxaQ7lcsvGeaCvrNOUK4aT1nKXIqnGAX0bkahYHaQZsX5inv6c-zOODhgUEEBrcjz5coK',
                        })
                      }
                      className="h-9 px-3 bg-surface-container-lowest text-primary rounded-lg font-label-sm text-label-sm flex items-center gap-1 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">zoom_in</span> Full
                      Preview
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                      Cardiology ECG
                    </span>
                    <span className="font-mono-token text-[11px] text-on-surface-variant">
                      IMG • 3.4 MB
                    </span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface font-bold mt-0.5">
                    12-Lead ECG Strip Rhythm
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono-token text-body-md text-primary font-bold">
                      Normal Sinus
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">
                      No Ischemia
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Notes & Official Clinical Sign-off */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Doctor Clinical Directives
            </span>
            <div className="bg-surface-container-low rounded-lg p-space-md text-on-surface font-body-md text-body-md leading-relaxed mb-space-md">
              <p className="italic">
                &ldquo;Advised strict low-sodium dietary regimen (&lt;3g/day). Patient instructed
                on brisk walking exercise 30 minutes daily in morning. Blood pressure remains
                uncontrolled secondary to recent salt intake and medication lapse. Continue
                prescribed Amlodipine 5mg and Metformin 500mg regularly. Mandatory follow-up at
                Hosahalli PHC in 30 days for repeat BP check and renal function screen.&rdquo;
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-body-lg text-on-surface font-bold">
                    Dr. Meera Nair, MD
                  </span>
                  <span className="font-mono-token text-[12px] text-on-surface-variant">
                    Registration: KMC #48291 • Karnataka Medical Council
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-left sm:text-right">
                <span className="font-label-sm text-label-sm text-primary font-bold flex items-center sm:justify-end gap-1">
                  <span className="material-symbols-outlined text-[16px]">lock</span> Digitally
                  Signed
                </span>
                <span className="font-mono-token text-[11px] text-on-surface-variant">
                  18-Oct-2026 11:42 IST
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Interactive Document Preview Modal */}
      {modalDoc && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-space-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-space-sm mb-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">
                  description
                </span>
                <div>
                  <h4 className="font-headline-md text-headline-md text-on-surface">
                    {modalDoc.title}
                  </h4>
                  <span className="font-mono-token text-label-sm text-on-surface-variant">
                    Patient: Lakshmamma (HC-2026-000381)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDoc(null)}
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="w-full h-72 rounded-xl bg-surface-container-high overflow-hidden mb-space-md flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                alt={modalDoc.title}
                src={modalDoc.imageUrl}
              />
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed bg-surface-container-low p-space-sm rounded-lg">
              {modalDoc.description}
            </p>
            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setModalDoc(null)}
                className="h-11 px-5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerToast(`Verified copy of ${modalDoc.title} downloaded.`);
                  setModalDoc(null);
                }}
                className="h-11 px-5 rounded-lg bg-primary text-on-primary hover:bg-primary/95 font-label-md text-label-md flex items-center gap-2 shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download Verified Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-14 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary-fixed text-[24px]">
            task_alt
          </span>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-semibold text-inverse-on-surface">
              Dossier Action Complete
            </span>
            <span className="font-body-sm text-body-sm text-inverse-on-surface/80">
              {toastMsg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
