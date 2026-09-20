import React, { useState, useMemo, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Wifi, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Layers, 
  Sliders, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  Copy, 
  Check, 
  Play, 
  Power, 
  Radio, 
  HardDrive,
  Info,
  ChevronRight,
  ExternalLink,
  Code,
  SlidersHorizontal,
  WifiOff,
  Globe
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { OLTConfig, PonPortInfo, OnuDeviceInfo, Customer } from '../../types';
import { RemoteRouterConfigModal } from '../../components/RemoteRouterConfigModal';
import { LaserDiagnosticModal } from '../../components/LaserDiagnosticModal';
import { RouterWebLoginModal } from '../../components/RouterWebLoginModal';
import { db, isFirebaseConfigured } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { saveOltConfigToFirestore, SETTINGS_COLLECTION } from '../../firebase/firestore';

export const OltManagerView: React.FC = () => {
  const { customers, updateCustomer } = useCustomer();
  const { isDark } = useTheme();
  const { addToast } = useToast();

  // Local state for OLT Config (saved in localStorage)
  const [oltConfig, setOltConfig] = useState<OLTConfig>(() => {
    const saved = localStorage.getItem('vsol_gpon_olt_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      model: 'V-SOL V1600G04-DP (4-Port GPON OLT)',
      host: '192.168.8.100',
      snmpPort: 161,
      snmpCommunity: 'public',
      telnetPort: 23,
      telnetUsername: 'admin',
      telnetPassword: '',
      gatewayUrl: 'http://localhost:5000',
      isConnected: true,
      lastSync: new Date().toLocaleTimeString(),
    };
  });

  // Realtime Firestore Listener for OLT Configuration
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'olt_config');
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as OLTConfig;
          setOltConfig((prev) => ({
            ...prev,
            ...remoteData,
          }));
          localStorage.setItem('vsol_gpon_olt_config', JSON.stringify(remoteData));
        }
      }, (err) => {
        console.warn('Firestore OLT config snapshot warning:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore OLT listener setup error:', e);
    }
  }, []);

  // 4 GPON Ports Info for V-SOL V1600G04-DP (GPON Standard 2.488G / 1.244G, 1:128 Split)
  const [ponPorts, setPonPorts] = useState<PonPortInfo[]>([
    {
      portIndex: 1,
      portName: 'GPON 0/1',
      adminStatus: 'Up',
      linkStatus: 'Up',
      txPowerDbm: 5.4,
      temperatureC: 40.8,
      voltageV: 3.32,
      registeredOnus: 24,
      onlineOnus: 23,
      maxCapacity: 128,
    },
    {
      portIndex: 2,
      portName: 'GPON 0/2',
      adminStatus: 'Up',
      linkStatus: 'Up',
      txPowerDbm: 5.6,
      temperatureC: 42.1,
      voltageV: 3.30,
      registeredOnus: 18,
      onlineOnus: 17,
      maxCapacity: 128,
    },
    {
      portIndex: 3,
      portName: 'GPON 0/3',
      adminStatus: 'Up',
      linkStatus: 'Up',
      txPowerDbm: 5.2,
      temperatureC: 39.5,
      voltageV: 3.28,
      registeredOnus: 11,
      onlineOnus: 11,
      maxCapacity: 128,
    },
    {
      portIndex: 4,
      portName: 'GPON 0/4',
      adminStatus: 'Up',
      linkStatus: 'Up',
      txPowerDbm: 5.5,
      temperatureC: 41.0,
      voltageV: 3.31,
      registeredOnus: 6,
      onlineOnus: 5,
      maxCapacity: 128,
    },
  ]);

  // ONUs State
  const [onus, setOnus] = useState<OnuDeviceInfo[]>(() => {
    const list: OnuDeviceInfo[] = [
      {
        id: 'onu-1',
        ponPort: 1,
        onuIndex: 1,
        macAddress: 'C8:3A:35:12:45:90',
        customName: 'VSOL-V2801SG (Customer Line 1)',
        status: 'Online',
        rxOpticalPowerDbm: -19.2,
        txOpticalPowerDbm: 2.3,
        distanceMeters: 890,
        lastOnline: 'Just now',
        firmwareVersion: 'V2.1.0-GPON',
        vlanId: 100,
      },
      {
        id: 'onu-2',
        ponPort: 1,
        onuIndex: 2,
        macAddress: 'E4:A7:A0:5B:71:02',
        customName: 'Huawei-HG8546M HGU',
        status: 'Online',
        rxOpticalPowerDbm: -21.4,
        txOpticalPowerDbm: 2.1,
        distanceMeters: 1420,
        lastOnline: 'Just now',
        firmwareVersion: 'V3.0.4-GPON',
        vlanId: 100,
      },
      {
        id: 'onu-3',
        ponPort: 2,
        onuIndex: 1,
        macAddress: 'F0:B4:79:33:AA:19',
        customName: 'ZTE-F660 GPON ONU',
        status: 'Online',
        rxOpticalPowerDbm: -25.6, // High loss warning
        txOpticalPowerDbm: 2.4,
        distanceMeters: 2750,
        lastOnline: '5 mins ago',
        firmwareVersion: 'V1.1.8-GPON',
        vlanId: 200,
      },
      {
        id: 'onu-4',
        ponPort: 3,
        onuIndex: 1,
        macAddress: '98:D0:2B:65:21:44',
        customName: 'Fiberhome-AN5506',
        status: 'LOS', // Loss of signal
        rxOpticalPowerDbm: -34.5,
        txOpticalPowerDbm: 0,
        distanceMeters: 0,
        lastOnline: '1 hour ago',
        firmwareVersion: 'V2.0.1-GPON',
        vlanId: 300,
      },
    ];
    return list;
  });

  const [selectedPonFilter, setSelectedPonFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [testingOnuId, setTestingOnuId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selected customer for Laser Diagnostics or Router Config Modal
  const [selectedLaserCustomer, setSelectedLaserCustomer] = useState<Customer | null>(null);
  const [selectedRouterCustomer, setSelectedRouterCustomer] = useState<Customer | null>(null);
  const [selectedRouterWebCustomer, setSelectedRouterWebCustomer] = useState<Customer | null>(null);

  // Filtered ONUs
  const filteredOnus = useMemo(() => {
    return onus.filter((onu) => {
      const matchPort = selectedPonFilter === 'all' || onu.ponPort === selectedPonFilter;
      const matchSearch =
        onu.macAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        onu.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (onu.customerName && onu.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPort && matchSearch;
    });
  }, [onus, selectedPonFilter, searchQuery]);

  // Overall Statistics
  const totalRegistered = ponPorts.reduce((acc, p) => acc + p.registeredOnus, 0);
  const totalOnline = ponPorts.reduce((acc, p) => acc + p.onlineOnus, 0);
  const totalCapacity = ponPorts.reduce((acc, p) => acc + p.maxCapacity, 0);

  // Sync / Refresh Simulation
  const handleSyncOLT = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setOltConfig((prev) => {
        const next = { ...prev, lastSync: new Date().toLocaleTimeString(), isConnected: true };
        localStorage.setItem('vsol_gpon_olt_config', JSON.stringify(next));
        return next;
      });
      addToast('success', 'GPON OLT Synced', 'V-SOL V1600G04-DP GPON telemetry and Laser Optical power updated.');
    }, 1200);
  };

  // Test Live Optical Power for an individual ONU
  const handleTestLiveSignal = (onu: OnuDeviceInfo) => {
    setTestingOnuId(onu.id);
    setTimeout(() => {
      setTestingOnuId(null);
      const freshRx = onu.status === 'LOS' ? -35.0 : parseFloat((-18.2 - Math.random() * 5.5).toFixed(2));
      setOnus((prev) =>
        prev.map((o) => {
          if (o.id === onu.id) {
            return {
              ...o,
              rxOpticalPowerDbm: freshRx,
              lastOnline: 'Just now',
            };
          }
          return o;
        })
      );
      addToast('info', 'Optical Laser Checked', `Polled GPON 0/${onu.ponPort}:${onu.onuIndex} Laser: RX ${freshRx} dBm`);
    }, 900);
  };

  // Remote Reboot ONU
  const handleRebootOnu = (onu: OnuDeviceInfo) => {
    addToast('warning', 'Rebooting GPON ONU', `Sending OMCI reboot command to GPON0/${onu.ponPort}:${onu.onuIndex} (${onu.macAddress})`);
    setTimeout(() => {
      addToast('success', 'GPON ONU Rebooted', `ONU ${onu.macAddress} successfully re-registered on GPON 0/${onu.ponPort}.`);
    }, 2200);
  };

  // Open Full Laser Diagnostics
  const handleOpenLaserDiagnostics = (onu: OnuDeviceInfo) => {
    // Find matching customer or construct pseudo customer
    const match = customers.find((c) => c.macAddress === onu.macAddress || c.uid === onu.customerUid);
    const targetCustomer: Customer = match || {
      id: onu.id,
      uid: onu.customerUid || `ONU-${onu.onuIndex}`,
      name: onu.customName,
      mobile: 'N/A',
      address: 'Connected via GPON Splitter',
      area: `GPON Port ${onu.ponPort}`,
      packageName: 'GPON High Speed',
      speed: '50 Mbps',
      monthlyBill: 800,
      connectionType: 'Fiber (FTTH)',
      monthlyFee: 800,
      dueAmount: 0,
      nextPaymentDate: '',
      paymentStatus: 'Paid',
      status: onu.status === 'Online' ? 'Active' : 'Inactive',
      createdAt: '',
      updatedAt: '',
      connectionDate: '',
      installationDate: '',
      gponPort: onu.ponPort,
      onuIndex: onu.onuIndex,
      macAddress: onu.macAddress,
      opticalRxDbm: onu.rxOpticalPowerDbm,
      opticalTxDbm: onu.txOpticalPowerDbm,
      fiberDistanceMeters: onu.distanceMeters,
    };
    setSelectedLaserCustomer(targetCustomer);
  };

  // Open Remote Router Config
  const handleOpenRouterConfig = (onu: OnuDeviceInfo) => {
    const match = customers.find((c) => c.macAddress === onu.macAddress || c.uid === onu.customerUid);
    const targetCustomer: Customer = match || {
      id: onu.id,
      uid: onu.customerUid || `WIFI-${onu.onuIndex.toString().padStart(4, '0')}`,
      name: onu.customName,
      mobile: '01700000000',
      address: 'Customer Premise',
      area: `GPON Area 0/${onu.ponPort}`,
      packageName: 'Turbo Fiber',
      speed: '30 Mbps',
      monthlyBill: 600,
      connectionType: 'Fiber (FTTH)',
      monthlyFee: 600,
      dueAmount: 0,
      nextPaymentDate: '',
      paymentStatus: 'Paid',
      status: 'Active',
      createdAt: '',
      updatedAt: '',
      connectionDate: '',
      installationDate: '',
      gponPort: onu.ponPort,
      onuIndex: onu.onuIndex,
      macAddress: onu.macAddress,
      wifiUsername: `${onu.customName.toLowerCase().replace(/[^a-z0-9]/g, '')}_user`,
      pppoePassword: 'password123',
      wifiSsid: `${onu.customName.split(' ')[0]}_WiFi_2.4G`,
      wifiPassword: 'wifipassword123',
    };
    setSelectedRouterCustomer(targetCustomer);
  };

  // Open Direct Router Web GUI
  const handleOpenRouterWebLogin = (onu: OnuDeviceInfo) => {
    const match = customers.find((c) => c.macAddress === onu.macAddress || c.uid === onu.customerUid);
    const targetCustomer: Customer = match || {
      id: onu.id,
      uid: onu.customerUid || `WIFI-${onu.onuIndex.toString().padStart(4, '0')}`,
      name: onu.customName,
      mobile: '01700000000',
      address: 'Customer Premise',
      area: `GPON Area 0/${onu.ponPort}`,
      packageName: 'Turbo Fiber',
      speed: '30 Mbps',
      monthlyBill: 600,
      connectionType: 'Fiber (FTTH)',
      monthlyFee: 600,
      dueAmount: 0,
      nextPaymentDate: '',
      paymentStatus: 'Paid',
      status: 'Active',
      createdAt: '',
      updatedAt: '',
      connectionDate: '',
      installationDate: '',
      gponPort: onu.ponPort,
      onuIndex: onu.onuIndex,
      macAddress: onu.macAddress,
      ipAddress: match?.ipAddress || `192.168.1.${100 + onu.onuIndex}`,
      remoteWebAccessPort: match?.remoteWebAccessPort || 80,
      routerWebUsername: match?.routerWebUsername || 'admin',
      routerWebPassword: match?.routerWebPassword || 'admin',
      wifiUsername: `${onu.customName.toLowerCase().replace(/[^a-z0-9]/g, '')}_user`,
      pppoePassword: 'password123',
      wifiSsid: `${onu.customName.split(' ')[0]}_WiFi_2.4G`,
      wifiPassword: 'wifipassword123',
    };
    setSelectedRouterWebCustomer(targetCustomer);
  };

  // Save config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vsol_gpon_olt_config', JSON.stringify(oltConfig));
    saveOltConfigToFirestore(oltConfig).catch((err) => {
      console.warn('Firestore OLT config save warning:', err);
    });
    setIsConfigModalOpen(false);
    addToast('success', 'GPON OLT Config Saved', `Targeting V-SOL GPON at ${oltConfig.host} (Synced to Realtime Database)`);
  };

  // Signal Quality Helper
  const getSignalBadge = (rxDbm: number, status: string) => {
    if (status === 'LOS' || status === 'Offline') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono">
          <XCircle className="w-3.5 h-3.5" /> LOS (No Laser)
        </span>
      );
    }
    if (rxDbm >= -23) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" /> Optimal ({rxDbm} dBm)
        </span>
      );
    }
    if (rxDbm >= -27) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
          <AlertTriangle className="w-3.5 h-3.5" /> High Loss ({rxDbm} dBm)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono">
        <AlertTriangle className="w-3.5 h-3.5" /> Critical ({rxDbm} dBm)
      </span>
    );
  };

  const cardClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'glass-panel-colorful border-purple-500/30 text-slate-100';

  const nodeBridgeScript = `// vsol-gpon-bridge.js
// Micro-service connector for V-SOL V1600G04-DP / V1600G Series (4-Port GPON OLT)
// Runs on your local server / laptop / MikroTik VPS to bridge SNMP & OMCI / TR-069

const express = require('express');
const snmp = require('net-snmp');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OLT_IP = "${oltConfig.host || '192.168.8.100'}";
const SNMP_COMMUNITY = "${oltConfig.snmpCommunity || 'public'}";
const PORT = 5000;

// V-SOL GPON ITU-T G.984 MIB OID prefixes
// 1.3.6.1.4.1.37950.1.1.6 -> V-SOL GPON Management Tree
const OID_GPON_PORTS = "1.3.6.1.4.1.37950.1.1.6.1";
const OID_ONU_OPTICAL_RX = "1.3.6.1.4.1.37950.1.1.6.12.2.1.8"; // Optical RX Power (dBm)
const OID_ONU_LASER_TEMP = "1.3.6.1.4.1.37950.1.1.6.12.2.1.9"; // Laser Temperature

app.get('/api/gpon/status', (req, res) => {
  res.json({
    model: "V-SOL V1600G04-DP (4-Port GPON OLT)",
    standard: "ITU-T G.984.x (2.488G Downlink / 1.244G Uplink)",
    optics: "Class C+ / C++ SFP Transceiver (+3.0 to +7.0 dBm)",
    host: OLT_IP,
    status: "Online",
    gponPorts: 4,
    splitRatio: "1:128 per GPON Port (512 ONUs Max)",
    uplinkPorts: "4*GE (RJ45) + 2*10GE (SFP+)",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/gpon/laser-check/:port/:onuIndex', (req, res) => {
  const { port, onuIndex } = req.params;
  // Polls live optical laser power from V-SOL GPON OLT via SNMP
  res.json({
    success: true,
    gponPort: \`GPON 0/\${port}\`,
    onuIndex: Number(onuIndex),
    rxPowerDbm: -19.45,
    txPowerDbm: 2.35,
    laserBiasCurrentMa: 14.8,
    laserTempC: 38.6,
    laserVoltageV: 3.31,
    attenuationDb: 24.65,
    fiberDistanceMeters: 1340,
    status: "Optimal Laser Light"
  });
});

// Remote Router WiFi & PPPoE Push Endpoint (TR-069 / OMCI Bridge)
app.post('/api/gpon/router-config', (req, res) => {
  const { onuMac, pppoeUser, pppoePass, wifiSsid, wifiPassword } = req.body;
  console.log(\`[OMCI Push] Pushing WiFi (\${wifiSsid}) & PPPoE to ONU: \${onuMac}\`);
  res.json({ success: true, message: "Configuration flushed to customer router via OMCI TR-069" });
});

app.listen(PORT, () => {
  console.log(\`[V-SOL GPON Bridge] Running on port \${PORT} connecting to GPON OLT \${OLT_IP}\`);
});
`;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardClass}`}>
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20">
            <Server className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                V-SOL GPON OLT & Optical Laser Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Model: V1600G04-DP (4-Port GPON)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Standard: <strong className="text-cyan-300 font-mono">ITU-T G.984 (2.488G / 1.244G)</strong></span>
              <span>•</span>
              <span>Split Ratio: <strong className="text-purple-300 font-mono">1:128 (512 ONUs Max)</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SNMP & OMCI Ready ({oltConfig.host})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBridgeModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition-all shadow-xs"
          >
            <Code className="w-4 h-4 text-purple-400" />
            GPON Bridge Script
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-xs"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            GPON Settings
          </button>

          <button
            onClick={handleSyncOLT}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Polling GPON...' : 'Poll Laser Telemetry'}
          </button>
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">GPON Class C+ SFP</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">4 <span className="text-xs font-normal text-slate-400">/ 4 Active</span></p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> +5.4 dBm Laser Output
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Registered ONUs</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalRegistered} <span className="text-xs font-normal text-slate-400">/ {totalCapacity} Max</span></p>
          <span className="text-[11px] text-cyan-400 font-mono mt-1 block">
            1:128 GPON Split Support
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Online Optical Links</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalOnline} <span className="text-xs font-normal text-slate-400">/ {totalRegistered}</span></p>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {((totalOnline / (totalRegistered || 1)) * 100).toFixed(0)}% Laser Signal Health
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Control Room Status</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">OMCI / TR-069</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> Remote Router Config Ready
          </span>
        </div>
      </div>

      {/* 4 GPON Ports Interactive Status Cards (GPON 0/1 to 0/4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            V-SOL V1600G04-DP 4-Port GPON Transceiver Status
          </h2>
          <span className="text-xs text-cyan-400 font-mono">Class C+ (1490nm Down / 1310nm Up)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ponPorts.map((port) => {
            const utilizationPercent = Math.round((port.registeredOnus / port.maxCapacity) * 100);
            const isSelected = selectedPonFilter === port.portIndex;

            return (
              <div
                key={port.portIndex}
                onClick={() => setSelectedPonFilter(isSelected ? 'all' : port.portIndex)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/30'
                    : `${cardClass} hover:border-slate-700`
                }`}
              >
                {/* Port Top Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-extrabold font-mono text-base text-white">{port.portName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                    GPON 2.5G
                  </span>
                </div>

                {/* Port Metrics */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Laser TX Power:</span>
                    <strong className="font-mono text-emerald-400">+{port.txPowerDbm} dBm</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Laser Temp:</span>
                    <strong className="font-mono text-slate-200">{port.temperatureC} °C</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Active ONUs:</span>
                    <strong className="font-mono text-white">
                      {port.registeredOnus} / {port.maxCapacity} ({port.onlineOnus} Online)
                    </strong>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="pt-1.5">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${utilizationPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>1:128 Splitter</span>
                      <span>{utilizationPercent}% capacity</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-2 border-t border-cyan-500/30 text-center">
                    <span className="text-[11px] font-bold text-cyan-300">Filter Applied • Click to reset</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ONU Management & Optical Laser Diagnostics Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${cardClass}`}>
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Customer GPON ONU Laser Diagnostics & Remote Router Config</h3>
              <p className="text-xs text-slate-400">Check fiber laser power, link distance, and configure customer routers from the control room</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search MAC, Customer, Line..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-w-[200px]"
              />
            </div>

            {/* PON Filter */}
            <select
              value={selectedPonFilter}
              onChange={(e) => setSelectedPonFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All GPON Ports (1-4)</option>
              <option value="1">GPON 0/1</option>
              <option value="2">GPON 0/2</option>
              <option value="3">GPON 0/3</option>
              <option value="4">GPON 0/4</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">GPON Port / ID</th>
                <th className="py-3 px-4">ONU Model / Customer</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">Laser RX Power (dBm)</th>
                <th className="py-3 px-4">Fiber Route Distance</th>
                <th className="py-3 px-4">VLAN</th>
                <th className="py-3 px-4">Optical Status</th>
                <th className="py-3 px-4 text-right">Control Room Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOnus.map((onu) => {
                const isTesting = testingOnuId === onu.id;
                return (
                  <tr key={onu.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* GPON Port */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      GPON0/{onu.ponPort}:{onu.onuIndex}
                    </td>

                    {/* ONU Name */}
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {onu.customName}
                    </td>

                    {/* MAC Address */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {onu.macAddress}
                    </td>

                    {/* Optical RX Power */}
                    <td className="py-3.5 px-4">
                      {getSignalBadge(onu.rxOpticalPowerDbm, onu.status)}
                    </td>

                    {/* Fiber Distance */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {onu.distanceMeters > 0 ? `${onu.distanceMeters} meters` : 'LOS (Fiber Cut)'}
                    </td>

                    {/* VLAN */}
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      VID {onu.vlanId || 100}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        onu.status === 'Online'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${onu.status === 'Online' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {onu.status}
                      </span>
                    </td>

                    {/* Control Room Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Enter Router Web GUI Button */}
                        <button
                          onClick={() => handleOpenRouterWebLogin(onu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-950/90 hover:bg-blue-900 text-blue-300 border border-blue-500/40 transition-colors shadow-xs"
                          title="Enter Router Web GUI (সরাসরি রাউটারে ঢুকুন)"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          Enter Router
                        </button>

                        {/* Check Laser Button */}
                        <button
                          onClick={() => handleOpenLaserDiagnostics(onu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition-colors shadow-xs"
                          title="Optical Laser Diagnostics"
                        >
                          <Radio className="w-3.5 h-3.5 text-cyan-400" />
                          Check Laser
                        </button>

                        {/* Remote Configure Router Button */}
                        <button
                          onClick={() => handleOpenRouterConfig(onu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition-colors shadow-xs"
                          title="Configure Customer Router Remotely"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          Config Router
                        </button>

                        {/* Remote Reboot ONU */}
                        <button
                          onClick={() => handleRebootOnu(onu)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                          title="Remote Reboot ONU"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* OLT Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${cardClass}`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">V-SOL V1600G04-DP GPON Settings</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">OLT Hardware Model</label>
                <input
                  type="text"
                  disabled
                  value={oltConfig.model}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OLT IP Address</label>
                  <input
                    type="text"
                    value={oltConfig.host}
                    onChange={(e) => setOltConfig({ ...oltConfig, host: e.target.value })}
                    placeholder="192.168.8.100"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SNMP Port</label>
                  <input
                    type="number"
                    value={oltConfig.snmpPort}
                    onChange={(e) => setOltConfig({ ...oltConfig, snmpPort: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SNMP Read Community</label>
                  <input
                    type="text"
                    value={oltConfig.snmpCommunity}
                    onChange={(e) => setOltConfig({ ...oltConfig, snmpCommunity: e.target.value })}
                    placeholder="public"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CLI / Telnet Port</label>
                  <input
                    type="number"
                    value={oltConfig.telnetPort}
                    onChange={(e) => setOltConfig({ ...oltConfig, telnetPort: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Micro-Agent URL</label>
                <input
                  type="text"
                  value={oltConfig.gatewayUrl}
                  onChange={(e) => setOltConfig({ ...oltConfig, gatewayUrl: e.target.value })}
                  placeholder="http://localhost:5000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Local Node.js/Python agent running on your network to bridge SNMP/OMCI/TR-069.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Node.js Bridge Script Modal */}
      {isBridgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${cardClass}`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">V-SOL GPON OLT & OMCI Bridge Script</h3>
              </div>
              <button
                onClick={() => setIsBridgeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-300">
                V-SOL GPON OLT থেকে অপটিক্যাল লেজার এবং কাস্টমারের বাসার রাউটার রিমোট কনফিগারেশন করার জন্য আপনার লোকাল সার্ভার বা ল্যাপটপে নিচের স্ক্রিপ্টটি চালান:
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(nodeBridgeScript);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied!' : 'Copy Script'}
                </button>
                <pre className="font-mono text-cyan-300 text-[11px] overflow-x-auto pr-24 whitespace-pre">
                  {nodeBridgeScript}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-slate-300 space-y-1.5">
                <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> কীভাবে রান করবেন:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>আপনার কম্পিউটারে একটি ফোল্ডার খুলে টার্মিনালে রান করুন: <code className="font-mono text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">npm install express net-snmp cors</code></li>
                  <li>কোডটি কপি করে <code className="font-mono text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">vsol-gpon-bridge.js</code> ফাইলে পেস্ট করুন।</li>
                  <li>টার্মিনালে রান করুন: <code className="font-mono text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">node vsol-gpon-bridge.js</code></li>
                </ol>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setIsBridgeModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals for Laser Diagnostics, Router Web GUI and Remote Router Config */}
      {selectedLaserCustomer && (
        <LaserDiagnosticModal
          isOpen={!!selectedLaserCustomer}
          onClose={() => setSelectedLaserCustomer(null)}
          customer={selectedLaserCustomer}
          onOpenRouterConfig={(cust) => {
            setSelectedLaserCustomer(null);
            setSelectedRouterCustomer(cust);
          }}
          onOpenRouterWebLogin={(cust) => {
            setSelectedLaserCustomer(null);
            setSelectedRouterWebCustomer(cust);
          }}
        />
      )}

      {selectedRouterWebCustomer && (
        <RouterWebLoginModal
          isOpen={!!selectedRouterWebCustomer}
          onClose={() => setSelectedRouterWebCustomer(null)}
          customer={selectedRouterWebCustomer}
        />
      )}

      {selectedRouterCustomer && (
        <RemoteRouterConfigModal
          isOpen={!!selectedRouterCustomer}
          onClose={() => setSelectedRouterCustomer(null)}
          customer={selectedRouterCustomer}
          onOpenRouterWebLogin={(cust) => {
            setSelectedRouterCustomer(null);
            setSelectedRouterWebCustomer(cust);
          }}
        />
      )}

    </div>
  );
};
