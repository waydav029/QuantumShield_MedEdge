import os
import sys
import random
import base64
import hashlib
import json

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, render_template, request, send_file, jsonify

from quantum.simulation import Simulation
from quantum.metrics import Metrics
from quantum.graphs import Graphs
from quantum.report import Report
from quantum.circuit import generate_bb84_circuit
from quantum.aes_crypto import AESCrypto
from quantum.demo_transport import DemoTransport
from quantum.digital_signature import DigitalSignature

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)


def run_simulation_logic(params):
    active_case = int(params.get("active_case", 1))
    total_runs = int(params.get("runs", 100))
    threshold_mode = params.get("threshold_mode", "adaptive")
    threshold = float(params.get("threshold", 0.11))
    noise_probability = float(params.get("noise", 0.05))
    eve_enabled = params.get("eve", False)
    noise_enabled = params.get("noise_enabled", False)
    custom_message = params.get("custom_message", "Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized")
    tamper_message = params.get("tamper_message", False)

    case_info = Simulation.get_case_parameters(active_case)

    # Check if explicitly running a specific case or multi-scenario benchmark
    if "scenario_case" in params:
        active_case = int(params["scenario_case"])
        case_info = Simulation.get_case_parameters(active_case)
        eve_enabled = case_info["eve_enabled"]
        noise_enabled = case_info["noise_enabled"]
        noise_probability = case_info["noise_probability"]
        tamper_message = case_info.get("tamper_message", False)

    simulation = Simulation(
        n_bits=32,
        eve_enabled=eve_enabled,
        noise_enabled=noise_enabled,
        noise_probability=noise_probability,
        custom_message=custom_message,
        tamper_message=tamper_message
    )

    metrics = Metrics()
    graphs = Graphs(base_dir=BASE_DIR)
    report = Report(base_dir=BASE_DIR)

    qber_values = []

    # If running a multi-run Monte Carlo simulation without forced parameters, evaluate across the 4 scenarios
    if total_runs >= 4 and "scenario_case" not in params and "eve" not in params:
        block_size = total_runs // 4
        for case_id in range(1, 5):
            c_params = Simulation.get_case_parameters(case_id)
            c_sim = Simulation(
                n_bits=32,
                eve_enabled=c_params["eve_enabled"],
                noise_enabled=c_params["noise_enabled"],
                noise_probability=c_params["noise_probability"],
                custom_message=custom_message,
                tamper_message=tamper_message
            )
            for _ in range(block_size):
                qber = c_sim.run()
                qber_values.append(qber)
                simulation.telemetry_history.append(c_sim.telemetry_history[-1])
        simulation.session = c_sim.session
    else:
        for _ in range(total_runs):
            qber = simulation.run()
            qber_values.append(qber)

    avg_qber = metrics.average_qber(qber_values)
    max_qber = metrics.maximum_qber(qber_values)
    min_qber = metrics.minimum_qber(qber_values)
    telemetry_metrics = metrics.calculate_telemetry_metrics(simulation.telemetry_history)

    # Plot graphs with scenario segmentation & performance comparison
    graphs.plot_qber(qber_values)
    graphs.plot_histogram(qber_values)
    graphs.plot_security_status(qber_values, telemetry_history=simulation.telemetry_history)
    graphs.plot_threshold(qber_values, fixed_threshold=0.11, telemetry_history=simulation.telemetry_history)
    graphs.plot_performance_metrics(telemetry_history=simulation.telemetry_history)
    graphs.plot_bar_chart(qber_values, telemetry_history=simulation.telemetry_history)

    # PDF Technical Report
    report.generate_report(
        total_runs=total_runs,
        average_qber=avg_qber,
        maximum_qber=max_qber,
        minimum_qber=min_qber,
        attack_rate=metrics.attack_detection_rate(qber_values, threshold),
        secure_rate=metrics.secure_rate(qber_values, threshold),
        adaptive_metrics=telemetry_metrics,
        scenario_name=case_info["name"]
    )

    qber_percent = round(avg_qber * 100, 2)
    adaptive_threshold_percent = round(telemetry_metrics["avg_adaptive_threshold"] * 100, 2)
    effective_threshold = adaptive_threshold_percent if threshold_mode == "adaptive" else round(threshold * 100, 2)
    channel_secure = qber_percent <= effective_threshold

    if threshold_mode == "adaptive":
        secure_runs = sum(1 for t in simulation.telemetry_history if t["eval"]["key_accepted_adaptive"])
    else:
        secure_runs = sum(1 for q in qber_values if q <= threshold)
    attack_runs = total_runs - secure_runs

    # Circuit Diagram generation
    sim_single = Simulation(
        n_bits=8,
        eve_enabled=eve_enabled,
        noise_enabled=noise_enabled,
        noise_probability=noise_probability,
        custom_message=custom_message,
        tamper_message=tamper_message
    )
    sim_single.run()
    generate_bb84_circuit(sim_single.session, base_dir=BASE_DIR)

    latest_eval = simulation.telemetry_history[-1]["eval"] if simulation.telemetry_history else {}
    qubits_detail = simulation.session.get("qubits_detail", [])
    auto_regeneration = simulation.session.get("auto_regeneration")
    digital_signature_info = simulation.session.get("digital_signature_info", {})
    # Never expose simulation key material through the browser-facing API.
    public_session = dict(simulation.session)
    public_session.pop("reconciled_key_bits", None)

    return {
        "status": "success",
        "active_case": active_case,
        "case_info": case_info,
        "threshold_mode": threshold_mode,
        "avg_qber": qber_percent,
        "qber_percent": qber_percent,
        "max_qber": round(max_qber * 100, 2),
        "min_qber": round(min_qber * 100, 2),
        "secure_runs": secure_runs,
        "attack_runs": attack_runs,
        "total_runs": total_runs,
        "threshold": round(threshold * 100, 2),
        "adaptive_threshold_percent": adaptive_threshold_percent,
        "effective_threshold": effective_threshold,
        "channel_secure": channel_secure,
        "eve_enabled": eve_enabled,
        "noise_enabled": noise_enabled,
        "noise_probability": noise_probability,
        "custom_message": custom_message,
        "tamper_message": tamper_message,
        "warning": (11 < qber_percent <= adaptive_threshold_percent),
        "critical": (qber_percent > adaptive_threshold_percent),
        "telemetry": telemetry_metrics,
        "qubits_detail": qubits_detail,
        "ai_classification": latest_eval.get("ai_classification", {}),
        "noise_category_info": latest_eval.get("noise_category_info", {}),
        "auto_regeneration": auto_regeneration,
        "digital_signature_info": digital_signature_info,
        "session": public_session,
        "latest_telemetry": simulation.telemetry_history[-1] if simulation.telemetry_history else {}
    }


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/api/simulation", methods=["POST"])
def api_simulation():
    data = request.get_json() or {}
    result = run_simulation_logic(data)
    return jsonify(result)


