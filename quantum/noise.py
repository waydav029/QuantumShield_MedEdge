import random
from qiskit import QuantumCircuit


class Noise:

    def __init__(self, probability=0.05):
        self.probability = probability

    def apply(self, circuits):
        """
        Applies quantum channel noise (bit-flip X and phase-flip Z noise)
        to circuits according to probability.
        """
        noisy_circuits = []

        for circuit in circuits:

            qc = circuit.copy()

            # Bit flip noise (affects Z basis measurement)
            if random.random() < self.probability:
                qc.x(0)

            # Phase flip noise (affects X basis measurement)
            if random.random() < self.probability:
                qc.z(0)

            noisy_circuits.append(qc)

        return noisy_circuits