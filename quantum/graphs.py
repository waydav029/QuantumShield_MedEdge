import os
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


class Graphs:

    def __init__(self, base_dir=None):
        if base_dir:
            self.output_dir = os.path.join(base_dir, "static", "images")
        else:
            self.output_dir = "static/images"
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_path(self, filename):
        return os.path.join(self.output_dir, filename)

    # -----------------------------
    # 1. QBER Trend Graph
    # -----------------------------
    def plot_qber(self, qber_values):
        plt.figure(figsize=(10, 4.5))
        qber_pct = [q * 100 for q in qber_values]
        sim_nums = list(range(1, len(qber_values) + 1))

        plt.plot(
            sim_nums,
            qber_pct,
            marker='o',
            markersize=3,
            color='#2563eb',
            linewidth=1.5,
            label='Observed QBER (%)'
        )

        plt.title("Quantum Bit Error Rate (QBER) Stream", fontsize=11, fontweight='bold')
        plt.xlabel("Simulation Run Index")
        plt.ylabel("Observed QBER (%)")
        plt.grid(True, linestyle='--', alpha=0.5)
        plt.tight_layout()

        plt.savefig(self._get_path("qber_plot.png"), dpi=150)
        plt.close()

    # -----------------------------
    # 2. Histogram
    # -----------------------------
    def plot_histogram(self, qber_values):
        plt.figure(figsize=(8, 4.5))
        qber_pct = [q * 100 for q in qber_values]
        
        plt.hist(
            qber_pct,
            bins=12,
            color='#0284c7',
            edgecolor='#0369a1',
            alpha=0.75
        )

        plt.title("QBER Distribution Density", fontsize=11, fontweight='bold')
        plt.xlabel("QBER (%)")
        plt.ylabel("Frequency (Runs)")
        plt.grid(True, linestyle='--', alpha=0.5)
        plt.tight_layout()

        plt.savefig(self._get_path("qber_histogram.png"), dpi=150)
        plt.close()

    # -----------------------------
    # 3. Security Decision Ratio (Pie Chart)
    # -----------------------------
    def plot_security_status(self, qber_values, threshold=0.11, telemetry_history=None):
        secure = 0
        attacked = 0

        if telemetry_history:
            for t in telemetry_history:
                if t["eval"]["key_accepted_adaptive"]:
                    secure += 1
                else:
                    attacked += 1
        else:
            for value in qber_values:
                if value <= threshold:
                    secure += 1
                else:
                    attacked += 1

        plt.figure(figsize=(5.5, 4.5))
        plt.pie(
            [secure, attacked],
            labels=[f"Accepted ({secure})", f"Rejected / Eve ({attacked})"],
            colors=['#059669', '#dc2626'],
            autopct="%1.1f%%",
            startangle=90,
            explode=(0.04, 0)
        )

        plt.title("Key Security Decision Ratio", fontsize=11, fontweight='bold')
        plt.tight_layout()

        plt.savefig(self._get_path("security_status.png"), dpi=150)
        plt.close()

    # -----------------------------
    # 4. QBER vs Adaptive AI Threshold vs Fixed 11% Benchmark Plot
    # -----------------------------
    def plot_threshold(self, qber_values, fixed_threshold=0.11, adaptive_threshold=0.11, telemetry_history=None):
        plt.figure(figsize=(10, 5))

        sim_nums = list(range(1, len(qber_values) + 1))
        qber_pct = [q * 100 for q in qber_values]
        fixed_pct = fixed_threshold * 100

        # Plot Observed QBER Line
        plt.plot(
            sim_nums,
            qber_pct,
            marker='o',
            markersize=3,
            color='#2563eb',
            linewidth=1.5,
            label="Observed QBER (%)"
        )

        # Plot Fixed 11% Threshold Line
        plt.axhline(
            y=fixed_pct,
            color='#dc2626',
            linestyle='--',
            linewidth=1.8,
            label=f"Fixed Baseline ({fixed_pct:.0f}%)"
        )

        # Plot Dynamic Adaptive Threshold Line
        if telemetry_history:
            adaptive_series = [t["adaptive_threshold"] * 100 for t in telemetry_history]
            plt.plot(
                sim_nums,
                adaptive_series,
                color='#059669',
                linestyle='-',
                linewidth=2.2,
                label="Adaptive Threat Threshold (Noise-Tuned)"
            )
        else:
            plt.axhline(
                y=adaptive_threshold * 100,
                color='#059669',
                linestyle='-',
                linewidth=2.2,
                label=f"Adaptive Threat Threshold ({adaptive_threshold*100:.1f}%)"
            )

        # Draw Scenario Region Divider Vertical Lines if 4 scenarios are present across runs
        total_runs = len(qber_values)
        if total_runs >= 4 and total_runs % 4 == 0:
            block_size = total_runs // 4
            scenario_names = ["Case 1: Secure", "Case 2: High Noise", "Case 3: Eve Attack", "Case 4: Noise + Eve"]
            for i in range(1, 4):
                divider_x = i * block_size + 0.5
                plt.axvline(x=divider_x, color='#94a3b8', linestyle=':', linewidth=1.2)

            for i in range(4):
                center_x = (i * block_size) + (block_size / 2) + 0.5
                plt.text(center_x, max(qber_pct) * 0.93 if max(qber_pct) > 0 else 30,
                         scenario_names[i], fontsize=8, fontweight='bold', ha='center',
                         bbox=dict(boxstyle='round,pad=0.2', facecolor='#f8fafc', edgecolor='#cbd5e1', alpha=0.85))

        plt.xlabel("Simulation Run Index")
        plt.ylabel("QBER / Threshold (%)")
        plt.title("Observed QBER vs. Adaptive Threat Threshold vs. Fixed 11% Baseline", fontsize=11, fontweight='bold')

        plt.legend(loc='upper right', fontsize=8)
        plt.grid(True, linestyle='--', alpha=0.5)
        plt.tight_layout()

        plt.savefig(self._get_path("qber_threshold.png"), dpi=150)
        plt.close()

    # -----------------------------
    # 5. Performance Comparison Metrics Chart (False Positives & False Negatives)
    # -----------------------------
    def plot_performance_metrics(self, telemetry_history=None):
        plt.figure(figsize=(9, 4.5))

        fixed_fp = 0.0
        adaptive_fp = 0.0
        fixed_fn = 0.0
        adaptive_fn = 0.0

        if telemetry_history:
            total_runs = len(telemetry_history)
            if total_runs > 0:
                fixed_fp_count = sum(1 for t in telemetry_history if t["eval"]["false_positive_fixed"])
                adaptive_fp_count = sum(1 for t in telemetry_history if t["eval"]["false_positive_adaptive"])
                fixed_fn_count = sum(1 for t in telemetry_history if t["eval"]["false_negative_fixed"])
                adaptive_fn_count = sum(1 for t in telemetry_history if t["eval"]["false_negative_adaptive"])

                fixed_fp = (fixed_fp_count / total_runs) * 100
                adaptive_fp = (adaptive_fp_count / total_runs) * 100
                fixed_fn = (fixed_fn_count / total_runs) * 100
                adaptive_fn = (adaptive_fn_count / total_runs) * 100

        categories = ["False Positive Rate (%)", "False Negative Rate (%)"]
        fixed_scores = [fixed_fp, fixed_fn]
        adaptive_scores = [adaptive_fp, adaptive_fn]

        x = np.arange(len(categories))
        width = 0.35

        rects1 = plt.bar(x - width/2, fixed_scores, width, label='Fixed 11% Baseline', color='#dc2626', alpha=0.85)
        rects2 = plt.bar(x + width/2, adaptive_scores, width, label='Adaptive Threat Threshold', color='#059669', alpha=0.85)

        plt.ylabel("Rate (%)")
        plt.title("Security Decision Reliability: Fixed 11% vs. Adaptive Threshold", fontsize=11, fontweight='bold')
        plt.xticks(x, categories, fontweight='bold')
        plt.legend(loc='upper right', fontsize=9)
        plt.grid(axis='y', linestyle='--', alpha=0.5)

        # Add bar value labels
        for rect in rects1:
            height = rect.get_height()
            plt.annotate(f'{height:.1f}%',
                         xy=(rect.get_x() + rect.get_width() / 2, height),
                         xytext=(0, 3),
                         textcoords="offset points",
                         ha='center', va='bottom', fontsize=8, fontweight='bold')

        for rect in rects2:
            height = rect.get_height()
            plt.annotate(f'{height:.1f}%',
                         xy=(rect.get_x() + rect.get_width() / 2, height),
                         xytext=(0, 3),
                         textcoords="offset points",
                         ha='center', va='bottom', fontsize=8, fontweight='bold')

        plt.tight_layout()
        plt.savefig(self._get_path("performance_metrics.png"), dpi=150)
        plt.close()

    # -----------------------------
    # 6. Summary Bar Chart
    # -----------------------------
    def plot_bar_chart(self, qber_values, threshold=0.11, telemetry_history=None):
        secure = 0
        attacked = 0

        if telemetry_history:
            for t in telemetry_history:
                if t["eval"]["key_accepted_adaptive"]:
                    secure += 1
                else:
                    attacked += 1
        else:
            for value in qber_values:
                if value <= threshold:
                    secure += 1
                else:
                    attacked += 1

        plt.figure(figsize=(5.5, 4.5))
        bars = plt.bar(
            ["Accepted Keys", "Rejected / Eve"],
            [secure, attacked],
            color=['#059669', '#dc2626'],
            width=0.5
        )
        
        plt.bar_label(bars, fmt='%d', padding=3, fontweight='bold')
        plt.title("Simulation Outcome Count", fontsize=11, fontweight='bold')
        plt.ylabel("Number of Runs")
        plt.grid(axis='y', linestyle='--', alpha=0.5)
        plt.tight_layout()

        plt.savefig(self._get_path("summary_bar.png"), dpi=150)
        plt.close()