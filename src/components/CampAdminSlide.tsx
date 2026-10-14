import React, { useState } from 'react';
import { saveCampToFirestore } from '../lib/firebase';
import { useFirebaseData } from '../context/FirebaseContext';

interface CampSiteNode {
  id: string;
  taluk: string;
  location: string;
  date: string;
  meshStatus: 'ONLINE_MESH' | 'SYNC_PENDING' | 'PROVISIONING';
  registeredCount: number;
  targetCapacity: number;
  doctorsAssigned: number;
  volunteersAssigned: number;
  piNodeIp: string;
  batteryLevel: number;
}

export const CampAdminSlide: React.FC = () => {
  const { camps: firestoreCamps } = useFirebaseData();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('CAMP-TMK-04');
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // New Camp Provisioning Form State (persists to Firestore `camps` collection)
  const [campCode, setCampCode] = useState('CAMP-TMK-06');
  const [taluk, setTaluk] = useState('Sira Taluk');
  const [location, setLocation] = useState('Govt Model Higher Primary School, Kallambella');
  const [campDate, setCampDate] = useState('01 Nov 2026');
  const [targetCapacity, setTargetCapacity] = useState(400);
  const [doctorsAssigned, setDoctorsAssigned] = useState(5);
  const [volunteersAssigned, setVolunteersAssigned] = useState(14);
  const [piNodeIp, setPiNodeIp] = useState('192.168.40.15');
  const [isSavingCamp, setIsSavingCamp] = useState(false);

  const [campNodes, setCampNodes] = useState<CampSiteNode[]>([
    {
      id: 'CAMP-TMK-04',
      taluk: 'Koratagere Taluk',
      location: 'Govt Higher Primary School, Holavanahalli',
      date: '18 Oct 2026 (Active Today)',
      meshStatus: 'ONLINE_MESH',
      registeredCount: 312,
      targetCapacity: 400,
      doctorsAssigned: 5,
      volunteersAssigned: 14,
      piNodeIp: '192.168.40.10 (Edge Pi-5)',
      batteryLevel: 94,
    },
    {
      id: 'CAMP-TMK-05',
      taluk: 'Madhugiri Taluk',
      location: 'Samudaya Bhavana, Kodigenahalli',
      date: '25 Oct 2026 (Next Sunday)',
      meshStatus: 'PROVISIONING',
      registeredCount: 128,
      targetCapacity: 350,
      doctorsAssigned: 4,
      volunteersAssigned: 12,
      piNodeIp: '192.168.40.12 (Edge Pi-5)',
      batteryLevel: 100,
    },
    {
      id: 'CAMP-TMK-03',
      taluk: 'Gubbi Taluk',
      location: 'Gram Panchayat Campus, Nittur',
      date: '11 Oct 2026 (Completed)',
      meshStatus: 'SYNC_PENDING',
      registeredCount: 418,
      targetCapacity: 400,
      doctorsAssigned: 6,
      volunteersAssigned: 16,
      piNodeIp: '192.168.40.08 (Edge Pi-5)',
      batteryLevel: 78,
    },
  ]);

  const liveMappedCamps: CampSiteNode[] = firestoreCamps.map((c) => ({
    id: c.campCode,
    taluk: c.taluk,
    location: c.location,
    date: `${c.campDate} (Firestore Live)`,
    meshStatus:
      c.meshStatus === 'COMPLETED' ? 'ONLINE_MESH' : c.meshStatus,
    registeredCount: c.registeredCount,
    targetCapacity: c.targetCapacity,
    doctorsAssigned: c.doctorsAssigned,
    volunteersAssigned: c.volunteersAssigned,
    piNodeIp: `${c.piNodeIp} (Firestore)`,
    batteryLevel: 98,
  }));

  const combinedNodes = [
    ...liveMappedCamps,
    ...campNodes.filter((n) => !liveMappedCamps.some((lc) => lc.id === n.id)),
  ];

  const activeNode =
    combinedNodes.find((n) => n.id === selectedNodeId) || combinedNodes[0];

  const handleForceCloudSync = async () => {
    setSyncInProgress(true);
    try {
      await saveCampToFirestore({
        campCode: activeNode.id,
        taluk: activeNode.taluk,
        location: activeNode.location,
        campDate: activeNode.date,
        meshStatus: 'ONLINE_MESH',
        registeredCount: activeNode.registeredCount,
        targetCapacity: activeNode.targetCapacity,
        doctorsAssigned: activeNode.doctorsAssigned,
        volunteersAssigned: activeNode.volunteersAssigned,
        piNodeIp: activeNode.piNodeIp,
        status: 'active',
      });
      setCampNodes((prev) => prev.map((n) => ({ ...n, meshStatus: 'ONLINE_MESH' })));
      setAdminToast(
        `Camp ${activeNode.id} synced and persisted to Firestore 'camps' collection.`
      );
      setTimeout(() => setAdminToast(null), 4500);
    } catch (err: any) {
      setAdminToast(`Firestore sync error: ${err?.message || 'Could not sync camp'}`);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleCreateCampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCamp(true);
    try {
      await saveCampToFirestore({
        campCode,
        taluk,
        location,
        campDate,
        meshStatus: 'PROVISIONING',
        registeredCount: 0,
        targetCapacity: Number(targetCapacity) || 400,
        doctorsAssigned: Number(doctorsAssigned) || 5,
        volunteersAssigned: Number(volunteersAssigned) || 14,
        piNodeIp,
        status: 'provisioning',
      });
      setSelectedNodeId(campCode);
      setAdminToast(
        `Provisioned new camp ${campCode} (${taluk}) and saved to Firestore 'camps' collection.`
      );
      setTimeout(() => setAdminToast(null), 4500);
    } catch (err: any) {
      setAdminToast(`Firestore error: ${err?.message || 'Failed to save camp'}`);
    } finally {
      setIsSavingCamp(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
              OPERATIONS & MULTI-SITE PROVISIONING
            </span>
            <h1 className="text-lg font-bold text-on-surface">
              Camp Command Center, Local Wi-Fi Mesh Nodes & Roster Provisioning
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleForceCloudSync}
          disabled={syncInProgress}
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-2 shadow-xs hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-base">
            {syncInProgress ? 'sync' : 'cloud_upload'}
          </span>
          <span>
            {syncInProgress ? 'Syncing to Firestore...' : 'Sync Active Camp to Firestore'}
          </span>
        </button>
      </div>

      {adminToast && (
        <div className="bg-primary-fixed border border-primary/30 text-on-primary-fixed px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium">
          <span>{adminToast}</span>
          <button type="button" onClick={() => setAdminToast(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Multi-Site Camp Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Tumakuru District Outreach Deployments ({combinedNodes.length})
            </h2>
            <span className="text-xs font-mono text-primary font-semibold">
              Firestore `camps`: {firestoreCamps.length} saved
            </span>
          </div>
          {combinedNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const pct = Math.min(
              100,
              Math.round((node.registeredCount / Math.max(1, node.targetCapacity)) * 100)
            );
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/15'
                    : 'bg-surface-container-lowest border-outline-variant/25 hover:border-primary/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{node.id}</span>
                      <span className="text-xs font-semibold text-on-surface-variant">
                        • {node.taluk}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface mt-0.5">{node.location}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{node.date}</p>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                      node.meshStatus === 'ONLINE_MESH'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : node.meshStatus === 'SYNC_PENDING'
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {node.meshStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">
                      Patient Load: <strong>{node.registeredCount}</strong> / {node.targetCapacity}
                    </span>
                    <span className="font-mono font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-outline-variant/15 text-xs">
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">
                      Medical Officers
                    </span>
                    <span className="font-bold text-on-surface">{node.doctorsAssigned} Doctors</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">
                      Field Volunteers
                    </span>
                    <span className="font-bold text-on-surface">
                      {node.volunteersAssigned} Staff
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">
                      Edge Box UPS
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {node.batteryLevel}% LiFePO4
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Provision New Camp Site Form (saves to Firestore `camps` collection) */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleCreateCampSubmit}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-4"
          >
            <div className="border-b border-outline-variant/20 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                FIRESTORE `camps` COLLECTION
              </span>
              <h3 className="text-base font-bold text-on-surface mt-0.5">
                Provision New Outreach Camp Site
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Camp Code
                </label>
                <input
                  type="text"
                  required
                  value={campCode}
                  onChange={(e) => setCampCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Taluk / Sector
                </label>
                <input
                  type="text"
                  required
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-on-surface-variant mb-1">
                Camp Venue & Village Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Scheduled Date
                </label>
                <input
                  type="text"
                  required
                  value={campDate}
                  onChange={(e) => setCampDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Target Capacity
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={5000}
                  value={targetCapacity}
                  onChange={(e) => setTargetCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Doctors
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={doctorsAssigned}
                  onChange={(e) => setDoctorsAssigned(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Volunteers
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={volunteersAssigned}
                  onChange={(e) => setVolunteersAssigned(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Edge Node IP
                </label>
                <input
                  type="text"
                  required
                  value={piNodeIp}
                  onChange={(e) => setPiNodeIp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingCamp}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_location_alt</span>
              <span>
                {isSavingCamp ? 'Saving to Firestore...' : 'Save Camp to Firestore'}
              </span>
            </button>
          </form>

          {/* Edge Hardware Telemetry */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-3">
            <div className="border-b border-outline-variant/20 pb-2.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                EDGE HARDWARE TELEMETRY • {activeNode.id}
              </span>
              <h3 className="text-sm font-bold text-on-surface mt-0.5">{activeNode.location}</h3>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary">database</span>
                <div>
                  <p className="font-bold text-on-surface">Cloud Firestore Sync</p>
                  <p className="text-on-surface-variant">
                    Collections: patients, camps, registrations
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-primary">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
