## QuantumShield MedEdge

This project demonstrates BB84-style QKD simulation, attack/noise detection,
RSA signatures, and authenticated AES-256-GCM payload encryption. It is an
educational simulation, not a production medical-security system.

### Run the dashboard

```powershell
python dashboard/app.py
```

### Two-PC LAN demonstration

The demo sends an AES-GCM encrypted payload from PC 1 to PC 2. Both machines
must have the project dependencies installed and use the same long demo secret.

On **PC 2** (receiver), set a secret and expose the Flask receiver on your LAN:

```powershell
$env:QUANTUMSHIELD_DEMO_PSK = "replace-this-with-a-long-demo-secret"
$env:QUANTUMSHIELD_HOST = "0.0.0.0"
python dashboard/app.py
```

Allow TCP port 5000 through the Windows firewall if prompted. Find PC 2's LAN
address with `ipconfig`. On **PC 1** (sender), set the identical secret and run:

```powershell
$env:QUANTUMSHIELD_DEMO_PSK = "replace-this-with-a-long-demo-secret"
python demo_sender.py --receiver http://PC2_LAN_IP:5000/api/demo/receive
```

The sender first runs the QKD simulation. A rejected QBER blocks the transfer;
an accepted simulation key encrypts the payload with AES-256-GCM. For a repeatable
attack demonstration, add `--eve`; this should normally cause the sender to block
the transfer.

The two-PC bridge wraps the *simulated* QKD key with the shared demo secret so
PC 2 can decrypt it. That bootstrap step is deliberately visible in the code and
is **not real QKD**. Real QKD requires compatible quantum hardware, a quantum
channel, and an authenticated classical channel. Use HTTPS/TLS, device identity,
secret rotation, and a real key-management design before any non-demo deployment.
