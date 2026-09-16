"""
Digital Signature Security Module for QuantumShield CyberDefense
Implements RSA-2048 signing & SHA-256 verification to ensure non-repudiation
and message integrity verification across the QKD & AES encryption pipeline.
"""

import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization

class DigitalSignature:
    def __init__(self):
        self.private_key, self.public_key = self.generate_key_pair()

    def generate_key_pair(self):
        """
        Generates RSA 2048-bit Private and Public key pair.
        """
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        public_key = private_key.public_key()
        return private_key, public_key

    def export_public_key_pem(self, public_key=None):
        """
        Exports public key in PEM format string.
        """
        pub_key = public_key or self.public_key
        pem = pub_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode('utf-8')

    def sign_message(self, message, private_key=None):
        """
        Signs message payload using RSA-PSS padding and SHA-256 digest.
        Returns Base64 encoded digital signature string.
        """
        priv_key = private_key or self.private_key
        if isinstance(message, str):
            message_bytes = message.encode('utf-8')
        else:
            message_bytes = message

        signature = priv_key.sign(
            message_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode('utf-8')

    def verify_signature(self, message, signature_b64, public_key=None):
        """
        Verifies digital signature against message payload.
        Returns True if valid, False if tampered or invalid.
        """
        pub_key = public_key or self.public_key
        if isinstance(message, str):
            message_bytes = message.encode('utf-8')
        else:
            message_bytes = message

        try:
            signature_bytes = base64.b64decode(signature_b64)
            pub_key.verify(
                signature_bytes,
                message_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False

    @staticmethod
    def load_public_key_pem(public_key_pem):
        """Load the sender's public key received by a demo receiver."""
        return serialization.load_pem_public_key(public_key_pem.encode("utf-8"))

    def tamper_message(self, message):
        """
        Simulates controlled message tampering during transmission.
        Modifies payload content to trigger digital signature verification failure.
        """
        if isinstance(message, str):
            if "Authorized" in message:
                return message.replace("Authorized", "FORGED_UNAUTHORIZED")
            elif "Confidential" in message:
                return message.replace("Confidential", "PUBLIC_EXPOSED")
            elif "TXN-78492" in message:
                return message.replace("TXN-78492", "TXN-99999_FORGED")
            else:
                return message + " [TAMPERED_PAYLOAD_MODIFICATION]"
        return message
