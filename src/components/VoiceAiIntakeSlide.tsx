import React, { useState, useEffect } from 'react';

interface VoiceAiIntakeSlideProps {
  onNavigate?: (station: string) => void;
}

const LANGUAGE_SAMPLES: Record<
  string,
  {
    name: string;
    nativeLabel: string;
    nativeScript: string;
    transliteration: string;
    translation: string;
  }
> = {
  KN: {
    name: 'ಕನ್ನಡ (Kannada)',
    nativeLabel: 'ರೋಗಿಯ ಮಾತು (Patient Voice)',
    nativeScript:
      '"ನನಗೆ ಮೂರು ದಿನಗಳಿಂದ ತಲೆ ಸುತ್ತು ಮತ್ತು ತಲೆನೋವು ಇದೆ, ನಿನ್ನೆ ರಾತ್ರಿಯಿಂದ ಸ್ವಲ್ಪ ಸುಸ್ತು ಅನಿಸುತ್ತಿದೆ. ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಮಾತ್ರೆಯನ್ನು ಸರಿಯಾಗಿ ತಗೊಂಡಿಲ್ಲ."',
    transliteration:
      '"Nanage mooru dinagalinda tale suttu mattu talenovu ide, ninne raatriyinda swalpa sustu anisuttide. Sakkare kaayile maathreyannu sariyagi thagondilla."',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
  HI: {
    name: 'हिंदी (Hindi)',
    nativeLabel: 'रोगी की आवाज़ (Patient Voice)',
    nativeScript:
      '"मुझे तीन दिनों से चक्कर आ रहे हैं और सिरदर्द है, कल रात से थोड़ी कमजोरी महसूस हो रही है। शुगर की दवा समय पर नहीं ले पायी।"',
    transliteration:
      '"Mujhe teen dinon se chakkar aa rahe hain aur sirdard hai, kal raat se thodi kamzori mehsoos ho rahi hai. Sugar ki dawa samay par nahi le paayi."',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
  TA: {
    name: 'தமிழ் (Tamil)',
    nativeLabel: 'நோயாளியின் குரல் (Patient Voice)',
    nativeScript:
      '"கடந்த மூன்று நாட்களாக தலைச்சுற்றல் மற்றும் தலைவலி உள்ளது, நேற்று இரவு முதல் சோர்வாக உணர்கிறேன். சர்க்கரை மாத்திரையை சரியாக எடுக்கவில்லை."',
    transliteration:
      '"Kadantha moondru naatkalaga thalaichutral matrum thalaivali ullathu, netru iravu muthal sorvaga unargiren."',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
  TE: {
    name: 'తెలుగు (Telugu)',
    nativeLabel: 'రోగి మాట (Patient Voice)',
    nativeScript:
      '"నాకు మూడు రోజులుగా తల తిరగడం మరియు తలనొప్పి ఉంది, నిన్న రాత్రి నుండి కొంచెం నీరసంగా ఉంది. షుగర్ మాత్రలు సరిగ్గా వేసుకోలేదు."',
    transliteration:
      '"Naaku moodu rojuluga thala thiragadam mariyu thalanoppi undi, ninna raathri nundi konchem neerasanga undi."',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
  ML: {
    name: 'മലയാളം (Malayalam)',
    nativeLabel: 'രോഗിയുടെ ശബ്ദം (Patient Voice)',
    nativeScript:
      '"കഴിഞ്ഞ മൂന്ന് ദിവസമായി തലകറക്കവും തലവേദനയും ഉണ്ട്, ഇന്നലെ രാത്രി മുതൽ നല്ല ക്ഷീണം തോന്നുന്നു."',
    transliteration:
      '"Kazhinja moonnu divasamaayi thalakarakkavum thalavedanayum undu, innale raathri muthal nalla ksheenam thonnunnu."',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
  EN: {
    name: 'English',
    nativeLabel: 'Patient Voice (Direct English)',
    nativeScript:
      '"I have been feeling dizzy with a back-of-head ache for 3 days, and feeling weak since last night. I missed my sugar tablets for 4 days."',
    transliteration: 'Direct English clinical intake stream (No transliteration required).',
    translation:
      'Patient reports persistent dizziness (vertigo) and occipital headache for the past 3 days, accompanied by generalized fatigue and weakness since yesterday evening. Admits to irregular compliance with prescribed Metformin diabetes medication.',
  },
};

export const VoiceAiIntakeSlide: React.FC<VoiceAiIntakeSlideProps> = ({ onNavigate }) => {
  const [langCode, setLangCode] = useState<string>('KN');
  const [speechRate, setSpeechRate] = useState<'0.8x' | '1.0x' | '1.2x'>('1.0x');
  const [isMuted, setIsMuted] = useState(false);
  const [isHoldingSpeak, setIsHoldingSpeak] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [customTranslation, setCustomTranslation] = useState(LANGUAGE_SAMPLES.KN.translation);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentLang = LANGUAGE_SAMPLES[langCode] || LANGUAGE_SAMPLES.KN;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerToast(
          'Successfully Dispatched to Room 2 • Token #TK-204 (Ningamma G.) sent with Allergy Warnings & Vitals.'
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    triggerToast(`Playing synthesized ${currentLang.name} audio to patient...`);
    setTimeout(() => setIsPlayingAudio(false), 2200);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* TOP CONTEXT & MULTILINGUAL TELEMETRY BAR */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Voice AI Intake &amp; Clinical Translation Assistant
                </span>
                <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                  {isMuted ? 'Mic Muted' : 'Live Mic Active'}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs flex-wrap">
                <span>Whisper v3 + Bhashini AI Neural Engine v4.2</span>
                <span>•</span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">bolt</span> Edge-Local
                  (Zero Cloud Latency)
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-lg text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">mic</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase leading-none">
                  Input Device
                </span>
                <span className="font-label-md text-label-md leading-tight">
                  Directional Lapel Mic #2
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerToast('Dialect acoustic profile verified: Tumakuru / Old Mysore')}
              className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-variant px-space-sm py-2 rounded-lg text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">
                travel_explore
              </span>
              <span className="font-label-md text-label-md">Dialect: Tumakuru / Old Mysore</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                check_circle
              </span>
            </button>

            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-2 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[18px]">hearing</span>
              <span className="font-label-sm text-label-sm text-on-surface">
                Camp Crowd Filter: <strong className="text-primary">High (28dB)</strong>
              </span>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
              {(['0.8x', '1.0x', '1.2x'] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`font-label-sm text-label-sm px-2.5 py-1 rounded transition-colors ${
                    speechRate === rate
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Prominent Multilingual Script Switcher */}
        <div className="flex items-center gap-space-sm pt-space-xs overflow-x-auto">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">translate</span> Language Mode:
          </span>
          <div className="flex items-center gap-space-xs flex-wrap">
            {[
              { code: 'EN', label: 'English' },
              { code: 'KN', label: 'ಕನ್ನಡ (Kannada)' },
              { code: 'HI', label: 'हिंदी (Hindi)' },
              { code: 'TA', label: 'தமிழ் (Tamil)' },
              { code: 'TE', label: 'తెలుగు (Telugu)' },
              { code: 'ML', label: 'മലയാളം (Malayalam)' },
            ].map((lang) => {
              const isActive = langCode === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLangCode(lang.code);
                    triggerToast(`Switched Bhashini neural intake to ${lang.label}`);
                  }}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-xs font-semibold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {isActive ? (
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                      verified
                    </span>
                  ) : (
                    <span className="font-mono-token text-xs text-on-surface-variant">
                      {lang.code}
                    </span>
                  )}
                  <span>{lang.label}</span>
                  {isActive && (
                    <span className="bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded-full font-mono-token">
                      Active Intake
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKSTATION STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* LEFT STAGE: INTERACTIVE LIVE VOICE ORB & BILINGUAL STREAM (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md relative overflow-hidden">
            <div className="flex items-center justify-between z-10 flex-wrap gap-2">
              <div className="flex items-center gap-space-xs">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isMuted ? 'bg-error' : 'bg-primary animate-pulse'
                  }`}
                ></span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Live Speech Recognition Feed
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Tumakuru Rural dialect stream
                </span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  equalizer
                </span>
                <span>Input Gain: +6dB</span>
              </div>
            </div>

            {/* Tactile Pulsating Audio Waveform Orb */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col items-center justify-center gap-space-sm relative">
              <div className="w-full h-28 flex items-center justify-center relative">
                {!isMuted && (
                  <div className="absolute w-24 h-24 rounded-full bg-primary/10 animate-ping opacity-75"></div>
                )}
                <div className="absolute w-20 h-20 rounded-full bg-secondary-container/40"></div>
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md relative z-10 transition-colors ${
                    isMuted
                      ? 'bg-error text-on-error'
                      : isHoldingSpeak
                      ? 'bg-secondary text-on-secondary scale-105'
                      : 'bg-primary text-on-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[28px]">
                    {isMuted ? 'mic_off' : 'mic'}
                  </span>
                </div>

                {!isMuted && (
                  <div className="w-full flex items-center justify-between px-space-xl absolute inset-0 pointer-events-none opacity-90">
                    <div className="flex items-center gap-1.5 w-full justify-center">
                      <span className="w-1.5 h-6 bg-primary rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                      <span className="w-1.5 h-12 bg-primary rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="w-1.5 h-16 bg-primary-container rounded-full animate-bounce [animation-delay:-0.5s]"></span>
                      <span className="w-1.5 h-20 bg-secondary rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                      <span className="w-1.5 h-10 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-14 bg-secondary-container rounded-full animate-bounce [animation-delay:-0.6s]"></span>
                      <span className="w-1.5 h-8 bg-primary rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="w-1.5 h-16 bg-primary rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                      <span className="w-1.5 h-5 bg-primary-container rounded-full animate-bounce [animation-delay:-0.7s]"></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center text-center z-10">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {isMuted
                    ? 'Microphone Muted (Tap Unmute to resume)'
                    : isHoldingSpeak
                    ? 'Recording Direct Patient Voice...'
                    : `Listening... (${currentLang.name} dialect detected)`}
                </span>
                <span className="font-mono-token text-xs text-on-surface-variant mt-0.5">
                  Confidence: 98.4% • Ingestion Latency: 240ms • Background Noise: -34dB
                </span>
              </div>
            </div>

            {/* Ergonomic Physical Action Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs z-10">
              <button
                type="button"
                onMouseDown={() => setIsHoldingSpeak(true)}
                onMouseUp={() => setIsHoldingSpeak(false)}
                onMouseLeave={() => setIsHoldingSpeak(false)}
                onClick={() => triggerToast('Captured 4.2s patient speech segment')}
                className={`h-12 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-space-xs shadow-xs transition-all active:scale-95 select-none ${
                  isHoldingSpeak
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary hover:bg-tertiary text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">mic</span>
                <span>{isHoldingSpeak ? 'Release when done' : 'Hold to Speak'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`h-12 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-space-xs transition-colors ${
                  isMuted
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-error">
                  {isMuted ? 'mic' : 'mic_off'}
                </span>
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              <button
                type="button"
                onClick={handlePlayAudio}
                className="h-12 px-space-sm rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-md text-label-md flex items-center justify-center gap-space-xs shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
                <span>{isPlayingAudio ? 'Playing...' : 'Play to Patient'}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerToast('Audio buffer cleared • Ready for fresh intake')}
                className="h-12 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                <span>Re-record</span>
              </button>
            </div>
          </div>

          {/* REAL-TIME BILINGUAL LIVE TRANSCRIPTION STREAM */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md flex-1">
            <div className="flex items-center justify-between pb-space-xs flex-wrap gap-2">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  graphic_eq
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Dual-Stream Transcription Feed
                </span>
              </div>
              <span className="font-mono-token text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                Token #TK-204 • Patient: Ningamma G. (68y / F)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Left Bubble: Patient Native Speech */}
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm font-semibold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>{' '}
                      {currentLang.nativeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center shadow-xs transition-colors"
                      title="Play Original Audio Recording"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    </button>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface font-medium leading-relaxed mt-1">
                    {currentLang.nativeScript}
                  </p>
                  <div className="bg-surface-container-lowest p-space-xs rounded-lg mt-2">
                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-0.5">
                      Phonetic Latin Transliteration
                    </span>
                    <p className="font-mono-token text-xs text-on-surface-variant italic">
                      {currentLang.transliteration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">
                      graphic_eq
                    </span>{' '}
                    Audio Duration: 8.4s
                  </span>
                  <span className="font-mono-token text-[11px] text-primary">
                    Tumakuru Accent: 99.1% match
                  </span>
                </div>
              </div>

              {/* Right Bubble: Clinical Translation in English */}
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm font-semibold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        medical_information
                      </span>{' '}
                      Clinical Doctor Translation
                    </span>
                    <span className="bg-primary/10 text-primary font-mono-token text-[11px] px-2 py-0.5 rounded-full font-semibold">
                      Verified SNOMED-CT
                    </span>
                  </div>

                  {isEditingTranslation ? (
                    <textarea
                      rows={5}
                      value={customTranslation}
                      onChange={(e) => setCustomTranslation(e.target.value)}
                      className="w-full p-2.5 mt-1 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed mt-1">
                      &ldquo;{customTranslation}&rdquo;
                    </p>
                  )}

                  <div className="bg-surface-container-lowest p-space-xs rounded-lg mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        psychology
                      </span>
                      <span className="font-label-sm text-label-sm">
                        Synthesized from Bhashini Medical NLP
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingTranslation(!isEditingTranslation)}
                      className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isEditingTranslation ? 'check' : 'edit'}
                      </span>{' '}
                      {isEditingTranslation ? 'Save text' : 'Edit text'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">
                      spellcheck
                    </span>{' '}
                    Grammatical Clarity: 100%
                  </span>
                  <span className="font-mono-token text-[11px]">Synced to Intake Slip</span>
                </div>
              </div>
            </div>

            {/* Live Audio Playback Counter for Patient */}
            <div className="bg-surface-container p-space-sm rounded-xl flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">campaign</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Rural Elderly Audio Feedback (Token Desk Speaker)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Speaks clear triage queue instruction in Kannada: &lsquo;ದಯವಿಟ್ಟು ಕೊಠಡಿ ೨ ಕ್ಕೆ
                    ಹೋಗಿ (Please proceed to Room 2)&rsquo;
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  triggerToast(
                    'Broadcasting Kannada Voice Instruction on Desk Speaker: "ದಯವಿಟ್ಟು ಕೊಠಡಿ ೨ ಕ್ಕೆ ಹೋಗಿ"'
                  )
                }
                className="px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-primary font-label-md text-label-md flex items-center gap-space-xs shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
                <span>Broadcast Instructions</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT STAGE: AUTOMATED CLINICAL ENTITY EXTRACTION & DESK DISPATCH (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  auto_awesome
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Auto-Extracted Clinical Entities
                </span>
              </div>
              <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded font-mono-token">
                AI Confidence: 99%
              </span>
            </div>

            {/* CRITICAL ALLERGY DETECTED BANNER */}
            <div className="bg-error-container text-on-error-container p-space-md rounded-xl flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                  <span className="font-label-lg text-label-lg font-bold text-error">
                    CRITICAL ALLERGY ALERT DETECTED
                  </span>
                </div>
                <span className="bg-error text-on-error text-[10px] font-mono-token px-2 py-0.5 rounded-full font-bold uppercase">
                  Severe
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-error-container leading-snug">
                Patient verbally confirmed past hypersensitivity:{' '}
                <strong>
                  Severe generalized itch, facial urticaria, and angioedema with Penicillin
                  injection
                </strong>{' '}
                at Taluk Hospital 4 years ago.
              </p>
              <div className="flex items-center gap-space-xs pt-1">
                <span className="material-symbols-outlined text-error text-[16px]">block</span>
                <span className="font-label-sm text-label-sm font-semibold text-error">
                  Flagged: DO NOT PRESCRIBE AMOXICILLIN / PENICILLIN DERIVATIVES
                </span>
              </div>
            </div>

            {/* SYMPTOMS EXTRACTED */}
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Chief Symptoms Extracted
              </span>
              <div className="flex flex-wrap gap-space-xs">
                {[
                  'Dizziness (Vertigo)',
                  'Occipital Headache',
                  'Generalized Weakness / Fatigue',
                ].map((sym) => (
                  <span
                    key={sym}
                    className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      check
                    </span>
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* TIMELINE & DURATION DETECTED */}
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Symptom Duration
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  3 Days Onset
                </span>
                <span className="font-label-sm text-[11px] text-primary">
                  Explicit duration match
                </span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Acuity Triage Level
                </span>
                <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                  Priority Tier 2
                </span>
                <span className="font-label-sm text-[11px] text-secondary">
                  Vitals screening recommended
                </span>
              </div>
            </div>

            {/* DETECTED CHRONIC HISTORY */}
            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                  Medication Non-Adherence Flag
                </span>
                <span className="font-mono-token text-xs text-secondary bg-surface-container px-2 py-0.5 rounded">
                  Rx History
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Patient mentioned skipping &ldquo;Sakkare Mathre&rdquo; (Type-2 Diabetes therapy:
                Metformin 500mg) for the last 4 days due to stock out at home.
              </p>
            </div>

            {/* VITALS CROSS-LINK */}
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Paired Station Telemetry (Hosahalli Node)
              </span>
              <div className="grid grid-cols-3 gap-space-xs text-center">
                <div className="bg-surface-container-low py-2 px-1 rounded-lg">
                  <span className="font-label-sm text-[11px] text-on-surface-variant block">
                    BP
                  </span>
                  <span className="font-mono-token text-sm font-bold text-error">152/94</span>
                  <span className="font-label-sm text-[10px] text-error block">Elevated</span>
                </div>
                <div className="bg-surface-container-low py-2 px-1 rounded-lg">
                  <span className="font-label-sm text-[11px] text-on-surface-variant block">
                    Random Blood Sugar
                  </span>
                  <span className="font-mono-token text-sm font-bold text-secondary">
                    238 mg/dL
                  </span>
                  <span className="font-label-sm text-[10px] text-secondary block">High</span>
                </div>
                <div className="bg-surface-container-low py-2 px-1 rounded-lg">
                  <span className="font-label-sm text-[11px] text-on-surface-variant block">
                    SpO2 / Pulse
                  </span>
                  <span className="font-mono-token text-sm font-bold text-primary">
                    98% / 78 bpm
                  </span>
                  <span className="font-label-sm text-[10px] text-primary block">Normal</span>
                </div>
              </div>
            </div>

            {/* PRIMARY ACTION DISPATCH BUTTON */}
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <button
                type="button"
                onClick={() => {
                  triggerToast(
                    'Successfully Dispatched to Room 2 • Token #TK-204 (Ningamma G.) sent with Allergy Warnings & Vitals.'
                  );
                  setTimeout(() => onNavigate?.('doctor-consultation'), 1100);
                }}
                className="min-h-[48px] px-3 py-2 w-full rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Push to Doctor Consultation Desk (Room 2)</span>
                <span className="ml-1 font-mono-token text-xs bg-primary-fixed-dim/30 px-2 py-0.5 rounded text-on-primary">
                  Ctrl + Enter
                </span>
              </button>
              <div className="flex items-center justify-between px-space-xs text-on-surface-variant font-label-sm text-label-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[14px]">
                    check_circle
                  </span>{' '}
                  Auto-assigned Dr. Meera Nair
                </span>
                <span>Queue Position: #4</span>
              </div>
            </div>
          </div>

          {/* LOCAL EDGE NODE STATUS CARD */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[20px]">hub</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Local Edge Node Status
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Local SQLite cache holds 1,420 regional clinical vocabulary tokens for Tumakuru
              district. Audio models run completely on camp field hardware with no internet
              required.
            </p>
            <div className="flex items-center justify-between bg-surface-container-low px-space-sm py-2 rounded-lg text-on-surface">
              <span className="font-label-sm text-label-sm">
                Field Node Battery: <strong>94% (UPS Active)</strong>
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                Local Sync: Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-14 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">done_all</span>
          <span className="font-label-md text-label-md">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
