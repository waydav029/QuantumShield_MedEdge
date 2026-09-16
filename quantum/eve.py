import random

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


class Eve:

    def __init__(self):
        self.simulator = AerSimulator()

    def generate_bases(self, n_bits):
        return [random.randint(0, 1) for _ in range(n_bits)]

    def intercept(self, circuits, eve_bases):

        eve_bits = []

        for circuit, basis in zip(circuits, eve_bases):

            qc = circuit.copy()

            if basis == 1:
                qc.h(0)

            qc.measure(0, 0)

            job = self.simulator.run(qc, shots=1)
            result = job.result()

            counts = result.get_counts()

            bit = int(list(counts.keys())[0])

            eve_bits.append(bit)

        return eve_bits

    def resend(self,eve_bits, eve_bases):

        circuits = []

        for bit, basis in zip(eve_bits, eve_bases):

            qc = QuantumCircuit(1, 1)

            if basis == 0:
                if bit == 1:
                    qc.x(0)
            else:
                if bit == 1:
                    qc.x(0)

                qc.h(0)

            circuits.append(qc)

        return circuits