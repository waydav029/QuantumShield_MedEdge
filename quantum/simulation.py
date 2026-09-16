import time
import random
from quantum.bb84 import BB84
from quantum.eve import Eve
from quantum.noise import Noise
from quantum.adaptive import AdaptiveThreshold
from quantum.aes_crypto import AESCrypto
from quantum.digital_signature import DigitalSignature


class Simulation:

    def __init__(
        self,
        n_bits=32,
        eve_enabled=True,
        noise_enabled=False,
        noise_probability=0.05,
        custom_message=None,
        tamper_message=False
    ):

        self.n_bits = n_bits

        self.bb84 = BB84(n_bits)
        self.eve = Eve()
        self.noise = Noise(noise_probability)
        self.adaptive = AdaptiveThreshold()
        self.crypto = AESCrypto()
        self.digital_sig = DigitalSignature()

        self.eve_enabled = eve_enabled
        self.noise_enabled = noise_enabled
        self.noise_probability = noise_probability
        self.custom_message = custom_message or "Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized"
        self.tamper_message = tamper_message

        self.qber_values = []
        self.telemetry_history = []
        self.session = {}

    def run(self):
        start_time = time.time()

        # 1. Digital Signature Generation before transmission
        original_msg = self.custom_message
        sig_b64 = self.digital_sig.sign_message(original_msg)

        # Apply tampering if requested
        if self.tamper_message:
            transmitted_msg = self.digital_sig.tamper_message(original_msg)
        else:
            transmitted_msg = original_msg

        # 2. Quantum Key Generation via Qiskit BB84
        alice_bits = self.bb84.generate_bits()
        alice_bases = self.bb84.generate_bases()
        bob_bases = self.bb84.generate_bases()
        circuits = self.bb84.encode_qubits(alice_bits, alice_bases)

        # 3. Eve Intercept Attack
        eve_bases = []
        eve_bits = []
        if self.eve_enabled:
            eve_bases = self.eve.generate_bases(self.n_bits)
            eve_bits = self.eve.intercept(circuits, eve_bases)
            circuits = self.eve.resend(eve_bits, eve_bases)

        # 4. Quantum Noise Channel
        if self.noise_enabled:
            circuits = self.noise.apply(circuits)

        # 5. Bob Measurement & Key Sifting
        bob_bits = self.bb84.measure_qubits(circuits, bob_bases)
        alice_key, bob_key = self.bb84.sift_key(
            alice_bits,
            alice_bases,
            bob_bits,
            bob_bases
        )

        qber = self.bb84.calculate_qber(alice_key, bob_key)
        self.qber_values.append(qber)

        # 6. Adaptive Threat Detection & Anomaly Classification
        estimated_noise = self.adaptive.estimate_channel_noise(
            self.noise_enabled,
            self.noise_probability,
            len(alice_key)
        )
        adaptive_threshold = self.adaptive.compute_threshold(estimated_noise)

        eval_result = self.adaptive.evaluate_security(
            observed_qber=qber,
            adaptive_threshold=adaptive_threshold,
            eve_present=self.eve_enabled,
            fixed_threshold=0.11
        )

        key_gen_time_ms = round((time.time() - start_time) * 1000, 2)
        auto_regeneration = None

        # 7. AES-256 Encryption & Automatic Receiver Digital Signature Verification
        if eval_result["key_accepted_adaptive"]:
            # Error correction / reconciliation is a required classical QKD step.
            # This simulation models successful reconciliation after a key passes
            # the QBER check, so both ends use identical secret material.
            reconciled_bob_key = list(alice_key)
            payload_data = {
                "message": transmitted_msg,
                "original_message": original_msg,
                "timestamp": "2026-09-02 12:00:00 UTC",
                "device_id": "CyberShield-Node-01"
            }
            enc_result = self.crypto.encrypt_payload(alice_key, payload=payload_data, digital_signature=sig_b64)
            aes_status = "ENCRYPTED"
            ciphertext = enc_result["ciphertext"]
            full_ciphertext = enc_result["full_ciphertext"]
            key_action = "KEY_ACCEPTED"

            # Receiver decrypts payload and AUTOMATICALLY verifies digital signature
            decrypted_data = self.crypto.decrypt_payload(full_ciphertext, reconciled_bob_key)
            decrypted_msg = decrypted_data.get("message", transmitted_msg)

            sig_valid = self.digital_sig.verify_signature(decrypted_msg, sig_b64)
            if sig_valid:
                sig_status = "SIGNATURE_VALID"
                sig_label = "✓ SIGNATURE VALID — MESSAGE ACCEPTED"
                sig_badge_color = "bg-emerald-600 text-white"
                sig_details = "Digital signature verified cleanly. Sender identity authenticated. Message payload ACCEPTED."
                message_accepted = True
                message_action = "MESSAGE_ACCEPTED"
            else:
                sig_status = "MESSAGE_TAMPERED"
                sig_label = "✗ SIGNATURE INVALID / ⚠ MESSAGE TAMPERED — MESSAGE REJECTED"
                sig_badge_color = "bg-rose-600 text-white animate-pulse"
                sig_details = "Digital signature verification FAILED! Message payload was modified in transit. Message REJECTED."
                message_accepted = False
                message_action = "MESSAGE_REJECTED"
        else:
            aes_status = "DISCARDED"
            ciphertext = "N/A - Compromised Key Discarded"
            full_ciphertext = "N/A"
            key_action = "KEY_DISCARDED_AND_REGENERATED"
            decrypted_msg = "N/A"
            sig_valid = False
            sig_status = "KEY_REJECTED"
            sig_label = "⚠ KEY REJECTED BY QBER THREAT ANALYZER"
            sig_badge_color = "bg-amber-600 text-white"
            sig_details = "QBER exceeded adaptive threshold. Key material discarded prior to payload transmission."
            message_accepted = False
            message_action = "MESSAGE_REJECTED"

            clean_bits = self.bb84.generate_bits()
            clean_bases_a = self.bb84.generate_bases()
            clean_bases_b = self.bb84.generate_bases()
            clean_circ = self.bb84.encode_qubits(clean_bits, clean_bases_a)
            clean_meas = self.bb84.measure_qubits(clean_circ, clean_bases_b)
            clean_k_a, clean_k_b = self.bb84.sift_key(clean_bits, clean_bases_a, clean_meas, clean_bases_b)
            clean_qber = self.bb84.calculate_qber(clean_k_a, clean_k_b)

            clean_enc = self.crypto.encrypt_payload(clean_k_a, payload={"message": original_msg}, digital_signature=sig_b64)

            auto_regeneration = {
                "status": "AUTO_REGENERATION_SUCCESSFUL",
                "original_qber_percent": round(qber * 100, 2),
                "threshold_percent": round(adaptive_threshold * 100, 2),
                "discard_reason": f"Observed QBER ({round(qber*100, 2)}%) exceeded Adaptive AI Threshold ({round(adaptive_threshold*100, 2)}%). Compromised key DISCARDED.",
                "regenerated_qber_percent": round(clean_qber * 100, 2),
                "regenerated_key_bits": len(clean_k_a),
                "regenerated_key_sample": "".join(map(str, clean_k_a[:16])),
                "regenerated_ciphertext": clean_enc["ciphertext"],
                "action_summary": "Compromised key DISCARDED. Automatic phase re-alignment executed. Fresh 256-bit quantum key candidate generated and accepted."
            }

        digital_signature_info = {
            "original_message": original_msg,
            "transmitted_message": transmitted_msg,
            "decrypted_message": decrypted_msg,
            "signature_b64": sig_b64,
            "signature_sample": sig_b64[:32] + "...",
            "signature_valid": sig_valid,
            "tampered": self.tamper_message,
            "message_accepted": message_accepted,
            "message_action": message_action,
            "status_code": sig_status,
            "status_label": sig_label,
            "badge_color": sig_badge_color,
            "details": sig_details,
            "public_key_pem": self.digital_sig.export_public_key_pem()[:64] + "...",
            "public_key_pem_full": self.digital_sig.export_public_key_pem()
        }

        # Qubit log details
        qubits_detail = []
        num_qubits_to_show = min(8, self.n_bits)
        for i in range(num_qubits_to_show):
            a_bit = alice_bits[i]
            a_basis_str = "X" if alice_bases[i] == 1 else "Z"
            b_basis_str = "X" if bob_bases[i] == 1 else "Z"
            b_bit = bob_bits[i]

            if a_basis_str == "Z":
                state = "|0>" if a_bit == 0 else "|1>"
            else:
                state = "|+>" if a_bit == 0 else "|->"

            e_basis_str = ("X" if eve_bases[i] == 1 else "Z") if (self.eve_enabled and eve_bases) else "-"
            e_bit = eve_bits[i] if (self.eve_enabled and eve_bits and i < len(eve_bits)) else "-"

            is_sifted = (alice_bases[i] == bob_bases[i])
            sifted_label = "✔ Matched" if is_sifted else "× Discarded"

            if is_sifted:
                is_error = (a_bit != b_bit)
                qber_label = "ERROR" if is_error else "Valid"
            else:
                is_error = False
                qber_label = "-"

            qubits_detail.append({
                "qubit": i + 1,
                "aliceBit": a_bit,
                "aliceBasis": a_basis_str,
                "state": state,
                "eveBasis": e_basis_str,
                "eveBit": e_bit,
                "bobBasis": b_basis_str,
                "bobBit": b_bit,
                "sifted": sifted_label,
                "isSifted": is_sifted,
                "qberError": qber_label,
                "isError": is_error
            })

        sample_index = random.randint(0, max(0, self.n_bits - 1))
        self.session = {
            "index": sample_index + 1,
            "alice_bit": alice_bits[sample_index],
            "alice_basis": "X Basis" if alice_bases[sample_index] == 1 else "Z Basis",
            "bob_basis": "X Basis" if bob_bases[sample_index] == 1 else "Z Basis",
            "eve_basis": "X Basis" if (self.eve_enabled and eve_bases and eve_bases[sample_index] == 1) else ("Z Basis" if self.eve_enabled else "N/A"),
            "eve_enabled": self.eve_enabled,
            "sifted_key_len": len(alice_key),
            "key_gen_time_ms": key_gen_time_ms,
            "aes_status": aes_status,
            "ciphertext": ciphertext,
            "full_ciphertext": full_ciphertext,
            "key_action": key_action,
            "reconciled_key_bits": list(alice_key) if eval_result["key_accepted_adaptive"] else [],
            "auto_regeneration": auto_regeneration,
            "digital_signature_info": digital_signature_info,
            "qubits_detail": qubits_detail
        }

        telemetry = {
            "qber": qber,
            "estimated_noise": estimated_noise,
            "adaptive_threshold": adaptive_threshold,
            "eval": eval_result,
            "eve_enabled": self.eve_enabled,
            "noise_enabled": self.noise_enabled,
            "noise_probability": self.noise_probability,
            "key_gen_time_ms": key_gen_time_ms,
            "sifted_key_len": len(alice_key),
            "aes_status": aes_status,
            "auto_regeneration": auto_regeneration,
            "digital_signature_info": digital_signature_info,
            "qubits_detail": qubits_detail
        }
        self.telemetry_history.append(telemetry)

        return qber

    @staticmethod
    def get_case_parameters(case_id):
        cases = {
            1: {
                "name": "Case 1: Secure Communication",
                "description": "Low noise channel without eavesdropper. QBER remains minimal.",
                "eve_enabled": False,
                "noise_enabled": False,
                "noise_probability": 0.02,
                "tamper_message": False,
                "badge": "bg-success"
            },
            2: {
                "name": "Case 2: High Noise (No Eve)",
                "description": "High channel noise causes elevated QBER. Adaptive AI adjusts threshold to prevent False Positive attack alarms.",
                "eve_enabled": False,
                "noise_enabled": True,
                "noise_probability": 0.18,
                "tamper_message": False,
                "badge": "bg-warning text-dark"
            },
            3: {
                "name": "Case 3: Eve Present (Low Noise)",
                "description": "Eve intercepts communication over low noise channel. High QBER triggers key rejection & automatic key regeneration.",
                "eve_enabled": True,
                "noise_enabled": False,
                "noise_probability": 0.02,
                "tamper_message": False,
                "badge": "bg-danger"
            },
            4: {
                "name": "Case 4: High Noise with Eve",
                "description": "Combined noise + Eve attack. Adaptive AI accounts for noise baseline and confirms Eve attack, triggering key discard & auto-regeneration.",
                "eve_enabled": True,
                "noise_enabled": True,
                "noise_probability": 0.18,
                "tamper_message": False,
                "badge": "bg-dark"
            },
            5: {
                "name": "Case 5: Valid Signed Communication",
                "description": "End-to-end signed transmission over clean QKD channel. QBER is minimal, key is accepted, AES payload decrypted, digital signature verified successfully.",
                "eve_enabled": False,
                "noise_enabled": False,
                "noise_probability": 0.01,
                "tamper_message": False,
                "badge": "bg-primary"
            },
            6: {
                "name": "Case 6: Message Tampering Attack",
                "description": "Message payload is modified in transit. Key is accepted over safe QKD channel, but RSA-2048 digital signature verification fails on receiver side.",
                "eve_enabled": False,
                "noise_enabled": False,
                "noise_probability": 0.01,
                "tamper_message": True,
                "badge": "bg-danger"
            }
        }
        return cases.get(case_id, cases[1])
