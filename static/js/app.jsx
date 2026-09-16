// QuantumShield CyberDefense - Quantum-Inspired Cyber Threat Detection for Digital Signature Security
const { useState, useEffect, useRef, useCallback } = React;

function App() {
    // Navigation & View States
    const [activeTab, setActiveTab] = useState("dashboard");
    const [devDrawerOpen, setDevDrawerOpen] = useState(false);
    const [selectedNodeModal, setSelectedNodeModal] = useState(null);

    // Dynamic Noise Category State ("auto", "no_noise", "low_noise", "medium_noise", "high_noise")
    const [noiseCategory, setNoiseCategory] = useState("auto");

    // Digital Signature Security & Tampering States
    const [customMessage, setCustomMessage] = useState("Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized");
    const [tamperMessage, setTamperMessage] = useState(false);

    // Backend Simulation Parameters
    const [runs, setRuns] = useState(100);
    const [thresholdMode, setThresholdMode] = useState("adaptive");
    const [fixedThreshold, setFixedThreshold] = useState(0.11);
    const [noiseProbability, setNoiseProbability] = useState(0.05);
    const [eveEnabled, setEveEnabled] = useState(true);
    const [noiseEnabled, setNoiseEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(true);
    const [ts, setTs] = useState(Date.now());

    // Telemetry & Results
    const [telemetry, setTelemetry] = useState(null);
    const [liveStep, setLiveStep] = useState(null);
    const [activePipelineStep, setActivePipelineStep] = useState(0);

    // Fetch Simulation API
    const fetchSimulation = useCallback((overrides = {}) => {
        setIsLoading(true);
        const payload = {
            runs: overrides.runs !== undefined ? overrides.runs : runs,
            threshold_mode: overrides.thresholdMode !== undefined ? overrides.thresholdMode : thresholdMode,
            threshold: overrides.fixedThreshold !== undefined ? overrides.fixedThreshold : fixedThreshold,
            noise: overrides.noiseProbability !== undefined ? overrides.noiseProbability : noiseProbability,
            eve: overrides.eveEnabled !== undefined ? overrides.eveEnabled : eveEnabled,
            noise_enabled: overrides.noiseEnabled !== undefined ? overrides.noiseEnabled : noiseEnabled,
            custom_message: overrides.customMessage !== undefined ? overrides.customMessage : customMessage,
            tamper_message: overrides.tamperMessage !== undefined ? overrides.tamperMessage : tamperMessage
        };

        fetch("/api/simulation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                setTelemetry(data);
                setTs(Date.now());
            }
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Simulation API Error:", err);
            setIsLoading(false);
        });
    }, [runs, thresholdMode, fixedThreshold, noiseProbability, eveEnabled, noiseEnabled, customMessage, tamperMessage]);

    // Initial Load
    useEffect(() => {
        fetchSimulation();
    }, []);

    // Live Transmission Loop
    useEffect(() => {
        let interval;
        if (isTransmitting) {
            interval = setInterval(() => {
                setActivePipelineStep(prev => (prev + 1) % 6);

                fetch("/api/live_transmission", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        case_id: eveEnabled ? 3 : 1,
                        noise_level: noiseCategory,
                        eve_enabled: eveEnabled,
                        custom_message: customMessage,
                        tamper_message: tamperMessage
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === "success") {
                        setLiveStep(data);
                        setTelemetry(prev => ({
                            ...prev,
                            qber_percent: data.qber,
                            noise_probability: data.noise_probability,
                            adaptive_threshold_percent: data.adaptive_threshold,
                            effective_threshold: data.adaptive_threshold,
                            noise_category_info: data.noise_category_info || prev?.noise_category_info,
                            auto_regeneration: data.auto_regeneration,
                            digital_signature_info: data.digital_signature_info || prev?.digital_signature_info,
                            critical: Number(data.qber) > Number(data.adaptive_threshold),
                            session: {
                                ...prev?.session,
                                alice_bit: data.sample_qubit.alice_bit,
                                alice_basis: data.sample_qubit.alice_basis,
                                bob_basis: data.sample_qubit.bob_basis,
                                eve_basis: data.sample_qubit.eve_basis,
                                eve_enabled: data.sample_qubit.eve_enabled,
                                sifted_key_len: data.sifted_key_len,
                                ciphertext: data.ciphertext,
                                aes_status: data.aes_status,
                                auto_regeneration: data.auto_regeneration,
                                digital_signature_info: data.digital_signature_info
                            },
                            qubits_detail: data.qubits_detail || prev?.qubits_detail
                        }));
                    }
                })
                .catch(err => console.error("Live Transmission Error:", err));
            }, 700);
        }
        return () => clearInterval(interval);
    }, [isTransmitting, eveEnabled, noiseCategory, customMessage, tamperMessage]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation Header */}
            <HeaderBar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main SOC Dashboard Container */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                
                {/* 1. TOP TITLE BANNER & PRIMARY CTA BUTTON */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold font-mono px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE TRANSMISSION
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Channel ID: OPT-NODE-01</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                            {activeTab === "dashboard" && "Cyber Threat Detection & Digital Signature SOC"}
                            {activeTab === "simulation" && "Live Channel Telemetry & Qubit Stream"}
                            {activeTab === "result" && "Security Audit & Diagnostics Summary"}
                            {activeTab === "graphs" && "Analytics & Performance Hub"}
                            {activeTab === "circuit" && "Qiskit BB84 Quantum Circuit"}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Quantum Key Distribution (BB84) &amp; RSA-2048 Digital Signature Security for Payload Integrity &amp; Non-Repudiation.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsTransmitting(!isTransmitting)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-sm ${isTransmitting ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            <i className={`bi ${isTransmitting ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                            {isTransmitting ? 'Pause Transmission' : 'Start Transmission'}
                        </button>

                        <button
                            onClick={() => setDevDrawerOpen(!devDrawerOpen)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold"
                            title="Configure Simulation Controls"
                        >
                            <i className="bi bi-sliders"></i> Controls
                        </button>
                    </div>
                </div>

                {/* 2. CONFIGURATION DRAWER */}
                {devDrawerOpen && (
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                <i className="bi bi-sliders text-blue-400"></i> Simulation Parameters &amp; Attack Injector
                            </h3>
                            <button onClick={() => setDevDrawerOpen(false)} className="text-slate-400 hover:text-white text-xs">
                                <i className="bi bi-x-lg"></i> Close
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                            <div>
                                <label className="block text-slate-400 mb-1">Monte Carlo Runs</label>
                                <input 
                                    type="number" value={runs} onChange={e => setRuns(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Threshold Strategy</label>
                                <select 
                                    value={thresholdMode} onChange={e => setThresholdMode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="adaptive">Adaptive Threat Threshold</option>
                                    <option value="fixed">Fixed Baseline (11%)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Fixed Baseline (%)</label>
                                <input 
                                    type="number" step="0.01" value={fixedThreshold} onChange={e => setFixedThreshold(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Channel Noise Probability</label>
                                <input 
                                    type="number" step="0.01" value={noiseProbability} onChange={e => setNoiseProbability(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={eveEnabled} onChange={e => setEveEnabled(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="font-semibold text-rose-300">Inject Eve Intercept-Resend Attack</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={noiseEnabled} onChange={e => setNoiseEnabled(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="font-semibold text-slate-300">Enable Optical Noise Channel</span>
                            </label>

                            <button 
                                onClick={() => fetchSimulation()}
                                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
                            >
                                <i className="bi bi-play-fill"></i> Run Simulation
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. DIGITAL SIGNATURE SECURITY SECTION */}
                {(activeTab === "dashboard" || activeTab === "simulation" || activeTab === "result") && (
                    <DigitalSignatureSection
                        customMessage={customMessage}
                        setCustomMessage={setCustomMessage}
                        tamperMessage={tamperMessage}
                        setTamperMessage={setTamperMessage}
                        digitalSigInfo={telemetry?.digital_signature_info}
                        onRefresh={() => fetchSimulation()}
                    />
                )}

                {/* 4. SECURITY PIPELINE SECTION */}
                {(activeTab === "dashboard" || activeTab === "simulation") && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <i className="bi bi-diagram-3-fill text-blue-600"></i> End-to-End Digital Signature &amp; QKD Pipeline
                            </h2>
                            <span className="text-xs text-slate-500 font-mono">Active Stage Flow</span>
                        </div>
                        <HealthcarePipelineSection 
                            activeStep={activePipelineStep} 
                            isTransmitting={isTransmitting} 
                            onSelectNode={(node) => setSelectedNodeModal(node)}
                        />
                    </div>
                )}

                {/* 5. SOC DASHBOARD CORE CARDS */}
                {(activeTab === "dashboard" || activeTab === "simulation") && (
                    <SOCCoreCardsSection 
                        telemetry={telemetry} 
                        liveStep={liveStep}
                        isTransmitting={isTransmitting}
                        noiseCategory={noiseCategory}
                        setNoiseCategory={setNoiseCategory}
                        onFetchWithNoiseCategory={(cat) => {
                            setNoiseCategory(cat);
                            fetchSimulation();
                        }}
                    />
                )}

                {/* 6. REAL-TIME VISUALIZER */}
                {(activeTab === "dashboard" || activeTab === "simulation") && (
                    <RealTimeVisualizerSection 
                        telemetry={telemetry}
                        liveStep={liveStep}
                        isTransmitting={isTransmitting}
                        eveEnabled={eveEnabled}
                    />
                )}

                {/* 7. KEY DISCARD PROTOCOL PANEL */}
                {(telemetry?.auto_regeneration || telemetry?.session?.auto_regeneration) && (
                    <KeyDiscardInnovationPanel autoRegen={telemetry?.auto_regeneration || telemetry?.session?.auto_regeneration} />
                )}

                {/* QUBIT TELEMETRY LOG TABLE & EVENT LOG */}
                {(activeTab === "dashboard" || activeTab === "simulation" || activeTab === "result") && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8">
                            <TelemetryLogTableSection telemetry={telemetry} />
                        </div>
                        <div className="lg:col-span-4">
                            <SOCEventTimelineSection telemetry={telemetry} isTransmitting={isTransmitting} />
                        </div>
                    </div>
                )}

                {/* ANALYTICS HUB TAB */}
                {(activeTab === "dashboard" || activeTab === "graphs") && (
                    <AnalyticsGraphsHubSection telemetry={telemetry} ts={ts} />
                )}

                {/* BB84 QUANTUM CIRCUIT TAB */}
                {(activeTab === "dashboard" || activeTab === "circuit") && (
                    <BB84CircuitSection telemetry={telemetry} ts={ts} />
                )}

                {/* SECURITY REPORT TAB VIEW */}
                {activeTab === "result" && (
                    <div className="white-card p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                                    <i className="bi bi-file-earmark-text-fill text-emerald-600"></i> SOC Security Audit &amp; Diagnostic Summary
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Formal verification log confirming QKD key agreement and digital signature integrity.</p>
                            </div>
                            <a href="/download" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-md">
                                <i className="bi bi-download"></i> Export PDF Audit Report
                            </a>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                                <div className="text-slate-500 uppercase font-bold text-[10px]">Threat Classification</div>
                                <div className="text-base font-extrabold text-emerald-700">{telemetry?.ai_classification?.classification || "SECURE_CHANNEL"}</div>
                                <div className="text-[10px] text-slate-400">Confidence: {telemetry?.ai_classification?.confidence_percent || 99.0}%</div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                                <div className="text-slate-500 uppercase font-bold text-[10px]">Digital Signature Standard</div>
                                <div className="text-base font-extrabold text-indigo-700">RSA-2048 + SHA-256</div>
                                <div className="text-[10px] text-emerald-600 font-semibold">Non-Repudiation Verified</div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                                <div className="text-slate-500 uppercase font-bold text-[10px]">Payload Cipher Standard</div>
                                <div className="text-base font-extrabold text-slate-900">AES-256-GCM</div>
                                <div className="text-[10px] text-emerald-600">Authenticated Cipher</div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* PIPELINE NODE DETAIL MODAL */}
            {selectedNodeModal && (
                <NodeDetailModal node={selectedNodeModal} onClose={() => setSelectedNodeModal(null)} telemetry={telemetry} />
            )}
        </div>
    );
}

// 1. TOP HEADER BAR
function HeaderBar({ activeTab, setActiveTab }) {
    return (
        <header className="app-header px-6 py-3.5 flex items-center justify-between shadow-sm bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
                    <i className="bi bi-shield-lock-fill text-lg"></i>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-white tracking-tight">QuantumShield</span>
                    <span className="bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Cyber Defense SOC</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
                {[
                    { id: "dashboard", label: "SOC Dashboard", icon: "bi-speedometer2" },
                    { id: "simulation", label: "Live Telemetry", icon: "bi-activity" },
                    { id: "result", label: "Security Report", icon: "bi-file-text" },
                    { id: "graphs", label: "Analytics Hub", icon: "bi-graph-up-arrow" },
                    { id: "circuit", label: "Qiskit Circuit", icon: "bi-cpu" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === tab.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                    >
                        <i className={`bi ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </nav>

            <a href="/download" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-2 shadow-sm">
                <i className="bi bi-file-earmark-pdf"></i> Download PDF
            </a>
        </header>
    );
}

// DIGITAL SIGNATURE SECURITY SECTION
function DigitalSignatureSection({ customMessage, setCustomMessage, tamperMessage, setTamperMessage, digitalSigInfo, onRefresh }) {
    const isTampered = tamperMessage || (digitalSigInfo && digitalSigInfo.tampered);
    const isValid = digitalSigInfo ? digitalSigInfo.signature_valid : true;

    return (
        <div className="white-card border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        <i className="bi bi-pen-fill text-indigo-600 text-lg"></i> Digital Signature &amp; Payload Integrity Module
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        RSA-2048 + SHA-256 Signature Verification Layer. Validates payload integrity and sender authenticity before and after QKD key agreement.
                    </p>
                </div>

                {/* STATUS BADGE */}
                <div className="flex items-center gap-2">
                    {isTampered || !isValid ? (
                        <span className="bg-rose-600 text-white font-mono text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                            <i className="bi bi-x-circle-fill"></i> ✗ SIGNATURE INVALID — PAYLOAD REJECTED
                        </span>
                    ) : (
                        <span className="bg-emerald-600 text-white font-mono text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                            <i className="bi bi-check-circle-fill"></i> ✓ SIGNATURE VERIFIED — PAYLOAD ACCEPTED
                        </span>
                    )}
                </div>
            </div>

            {/* MESSAGE INPUT & ACTION CONTROLS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Sender Transaction Payload:
                    </label>
                    <textarea
                        rows="2"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        placeholder="Enter payload string..."
                    />

                    {/* BUTTON CONTROLS */}
                    <div className="flex flex-wrap gap-2.5">
                        <button
                            onClick={() => { setTamperMessage(false); onRefresh(); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                        >
                            <i className="bi bi-key-fill"></i> 🔐 Sign Payload
                        </button>

                        <button
                            onClick={() => { setTamperMessage(!tamperMessage); onRefresh(); }}
                            className={`font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm ${tamperMessage ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                        >
                            <i className="bi bi-exclamation-triangle-fill"></i> {tamperMessage ? '⚠️ Tampering Active (Click to Revert)' : '⚠️ Simulate Payload Tampering'}
                        </button>

                        <button
                            onClick={() => onRefresh()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                        >
                            <i className="bi bi-shield-check"></i> ✔ Run Verification
                        </button>
                    </div>
                </div>

                {/* DETAILS DISPLAY GRID */}
                <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-slate-600 font-semibold text-[11px]">Digital Signature (RSA-2048 PSS):</span>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">SHA-256</span>
                    </div>

                    <div className="bg-slate-950 text-slate-200 p-2.5 rounded-lg text-[10px] break-all">
                        {digitalSigInfo?.signature_sample || "a8f3b2...[RSA-2048 SHA-256 SIGNATURE]"}
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Payload Status:</span>
                            <span className={isTampered ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>
                                {isTampered ? "MODIFIED IN TRANSIT" : "INTACT & AUTHENTIC"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Signature Verification:</span>
                            <span className={isValid && !isTampered ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                                {isValid && !isTampered ? "VERIFIED (100% MATCH)" : "FAILED (HASH MISMATCH)"}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5">
                            <span className="text-slate-500">Receiver Action:</span>
                            <span className={isValid && !isTampered ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                                {isValid && !isTampered ? "PAYLOAD ACCEPTED" : "PAYLOAD REJECTED"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 2. SOC DASHBOARD CORE CARDS SECTION
function SOCCoreCardsSection({ telemetry, liveStep, isTransmitting, noiseCategory, setNoiseCategory, onFetchWithNoiseCategory }) {
    const qberVal = telemetry ? (liveStep ? liveStep.qber : telemetry.qber_percent) : 0;
    const adaptiveThresholdVal = telemetry ? (liveStep ? liveStep.adaptive_threshold : telemetry.adaptive_threshold_percent) : 11.0;
    const isCompromised = Number(qberVal) > Number(adaptiveThresholdVal);
    const eveEnabled = liveStep ? liveStep.eve_enabled : (telemetry ? telemetry.eve_enabled : true);

    const noiseInfo = liveStep?.noise_category_info || telemetry?.noise_category_info || {
        category: "LOW_NOISE",
        label: "Low Noise",
        badge_color: "bg-blue-600 text-white",
        description: "Minimal thermal fiber attenuation. Threshold adjusted."
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* CARD 1: LIVE OBSERVED QBER MONITOR */}
            <div className="white-card p-6 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Quantum Bit Error Rate (QBER)
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${isCompromised ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isCompromised ? 'ELEVATED' : 'NORMAL'}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold font-mono tracking-tight ${isCompromised ? 'text-rose-600' : 'text-slate-900'}`}>
                        {qberVal}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Qubit Error</span>
                </div>
                <p className="text-xs text-slate-500">
                    Observed disturbance on single-photon optical channel.
                </p>
            </div>

            {/* CARD 2: CHANNEL NOISE BASELINE */}
            <div className="white-card p-6 space-y-3 border border-slate-200">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-reception-4 text-blue-600"></i> Channel Noise Baseline
                    </span>
                    <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${noiseInfo.badge_color}`}>
                        {noiseInfo.label}
                    </span>
                </div>

                <p className="text-xs text-slate-600">
                    {noiseInfo.description}
                </p>

                {/* NOISE LEVEL SELECTOR CONTROL */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                        { id: "auto", label: "Auto" },
                        { id: "no_noise", label: "0% Noise" },
                        { id: "low_noise", label: "8% Low" },
                        { id: "medium_noise", label: "18% Med" },
                        { id: "high_noise", label: "30% High" }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => onFetchWithNoiseCategory(btn.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition ${noiseCategory === btn.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CARD 3: ADAPTIVE THREAT THRESHOLD */}
            <div className="white-card p-6 space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Adaptive Threat Threshold
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        Noise Calibrated
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold font-mono text-purple-600 tracking-tight">
                        {adaptiveThresholdVal}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Fixed: 11.0%</span>
                </div>
                <p className="text-xs text-slate-500">
                    Formula: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono text-[11px]">max(11%, Noise + 5%)</code>
                </p>
            </div>

            {/* CARD 4: STATISTICAL CLASSIFIER */}
            <div className="white-card p-6 space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Statistical Threat Classification
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        Gaussian Likelihood
                    </span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                    {telemetry?.ai_classification?.classification || (isCompromised ? "EAVESDROPPER_ATTACK" : "SECURE_CHANNEL")}
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                    <span>Confidence Level:</span>
                    <span className="font-bold text-emerald-600 font-mono">{telemetry?.ai_classification?.confidence_percent || 99.0}%</span>
                </div>
            </div>

            {/* CARD 5: AES-256 CIPHER STATE */}
            <div className="white-card p-6 space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        AES-256 Cipher State
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${telemetry?.session?.aes_status === 'ENCRYPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {telemetry?.session?.aes_status || 'ENCRYPTED'}
                    </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-800 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {telemetry?.session?.ciphertext || 'a7f3b9c2...[AES-256]'}
                </div>
                <p className="text-xs text-slate-500">
                    Encrypted payload using sifted QKD key.
                </p>
            </div>

            {/* CARD 6: THREAT STATUS */}
            <div className={`white-card p-6 space-y-3 border ${isCompromised ? (eveEnabled ? 'border-rose-300 bg-rose-50/30' : 'border-amber-300 bg-amber-50/30') : 'border-emerald-200 bg-emerald-50/20'}`}>
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Threat Detection Status
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${isCompromised ? (eveEnabled ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') : 'bg-emerald-600 text-white'}`}>
                        {isCompromised ? (eveEnabled ? 'EAVESDROPPER DETECTED' : 'HIGH NOISE BASELINE') : 'CHANNEL SECURE'}
                    </span>
                </div>

                <div className="space-y-1">
                    <div className="text-base font-extrabold text-slate-900">
                        {isCompromised ? (eveEnabled ? 'Eve Intercept Attack Detected' : 'Elevated Thermal Noise') : 'Channel Secure & Authenticated'}
                    </div>
                    <p className="text-xs text-slate-600">
                        {isCompromised ? (eveEnabled ? 'QBER exceeded adaptive threshold. Compromised key material discarded.' : 'Noise baseline elevated. Adaptive threshold adjusted.') : 'No eavesdropping detected. QKD key approved.'}
                    </p>
                </div>
            </div>

        </div>
    );
}

// 3. PIPELINE SECTION
function HealthcarePipelineSection({ activeStep, isTransmitting, onSelectNode }) {
    const nodes = [
        {
            id: 1,
            title: "Sender Security Terminal",
            subtitle: "Enterprise Client Gateway",
            icon: "bi-shield-shaded",
            color: "border-slate-300 bg-slate-50 text-slate-700",
            status: "Payload Active",
            ip: "192.168.10.104",
            details: "Generates authenticated digital transaction payloads & confidential records for secure transit."
        },
        {
            id: 2,
            title: "Digital Signature Engine",
            subtitle: "RSA-2048 SHA-256",
            icon: "bi-pen-fill",
            color: "border-indigo-300 bg-indigo-50 text-indigo-600",
            status: "Signature Created",
            ip: "RSA-PSS-CORE",
            details: "Generates RSA-2048 Base64 signature with SHA-256 hash digest to guarantee payload non-repudiation."
        },
        {
            id: 3,
            title: "BB84 Key Exchange",
            subtitle: "Single-Photon QKD",
            icon: "bi-key-fill",
            color: "border-emerald-300 bg-emerald-50 text-emerald-600",
            status: "Qubit Polarization Sifting",
            ip: "QKD-OPTICAL-01",
            details: "Generates quantum key candidate via single-photon polarizations in rectilinear & diagonal bases."
        },
        {
            id: 4,
            title: "Adaptive Threat Evaluator",
            subtitle: "QBER Anomaly Classifier",
            icon: "bi-cpu-fill",
            color: "border-purple-300 bg-purple-50 text-purple-600",
            status: "Anomaly Classification",
            ip: "ADAPTIVE-ENGINE-V2",
            details: "Differentiates environmental noise from Eve intercept attacks and computes dynamic security threshold."
        },
        {
            id: 5,
            title: "AES-256 Payload Cipher",
            subtitle: "GCM Payload Cipher",
            icon: "bi-lock-fill",
            color: "border-teal-300 bg-teal-50 text-teal-600",
            status: "GCM Encryption",
            ip: "AES-CRYPTO-CORE",
            details: "Encrypts confidential payload data with 256-bit quantum-sifted key."
        },
        {
            id: 6,
            title: "Secure Enterprise Vault",
            subtitle: "Automatic Receiver Verification",
            icon: "bi-cloud-check-fill",
            color: "border-blue-300 bg-blue-50 text-blue-600",
            status: "Signature Verified",
            ip: "CLOUD-VAULT-AZ",
            details: "Decrypts payload and automatically verifies RSA-2048 digital signature before committing transaction data to secure vault."
        }
    ];

    return (
        <div className="white-card p-6 relative overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                {nodes.map((node, index) => {
                    const isCurrent = isTransmitting && (activeStep === index);
                    const isDone = activeStep > index;

                    return (
                        <div
                            key={node.id}
                            onClick={() => onSelectNode(node)}
                            className={`cursor-pointer white-card p-4 text-center space-y-2 border transition-all duration-200 ${isCurrent ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'hover:border-slate-300'}`}
                        >
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                <span>STAGE 0{node.id}</span>
                                {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                            </div>

                            <div className={`w-10 h-10 mx-auto rounded-xl border flex items-center justify-center text-lg shadow-sm ${node.color}`}>
                                <i className={`bi ${node.icon}`}></i>
                            </div>

                            <div>
                                <div className="font-extrabold text-xs text-slate-900 truncate">{node.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono truncate">{node.subtitle}</div>
                            </div>

                            <div className="pt-1 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] font-mono">
                                <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                <span className="text-slate-600 truncate">{node.status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 6. REAL-TIME QUANTUM COMMUNICATION VISUALIZER
function RealTimeVisualizerSection({ telemetry, liveStep, isTransmitting, eveEnabled }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let pPos = 0;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        function drawLaser() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const midY = canvas.height / 2;

            ctx.beginPath();
            ctx.moveTo(10, midY);
            ctx.lineTo(canvas.width - 10, midY);
            ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();

            if (isTransmitting) {
                pPos = (pPos + 5) % (canvas.width - 20);
                ctx.beginPath();
                ctx.arc(pPos + 10, midY, 5, 0, Math.PI * 2);
                ctx.fillStyle = "#10B981";
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(drawLaser);
        }

        drawLaser();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isTransmitting]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200">
                    <i className="bi bi-broadcast text-blue-400"></i> Quantum Optical Channel Visualizer
                </h3>
                <span className="text-xs text-slate-400 font-mono">Alice → Eve → Bob Single-Photon Path</span>
            </div>

            <div className="h-8 w-full relative">
                <canvas ref={canvasRef} className="w-full h-full"></canvas>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-slate-950/90 border border-slate-800 text-blue-400 text-[10px] font-mono font-semibold px-3 py-0.5 rounded-full">
                        {isTransmitting ? 'Optical Link Transmitting' : 'Optical Link Idle'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 text-white space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/30 text-blue-400 p-2.5 rounded-lg text-lg"><i className="bi bi-shield-shaded"></i></div>
                        <div>
                            <div className="font-bold text-sm">Alice (Sender Terminal)</div>
                            <div className="text-xs text-slate-300 font-mono">
                                {liveStep ? `Bit: ${liveStep.sample_qubit.alice_bit} | Basis: ${liveStep.sample_qubit.alice_basis}` : 'State: Ready'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 text-white space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-600/30 text-rose-400 p-2.5 rounded-lg text-lg"><i className="bi bi-bug-fill"></i></div>
                        <div>
                            <div className="font-bold text-sm">Eve (Interceptor)</div>
                            <div className="text-xs text-slate-300 font-mono">
                                {liveStep ? `Basis: ${liveStep.sample_qubit.eve_basis}` : (eveEnabled ? 'Active Intercept-Resend' : 'Passive Channel')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 text-white space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-600/30 text-emerald-400 p-2.5 rounded-lg text-lg"><i className="bi bi-cloud-check-fill"></i></div>
                        <div>
                            <div className="font-bold text-sm">Bob (Receiver Vault)</div>
                            <div className="text-xs text-slate-300 font-mono">
                                {liveStep ? `Basis: ${liveStep.sample_qubit.bob_basis}` : 'State: Ready'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 7. KEY DISCARD PROTOCOL PANEL
function KeyDiscardInnovationPanel({ autoRegen }) {
    return (
        <div className="white-card border border-indigo-200 bg-indigo-50/30 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-100 pb-3">
                <h3 className="font-bold text-indigo-950 text-sm uppercase tracking-wider flex items-center gap-2">
                    <i className="bi bi-arrow-repeat text-indigo-600 text-lg"></i> Key Discard &amp; Automatic Re-Alignment Protocol
                </h3>
                <span className="bg-indigo-600 text-white font-mono text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Safety Protocol Triggered
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-x-circle-fill text-rose-600"></i> Step 1: Compromised Key Discarded
                    </div>
                    <div className="text-xs text-slate-700 space-y-1 font-mono">
                        <div>Observed QBER: <strong className="text-rose-700">{autoRegen.original_qber_percent}%</strong></div>
                        <div>Adaptive Threshold: <strong className="text-slate-900">{autoRegen.threshold_percent}%</strong></div>
                        <div>Action: <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold">KEY DISCARDED</span></div>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-check-circle-fill text-emerald-600"></i> Step 2: Auto-Regenerated Clean Key
                    </div>
                    <div className="text-xs text-slate-700 space-y-1 font-mono">
                        <div>Regenerated QBER: <strong className="text-emerald-700">{autoRegen.regenerated_qber_percent}%</strong></div>
                        <div>Fresh Key Sample: <strong className="text-slate-900">{autoRegen.regenerated_key_sample}...</strong></div>
                        <div>AES Status: <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">ENCRYPTED</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs flex items-start gap-2.5">
                <i className="bi bi-info-circle-fill text-blue-400 text-base mt-0.5"></i>
                <div>
                    <strong className="text-white">Protocol Summary:</strong> {autoRegen.action_summary}
                </div>
            </div>
        </div>
    );
}

// 8. TELEMETRY LOG TABLE
function TelemetryLogTableSection({ telemetry }) {
    const sampleRows = [
        { qubit: 1, aliceBit: 0, aliceBasis: "X", state: "|+>", eveBasis: "X", eveBit: 0, bobBasis: "Z", bobBit: 1, sifted: "× Discarded", isSifted: false, qberError: "-" },
        { qubit: 2, aliceBit: 1, aliceBasis: "X", state: "|->", eveBasis: "Z", eveBit: 0, bobBasis: "X", bobBit: 0, sifted: "✔ Matched", isSifted: true, qberError: "ERROR", isError: true },
        { qubit: 3, aliceBit: 0, aliceBasis: "X", state: "|+>", eveBasis: "X", eveBit: 0, bobBasis: "X", bobBit: 0, sifted: "✔ Matched", isSifted: true, qberError: "Valid", isError: false },
        { qubit: 4, aliceBit: 0, aliceBasis: "X", state: "|+>", eveBasis: "Z", eveBit: 1, bobBasis: "X", bobBit: 1, sifted: "✔ Matched", isSifted: true, qberError: "ERROR", isError: true }
    ];

    const rows = (telemetry && telemetry.qubits_detail && telemetry.qubits_detail.length > 0)
        ? telemetry.qubits_detail
        : sampleRows;

    return (
        <div className="white-card space-y-4 p-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-list-task text-blue-600"></i> Qubit Polarization &amp; Measurement Telemetry Log
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left telemetry-table">
                    <thead>
                        <tr>
                            <th>QUBIT #</th>
                            <th>ALICE BIT</th>
                            <th>ALICE BASIS</th>
                            <th>STATE</th>
                            <th>EVE BASIS</th>
                            <th>EVE BIT</th>
                            <th>BOB BASIS</th>
                            <th>BOB BIT</th>
                            <th>SIFTED MATCH</th>
                            <th>QBER ERROR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr key={r.qubit || idx} className="hover:bg-slate-50/80 transition">
                                <td className="font-bold text-slate-800">#{r.qubit || idx + 1}</td>
                                <td>
                                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${r.aliceBit === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {r.aliceBit}
                                    </span>
                                </td>
                                <td className="font-mono text-slate-600">{r.aliceBasis}</td>
                                <td className="font-mono text-cyan-600 font-bold">{r.state}</td>
                                <td className="font-mono text-slate-600">{r.eveBasis}</td>
                                <td>
                                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 text-rose-700">
                                        {r.eveBit}
                                    </span>
                                </td>
                                <td className="font-mono text-slate-600">{r.bobBasis}</td>
                                <td>
                                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-100 text-blue-700">
                                        {r.bobBit}
                                    </span>
                                </td>
                                <td>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs whitespace-nowrap ${r.isSifted ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white'}`}>
                                        <span>{r.isSifted ? 'Matched' : 'Discarded'}</span>
                                    </span>
                                </td>
                                <td>
                                    {r.qberError === '-' ? (
                                        <span className="text-slate-400 font-mono">-</span>
                                    ) : r.isError ? (
                                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-600 text-white">ERROR</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded font-semibold text-xs border border-emerald-500 text-emerald-700 bg-emerald-50">Valid</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// 9. EVENT AUDIT LOG
function SOCEventTimelineSection({ telemetry, isTransmitting }) {
    const events = [
        { time: "12:00:01", title: "Digital Signature Created", desc: "RSA-2048 payload signed via SHA-256", type: "info" },
        { time: "12:00:03", title: "Quantum Channel Established", desc: "Single-photon optical link active", type: "info" },
        { time: "12:00:05", title: "Noise Baseline Estimated", desc: "Channel noise measured at 5.0%", type: "info" },
        { time: "12:00:06", title: "Adaptive Threshold Updated", desc: "Formula applied: max(11%, Noise + 5%)", type: "success" },
        { time: "12:00:08", title: "BB84 Key Generated & Sifted", desc: "Matched basis bits extracted", type: "success" },
        { time: "12:00:10", title: "AES-256 Encryption Active", desc: "Transaction payload encrypted", type: "success" },
        { time: "12:00:12", title: "Digital Signature Verified", desc: "Receiver verified RSA signature", type: "success" }
    ];

    return (
        <div className="white-card p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <i className="bi bi-clock-history text-indigo-600"></i> Event Audit Log
            </h3>

            <div className="space-y-3 font-mono text-xs relative pl-4 border-l-2 border-slate-200">
                {events.map((ev, i) => (
                    <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white"></span>
                        <div className="text-[10px] text-slate-400 font-bold">{ev.time}</div>
                        <div className="font-bold text-slate-800">{ev.title}</div>
                        <div className="text-[11px] text-slate-500 font-sans">{ev.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 10. ANALYTICS & GRAPHS HUB
function AnalyticsGraphsHubSection({ telemetry, ts }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <i className="bi bi-graph-up-arrow text-blue-600"></i> Analytics &amp; Telemetry Hub
                    </h2>
                    <p className="text-slate-500 text-sm">
                        QBER trend analysis and adaptive threshold comparison for simulation runs.
                    </p>
                </div>
                <a href="/download" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow-sm">
                    <i className="bi bi-download"></i> Download Report
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 white-card p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                            <i className="bi bi-activity text-blue-600"></i> Observed QBER vs. Adaptive Threshold (Scenario Benchmark)
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">Average QBER: {telemetry?.qber_percent || 21.83}%</span>
                    </div>

                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-2">
                        <img src={`/static/images/qber_threshold.png?t=${ts}`} alt="QBER Trend Chart" className="max-h-full object-contain" />
                    </div>
                </div>

                <div className="lg:col-span-4 white-card p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                            <i className="bi bi-bar-chart-line-fill text-emerald-600"></i> Fixed vs. Adaptive Reliability
                        </h3>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-mono font-bold px-2 py-0.5 rounded">0.0% FP</span>
                    </div>

                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-2">
                        <img src={`/static/images/performance_metrics.png?t=${ts}`} alt="Performance Comparison Metrics" className="max-h-full object-contain" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="white-card p-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                        <i className="bi bi-bar-chart-fill text-blue-600"></i> QBER Distribution Histogram
                    </h3>
                    <div className="h-56 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-2">
                        <img src={`/static/images/qber_histogram.png?t=${ts}`} alt="QBER Histogram" className="max-h-full object-contain" />
                    </div>
                </div>

                <div className="white-card p-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                        <i className="bi bi-pie-chart-fill text-emerald-600"></i> Security Decision Ratio
                    </h3>
                    <div className="h-56 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-2">
                        <img src={`/static/images/security_status.png?t=${ts}`} alt="Security Ratio" className="max-h-full object-contain" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// 11. BB84 QUANTUM CIRCUIT SECTION
function BB84CircuitSection({ telemetry, ts }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <i className="bi bi-cpu text-blue-600"></i> Qiskit BB84 Quantum Circuit Architecture
                    </h2>
                    <p className="text-slate-500 text-sm">
                        Single-photon quantum state preparation, basis transformation (Hadamard H gate), and projective measurement circuit.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 white-card p-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="bi bi-diagram-3-fill text-blue-600"></i> Qiskit BB84 Quantum Circuit Diagram
                    </h3>

                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                        <img src={`/static/images/bb84_circuit.png?t=${ts}`} alt="BB84 Circuit Diagram" className="max-h-full object-contain" onError={e => {
                            e.target.onerror = null;
                            e.target.parentElement.innerHTML = '<div className="text-slate-500 font-mono text-xs">q0: ──[X]──[H]──[H]──░──[M]──<br/>c0: ══════════════════╩══</div>';
                        }} />
                    </div>
                </div>

                <div className="lg:col-span-4 white-card p-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">Quantum Gate Operations</h3>
                    <div className="space-y-2.5 font-mono text-xs text-slate-700">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between"><span>Alice State Prep:</span> <span className="font-bold text-emerald-600">|0&gt; / X Gate</span></div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between"><span>Basis Gate (X Basis):</span> <span className="font-bold text-purple-600">Hadamard (H)</span></div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between"><span>Eve Interception:</span> <span className="font-bold text-rose-600">Measure &amp; Resend</span></div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between"><span>Bob Basis Prep:</span> <span className="font-bold text-blue-600">Hadamard (H)</span></div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between"><span>Measurement:</span> <span className="font-bold text-slate-900">Z / X Basis</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 12. PIPELINE NODE DETAIL MODAL
function NodeDetailModal({ node, onClose, telemetry }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="white-card max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border ${node.color} text-xl`}>
                            <i className={`bi ${node.icon}`}></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900">{node.title}</h3>
                            <div className="text-xs font-mono text-slate-500">{node.subtitle} • {node.ip}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="space-y-3 text-xs text-slate-700 font-sans">
                    <p className="leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {node.details}
                    </p>

                    <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Node Status:</span>
                            <span className="font-bold text-emerald-600">ONLINE &amp; SECURE</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Protocol:</span>
                            <span className="font-bold text-slate-800">RSA-2048 + BB84 QKD + AES-256</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-slate-500">Signature Certificate:</span>
                            <span className="font-bold text-indigo-600">VALID (RSA SHA-256)</span>
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
