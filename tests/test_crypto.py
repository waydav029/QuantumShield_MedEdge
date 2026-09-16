import unittest

from quantum.aes_crypto import AESCrypto
from quantum.demo_transport import DemoTransport


class CryptoTests(unittest.TestCase):
    def test_aes_gcm_round_trip_and_tamper_detection(self):
        crypto = AESCrypto()
        bits = [0, 1] * 128
        encrypted = crypto.encrypt_payload(bits, {"message": "hello"})
        self.assertEqual(crypto.decrypt_payload(encrypted["full_ciphertext"], bits)["message"], "hello")

        altered = encrypted["full_ciphertext"][:-1] + ("A" if encrypted["full_ciphertext"][-1] != "A" else "B")
        self.assertIn("error", crypto.decrypt_payload(altered, bits))

    def test_demo_key_wrap_round_trip(self):
        bits = [1, 0, 1, 1]
        wrapped = DemoTransport.wrap_qkd_key(bits, "at-least-sixteen-characters")
        self.assertEqual(DemoTransport.unwrap_qkd_key(wrapped, "at-least-sixteen-characters"), bits)


if __name__ == "__main__":
    unittest.main()
