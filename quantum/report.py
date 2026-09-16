import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet


class Report:

    def __init__(self, base_dir=None):
        if base_dir:
            self.output_dir = os.path.join(base_dir, "reports")
            self.static_dir = os.path.join(base_dir, "static", "images")
        else:
            self.output_dir = "reports"
            self.static_dir = "static/images"

        os.makedirs(self.output_dir, exist_ok=True)

    def generate_report(
        self,
        total_runs,
        average_qber,
        maximum_qber,
        minimum_qber,
        attack_rate,
        secure_rate,
        adaptive_metrics=None,
        scenario_name="Custom Simulation"
    ):

        filename = os.path.join(self.output_dir, "QuantumShield_Report.pdf")
        doc = SimpleDocTemplate(filename)
        styles = getSampleStyleSheet()

        story = []

        story.append(
            Paragraph(
                "<b><font size=18 color='#0d6efd'>QuantumShield CyberDefense Technical Audit Report</font></b>",
                styles["Title"]
            )
        )

        story.append(
            Paragraph(
                "<b>BB84 Quantum Key Distribution & RSA-2048 Digital Signature Security</b>",
                styles["Heading2"]
            )
        )

        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                f"<b>Scenario Context:</b> {scenario_name} | <b>Generated on:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                styles["Normal"]
            )
        )

        story.append(Spacer(1, 15))

        story.append(
            Paragraph("<b>1. Executive Performance Summary</b>", styles["Heading2"])
        )

        table_data = [
            ["Metric Parameter", "Value", "Notes / Evaluation"],
            ["Total Simulation Runs", str(total_runs), "Monte Carlo BB84 iterations"],
            ["Average Observed QBER", f"{average_qber*100:.2f}%", f"Min: {minimum_qber*100:.1f}%, Max: {maximum_qber*100:.1f}%"],
            ["Traditional Fixed Threshold", "11.00%", "Static BB84 theoretical limit"],
            ["Adaptive Threat Threshold (Avg)", f"{adaptive_metrics['avg_adaptive_threshold']*100:.2f}%" if adaptive_metrics else "11.00%", "Dynamically adjusted to channel noise"],
            ["Fixed Threshold False Positive Rate", f"{adaptive_metrics['fixed_fp_rate']:.1f}%" if adaptive_metrics else "0.0%", "False attack alerts under high noise"],
            ["Adaptive Threat False Positive Rate", f"{adaptive_metrics['adaptive_fp_rate']:.1f}%" if adaptive_metrics else "0.0%", "Eliminated false alarms"],
            ["Avg Key Generation Time", f"{adaptive_metrics['key_gen_time_avg_ms']:.2f} ms" if adaptive_metrics else "N/A", "Sifted key agreement latency"],
            ["Avg Sifted Key Length", f"{adaptive_metrics['sifted_key_len_avg']:.1f} bits" if adaptive_metrics else "N/A", "Secret key output size"]
        ]

        t = Table(table_data, colWidths=[200, 100, 180])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d6efd')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
        ]))

        story.append(t)
        story.append(Spacer(1, 20))

        story.append(
            Paragraph("<b>2. Graphical Telemetry Analysis</b>", styles["Heading2"])
        )

        graph_files = [
            os.path.join(self.static_dir, "qber_threshold.png"),
            os.path.join(self.static_dir, "performance_metrics.png"),
            os.path.join(self.static_dir, "qber_plot.png"),
            os.path.join(self.static_dir, "security_status.png"),
            os.path.join(self.static_dir, "qber_histogram.png")
        ]

        for graph in graph_files:
            if os.path.exists(graph):
                story.append(Image(graph, width=450, height=220))
                story.append(Spacer(1, 15))

        story.append(
            Paragraph("<b>3. Security Analysis & Adaptive Threat Observation</b>", styles["Heading2"])
        )

        if adaptive_metrics and adaptive_metrics["fixed_fp_rate"] > 0 and adaptive_metrics["adaptive_fp_rate"] == 0:
            result = (
                "<b>CRITICAL SECURITY INNOVATION DEMONSTRATED:</b> The Traditional Fixed 11% Threshold produced a "
                f"<b>{adaptive_metrics['fixed_fp_rate']:.1f}% False Positive Rate</b> due to high channel noise. "
                "The Adaptive Threat Threshold dynamically calibrated to environmental noise, reducing False Positives to <b>0.0%</b> "
                "and successfully preserving legitimate key agreement without compromising security."
            )
        elif average_qber <= (adaptive_metrics['avg_adaptive_threshold'] if adaptive_metrics else 0.11):
            result = (
                "<b>SECURE CHANNEL CONFIRMED:</b> The communication channel is secure. The observed QBER is well within "
                "the Adaptive Threat Threshold. Generated keys are approved for AES-256 confidential enterprise payload encryption."
            )
        else:
            result = (
                "<b>EAVESDROPPING ATTACK CONFIRMED:</b> The observed QBER significantly exceeds the Adaptive Threat Threshold. "
                "The system detected measurement-induced quantum state collapse caused by Eve's intercept-resend attack. "
                "The QKD session has been terminated and key rejected."
            )

        story.append(Paragraph(result, styles["Normal"]))
        doc.build(story)