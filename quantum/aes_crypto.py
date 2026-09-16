"""Authenticated AES-256-GCM encryption for QuantumShield payloads."""

import base64
import hashlib
import json
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class AESCrypto:
    """Uses a SHA-256 expansion of sifted BB84 bits as the 256-bit AES key."""

    ENVELOPE_VERSION = "AES-256-GCM-v1"
    ASSOCIATED_DATA = b"QuantumShield-MedEdge"

    def _derive_key(self, sifted_key_bits):
        if not sifted_key_bits:
            raise ValueError("Cannot derive an AES key from an empty QKD key")
        bit_string = "".join(str(int(b)) for b in sifted_key_bits)
        return hashlib.sha256(bit_string.encode("ascii")).digest()

    def encrypt_payload(self, sifted_key_bits, payload=None, digital_signature=None):
        if payload is None:
            raise ValueError("A payload is required")
        payload = {"message": payload} if isinstance(payload, str) else dict(payload)

        if digital_signature:
            payload["digital_signature"] = digital_signature

        nonce = os.urandom(12)
        ciphertext = AESGCM(self._derive_key(sifted_key_bits)).encrypt(
            nonce,
            json.dumps(payload, separators=(",", ":")).encode("utf-8"),
            self.ASSOCIATED_DATA,
        )
        envelope = {
            "version": self.ENVELOPE_VERSION,
            "nonce": base64.b64encode(nonce).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
        }
        full_ciphertext = base64.b64encode(json.dumps(envelope, separators=(",", ":")).encode("utf-8")).decode("ascii")
        return {
            "encrypted": True,
            "algorithm": self.ENVELOPE_VERSION,
            "ciphertext": full_ciphertext[:48] + "..." if len(full_ciphertext) > 48 else full_ciphertext,
            "full_ciphertext": full_ciphertext,
            "key_hash": hashlib.sha256(self._derive_key(sifted_key_bits)).hexdigest()[:16],
        }

    def decrypt_payload(self, ciphertext_b64, sifted_key_bits):
        try:
            envelope = json.loads(base64.b64decode(ciphertext_b64).decode("utf-8"))
            if envelope.get("version") != self.ENVELOPE_VERSION:
                raise ValueError("Unsupported encryption envelope")
            plaintext = AESGCM(self._derive_key(sifted_key_bits)).decrypt(
                base64.b64decode(envelope["nonce"]),
                base64.b64decode(envelope["ciphertext"]),
                self.ASSOCIATED_DATA,
            )
            return json.loads(plaintext.decode("utf-8"))
        except Exception as error:
            return {"error": f"AES-GCM decryption failed: {error}"}
