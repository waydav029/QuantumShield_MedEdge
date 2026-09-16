"""Send one AES-GCM-protected QuantumShield demonstration message to PC 2."""

import argparse
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from quantum.demo_transport import DemoTransport
from quantum.simulation import Simulation


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receiver", required=True, help="Example: http://192.168.1.20:5000/api/demo/receive")
    parser.add_argument("--psk", default=os.environ.get("QUANTUMSHIELD_DEMO_PSK"), help="Shared demo secret; prefer the environment variable")
    parser.add_argument("--message", default="Secure Transaction: TXN-78492 | Classification: Confidential | Status: Authorized")
    parser.add_argument("--eve", action="store_true", help="Simulate an intercept-resend attack")
    parser.add_argument("--noise", type=float, default=0.0, help="Simulated channel noise probability")
    args = parser.parse_args()

    simulation = Simulation(n_bits=256, eve_enabled=args.eve, noise_enabled=args.noise > 0, noise_probability=args.noise, custom_message=args.message)
    qber = simulation.run()
    session = simulation.session
    if session["aes_status"] != "ENCRYPTED":
        raise SystemExit(f"Transmission blocked: QBER was {qber:.2%}; the QKD key was rejected.")

    body = {
        "payload": session["full_ciphertext"],
        "wrapped_qkd_key": DemoTransport.wrap_qkd_key(session["reconciled_key_bits"], args.psk),
        "sender_public_key_pem": session["digital_signature_info"]["public_key_pem_full"],
        "qber_percent": round(qber * 100, 2),
    }
    request = Request(args.receiver, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(request, timeout=10) as response:
            print(response.read().decode("utf-8"))
    except (HTTPError, URLError) as error:
        raise SystemExit(f"Could not deliver the demo message: {error}") from error


if __name__ == "__main__":
    main()
