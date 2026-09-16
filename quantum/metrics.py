class Metrics:

    def __init__(self):
        pass

    def average_qber(self, qber_values):
        if not qber_values:
            return 0
        return sum(qber_values) / len(qber_values)

    def maximum_qber(self, qber_values):
        if not qber_values:
            return 0
        return max(qber_values)

    def minimum_qber(self, qber_values):
        if not qber_values:
            return 0
        return min(qber_values)

    def attack_detection_rate(self, qber_values, threshold=0.11):
        if not qber_values:
            return 0

        detected = sum(1 for qber in qber_values if qber > threshold)
        return (detected / len(qber_values)) * 100

    def secure_rate(self, qber_values, threshold=0.11):
        if not qber_values:
            return 0

        secure = sum(1 for qber in qber_values if qber <= threshold)
        return (secure / len(qber_values)) * 100

    def calculate_telemetry_metrics(self, telemetry_history):
      
        if not telemetry_history:
            return {
                "avg_adaptive_threshold": 0.11,
                "fixed_fp_count": 0,
                "adaptive_fp_count": 0,
                "fixed_fp_rate": 0.0,
                "adaptive_fp_rate": 0.0,
                "adaptive_fn_rate": 0.0,
                "key_gen_time_avg_ms": 0.0,
                "sifted_key_len_avg": 0
            }

        total_runs = len(telemetry_history)
        avg_adaptive_threshold = sum(t["adaptive_threshold"] for t in telemetry_history) / total_runs
        
        fixed_fp_count = sum(1 for t in telemetry_history if t["eval"]["false_positive_fixed"])
        adaptive_fp_count = sum(1 for t in telemetry_history if t["eval"]["false_positive_adaptive"])
        
        fixed_fn_count = sum(1 for t in telemetry_history if t["eval"]["false_negative_fixed"])
        adaptive_fn_count = sum(1 for t in telemetry_history if t["eval"]["false_negative_adaptive"])

        avg_gen_time = sum(t["key_gen_time_ms"] for t in telemetry_history) / total_runs
        avg_key_len = sum(t["sifted_key_len"] for t in telemetry_history) / total_runs

        return {
            "avg_adaptive_threshold": round(avg_adaptive_threshold, 4),
            "fixed_fp_count": fixed_fp_count,
            "adaptive_fp_count": adaptive_fp_count,
            "fixed_fp_rate": round((fixed_fp_count / total_runs) * 100, 2),
            "adaptive_fp_rate": round((adaptive_fp_count / total_runs) * 100, 2),
            "fixed_fn_rate": round((fixed_fn_count / total_runs) * 100, 2),
            "adaptive_fn_rate": round((adaptive_fn_count / total_runs) * 100, 2),
            "key_gen_time_avg_ms": round(avg_gen_time, 2),
            "sifted_key_len_avg": round(avg_key_len, 1)
        }
