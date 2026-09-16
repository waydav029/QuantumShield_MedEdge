document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================
       1. INTERACTIVE PARTICLE CANVAS BACKGROUND
    ========================================================== */
    const canvas = document.getElementById("particleCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let particles = [];
        const numParticles = 45;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.radius = Math.random() * 2 + 1;
                this.color = Math.random() > 0.5 ? "#00e5ff" : "#8b5cf6";
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 229, 255, ${1 - dist / 130})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    /* ==========================================================
       2. REAL-TIME ANIMATED ECG HEARTBEAT WAVEFORM CANVAS
    ========================================================== */
    const ecgCanvas = document.getElementById("ecgCanvas");
    if (ecgCanvas) {
        const ecgCtx = ecgCanvas.getContext("2d");
        let xOffset = 0;
        const speed = 2.5;

        function resizeECG() {
            ecgCanvas.width = ecgCanvas.parentElement.clientWidth;
            ecgCanvas.height = 120;
        }
        resizeECG();
        window.addEventListener("resize", resizeECG);

        function getECGY(x) {
            const h = ecgCanvas.height;
            const mid = h / 2;
            const period = 200;
            const pos = x % period;

            // Simulated P-QRS-T ECG complex
            if (pos > 70 && pos < 80) return mid - 8;                     // P Wave
            if (pos >= 80 && pos < 85) return mid + 4;                    // Q Dip
            if (pos >= 85 && pos < 95) return mid - (mid * 0.75);         // R Peak (Tall)
            if (pos >= 95 && pos < 100) return mid + 12;                  // S Dip
            if (pos >= 110 && pos < 130) return mid - 12;                 // T Wave
            return mid + (Math.sin(x * 0.05) * 1.5);                      // Baseline noise
        }

        function animateECG() {
            ecgCtx.fillStyle = "rgba(4, 8, 18, 0.2)";
            ecgCtx.fillRect(0, 0, ecgCanvas.width, ecgCanvas.height);

            ecgCtx.beginPath();
            ecgCtx.strokeStyle = "#10b981";
            ecgCtx.lineWidth = 2.2;
            ecgCtx.shadowBlur = 12;
            ecgCtx.shadowColor = "#10b981";

            for (let px = 0; px < ecgCanvas.width; px++) {
                const py = getECGY(px + xOffset);
                if (px === 0) ecgCtx.moveTo(px, py);
                else ecgCtx.lineTo(px, py);
            }

            ecgCtx.stroke();
            ecgCtx.shadowBlur = 0;

            xOffset += speed;
            requestAnimationFrame(animateECG);
        }
        animateECG();
    }

    /* ==========================================================
       3. ARCHITECTURE PIPELINE NODE MODAL HANDLER
    ========================================================== */
    window.openNodeModal = function(title, description) {
        const modalTitle = document.getElementById("nodeModalTitle");
        const modalBody = document.getElementById("nodeModalBody");
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.textContent = description;

        const modalEl = document.getElementById("nodeDetailModal");
        if (modalEl && window.bootstrap) {
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        }
    };

    /* ==========================================================
       4. ANIMATED COUNTERS
    ========================================================== */
    function animateCounter(element) {
        const target = parseFloat(element.textContent.replace(/[^0-9.]/g, ""));
        if (isNaN(target)) return;

        let current = 0;
        const duration = 1200;
        const increment = target / (duration / 20);

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            if (element.textContent.includes("%")) {
                element.textContent = current.toFixed(1) + "%";
            } else if (element.textContent.includes(",")) {
                element.textContent = Math.round(current).toLocaleString();
            } else {
                element.textContent = Math.round(current);
            }
        }, 20);
    }

    document.querySelectorAll(".counter-val").forEach(el => animateCounter(el));

    /* ==========================================================
       5. LIVE STEP TRANSMISSION ANIMATION & API FETCH
    ========================================================== */
    const triggerFlowBtn = document.getElementById("triggerFlowBtn");
    const liveTransmissionBtn = document.getElementById("liveTransmissionBtn");
    const flowDot = document.getElementById("flowPhotonDot");

    function runTransmissionAnimation() {
        if (!flowDot) return;
        
        flowDot.style.transition = "none";
        flowDot.style.left = "0%";
        flowDot.style.opacity = "1";

        setTimeout(() => {
            flowDot.style.transition = "left 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-in-out";
            flowDot.style.left = "92%";
        }, 80);

        const activeCaseInput = document.querySelector("input[name='active_case']");
        const caseId = activeCaseInput ? activeCaseInput.value : 1;

        fetch("/api/live_transmission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ case_id: caseId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                const sample = data.sample_qubit;
                
                const aliceBit = document.getElementById("flowAliceBit");
                const aliceBasis = document.getElementById("flowAliceBasis");
                const bobBasis = document.getElementById("flowBobBasis");
                const eveBasis = document.getElementById("flowEveBasis");

                if (aliceBit) aliceBit.textContent = sample.alice_bit;
                if (aliceBasis) aliceBasis.textContent = sample.alice_basis;
                if (bobBasis) bobBasis.textContent = sample.bob_basis;
                if (eveBasis && sample.eve_enabled) eveBasis.textContent = sample.eve_basis;

                // Log to terminal HUD
                addTerminalLog(`[LIVE_STEP] Qubit #${sample.index} transmitted. Alice (${sample.alice_bit}, ${sample.alice_basis}) -> Bob (${sample.bob_basis}). Key Status: ${data.key_accepted_adaptive ? 'ACCEPTED' : 'REJECTED'}`);
            }
        })
        .catch(err => console.error("Error running transmission:", err));
    }

    if (triggerFlowBtn) triggerFlowBtn.addEventListener("click", runTransmissionAnimation);
    if (liveTransmissionBtn) liveTransmissionBtn.addEventListener("click", runTransmissionAnimation);

    /* ==========================================================
       6. CYBER TERMINAL LOG SIMULATOR
    ========================================================== */
    const terminalHud = document.getElementById("terminalHud");
    function addTerminalLog(message) {
        if (!terminalHud) return;
        const now = new Date();
        const timestamp = now.toTimeString().split(" ")[0];
        
        const line = document.createElement("div");
        line.className = "terminal-line";
        line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ${message}`;
        terminalHud.appendChild(line);
        terminalHud.scrollTop = terminalHud.scrollHeight;
    }

    // Auto-stream realistic security log entries
    const logMessages = [
        "<span class=\"terminal-prefix\">[TELEMETRY]</span> Edge MedDevice #348 streaming ECG waveform (500Hz).",
        "<span class=\"terminal-prefix\">[BB84_ENTANGLE]</span> Quantum state preparation initialized on channel A-1.",
        "<span class=\"terminal-prefix\">[AI_PROFILER]</span> Evaluating background decoherence and photon loss rate.",
        "<span class=\"terminal-prefix\">[CRYPTO_AES]</span> 256-bit AES-GCM session key refreshed.",
        "<span class=\"terminal-prefix\">[HEALTH_CHECK]</span> All 6 architecture pipeline nodes reporting OPTIMAL."
    ];

    let logIdx = 0;
    setInterval(() => {
        if (logMessages[logIdx]) {
            addTerminalLog(logMessages[logIdx]);
            logIdx = (logIdx + 1) % logMessages.length;
        }
    }, 6000);

    /* ==========================================================
       7. HERO QUICK ACTION BUTTONS
    ========================================================== */
    const heroLaunchBtn = document.getElementById("heroLaunchBtn");
    const heroGenerateKeyBtn = document.getElementById("heroGenerateKeyBtn");

    if (heroLaunchBtn) {
        heroLaunchBtn.addEventListener("click", () => {
            const flowSec = document.getElementById("flowSection");
            if (flowSec) flowSec.scrollIntoView({ behavior: "smooth" });
            runTransmissionAnimation();
        });
    }

    if (heroGenerateKeyBtn) {
        heroGenerateKeyBtn.addEventListener("click", () => {
            const runBtn = document.getElementById("runBtn");
            if (runBtn) runBtn.click();
        });
    }

    /* ==========================================================
       8. LIVE UTC CLOCK
    ========================================================== */
    function updateClock() {
        const clock = document.getElementById("liveClock");
        if (clock) {
            const now = new Date();
            clock.textContent = now.toUTCString().split(" ")[4] + " UTC";
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
});