@app.route("/api/scenarios", methods=["GET"])
def api_scenarios():
    cases = [Simulation.get_case_parameters(i) for i in range(1, 7)]
    return jsonify({"status": "success", "scenarios": cases})


@app.route("/api/live_transmission", methods=["POST"])
def live_transmission():
    data = request.get_json() or {}
    
    # Check explicitly if eve_enabled was passed in JSON body
    if "eve_enabled" in data:
        eve_enabled = bool(data["eve_enabled"])
    else:
        case_id = int(data.get("case_id", 1))
        eve_enabled = (case_id == 3 or case_id == 4)

    custom_message = data.get("custom_message", "Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized")
    tamper_message = bool(data.get("tamper_message", False))

    # Custom noise category level override if provided by frontend
    noise_level = data.get("noise_level", None)
    
    if noise_level == "no_noise":
        noise_enabled = False
        noise_probability = 0.01
    elif noise_level == "low_noise":
        noise_enabled = True
        noise_probability = 0.08
    elif noise_level == "medium_noise":
        noise_enabled = True
        noise_probability = 0.18
    elif noise_level == "high_noise":
        noise_enabled = True
        noise_probability = 0.30
    else:
        case_id = int(data.get("case_id", 1))
        case_params = Simulation.get_case_parameters(case_id)
        noise_enabled = case_params["noise_enabled"]
        noise_probability = case_params["noise_probability"]
        if noise_enabled and random.random() > 0.4:
            noise_probability = random.choice([0.08, 0.18, 0.28])

    sim = Simulation(
        n_bits=16,
        eve_enabled=eve_enabled,
        noise_enabled=noise_enabled,
        noise_probability=noise_probability,
        custom_message=custom_message,
        tamper_message=tamper_message
    )
    qber = sim.run()

    session = sim.session
    latest = sim.telemetry_history[-1]

    auto_regeneration = session.get("auto_regeneration")
    digital_signature_info = session.get("digital_signature_info", {})

    return jsonify({
        "status": "success",
        "qber": round(qber * 100, 2),
        "eve_enabled": eve_enabled,
        "noise_probability": round(noise_probability, 4),
        "noise_probability_percent": round(noise_probability * 100, 2),
        "adaptive_threshold": round(latest["adaptive_threshold"] * 100, 2),
        "fixed_threshold": 11.0,
        "key_accepted_adaptive": latest["eval"]["key_accepted_adaptive"],
        "key_accepted_fixed": latest["eval"]["key_accepted_fixed"],
        "false_positive_fixed": latest["eval"]["false_positive_fixed"],
        "ai_classification": latest["eval"].get("ai_classification", {}),
        "noise_category_info": latest["eval"].get("noise_category_info", {}),
        "aes_status": session.get("aes_status", "DISCARDED"),
        "ciphertext": session.get("ciphertext", "N/A"),
        "auto_regeneration": auto_regeneration,
        "digital_signature_info": digital_signature_info,
        "sifted_key_len": session.get("sifted_key_len", 0),
        "key_gen_time_ms": session.get("key_gen_time_ms", 0.0),
        "qubits_detail": session.get("qubits_detail", []),
        "sample_qubit": {
            "index": session.get("index", 1),
            "alice_bit": session.get("alice_bit", 0),
            "alice_basis": session.get("alice_basis", "Z Basis"),
            "bob_basis": session.get("bob_basis", "Z Basis"),
            "eve_basis": session.get("eve_basis", "N/A"),
            "eve_enabled": session.get("eve_enabled", False)
        }
    })


