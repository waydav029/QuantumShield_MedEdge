"""Demo-only bridge for delivering a simulated QKD key to a second PC.

This is not QKD: a QKD simulation's key is wrapped with an out-of-band shared
secret solely so PC 2 can reproduce the full sender/receiver demonstration.
"""

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class DemoTransport:
    VERSION = "QuantumShield-demo-key-wrap-v1"
    AAD = b"QuantumShield-demo-key-wrap"

    @staticmethod
    def _key(psk):
        if not psk or len(psk) < 16:
            raise ValueError("Set a demo transport secret of at least 16 characters")
        return hashlib.sha256(psk.encode("utf-8")).digest()

    @classmethod
    def wrap_qkd_key(cls, qkd_key_bits, psk):
        nonce = os.urandom(12)
        raw_key = "".join(str(int(bit)) for bit in qkd_key_bits).encode("ascii")
        ciphertext = AESGCM(cls._key(psk)).encrypt(nonce, raw_key, cls.AAD)
        return {"version": cls.VERSION, "nonce": base64.b64encode(nonce).decode("ascii"), "ciphertext": base64.b64encode(ciphertext).decode("ascii")}

    @classmethod
    def unwrap_qkd_key(cls, wrapped_key, psk):
        if wrapped_key.get("version") != cls.VERSION:
            raise ValueError("Unsupported demo key-wrap envelope")
        raw_key = AESGCM(cls._key(psk)).decrypt(base64.b64decode(wrapped_key["nonce"]), base64.b64decode(wrapped_key["ciphertext"]), cls.AAD)
        return [int(bit) for bit in raw_key.decode("ascii")]
