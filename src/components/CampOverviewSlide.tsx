import React, { useState, useEffect } from 'react';
import { saveRegistrationAndPatientToFirestore } from '../lib/firebase';
import { useFirebaseData } from '../context/FirebaseContext';

interface CampOverviewSlideProps {
  onNavigate?: (station: string) => void;
}

export const CampOverviewSlide: React.FC<CampOverviewSlideProps> = ({ onNavigate }) => {
  const { registrations, defaultCampId } = useFirebaseData();
  const [isSaving, setIsSaving] = useState(false);
  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [address, setAddress] = useState('');
  const [idProof, setIdProof] = useState('Aadhaar Card');
  const [idNum, setIdNum] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [consent, setConsent] = useState(true);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);

  // Live Queue State
  const [countdown, setCountdown] = useState(15);
  const [syncing, setSyncing] = useState(false);
  const [queueNum, setQueueNum] = useState(12);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [turnSkipped, setTurnSkipped] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [recordExpanded, setRecordExpanded] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setSyncing(true);
          setTimeout(() => setSyncing(false), 900);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const toggleCondition = (cond: string) => {
    setConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const tokenNumber = `#T-${String(42 + registrations.length).padStart(3, '0')}`;
      await saveRegistrationAndPatientToFirestore({
        campId: defaultCampId || undefined,
        token: tokenNumber,
        fullName,
        phone,
        dob,
        gender,
        village: address,
        govId: `${idProof}: ${idNum}`,
        arrivalSlot: selectedSlot,
        symptoms: conditions.join(', '),
        status: 'queued',
      });
      setRegisteredToken(`${tokenNumber} (Firestore Saved)`);
      triggerToast(
        `Saved to Firestore registrations & patients collections • Token ${tokenNumber} for ${fullName}`
      );
    } catch (err: any) {
      triggerToast(`Firestore error: ${err?.message || 'Could not save registration'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard?.writeText('T-042');
    setCopiedToken(true);
    triggerToast('Token T-042 copied to clipboard');
    setTimeout(() => setCopiedToken(false), 1500);
  };

  const renderRegistrationColumn = () => (
    <div className="flex flex-col w-full gap-space-md">
      {/* Status & Urgency Ticker */}
      <section className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-space-xs bg-surface-container-high rounded-full px-3.5 py-2 shadow-sm">
          <div className="inline-flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping flex-shrink-0"></span>
            <span className="font-label-sm text-label-sm text-on-secondary-container font-semibold truncate">
              Registrations closing in 3 days
            </span>
          </div>
          <div className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="font-label-sm text-label-sm font-bold">27 slots left</span>
          </div>
        </div>
      </section>

      {/* Hero Card with Rich Visuals and Dignified Framing */}
      <section className="relative rounded-xl overflow-hidden bg-primary text-on-primary p-space-lg shadow-md">
        <div className="relative z-10 flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-2.5 py-1 rounded-full font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Free Entry
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container-lowest/20 backdrop-blur-sm text-on-primary px-2.5 py-1 rounded-full font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">groups</span>
              Open to All
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container">
              District Health Outreach
            </span>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-primary leading-tight font-bold">
              Sanjeevini Community Health Camp
            </h1>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-start gap-2 text-on-primary-container font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed flex-shrink-0">
                calendar_month
              </span>
              <span>Sunday, 18 Oct 2026 • 9:00 AM – 5:00 PM</span>
            </div>
            <div className="flex items-start gap-2 text-on-primary-container font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed flex-shrink-0">
                location_on
              </span>
              <span>Govt. Higher Primary School, Hosahalli, Tumakuru District</span>
            </div>
          </div>

          <a
            href="#register-form"
            className="mt-space-xs inline-flex items-center justify-center gap-2 h-13 w-full bg-surface-container-lowest text-primary rounded-lg font-label-lg text-label-lg shadow-sm active:scale-[0.99] transition-transform"
          >
            <span>Register for Free Token</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </a>
        </div>
      </section>

      {/* Visual Camp Highlights Preview */}
      <section className="grid grid-cols-2 gap-space-sm">
        <div className="relative h-32 rounded-xl overflow-hidden shadow-sm bg-surface-container-high">
          <img
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            alt="Female doctor in clinical coat smiling gently while measuring pulse of an elderly rural Indian woman"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwX-CxcRjEHchtdxv602v4lkMhBtL-19bsBM-TrAOaA7XK-3axqPVfVoF8fMaM-cMRGmTcD4Diim2q-wAU7KsooyLfxYSI1p7t89cYqSDsVlDxm051qf9_Lfkcy1fh4GTK8w5wE4EcTHofRhPX0oVSt_2TA-mDgcDTiEm1n8_CeTx1MqFtsuzVJ_JGrgGw4kNy3K4TtK_SSmhTz0CVP31UKqO-tAGZLS7iR005ZfXXlDOiAiu4THGL"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 to-transparent flex items-end p-2.5">
            <span className="text-on-primary font-label-sm text-label-sm">Doctor Consultation</span>
          </div>
        </div>
        <div className="relative h-32 rounded-xl overflow-hidden shadow-sm bg-surface-container-high">
          <img
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            alt="Warm welcoming field pharmacy distribution counter with neatly stacked essential medicines"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQhMpTDI2o9n8MnnuS19NCgnNXBaBXMrR8hRWPblDut0U0G0OouGQJmmklfCILd18xz5O6PQhlzWsgulsVK4sl3KpynuxxjF-Rq3MztEP6VXf3nT33xamaaLzWXB99XBZ0BcVXUbZFvJfy9fTairSKizY8LFTzPG-exXp4vTGJKPWpW091TRfIagujLlDIOwqI3W4wUKNUFdLzoVSJQs7oplg1McWnSg_EcDLc4tGFgs2E58cHglS5"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 to-transparent flex items-end p-2.5">
            <span className="text-on-primary font-label-sm text-label-sm">Free Medications</span>
          </div>
        </div>
      </section>

      {/* Available Services */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Available Services</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Comprehensive clinical care on-site
            </span>
          </div>
          <span className="bg-primary-fixed text-on-primary-fixed px-2.5 py-1 rounded-full font-label-sm text-label-sm">
            6 Stations
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm">
          {[
            {
              icon: 'stethoscope',
              title: 'General Checkup',
              desc: 'Full vitals, systemic triage & counseling',
              station: 'doctor-consultation',
            },
            {
              icon: 'visibility',
              title: 'Eye Screening',
              desc: 'Cataract evaluation & free reading glasses',
              station: 'admin-camp-setup',
            },
            {
              icon: 'dentistry',
              title: 'Dental Clinic',
              desc: 'Oral hygiene checks and pain relief triage',
              station: 'admin-camp-setup',
            },
            {
              icon: 'bloodtype',
              title: 'BP & Sugar',
              desc: 'Instant glucometry and hypertension tests',
              station: 'triage-vitals',
            },
            {
              icon: 'pregnant_woman',
              title: 'Maternal Care',
              desc: 'Antenatal advice and nutrition packs',
              station: 'pharmacy-dispense',
            },
            {
              icon: 'vaccines',
              title: 'Child Vaccines',
              desc: 'Essential immunizations & growth tracking',
              station: 'medicine-inventory',
            },
          ].map((srv) => (
            <button
              key={srv.title}
              type="button"
              onClick={() => onNavigate?.(srv.station)}
              className="flex flex-col gap-2 p-space-sm bg-surface-container-lowest rounded-xl shadow-sm text-left hover:bg-surface-container-low transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">{srv.icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  {srv.title}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                  {srv.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Venue & Schedule Card */}
      <section className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-xl shadow-sm">
        <div className="flex items-center gap-space-xs text-primary">
          <span className="material-symbols-outlined text-[22px]">lightbulb_2</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Venue &amp; Schedule</h3>
        </div>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface">
            <span className="text-on-surface-variant">Operating Hours:</span>
            <span className="font-semibold">9:00 AM – 5:00 PM</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface">
            <span className="text-on-surface-variant">Midday Lunch Break:</span>
            <span className="font-semibold text-secondary">1:00 PM – 2:00 PM</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface">
            <span className="text-on-surface-variant">Location:</span>
            <span className="font-semibold text-right">Hosahalli School Ground</span>
          </div>
        </div>
        <div
          className="w-full h-36 mt-space-sm rounded-lg bg-surface-container-high relative overflow-hidden flex items-end p-space-sm shadow-inner bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCWAbhUiv5ZnSiwYBCZoRIs1FDEdhLu9LM8QiVfBmKFKQw_rAfrCWk8RWKP6sLWD3VIfzTKs7anJF5H90BfMuomfVqNY07kIaE0oqdsxzS_Fs-7npURxI_I7w31NS2JJHiskXbwUaZ1WVJGWijqd2z13L9TPoeoeLeCAtNwQ1RcqyZz4LtnbiWi08ZCSJsjTuCB48mXI0ymFdCz4R9Jo876pT65ZMCNOG7xRKLkRHhn9DkbcnfIYe94')`,
          }}
        >
          <div className="bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">directions</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              Hosahalli, Tumakuru
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => triggerToast('Opening directions to Govt. Higher Primary School, Hosahalli')}
          className="mt-space-xs inline-flex items-center justify-center gap-2 h-11 w-full bg-surface-container text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">map</span>
          <span>Get Driving Directions</span>
        </button>
      </section>

      {/* Quick Registration Form */}
      <section className="flex flex-col gap-space-md" id="register-form">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
              Fast Registration
            </span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            Register for this Camp
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Takes less than 2 minutes • Instant digital token on WhatsApp/SMS
          </p>
        </div>

        <form
          onSubmit={handleRegisterSubmit}
          className="flex flex-col gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="full-name">
              Full Name (As per ID)
            </label>
            <div className="relative flex items-center">
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              <span className="absolute right-3.5 material-symbols-outlined text-primary text-[20px]">
                check_circle
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="phone">
                Mobile Number
              </label>
              <span className="font-label-sm text-label-sm text-primary">SMS Token Delivery</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              <span className="absolute right-3.5 material-symbols-outlined text-primary text-[20px]">
                verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="dob">
                Date of Birth
              </label>
              <input
                id="dob"
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md text-on-surface">Gender</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`h-12 flex items-center justify-center rounded-lg font-label-md text-label-md transition-colors ${
                      gender === g
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {gender === g && (
                      <span className="material-symbols-outlined text-[18px] mr-1">check</span>
                    )}
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="address">
              Residential Address
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="id-proof">
                ID Document
              </label>
              <div className="relative">
                <select
                  id="id-proof"
                  value={idProof}
                  onChange={(e) => setIdProof(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs appearance-none"
                >
                  <option>Aadhaar Card</option>
                  <option>Voter ID (EPIC)</option>
                  <option>Ration Card (BPL/APL)</option>
                  <option>Ayushman Bharat Card</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="id-num">
                ID Number (Masked)
              </label>
              <input
                id="id-num"
                type="text"
                value={idNum}
                onChange={(e) => setIdNum(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-mono-token text-mono-token focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          {/* Known Conditions */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">
              Known Health Conditions / Warnings
            </label>
            <div className="flex flex-wrap gap-2">
              {['Diabetes', 'High BP', 'Asthma'].map((cond) => {
                const active = conditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`h-10 px-3 rounded-full flex items-center gap-1.5 font-label-sm text-label-sm transition-colors ${
                      active
                        ? 'bg-primary-fixed text-on-primary-fixed shadow-xs'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {active ? 'check' : 'add'}
                    </span>
                    {cond}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => toggleCondition('Penicillin Allergy')}
                className={`h-10 px-3 rounded-full flex items-center gap-1.5 font-label-sm text-label-sm font-semibold transition-colors ${
                  conditions.includes('Penicillin Allergy')
                    ? 'bg-error-container text-on-error-container shadow-xs'
                    : 'bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Penicillin Allergy
              </button>
            </div>
          </div>

          {/* Arrival Slot Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface">
                Choose Your Arrival Slot
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Recommended for low wait
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { time: '09:00 AM', tag: 'Fast Entry', disabled: false },
                { time: '09:30 AM', tag: 'FULL', disabled: true },
                { time: '10:00 AM', tag: 'Normal', disabled: false },
                { time: '10:30 AM', tag: 'Selected', disabled: false },
                { time: '11:00 AM', tag: 'Available', disabled: false },
                { time: '02:00 PM', tag: 'Post Lunch', disabled: false },
              ].map((s) => {
                const isSelected = selectedSlot === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={s.disabled}
                    onClick={() => setSelectedSlot(s.time)}
                    className={`flex-shrink-0 min-h-[48px] px-3.5 py-2 rounded-lg flex flex-col items-center justify-center font-label-sm text-label-sm transition-all ${
                      s.disabled
                        ? 'bg-surface-dim/40 text-on-surface-variant/60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-on-primary shadow-xs ring-2 ring-primary ring-offset-1'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className={`flex items-center gap-1 ${s.disabled ? 'line-through' : 'font-bold'}`}>
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      {s.time}
                    </span>
                    <span
                      className={`text-[10px] ${
                        s.disabled
                          ? 'text-error font-bold'
                          : isSelected
                          ? 'text-on-primary-container'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {isSelected ? 'Selected' : s.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-primary rounded cursor-pointer"
            />
            <span className="font-body-sm text-body-sm text-on-surface leading-tight">
              I consent to the collection and use of my health data under the{' '}
              <span className="font-semibold text-primary">DPDP Act 2023</span> solely for camp
              clinical triage and treatment.
            </span>
          </label>

          <button
            type="submit"
            className="h-14 w-full bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            <span>Confirm Registration</span>
          </button>
        </form>

        {registeredToken && (
          <div className="p-space-md rounded-xl bg-primary text-on-primary shadow-lg flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">
                verified
              </span>
              <span className="font-headline-sm text-headline-sm font-bold">
                Token Confirmed: {registeredToken}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary-container">
              Sent to {phone}. Please present this code at Station 1 (Registration Desk) upon
              arrival at {selectedSlot}.
            </p>
          </div>
        )}
      </section>
    </div>
  );

  const renderLiveQueueColumn = () => (
    <div className="flex flex-col w-full gap-space-md">
      {/* Top Identity & Status Strip */}
      <div className="flex items-center justify-between bg-surface-container p-space-md rounded-xl shadow-sm">
        <div className="flex flex-col min-w-0">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
            My Live Token
          </span>
          <div className="flex items-center gap-space-xs mt-0.5">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              {fullName}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="font-mono-token text-mono-token bg-surface-container-lowest text-primary px-2.5 py-1 rounded-full shadow-xs font-bold tracking-wider">
            HC-2026-000381
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span> Verified Patient
          </span>
        </div>
      </div>

      {/* Live Queue Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant mb-space-sm">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {syncing ? (
                <span className="text-primary font-bold">Syncing latest queue...</span>
              ) : (
                <>
                  Updated just now • Sync in{' '}
                  <span className="font-bold text-primary">{countdown}s</span>
                </>
              )}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span className="font-label-sm text-label-sm font-bold">Waiting</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Your Position in Queue
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-headline-xl text-[64px] leading-none text-primary font-black tracking-tight tabular-nums">
                {queueNum}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">in line</span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right bg-surface-container-low px-3.5 py-2.5 rounded-lg">
            <div className="flex items-center gap-1 text-secondary font-bold">
              <span className="material-symbols-outlined text-[18px]">timelapse</span>
              <span className="font-headline-sm text-headline-sm">
                ~{turnSkipped ? '32' : '25'} min
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Estimated wait
            </span>
          </div>
        </div>

        <div className="mt-space-sm pt-space-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden py-1">
              <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary-fixed text-on-primary-fixed font-bold font-label-sm text-[11px] shadow-xs">
                09
              </div>
              <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-surface-container text-on-surface-variant font-bold font-label-sm text-[11px] shadow-xs">
                10
              </div>
              <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-surface-container-high text-on-surface font-bold font-label-sm text-[11px] shadow-xs">
                11
              </div>
            </div>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {turnSkipped ? '6 patients ahead of you' : '3 patients ahead of you'}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold">Counter 2</span>
        </div>

        <div className="w-full bg-surface-container-high rounded-full h-3 mt-space-sm overflow-hidden relative">
          <div
            className="bg-primary-container h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: turnSkipped ? '60%' : '75%' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-space-xs mt-space-md pt-space-xs">
          <button
            type="button"
            onClick={() => {
              setAlertEnabled(!alertEnabled);
              triggerToast(
                !alertEnabled
                  ? 'SMS Alert enabled when 3 patients ahead'
                  : 'Queue alert disabled'
              );
            }}
            className={`min-h-[48px] px-2 py-1.5 rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors ${
              alertEnabled
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span className="truncate">{alertEnabled ? 'Alert Enabled' : 'Alert when 3 ahead'}</span>
          </button>
          <button
            type="button"
            disabled={turnSkipped}
            onClick={() => {
              setTurnSkipped(true);
              setQueueNum(15);
              triggerToast('Turn skipped once • Moved back 3 spots to #15');
            }}
            className={`min-h-[48px] px-2 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors ${
              turnSkipped ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">low_priority</span>
            <span>{turnSkipped ? 'Turn Skipped' : 'Skip my turn once'}</span>
          </button>
        </div>
      </div>

      {/* Token ID & Digital Gate Pass Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col items-center text-center">
        <div className="flex items-center justify-between w-full pb-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
            Allocated Pass
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">
            <span className="material-symbols-outlined text-[14px]">meeting_room</span> Room B
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 my-1">
          <span className="font-mono-id-lg text-[44px] leading-tight text-on-surface font-black tracking-tight">
            T-042
          </span>
          <button
            type="button"
            onClick={handleCopyToken}
            className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-colors ${
              copiedToken
                ? 'text-primary bg-primary-fixed/40'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
            title="Copy Token"
          >
            <span className="material-symbols-outlined text-[22px]">
              {copiedToken ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>

        <div className="w-full bg-surface-container-low text-primary p-3 rounded-lg flex items-center gap-2 text-left mb-space-md">
          <span className="material-symbols-outlined text-[22px] flex-shrink-0 text-primary-container">
            info
          </span>
          <span className="font-label-md text-label-md font-semibold leading-tight">
            Proceed to Counter 2 (General Physician) when called.
          </span>
        </div>

        {/* Verified QR SVG Component */}
        <div className="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex flex-col items-center">
          <svg
            className="w-44 h-44"
            fill="none"
            viewBox="0 0 160 160"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect fill="#FFFFFF" height="160" width="160" />
            <rect fill="#00614f" height="42" rx="6" width="42" x="10" y="10" />
            <rect fill="#FFFFFF" height="26" rx="3" width="26" x="18" y="18" />
            <rect fill="#00614f" height="14" rx="2" width="14" x="24" y="24" />
            <rect fill="#00614f" height="42" rx="6" width="42" x="108" y="10" />
            <rect fill="#FFFFFF" height="26" rx="3" width="26" x="116" y="18" />
            <rect fill="#00614f" height="14" rx="2" width="14" x="122" y="24" />
            <rect fill="#00614f" height="42" rx="6" width="42" x="10" y="108" />
            <rect fill="#FFFFFF" height="26" rx="3" width="26" x="18" y="116" />
            <rect fill="#00614f" height="14" rx="2" width="14" x="24" y="122" />
            <rect fill="#121c2a" height="8" width="8" x="60" y="14" />
            <rect fill="#121c2a" height="8" width="8" x="76" y="14" />
            <rect fill="#121c2a" height="8" width="8" x="92" y="14" />
            <rect fill="#00614f" height="8" width="8" x="68" y="22" />
            <rect fill="#121c2a" height="8" width="8" x="84" y="22" />
            <rect fill="#121c2a" height="8" width="8" x="60" y="30" />
            <rect fill="#00614f" height="8" width="8" x="76" y="38" />
            <rect fill="#121c2a" height="8" width="8" x="92" y="38" />
            <rect fill="#121c2a" height="8" width="8" x="14" y="60" />
            <rect fill="#121c2a" height="8" width="8" x="22" y="68" />
            <rect fill="#00614f" height="8" width="8" x="30" y="60" />
            <rect fill="#121c2a" height="8" width="8" x="38" y="68" />
            <rect fill="#121c2a" height="8" width="8" x="46" y="60" />
            <rect fill="#0e7c66" height="12" rx="2" width="12" x="60" y="60" />
            <rect fill="#121c2a" height="8" width="8" x="76" y="60" />
            <rect fill="#00614f" height="12" rx="2" width="12" x="88" y="60" />
            <rect fill="#121c2a" height="8" width="8" x="108" y="60" />
            <rect fill="#121c2a" height="8" width="8" x="124" y="60" />
            <rect fill="#00614f" height="8" width="8" x="140" y="68" />
            <rect fill="#121c2a" height="8" width="8" x="60" y="80" />
            <rect fill="#00614f" height="16" rx="3" width="16" x="72" y="76" />
            <circle cx="80" cy="84" fill="#FFFFFF" r="3" />
            <rect fill="#121c2a" height="8" width="8" x="92" y="80" />
            <rect fill="#121c2a" height="8" width="8" x="60" y="108" />
            <rect fill="#00614f" height="8" width="8" x="76" y="108" />
            <rect fill="#121c2a" height="8" width="8" x="68" y="116" />
            <rect fill="#121c2a" height="8" width="8" x="84" y="124" />
            <rect fill="#00614f" height="8" width="8" x="60" y="132" />
            <rect fill="#121c2a" height="8" width="8" x="76" y="140" />
            <rect fill="#00614f" height="8" width="8" x="108" y="108" />
            <rect fill="#121c2a" height="8" width="8" x="116" y="116" />
            <rect fill="#121c2a" height="8" width="8" x="132" y="108" />
            <rect fill="#00614f" height="8" width="8" x="140" y="124" />
            <rect fill="#121c2a" height="8" width="8" x="124" y="132" />
            <rect fill="#121c2a" height="8" width="8" x="108" y="140" />
            <rect fill="#121c2a" height="8" width="8" x="132" y="140" />
          </svg>
          <span className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-[220px]">
            Show this QR code at Counter 2 or Registration Desk
          </span>
        </div>

        <div className="grid grid-cols-2 gap-space-sm w-full mt-space-md">
          <button
            type="button"
            onClick={() => triggerToast('Downloading Token_T-042_Pass.pdf...')}
            className="min-h-[48px] px-3 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span className="truncate">Token (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => triggerToast('Added Sanjeevini Health Camp slot to Calendar')}
            className="min-h-[48px] px-3 py-2 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">event</span>
            <span className="truncate">Calendar</span>
          </button>
        </div>
      </div>

      {/* Camp Station Pipeline */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold block mb-space-sm">
          Camp Station Pipeline
        </span>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-surface-container-highest" />
          <button
            type="button"
            onClick={() => onNavigate?.('volunteer-desk')}
            className="flex flex-col items-center z-10 group"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px]">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface font-semibold mt-1 group-hover:text-primary">
              Reg
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('triage-vitals')}
            className="flex flex-col items-center z-10 group"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px]">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface font-semibold mt-1 group-hover:text-primary">
              Triage
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('doctor-consultation')}
            className="flex flex-col items-center z-10 group"
          >
            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[14px] ring-4 ring-primary-fixed/40 animate-pulse">
              3
            </div>
            <span className="font-label-sm text-[11px] text-primary font-bold mt-1">Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('pharmacy-dispense')}
            className="flex flex-col items-center z-10 group"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[14px]">
              4
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant font-medium mt-1 group-hover:text-primary">
              Pharmacy
            </span>
          </button>
        </div>
      </div>

      {/* Past Health Camp Visits Accordion */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[22px] text-primary">
              clinical_notes
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Past Health Camp Visits
            </h3>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
            1 Record
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setRecordExpanded(!recordExpanded)}
            className="w-full p-space-md flex items-center justify-between text-left hover:bg-surface-container-low transition-colors min-h-[48px]"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  12 Jan 2026
                </span>
                <span className="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Hosahalli Camp
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-primary font-medium mt-0.5">
                Dr. Meera Nair (General Physician)
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
              <span
                className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                  recordExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              >
                expand_more
              </span>
            </div>
          </button>

          {recordExpanded && (
            <div className="p-space-md pt-0 flex flex-col gap-space-md">
              <div className="bg-surface-container-low p-3 rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                  Chief Complaint
                </span>
                <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">
                  Fever and body ache for 3 days
                </p>
              </div>

              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1.5">
                  Recorded Triage Vitals
                </span>
                <div className="grid grid-cols-2 gap-space-xs">
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Blood Pressure
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      128/82{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        mmHg
                      </span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Pulse Rate
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      84{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        bpm
                      </span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Temperature
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      99.1{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        °F
                      </span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Blood Oxygen
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      97%{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        SpO2
                      </span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Body Weight
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      64{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        kg
                      </span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      BMI Level
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      25.6{' '}
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        (Normal)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-space-xs">
                <div className="flex items-start gap-2 bg-surface-container-low p-3 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                    stethoscope
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Diagnosis
                    </span>
                    <p className="font-body-md text-body-md text-on-surface font-bold">
                      Viral Fever
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-surface-container-low p-3 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                    medication
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Prescriptions Dispensed
                    </span>
                    <p className="font-body-md text-body-md text-on-surface font-medium">
                      Paracetamol 650 mg
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-normal">
                      1-0-1 for 3 days • 10 tablets given
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-surface-container-low p-3 rounded-lg">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">
                    medical_information
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Doctor Notes
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface italic">
                      &ldquo;Adequate oral hydration advised. Review at nearby PHC if high-grade
                      fever persists beyond 48 hours.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action & Helpline */}
      <div className="flex flex-col gap-space-sm">
        <button
          type="button"
          onClick={() => onNavigate?.('dossier')}
          className="w-full min-h-[52px] px-space-md py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">download_for_offline</span>
          <span>Open Full Longitudinal Health Record</span>
        </button>

        <a
          href="tel:18004254567"
          className="min-h-[48px] w-full bg-surface-container-low hover:bg-surface-container p-3 rounded-xl flex items-center justify-between text-on-surface transition-colors"
        >
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Toll-Free Health Camp Assistance
              </span>
              <span className="font-label-md text-label-md font-bold text-primary">
                1800-425-4567
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            chevron_right
          </span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Station Header Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Camp Overview, Citizen Registration &amp; Live Queue Token
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Hosahalli Outreach Portal • Pre-registration intake &amp; patient live queue pass
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Public Registration Active</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-7">{renderRegistrationColumn()}</div>
        <div className="lg:col-span-5">{renderLiveQueueColumn()}</div>
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