@app.route("/api/demo/receive", methods=["POST"])
def receive_demo_transmission():
    """PC 2 endpoint for the explicitly demo-only two-PC flow."""
    data = request.get_json(silent=True) or {}
    required = {"payload", "wrapped_qkd_key", "sender_public_key_pem"}
    if not required.issubset(data):
        return jsonify({"status": "error", "message": "Missing encrypted payload, wrapped demo key, or sender public key."}), 400

    try:
        psk = os.environ.get("QUANTUMSHIELD_DEMO_PSK")
        payload_envelope = json.loads(base64.b64decode(data["payload"]).decode("utf-8"))
        if payload_envelope.get("version") != AESCrypto.ENVELOPE_VERSION:
            raise ValueError("Receiver expected an AES-256-GCM payload envelope")
        encrypted_payload_hash = hashlib.sha256(data["payload"].encode("ascii")).hexdigest()
        qkd_key_bits = DemoTransport.unwrap_qkd_key(data["wrapped_qkd_key"], psk)
        payload = AESCrypto().decrypt_payload(data["payload"], qkd_key_bits)
        if "error" in payload:
            return jsonify({"status": "rejected", "message": payload["error"]}), 400
        public_key = DigitalSignature.load_public_key_pem(data["sender_public_key_pem"])
        signature_valid = DigitalSignature().verify_signature(payload.get("message", ""), payload.get("digital_signature", ""), public_key)
        print(
            "RECEIVER AUDIT | encrypted payload received"
            f" | algorithm={payload_envelope['version']}"
            f" | sha256={encrypted_payload_hash}"
            f" | signature_valid={signature_valid}",
            flush=True,
        )
        return jsonify({
            "status": "accepted" if signature_valid else "rejected",
            "message": payload.get("message"),
            "signature_valid": signature_valid,
            "encryption_algorithm": payload_envelope["version"],
            "encrypted_payload_sha256": encrypted_payload_hash,
            "nonce_b64": payload_envelope["nonce"],
            "ciphertext_preview": payload_envelope["ciphertext"][:48] + "...",
            "qber_percent": data.get("qber_percent"),
            "transport_note": "Demo key wrap verified. This is not a physical QKD key exchange.",
        }), 200 if signature_valid else 400
    except (ValueError, KeyError, TypeError) as error:
        return jsonify({"status": "error", "message": str(error)}), 400


@app.route("/download")
def download():
    pdf_path = os.path.join(
        BASE_DIR,
        "reports",
        "QuantumShield_Report.pdf"
    )
    return send_file(
        pdf_path,
        as_attachment=True
    )


if __name__ == "__main__":
    # Set QUANTUMSHIELD_HOST=0.0.0.0 on PC 2 so another LAN PC can reach it.
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", host=os.environ.get("QUANTUMSHIELD_HOST", "127.0.0.1"), port=int(os.environ.get("QUANTUMSHIELD_PORT", "5000")))
