import React, { useState } from 'react';

interface PharmacyDispensingSlideProps {
  onNavigate?: (station: string) => void;
}

interface QueuePatient {
  token: string;
  name: string;
  ageGender: string;
  doctor: string;
  room: string;
  itemCount: number;
  waitMinutes: number;
  status: 'DISPENSING' | 'WAITING' | 'PARTIAL' | 'COMPLETED';
  uhid: string;
  bloodGroup: string;
  allergies: string;
}

interface PrescriptionItem {
  id: string;
  name: string;
  strength: string;
  batch: string;
  expiry: string;
  stockPacks: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  regimenCode: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  foodRelation: 'AFTER FOOD' | 'BEFORE FOOD' | 'WITH WATER';
  foodRelationKn: string;
  durationDays: number;
  prescribedQty: number;
  dispensedQty: number;
  checked: boolean;
  substitutedWith?: string;
}

import { useFirebaseData } from '../context/FirebaseContext';
import { updatePatientClinicalRecord } from '../lib/firebase';

export const PharmacyDispensingSlide: React.FC<PharmacyDispensingSlideProps> = ({ onNavigate }) => {
  const { patients: firestorePatients, activePatient: globalPatient, userProfile, setSelectedPatientId } = useFirebaseData();
  const [viewMode, setViewMode] = useState<'workstation' | 'mobile-scanner'>('workstation');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');
  const [labelLanguage, setLabelLanguage] = useState<'KN_EN' | 'HI_EN' | 'TA_EN'>('KN_EN');
  const [qrInput, setQrInput] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [counselingChecks, setCounselingChecks] = useState({
    sunMoonExplained: true,
    foodTimingConfirmed: true,
    courseCompletionAdvised: false,
  });

  const queueList: QueuePatient[] = firestorePatients.map((p, idx) => ({
    token: p.token,
    name: p.fullName,
    ageGender: `${p.age} / ${p.gender === 'Female' ? 'F' : 'M'}`,
    doctor: userProfile?.fullName || 'Dr. Govardhan T K',
    room: 'Room 02 • OPD',
    itemCount: 2,
    waitMinutes: 2 + idx * 3,
    status: p.status === 'completed' ? 'COMPLETED' : 'DISPENSING',
    uhid: `UHID-${p.aadhaarLast4}`,
    bloodGroup: 'B+ve',
    allergies: p.vitalsSummary ? p.vitalsSummary.slice(0, 30) : 'None Known',
  }));

  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    {
      id: 'rx-1',
      name: 'Tab. Amlodipine',
      strength: '5mg',
      batch: 'B#AM902',
      expiry: '11/2027',
      stockPacks: 420,
      stockStatus: 'IN_STOCK',
      regimenCode: '1 - 0 - 0',
      morning: true,
      afternoon: false,
      night: false,
      foodRelation: 'AFTER FOOD',
      foodRelationKn: 'ಊಟದ ನಂತರ (ಬೆಳಿಗ್ಗೆ)',
      durationDays: 30,
      prescribedQty: 30,
      dispensedQty: 30,
      checked: true,
    },
    {
      id: 'rx-2',
      name: 'Tab. Metformin HCl',
      strength: '500mg SR',
      batch: 'B#MF418',
      expiry: '08/2027',
      stockPacks: 880,
      stockStatus: 'IN_STOCK',
      regimenCode: '1 - 0 - 1',
      morning: true,
      afternoon: false,
      night: true,
      foodRelation: 'AFTER FOOD',
      foodRelationKn: 'ಊಟದ ನಂತರ (ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ)',
      durationDays: 30,
      prescribedQty: 60,
      dispensedQty: 60,
      checked: true,
    },
    {
      id: 'rx-3',
      name: 'Tab. Atorvastatin',
      strength: '10mg',
      batch: 'B#AT104',
      expiry: '04/2027',
      stockPacks: 14,
      stockStatus: 'LOW_STOCK',
      regimenCode: '0 - 0 - 1',
      morning: false,
      afternoon: false,
      night: true,
      foodRelation: 'AFTER FOOD',
      foodRelationKn: 'ರಾತ್ರಿ ಊಟದ ನಂತರ',
      durationDays: 30,
      prescribedQty: 30,
      dispensedQty: 30,
      checked: true,
    },
  ]);

  const activePatient = queueList.find((p) => p.token === selectedToken) || queueList[0];

  const handleToggleItemCheck = (id: string) => {
    setRxItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAdjustQty = (id: string, delta: number) => {
    setRxItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, dispensedQty: Math.max(0, item.dispensedQty + delta) }
          : item
      )
    );
  };

  const handleSubstituteGeneric = (id: string) => {
    setRxItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              substitutedWith: item.substitutedWith
                ? undefined
                : 'Rosuvastatin 5mg (Jan Aushadhi Batch #RS209)',
              stockStatus: item.substitutedWith ? 'LOW_STOCK' : 'IN_STOCK',
            }
          : item
      )
    );
    setFeedbackBanner('Generic equivalent substitution logged to camp formulary ledger.');
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleCompleteDispensing = async () => {
    if (!activePatient) return;
    const target = firestorePatients.find((p) => p.token === activePatient.token);
    if (target) {
      try {
        await updatePatientClinicalRecord(target.id, { status: 'completed' });
      } catch {
        // local fallback
      }
    }
    setFeedbackBanner(
      `Dispensing completed for ${activePatient.token} (${activePatient.name}). 3 Thermal bilingual labels spooled to printer.`
    );
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const handlePrintLabels = () => {
    setFeedbackBanner(
      `Printing ${rxItems.filter((i) => i.checked).length} bilingual 50x30mm thermal stickers (${labelLanguage.replace('_', ' + ')})...`
    );
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const filteredQueue = queueList.filter((p) => {
    if (queueFilter === 'WAITING') return p.status === 'WAITING' || p.status === 'DISPENSING' || p.status === 'PARTIAL';
    if (queueFilter === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Sub-navigation bar to toggle between Desktop Pharmacy Workstation (Slide 1) & Mobile Field Pharmacist Scanner (Slide 5) */}
      <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined">medication</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                STATION 04 • PHARMACY & INVENTORY
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Thermal Labeler Ready
              </span>
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Pharmacy Dispensing, Batch Inventory & Pictographic Dosage Labels
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-surface-container p-1 border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setViewMode('workstation')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'workstation'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
              <span>Workstation Console</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile-scanner')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'mobile-scanner'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              <span>QR Scanner Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div className="bg-primary-fixed border border-primary/30 text-on-primary-fixed px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <span className="text-sm font-medium">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-on-primary-fixed/70 hover:text-on-primary-fixed"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {viewMode === 'workstation' ? (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Pending Rx Queue
                </p>
                <p className="text-2xl font-bold text-on-surface font-mono mt-1">
                  {queueList.filter((q) => q.status !== 'COMPLETED').length}{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">
                    Tokens
                  </span>
                </p>
                <p className="text-[11px] text-primary font-medium mt-0.5">
                  Avg dispense time: 1m 40s
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">queue_play_next</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Dispensed Today
                </p>
                <p className="text-2xl font-bold text-on-surface font-mono mt-1">
                  148{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">
                    Patients
                  </span>
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  412 total unit packs issued
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-secondary/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Low Stock Alerts
                </p>
                <p className="text-2xl font-bold text-secondary font-mono mt-1">
                  03{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">
                    SKUs &lt; 20%
                  </span>
                </p>
                <p className="text-[11px] text-secondary font-medium mt-0.5">
                  Atorvastatin 10mg, ORS, Cetirizine
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Bilingual Stickers
                </p>
                <p className="text-2xl font-bold text-on-surface font-mono mt-1">
                  389{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">
                    Printed
                  </span>
                </p>
                <p className="text-[11px] text-primary font-medium mt-0.5">
                  Kannada + Pictogram Sun/Moon
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined">print</span>
              </div>
            </div>
          </div>

          {/* Main 12-Col Workstation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 3 Cols: Live Token Queue & QR Scan */}
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
              <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Rx Token Queue
                  </h2>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                    Live LAN Sync
                  </span>
                </div>

                {/* Quick QR / Token Lookup */}
                <div className="relative mb-3">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    qr_code_scanner
                  </span>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Scan slip QR or #T-042..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/40 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-lg text-xs font-semibold">
                  {(['ALL', 'WAITING', 'COMPLETED'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setQueueFilter(tab)}
                      className={`py-1 rounded text-[11px] transition-colors ${
                        queueFilter === tab
                          ? 'bg-surface-container-lowest text-primary shadow-2xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-outline-variant/15 max-h-[520px] overflow-y-auto">
                {filteredQueue
                  .filter(
                    (item) =>
                      !qrInput ||
                      item.token.toLowerCase().includes(qrInput.toLowerCase()) ||
                      item.name.toLowerCase().includes(qrInput.toLowerCase())
                  )
                  .map((item) => {
                    const isSelected = item.token === selectedToken;
                    return (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => setSelectedToken(item.token)}
                        className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-primary/8 border-l-4 border-primary'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-on-surface">
                              {item.token}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                item.status === 'DISPENSING'
                                  ? 'bg-primary text-on-primary'
                                  : item.status === 'WAITING'
                                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                                  : item.status === 'PARTIAL'
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-on-surface mt-1">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {item.ageGender} • {item.doctor} ({item.room})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-mono font-semibold bg-surface-container px-2 py-0.5 rounded text-on-surface">
                            {item.itemCount} Rx
                          </span>
                          {item.waitMinutes > 0 && (
                            <p className="text-[11px] text-on-surface-variant mt-1">
                              {item.waitMinutes}m wait
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Center 5 Cols: Active e-Prescription Fulfillment & Batch Deductor */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
                {/* Active Patient Header */}
                <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-primary">
                        {activePatient.token}
                      </span>
                      <h2 className="text-base font-bold text-on-surface">{activePatient.name}</h2>
                      <span className="text-xs text-on-surface-variant font-medium">
                        ({activePatient.ageGender})
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                      {activePatient.uhid} • Prescribed by {activePatient.doctor} • Blood:{' '}
                      {activePatient.bloodGroup}
                    </p>
                  </div>

                  {activePatient.allergies !== 'None Known' && (
                    <div className="bg-error-container text-on-error-container px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>Allergy: {activePatient.allergies}</span>
                    </div>
                  )}
                </div>

                {/* Medication Line Items */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-1 border-b border-outline-variant/20">
                    <span>Prescribed Medication & Batch</span>
                    <span>Regimen & Qty to Issue</span>
                  </div>

                  {rxItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        item.checked
                          ? 'bg-surface-container-lowest border-primary/40 shadow-2xs'
                          : 'bg-surface-container-low/50 border-outline-variant/20 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleItemCheck(item.id)}
                            className="mt-1 w-4 h-4 accent-primary rounded"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-on-surface">
                                {item.name} {item.strength}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  item.stockStatus === 'IN_STOCK'
                                    ? 'bg-primary-fixed text-on-primary-fixed'
                                    : 'bg-secondary-fixed text-on-secondary-fixed'
                                }`}
                              >
                                {item.stockStatus === 'IN_STOCK'
                                  ? `IN STOCK (${item.stockPacks})`
                                  : `LOW STOCK (${item.stockPacks} left)`}
                              </span>
                            </div>

                            {item.substitutedWith && (
                              <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">swap_horiz</span>
                                Substituted: {item.substitutedWith}
                              </p>
                            )}

                            <p className="text-xs font-mono text-on-surface-variant mt-1">
                              Batch: {item.batch} • Exp: {item.expiry} • {item.durationDays} Days
                            </p>

                            {/* Pictographic Sun/Moon Strip */}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.morning
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-surface-container text-on-surface-variant/50'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">wb_sunny</span>
                                Morn ({item.morning ? '1' : '0'})
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.afternoon
                                    ? 'bg-orange-100 text-orange-900'
                                    : 'bg-surface-container text-on-surface-variant/50'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">light_mode</span>
                                Noon ({item.afternoon ? '1' : '0'})
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.night
                                    ? 'bg-indigo-100 text-indigo-900'
                                    : 'bg-surface-container text-on-surface-variant/50'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">dark_mode</span>
                                Night ({item.night ? '1' : '0'})
                              </span>
                              <span className="text-[11px] font-bold text-primary bg-primary/8 px-2 py-0.5 rounded">
                                {item.foodRelation}
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Stepper & Generic Substitute Trigger */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden bg-surface-container-lowest">
                            <button
                              type="button"
                              onClick={() => handleAdjustQty(item.id, -5)}
                              className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs font-bold"
                            >
                              -5
                            </button>
                            <span className="px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                              {item.dispensedQty} tabs
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustQty(item.id, 5)}
                              className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs font-bold"
                            >
                              +5
                            </button>
                          </div>

                          {item.stockStatus === 'LOW_STOCK' || item.substitutedWith ? (
                            <button
                              type="button"
                              onClick={() => handleSubstituteGeneric(item.id)}
                              className="text-[11px] font-semibold text-secondary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">find_replace</span>
                              {item.substitutedWith ? 'Revert Generic' : 'Substitute Generic'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pharmacist Counseling Checklist */}
                <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/20 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Mandatory Patient Counseling Verification
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                      <input
                        type="checkbox"
                        checked={counselingChecks.sunMoonExplained}
                        onChange={(e) =>
                          setCounselingChecks((prev) => ({
                            ...prev,
                            sunMoonExplained: e.target.checked,
                          }))
                        }
                        className="accent-primary"
                      />
                      <span>Sun/Moon symbols explained</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                      <input
                        type="checkbox"
                        checked={counselingChecks.foodTimingConfirmed}
                        onChange={(e) =>
                          setCounselingChecks((prev) => ({
                            ...prev,
                            foodTimingConfirmed: e.target.checked,
                          }))
                        }
                        className="accent-primary"
                      />
                      <span>Before/After food verified</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                      <input
                        type="checkbox"
                        checked={counselingChecks.courseCompletionAdvised}
                        onChange={(e) =>
                          setCounselingChecks((prev) => ({
                            ...prev,
                            courseCompletionAdvised: e.target.checked,
                          }))
                        }
                        className="accent-primary"
                      />
                      <span>30-day refill date shared</span>
                    </label>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-4 border-t border-outline-variant/25 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={handlePrintLabels}
                    className="px-4 py-2.5 rounded-xl border border-primary text-primary font-semibold text-xs flex items-center gap-2 hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Print Bilingual Labels ({rxItems.filter((i) => i.checked).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteDispensing}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-2 shadow-sm hover:bg-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Verify & Complete Dispensing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Bilingual Thermal Label Preview (Kannada + Sun/Moon Pictograms) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      50x30mm Thermal Dosage Sticker Preview
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Low-literacy pictographic & vernacular thermal output
                    </p>
                  </div>
                  <select
                    value={labelLanguage}
                    onChange={(e) => setLabelLanguage(e.target.value as any)}
                    className="text-xs bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/30 font-semibold text-on-surface"
                  >
                    <option value="KN_EN">ಕನ್ನಡ + English</option>
                    <option value="HI_EN">हिन्दी + English</option>
                    <option value="TA_EN">தமிழ் + English</option>
                  </select>
                </div>

                {/* Thermal Sticker Cards */}
                <div className="space-y-3">
                  {rxItems
                    .filter((i) => i.checked)
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-[#fffdf9] border-2 border-dashed border-stone-300 rounded-xl p-3.5 shadow-2xs font-sans text-stone-900"
                      >
                        <div className="flex items-center justify-between border-b border-stone-300 pb-1.5 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                            SANJEEVINI CAMP • TUMAKURU
                          </span>
                          <span className="font-mono text-[11px] font-bold">
                            {activePatient.token} ({idx + 1}/{rxItems.filter((i) => i.checked).length})
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <p className="font-bold text-sm text-stone-900">
                            {item.name} {item.strength}
                          </p>
                          <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
                            Qty: {item.dispensedQty}
                          </span>
                        </div>

                        {/* Visual Sun / Noon / Moon Table on Thermal Sticker */}
                        <div className="grid grid-cols-3 gap-1.5 my-2.5 text-center">
                          <div
                            className={`p-1.5 rounded border ${
                              item.morning
                                ? 'border-stone-900 bg-amber-50/70 font-bold'
                                : 'border-stone-200 text-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="material-symbols-outlined text-sm">wb_sunny</span>
                              <span>ಬೆಳಿಗ್ಗೆ</span>
                            </div>
                            <p className="font-mono text-sm font-bold mt-0.5">
                              {item.morning ? '● 1 ಮಾತ್ರೆ' : '—'}
                            </p>
                          </div>

                          <div
                            className={`p-1.5 rounded border ${
                              item.afternoon
                                ? 'border-stone-900 bg-orange-50/70 font-bold'
                                : 'border-stone-200 text-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="material-symbols-outlined text-sm">light_mode</span>
                              <span>ಮಧ್ಯಾಹ್ನ</span>
                            </div>
                            <p className="font-mono text-sm font-bold mt-0.5">
                              {item.afternoon ? '● 1 ಮಾತ್ರೆ' : '—'}
                            </p>
                          </div>

                          <div
                            className={`p-1.5 rounded border ${
                              item.night
                                ? 'border-stone-900 bg-indigo-50/70 font-bold'
                                : 'border-stone-200 text-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="material-symbols-outlined text-sm">dark_mode</span>
                              <span>ರಾತ್ರಿ</span>
                            </div>
                            <p className="font-mono text-sm font-bold mt-0.5">
                              {item.night ? '● 1 ಮಾತ್ರೆ' : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200">
                          <span className="font-bold text-stone-800">{item.foodRelationKn}</span>
                          <span className="font-mono text-stone-600">
                            {item.batch} • Exp {item.expiry}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Slide 5: Mobile Pharmacist QR Scan & Rapid Dispensing View */
        <div className="max-w-md mx-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-md overflow-hidden">
          <div className="bg-primary text-on-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                  MOBILE PHARMACY TERMINAL
                </p>
                <h2 className="text-sm font-bold">Scan Patient Token QR</h2>
              </div>
            </div>
            <span className="text-xs font-mono bg-black/20 px-2.5 py-1 rounded-full">
              Counter #02
            </span>
          </div>

          {/* Simulated Camera / QR Viewfinder */}
          <div className="p-4 bg-stone-950 text-white relative">
            <div className="border-2 border-primary-fixed/70 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <span className="material-symbols-outlined text-4xl text-primary-fixed mb-2">
                qr_code_2
              </span>
              <p className="text-xs font-mono text-primary-fixed">
                {scannerActive
                  ? 'Camera Active — Align 80mm Thermal Slip QR...'
                  : 'Verified QR Payload: #T-042 • Rameshappa K.G.'}
              </p>
              <button
                type="button"
                onClick={() => setScannerActive(!scannerActive)}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                {scannerActive ? 'Lock Token #T-042' : 'Re-Scan Another Slip'}
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
              <div>
                <span className="font-mono text-base font-bold text-primary">
                  {activePatient.token}
                </span>
                <h3 className="text-sm font-bold text-on-surface">{activePatient.name}</h3>
              </div>
              <span className="text-xs font-semibold bg-primary-fixed text-on-primary-fixed px-2.5 py-1 rounded-full">
                {rxItems.length} Meds Ready
              </span>
            </div>

            {rxItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleItemCheck(item.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                  item.checked
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/30 bg-surface-container-low'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {item.name} {item.strength}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {item.regimenCode} • {item.foodRelationKn}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-primary">
                    {item.dispensedQty}u
                  </span>
                  <p className="text-[10px] font-mono text-on-surface-variant">{item.batch}</p>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleCompleteDispensing}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              <span>Confirm Handover & Print Stickers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
