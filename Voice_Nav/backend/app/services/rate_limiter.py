import time
from typing import Dict, Any, List
from collections import deque

class RateLimitTracker:
    """
    Real-world API Rate Limiter & Telemetry Tracker for Groq / Cloud AI models.
    Tracks RPM (Requests Per Minute), Daily Quotas, and Live Request Latency.
    """

    def __init__(self):
        # Groq Whisper free tier: 20 RPM, 2000 RPD
        # Groq LLM free tier: 30 RPM, 14400 RPD
        self.MAX_RPM = 20
        self.MAX_DAILY = 2000
        
        self.request_timestamps: deque = deque()
        self.total_requests: int = 0
        self.daily_requests: int = 0
        self.day_start_time: float = time.time()
        self.last_latency_ms: float = 0.0
        self.total_latency_ms: float = 0.0

    def _cleanup_old_timestamps(self, current_time: float):
        """Removes timestamps older than 60 seconds for accurate RPM calculation."""
        while self.request_timestamps and current_time - self.request_timestamps[0] > 60:
            self.request_timestamps.popleft()

        # Reset daily counter every 24 hours
        if current_time - self.day_start_time >= 86400:
            self.daily_requests = 0
            self.day_start_time = current_time

    def check_rate_limit(self) -> Dict[str, Any]:
        """Checks if current request rate is within safe operating limits."""
        now = time.time()
        self._cleanup_old_timestamps(now)
        
        current_rpm = len(self.request_timestamps)
        is_rpm_exceeded = current_rpm >= self.MAX_RPM
        is_daily_exceeded = self.daily_requests >= self.MAX_DAILY
        
        status = "NORMAL"
        if is_rpm_exceeded or is_daily_exceeded:
            status = "RATE_LIMITED"
        elif current_rpm >= self.MAX_RPM * 0.8:
            status = "WARNING"

        return {
            "status": status,
            "current_rpm": current_rpm,
            "max_rpm": self.MAX_RPM,
            "daily_requests": self.daily_requests,
            "max_daily": self.MAX_DAILY,
            "remaining_daily": max(0, self.MAX_DAILY - self.daily_requests),
            "is_limited": is_rpm_exceeded or is_daily_exceeded
        }

    def record_request(self, latency_ms: float):
        """Records a successful request timestamp and latency metric."""
        now = time.time()
        self.request_timestamps.append(now)
        self.total_requests += 1
        self.daily_requests += 1
        self.last_latency_ms = round(latency_ms, 2)
        self.total_latency_ms += latency_ms

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns comprehensive real-time telemetry metrics."""
        now = time.time()
        self._cleanup_old_timestamps(now)
        
        current_rpm = len(self.request_timestamps)
        avg_latency = round(self.total_latency_ms / max(self.total_requests, 1), 2)
        
        # Calculate seconds until minute resets
        oldest_in_window = self.request_timestamps[0] if self.request_timestamps else now
        reset_in_seconds = max(0, int(60 - (now - oldest_in_window))) if current_rpm > 0 else 0

        return {
            "rpm_used": current_rpm,
            "rpm_limit": self.MAX_RPM,
            "rpm_available": max(0, self.MAX_RPM - current_rpm),
            "daily_used": self.daily_requests,
            "daily_limit": self.MAX_DAILY,
            "daily_available": max(0, self.MAX_DAILY - self.daily_requests),
            "total_lifetime_requests": self.total_requests,
            "last_latency_ms": self.last_latency_ms,
            "avg_latency_ms": avg_latency,
            "rate_limit_status": "NORMAL" if current_rpm < self.MAX_RPM * 0.8 else ("WARNING" if current_rpm < self.MAX_RPM else "EXCEEDED"),
            "window_reset_seconds": reset_in_seconds
        }

rate_tracker = RateLimitTracker()
