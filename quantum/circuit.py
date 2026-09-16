from qiskit import QuantumCircuit
from qiskit.visualization import circuit_drawer
import os


def generate_bb84_circuit(session, base_dir=None):
    if not session:
        return

    qc = QuantumCircuit(1, 1)

    # Decode Alice bit and basis
    alice_bit = session.get("alice_bit", 0)
    alice_basis = session.get("alice_basis", 0)
    bob_basis = session.get("bob_basis", 0)

    # Convert string basis representation if needed
    if isinstance(alice_basis, str):
        alice_basis = 1 if "X" in alice_basis else 0
    if isinstance(bob_basis, str):
        bob_basis = 1 if "X" in bob_basis else 0

    # Alice encodes qubit
    if alice_bit == 1:
        qc.x(0)

    if alice_basis == 1:
        qc.h(0)

    # Bob measures qubit
    if bob_basis == 1:
        qc.h(0)

    qc.measure(0, 0)

    if base_dir:
        output_dir = os.path.join(base_dir, "static", "images")
    else:
        output_dir = "static/images"
    os.makedirs(output_dir, exist_ok=True)

    filename = os.path.join(output_dir, "bb84_circuit.png")

    try:
        circuit_drawer(
            qc,
            output="mpl",
            filename=filename
        )
    except Exception as e:
        print(f"Warning: Could not render Matplotlib circuit diagram: {e}")
        try:
            circuit_drawer(qc, output="text", filename=filename + ".txt")
        except Exception:
            pass