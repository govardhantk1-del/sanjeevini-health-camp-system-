import React, { useState } from 'react';
import { useFirebaseData, UserProfile } from '../context/FirebaseContext';
import { updatePatientClinicalRecord } from '../lib/firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, updateUserProfile, activePatient } = useFirebaseData();

  const isPatient = userProfile?.role === 'patient';

  // Doctor / Clinician / Admin state
  const [fullName, setFullName] = useState(userProfile?.fullName || 'Dr. Govardhan T K');
  const [role, setRole] = useState<UserProfile['role']>(userProfile?.role || 'doctor');
  const [speciality, setSpeciality] = useState(userProfile?.speciality || 'General Medicine');
  const [licenseNumber, setLicenseNumber] = useState(userProfile?.licenseNumber || 'KMC-2026-081');
  const [phone, setPhone] = useState(userProfile?.phone || '+91 98450 11223');
  const [hospitalAffiliation, setHospitalAffiliation] = useState(
    userProfile?.hospitalAffiliation || 'Tumakuru District Health Mission'
  );
  const [opdRoom, setOpdRoom] = useState(userProfile?.opdRoom || 'Workstation 02 • OPD');

  // Patient profile state
  const [age, setAge] = useState(userProfile?.age || activePatient?.age || '45y');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>(
    (userProfile?.gender as any) || activePatient?.gender || 'Female'
  );
  const [village, setVillage] = useState(userProfile?.village || activePatient?.village || 'Holavanahalli Village');
  const [emergencyContact, setEmergencyContact] = useState(
    userProfile?.emergencyContact || '+91 98450 99881 (Family)'
  );
  const [bloodGroup, setBloodGroup] = useState(userProfile?.bloodGroup || 'B+');
  const [allergies, setAllergies] = useState(userProfile?.allergies || 'Penicillin Allergy');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      updateUserProfile({
        fullName: fullName.trim(),
        role,
        speciality: speciality.trim(),
        licenseNumber: licenseNumber.trim(),
        phone: phone.trim(),
        hospitalAffiliation: hospitalAffiliation.trim(),
        opdRoom: opdRoom.trim(),
        age: age.trim(),
        gender,
        village: village.trim(),
        emergencyContact: emergencyContact.trim(),
        bloodGroup,
        allergies: allergies.trim(),
      });

      // If user is a patient and has an active patient doc in Firestore, also update Firestore
      if (role === 'patient' && activePatient?.id) {
        try {
          await updatePatientClinicalRecord(activePatient.id, {
            fullName: fullName.trim(),
            phone: phone.trim(),
            age: age.trim(),
            gender,
            village: village.trim(),
          });
        } catch {
          // ignore error if not owner
        }
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="bg-primary text-on-primary p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">
                {role === 'patient' ? 'account_circle' : 'clinical_notes'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold">
                {role === 'patient' ? 'Edit Patient Profile' : 'Edit Clinician / Admin Profile'}
              </h2>
              <p className="text-xs text-on-primary/80">
                Update your credentials, clinical role, or patient personal details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-primary/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Role Switcher in Profile Editor */}
          <div className="bg-surface-container p-3 rounded-xl space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Account Type / Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'doctor', label: 'Doctor / OPD', icon: 'stethoscope' },
                  { id: 'clinician', label: 'Specialist', icon: 'cardiology' },
                  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
                  { id: 'patient', label: 'Patient', icon: 'person' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === item.id
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Common Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
              />
            </div>
          </div>

          {/* DOCTOR / CLINICIAN / ADMIN SPECIFIC FIELDS */}
          {role !== 'patient' ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Speciality / Clinical Department
                  </label>
                  <input
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="General Medicine / Diabetology"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Medical Council / License No.
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="KMC-2026-081"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Hospital / District Affiliation
                  </label>
                  <input
                    type="text"
                    value={hospitalAffiliation}
                    onChange={(e) => setHospitalAffiliation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Assigned OPD Workstation
                  </label>
                  <input
                    type="text"
                    value={opdRoom}
                    onChange={(e) => setOpdRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* PATIENT SPECIFIC FIELDS */
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="52y"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Village / Town / Ward
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Holavanahalli Village, Tumakuru"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98450 99881 (Son/Spouse)"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Known Drug Allergies / Conditions
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin Allergy, Sulfa Drugs, Chronic Asthma"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
