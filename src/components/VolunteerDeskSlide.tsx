import React, { useState, useRef, useEffect } from 'react';
import { saveRegistrationAndPatientToFirestore } from '../lib/firebase';
import { useFirebaseData } from '../context/FirebaseContext';

interface VolunteerDeskSlideProps {
  onNavigate?: (station: string) => void;
}

interface QueueRow {
  token: string;
  name: string;
  age: string;
  gender: string;
  village: string;
  aadhaarLast4: string;
  dept: string;
  doctorRoom: string;
  time: string;
  waitNote: string;
  status: 'Waiting' | 'In Consultation' | 'Dispensed' | 'Triaging';
  alerts: { label: string; type: 'error' | 'neutral' }[];
}

const INITIAL_QUEUE: QueueRow[] = [];

export const VolunteerDeskSlide: React.FC<VolunteerDeskSlideProps> = () => {
  const {
    patients: firestorePatients,
    defaultCampId,
    selectedPatientId,
    setSelectedPatientId,
    userProfile,
  } = useFirebaseData();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [showDuplicateBanner, setShowDuplicateBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'In Consultation' | 'Dispensed'>('All');

  // Fast Walk-in Form State
  const [fwName, setFwName] = useState('');
  const [fwAge, setFwAge] = useState('');
  const [fwGender, setFwGender] = useState('Female');
  const [fwPhone, setFwPhone] = useState('');
  const [fwAadhaar, setFwAadhaar] = useState('');
  const [fwVillage, setFwVillage] = useState('Holavanahalli');
  const [fwComplaint, setFwComplaint] = useState('General Health Checkup');
  const [nextTokenNum, setNextTokenNum] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        nameInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const firestoreRows: QueueRow[] = firestorePatients.map((p) => ({
    token: p.token,
    name: p.fullName,
    age: p.age,
    gender: p.gender,
    village: p.village,
    aadhaarLast4: p.aadhaarLast4,
    dept: p.department || 'General OPD',
    doctorRoom: 'Room 2 • OPD Console',
    time: 'Synced Live',
    waitNote: p.status === 'completed' ? 'Dispensed' : '~10m wait',
    status:
      p.status === 'completed'
        ? 'Dispensed'
        : p.status === 'consulted'
        ? 'In Consultation'
        : p.status === 'triaged'
        ? 'Triaging'
        : 'Waiting',
    alerts: p.vitalsSummary ? [{ label: p.vitalsSummary.slice(0, 40), type: 'neutral' }] : [],
  }));

  // Only use real patients from Firestore or newly added walk-in rows
  const combinedRows = firestoreRows.length > 0 ? firestoreRows : rows;

  // Selected patient for 80mm slip
  const selectedPatient =
    combinedRows.find((r) => r.token === selectedToken) ||
    combinedRows[0] ||
    null;

  const filteredRows = combinedRows.filter((r) => {
    const matchesSearch =
      r.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.aadhaarLast4.includes(searchQuery);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFastRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fwName.trim() || !fwAge.trim()) return;
    const cleanTokenNum = String(firestorePatients.length + rows.length + 1).padStart(3, '0');
    const newToken = `#T-${cleanTokenNum}`;
    const newRow: QueueRow = {
      token: newToken,
      name: fwName.trim(),
      age: fwAge.trim(),
      gender: fwGender,
      village: fwVillage.trim() || 'Holavanahalli',
      aadhaarLast4: fwAadhaar.trim() || '0000',
      dept: 'General Physician',
      doctorRoom: 'Room 2 • OPD Console',
      time: 'Just Now',
      waitNote: '~10m wait',
      status: 'Waiting',
      alerts: [{ label: fwComplaint, type: 'neutral' }],
    };
    setRows((prev) => [newRow, ...prev]);
    setSelectedToken(newToken);

    try {
      const res = await saveRegistrationAndPatientToFirestore({
        campId: defaultCampId || undefined,
        token: newToken,
        fullName: newRow.name,
        phone: fwPhone.trim() || '+91 98450 00000',
        dob: `${newRow.age}y`,
        gender: newRow.gender,
        village: newRow.village,
        govId: `Aadhaar: XXXX-XXXX-${newRow.aadhaarLast4}`,
        arrivalSlot: 'Walk-in Immediate',
        symptoms: fwComplaint,
        department: 'General Physician',
        status: 'checked-in',
      });
      if (res?.patientId) {
        setSelectedPatientId(res.patientId);
      }
      triggerToast(
        `Token ${newToken} registered for ${newRow.name} and saved to Firestore!`
      );
    } catch (err: any) {
      triggerToast(`Firestore saved locally: ${err?.message || 'Ready'}`);
    }

    setFwName('');
    setFwAge('');
    setFwPhone('');
    setFwAadhaar('');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* TOP CONTEXT & LIVE SUMMARY BANNER */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Desk 01 • Active Triage
              </span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">
                Station Terminal: REG-POS-04
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Volunteer Registration Desk &amp; Patient Flow
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Real-time walk-in intake, biometric de-duplication, queue token generation, and audio
              dispatch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              type="button"
              onClick={() => nameInputRef.current?.focus()}
              className="h-12 px-5 rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg flex items-center gap-2 hover:opacity-95 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>
                Quick Walk-in Register{' '}
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-on-primary-container font-mono-token text-label-sm">
                  F2
                </kbd>
              </span>
            </button>
            <button
              type="button"
              onClick={() => triggerToast('Optical QR / ABHA Scanner ready on COM3...')}
              className="h-12 px-4 rounded-lg bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span>Scan Token / ABHA</span>
            </button>
            <button
              type="button"
              onClick={() => triggerToast('Queue roster synchronized with local SQLite node')}
              className="h-12 w-12 rounded-lg bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high transition-colors"
              title="Reload queue data"
            >
              <span className="material-symbols-outlined text-[20px]">sync</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm pt-2">
          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total Registered
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold tabular-nums">
                {combinedRows.length}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">Live Camp</span>
            </div>
          </div>
          <div className="p-space-sm rounded-lg bg-secondary-fixed/40 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-secondary-container">
                Waiting in Queue
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-secondary font-bold tabular-nums">
                {combinedRows.filter((r) => r.status === 'Waiting').length}
              </span>
              <span className="font-label-sm text-label-sm text-on-secondary-container">
                Intake Stage
              </span>
            </div>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-high flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              In Consultation
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-primary font-bold tabular-nums">
                {combinedRows.filter((r) => r.status === 'In Consultation').length}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                OPD Room
              </span>
            </div>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Triaging &amp; Vitals
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-tertiary font-bold tabular-nums">
                {combinedRows.filter((r) => r.status === 'Triaging').length}
              </span>
              <span className="font-label-sm text-label-sm text-tertiary">Station 02</span>
            </div>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col shadow-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Dispensed / Completed
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-primary font-bold tabular-nums">
                {combinedRows.filter((r) => r.status === 'Dispensed').length}
              </span>
              <span className="font-label-sm text-label-sm text-primary">Cleared</span>
            </div>
          </div>
        </div>
      </section>

      {/* DUPLICATE PATIENT DETECTION BANNER */}
      {showDuplicateBanner && (
        <div className="p-space-md rounded-xl bg-secondary-container text-on-secondary-container shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-lg text-label-lg font-bold">
                  Possible duplicate registration detected
                </span>
                <span className="bg-secondary text-on-secondary font-mono-token text-label-sm px-2 py-0.5 rounded-full">
                  MATCH 98%
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-secondary-container mt-0.5">
                Patient <strong className="font-semibold">&ldquo;Lakshmamma, 52y, F&rdquo;</strong>{' '}
                matches phone <span className="font-mono-token font-bold">+91 98450 12345</span>.
                Already registered today at 09:15 AM as{' '}
                <span className="font-mono-token font-bold bg-surface-container-lowest/80 px-1.5 py-0.5 rounded">
                  T-018
                </span>{' '}
                (Assigned to General Physician Room 2).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setSelectedToken('T-042');
                triggerToast('Merged duplicate profile with active token T-042 (Lakshmamma)');
              }}
              className="h-10 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface transition-colors shadow-xs"
            >
              Review Record
            </button>
            <button
              type="button"
              onClick={() => setShowDuplicateBanner(false)}
              className="h-10 px-3 rounded-lg text-on-secondary-container hover:bg-secondary/20 transition-colors font-label-md text-label-md"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTER BAR */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row gap-space-sm items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Token (e.g. T-042), Aadhaar, Phone number (+91...), or Patient name..."
            className="w-full h-12 pl-11 pr-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-variant/70"
          />
        </div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <div className="flex items-center bg-surface-container rounded-lg p-1 flex-wrap">
            {(
              [
                { id: 'All', label: `All (${139 + rows.length})` },
                { id: 'Waiting', label: 'Waiting (38)' },
                { id: 'In Consultation', label: 'In Doctor Room (12)' },
                { id: 'Dispensed', label: 'Pharmacy (18)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`font-label-sm text-label-sm px-3 py-1.5 rounded transition-all ${
                  statusFilter === tab.id
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: QUEUE DATA TABLE (8 COLS) */}
        <div className="xl:col-span-8 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-space-md flex items-center justify-between bg-surface-container-low flex-wrap gap-2">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  table_rows
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Today&apos;s Patient Queue Roster
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-mono-token text-label-sm">
                  LIVE FEED
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Auto-sorted by token time
              </span>
            </div>

            <div className="responsive-table-scroll overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">TOKEN</th>
                    <th className="py-3 px-4">PATIENT DEMOGRAPHICS</th>
                    <th className="py-3 px-4">ASSIGNED DOCTOR / ROOM</th>
                    <th className="py-3 px-4">TIME &amp; WAIT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">CLINICAL ALERTS</th>
                    <th className="py-3 px-4 text-right">DESK ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container">
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                            person_search
                          </span>
                          <p className="font-bold text-sm text-on-surface">No Patients in Queue</p>
                          <p className="text-xs text-on-surface-variant max-w-sm">
                            No registered patients yet. Fill in the Fast Walk-in form on the right or press F2 to generate a token pass.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row) => {
                    const isSelected = row.token === selectedToken;
                    return (
                      <tr
                        key={row.token}
                        onClick={() => setSelectedToken(row.token)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-container-low'
                            : 'hover:bg-surface-container-low/60'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                            <span
                              className={`font-mono-id-lg text-mono-id-lg font-bold ${
                                isSelected ? 'text-primary' : 'text-on-surface'
                              }`}
                            >
                              {row.token}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                              {row.name}
                            </span>
                            <span className="text-on-surface-variant font-label-sm text-label-sm">
                              {row.age}y • {row.gender} • {row.village}
                            </span>
                            <span className="font-mono-token text-label-sm text-on-surface-variant/80">
                              UID: XXXX-XXXX-{row.aadhaarLast4}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">
                              {row.dept}
                            </span>
                            <span className="text-on-surface-variant text-body-sm">
                              {row.doctorRoom}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono-token text-label-sm font-semibold text-on-surface">
                            {row.time}
                          </span>
                          <span className="block text-secondary font-label-sm text-label-sm font-medium">
                            {row.waitNote}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {row.status === 'Waiting' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Waiting
                            </span>
                          )}
                          {row.status === 'In Consultation' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                              In Consultation
                            </span>
                          )}
                          {row.status === 'Dispensed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Dispensed
                            </span>
                          )}
                          {row.status === 'Triaging' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Triaging
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {row.alerts.length === 0 ? (
                            <span className="text-on-surface-variant font-label-sm text-label-sm italic">
                              No active alerts
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              {row.alerts.map((al) => (
                                <span
                                  key={al.label}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm ${
                                    al.type === 'error'
                                      ? 'bg-error-container text-on-error-container font-semibold'
                                      : 'bg-surface-container-high text-on-surface-variant'
                                  }`}
                                >
                                  {al.type === 'error' && (
                                    <span className="material-symbols-outlined text-[14px]">
                                      warning
                                    </span>
                                  )}
                                  {al.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedToken(row.token);
                                triggerToast(`Printing 80mm thermal slip for ${row.token}...`);
                              }}
                              className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-primary transition-colors"
                              title="Print Slip"
                            >
                              <span className="material-symbols-outlined text-[20px]">print</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedToken(row.token);
                              }}
                              className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Inspect Slip"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-on-surface font-semibold">1-{filteredRows.length}</strong> of{' '}
                  <strong className="text-on-surface font-semibold">{139 + rows.length}</strong> registrations
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="text-primary font-medium">Auto-refresh every 15s</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded bg-primary-container text-on-primary-container font-bold flex items-center justify-center"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Loaded Page 2 of Queue Roster')}
                  className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Loaded Page 3 of Queue Roster')}
                  className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                >
                  3
                </button>
              </div>
            </div>
          </div>

          {/* DOCTOR ROOM CAPACITIES */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface">
                Doctor Room Capacities &amp; Estimated Queue Times
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                Live Load Balancer
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Room 1 • Maternal
                  </span>
                  <span className="font-mono-token text-label-sm text-primary font-bold">
                    4 in wait (~12m)
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Room 2 • General Med
                  </span>
                  <span className="font-mono-token text-label-sm text-secondary font-bold">
                    14 in wait (~32m)
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Room 4 • Dental
                  </span>
                  <span className="font-mono-token text-label-sm text-primary font-bold">
                    6 in wait (~18m)
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 80MM THERMAL SLIP PREVIEW & FAST WALK-IN FORM (4 COLS) */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* 80MM THERMAL SLIP PREVIEW */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  receipt_long
                </span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  80mm Token Slip Preview
                </span>
              </div>
              <span className="font-mono-token text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full font-bold">
                READY TO PRINT
              </span>
            </div>

            {selectedPatient ? (
              <div className="bg-white p-5 rounded-lg shadow-xs border border-outline-variant/30 flex flex-col gap-3 font-mono-token text-neutral-900">
                <div className="text-center flex flex-col items-center">
                  <span className="text-xs tracking-widest uppercase font-bold text-neutral-600">
                    SANJEEVINI HEALTH CAMP
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Holavanahalli Primary School Campus
                  </span>
                  <span className="text-[10px] text-neutral-400">Date: 18-Oct-2026 • Live Camp</span>
                </div>
                <div className="border-t border-dashed border-neutral-300 pt-2 text-center">
                  <span className="text-xs text-neutral-600 block uppercase font-medium">
                    QUEUE TOKEN NUMBER
                  </span>
                  <span className="text-4xl font-extrabold tracking-wider my-1 block text-neutral-950 font-mono-id-lg">
                    {selectedPatient.token}
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-xs font-semibold">
                    Priority {selectedPatient.dept}
                  </span>
                </div>

                <div className="flex justify-center py-1">
                  <svg className="w-24 h-24 text-neutral-900" fill="currentColor" viewBox="0 0 100 100">
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="5" y="5" />
                    <rect fill="currentColor" height="16" width="16" x="11" y="11" />
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="67" y="5" />
                    <rect fill="currentColor" height="16" width="16" x="73" y="11" />
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="5" y="67" />
                    <rect fill="currentColor" height="16" width="16" x="11" y="73" />
                    <rect height="6" width="6" x="38" y="8" />
                    <rect height="6" width="6" x="48" y="8" />
                    <rect height="16" width="6" x="38" y="18" />
                    <rect height="6" width="12" x="48" y="24" />
                    <rect height="6" width="16" x="8" y="38" />
                    <rect height="12" width="8" x="8" y="48" />
                    <rect height="6" width="12" x="22" y="48" />
                    <rect height="6" width="6" x="38" y="38" />
                    <rect height="6" width="6" x="48" y="38" />
                    <rect height="6" width="14" x="58" y="38" />
                    <rect height="6" width="14" x="78" y="38" />
                    <rect height="6" width="12" x="38" y="52" />
                    <rect height="16" width="6" x="58" y="52" />
                    <rect height="6" width="6" x="70" y="48" />
                    <rect height="6" width="10" x="82" y="52" />
                    <rect height="16" width="6" x="38" y="68" />
                    <rect height="6" width="14" x="48" y="74" />
                    <rect height="6" width="14" x="68" y="68" />
                    <rect height="12" width="8" x="68" y="80" />
                    <rect height="6" width="10" x="82" y="80" />
                    <rect height="6" width="6" x="48" y="86" />
                  </svg>
                </div>

                <div className="border-t border-dashed border-neutral-300 pt-2 text-xs flex flex-col gap-1 leading-relaxed">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Patient:</span>
                    <span className="font-bold text-neutral-900">
                      {selectedPatient.name} ({selectedPatient.age} / {selectedPatient.gender ? selectedPatient.gender[0] : 'F'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Aadhaar:</span>
                    <span className="font-bold text-neutral-900">
                      XXXX-XXXX-{selectedPatient.aadhaarLast4}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Village:</span>
                    <span className="text-neutral-800">{selectedPatient.village}</span>
                  </div>
                  <div className="flex justify-between text-error font-semibold">
                    <span>Allergy/Alert:</span>
                    <span>{selectedPatient.alerts[0]?.label || 'None reported'}</span>
                  </div>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded border border-dashed border-neutral-300 text-center flex flex-col gap-1">
                  <span className="font-bold text-sm text-neutral-900">
                    ದಯವಿಟ್ಟು ಕೌಂಟರ್ 2 ಕ್ಕೆ ಹೋಗಿ
                  </span>
                  <span className="text-xs text-neutral-700">Please proceed to Counter 2</span>
                  <span className="text-[11px] font-semibold text-neutral-600 mt-0.5">
                    {selectedPatient.doctorRoom} • {selectedPatient.dept}
                  </span>
                </div>

                <div className="text-[10px] text-center text-neutral-500 pt-1">
                  Please retain this slip till medicines are collected. Free consultation initiative.
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-xs border border-dashed border-outline-variant/40 text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-3xl text-neutral-400">receipt_long</span>
                <p className="font-bold text-xs text-neutral-700">No Patient Selected</p>
                <p className="text-[11px] text-neutral-500">
                  Register a walk-in patient below to generate and preview their 80mm slip.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!selectedPatient}
                onClick={() =>
                  selectedPatient &&
                  triggerToast(
                    `Sending Token [${selectedPatient.token}] to Posiflex 80mm Thermal Printer...`
                  )
                }
                className="h-12 w-full rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg flex items-center justify-center gap-2 hover:opacity-95 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span>Print 80mm Slip</span>
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-on-primary-container font-mono-token text-label-sm">
                  Ctrl+P
                </kbd>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!selectedPatient}
                  onClick={() =>
                    selectedPatient &&
                    triggerToast(`SMS & WhatsApp token sent for ${selectedPatient.name}`)
                  }
                  className="h-10 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>SMS/WA</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedPatient}
                  onClick={() =>
                    selectedPatient &&
                    triggerToast(
                      `PA Speaker: Token ${selectedPatient.token} (${selectedPatient.name}), proceed to ${selectedPatient.doctorRoom}`
                    )
                  }
                  className="h-10 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  <span>Call to Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* FAST WALK-IN INTAKE FORM */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  how_to_reg
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Fast Walk-in Registration
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                30-sec entry
              </span>
            </div>

            <form onSubmit={handleFastRegister} className="flex flex-col gap-space-sm">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  Patient Full Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={fwName}
                  onChange={(e) => setFwName(e.target.value)}
                  placeholder="e.g. Lakshmamma / Ramesh B"
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    required
                    value={fwAge}
                    onChange={(e) => setFwAge(e.target.value)}
                    placeholder="52"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Gender *
                  </label>
                  <select
                    value={fwGender}
                    onChange={(e) => setFwGender(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={fwPhone}
                    onChange={(e) => setFwPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Aadhaar Last 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={fwAadhaar}
                    onChange={(e) => setFwAadhaar(e.target.value)}
                    placeholder="8921"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-mono-token text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5">
                  Origin Village / Grama
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Hosahalli', 'Bellavi', 'Oorukere', 'Mallasandra'].map((vil) => (
                    <button
                      key={vil}
                      type="button"
                      onClick={() => setFwVillage(vil)}
                      className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-colors ${
                        fwVillage === vil
                          ? 'bg-primary-container text-on-primary-container font-semibold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {vil}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5">
                  Primary Chief Complaint
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Joint Pain',
                    'Fever / Cold',
                    'Dental Ache',
                    'Diabetes Check',
                    'BP Follow-up',
                  ].map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setFwComplaint(comp)}
                      className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-colors ${
                        fwComplaint === comp
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="h-12 w-full rounded-lg bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container shadow-md transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[20px]">add_task</span>
                  <span>Issue Token &amp; Print (T-{nextTokenNum})</span>
                </button>
              </div>
            </form>
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
