import random
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


class BB84:

    def __init__(self, n_bits=8):
        self.n_bits = n_bits
        self.simulator = AerSimulator()

    # ----------------------------
    # Alice generates random bits
    # ----------------------------
    def generate_bits(self):
        return [random.randint(0, 1) for _ in range(self.n_bits)]

    # ----------------------------
    # Alice/Bob generates random bases
    # 0 = Z basis
    # 1 = X basis
    # ----------------------------
    def generate_bases(self):
        return [random.randint(0, 1) for _ in range(self.n_bits)]

    def encode_qubits(self, bits, bases):

        circuits = []

        for bit, basis in zip(bits, bases):

            qc = QuantumCircuit(1, 1)

            if basis == 0:        # Z Basis

                if bit == 1:
                    qc.x(0)

            else:                 # X Basis

                if bit == 1:
                    qc.x(0)

                qc.h(0)

            circuits.append(qc)

        return circuits

    def measure_qubits(self, circuits, bob_bases):

        measured_bits = []

        for circuit, basis in zip(circuits, bob_bases):

            qc = circuit.copy()

            if basis == 1:
                qc.h(0)

            qc.measure(0, 0)

            job = self.simulator.run(qc, shots=1)
            result = job.result()

            counts = result.get_counts()

            measured_bit = int(list(counts.keys())[0])

            measured_bits.append(measured_bit)

        return measured_bits

    
    def sift_key(self,
                 alice_bits,
                 alice_bases,
                 bob_bits,
                 bob_bases):

        alice_key = []
        bob_key = []

        for abit, abase, bbit, bbase in zip(
                alice_bits,
                alice_bases,
                bob_bits,
                bob_bases):

            if abase == bbase:

                alice_key.append(abit)
                bob_key.append(bbit)

        return alice_key, bob_key
        
      
    def calculate_qber(self, alice_key, bob_key):

        if len(alice_key) == 0:
            return 0.0

        errors = 0

        for a, b in zip(alice_key, bob_key):
            if a != b:
                errors += 1

        qber = errors / len(alice_key)

        return qber
