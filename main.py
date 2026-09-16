"""
QuantumShield CyberDefense - Quantum-Inspired Cyber Threat Detection for Digital Signature Security
Main execution script for CLI simulation runs.
"""

from quantum.simulation import Simulation

def main():
    print("=" * 65)
    print("  QuantumShield CyberDefense - Quantum-Inspired Cyber Threat Detection")
    print("  BB84 QKD + RSA-2048 Digital Signature & Adaptive Threat Evaluator")
    print("=" * 65)
    
    sim = Simulation(
        n_bits=32,
        eve_enabled=True,
        noise_enabled=True,
        noise_probability=0.18,
        custom_message="Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized",
        tamper_message=False
    )
    
    qber = sim.run()
    session = sim.session
    sig_info = session.get("digital_signature_info", {})
    
    print(f"\n[+] Simulation Complete:")
    print(f"    - Observed QBER: {round(qber * 100, 2)}%")
    print(f"    - AES Status: {session.get('aes_status')}")
    print(f"    - Ciphertext: {session.get('ciphertext')}")
    print(f"    - Digital Signature Status: {sig_info.get('status_label')}")
    print(f"    - Receiver Action: {sig_info.get('message_action')}")

if __name__ == "__main__":
    main()
