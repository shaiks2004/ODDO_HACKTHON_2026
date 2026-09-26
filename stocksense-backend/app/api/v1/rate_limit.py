"""Small process-local sliding-window limiter for authentication endpoints."""

import math
import threading
import time
from collections import deque

from fastapi import HTTPException, Request, status

from app.core.config import settings


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._events: dict[tuple[str, str], deque[float]] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _parse_limit(value: str) -> tuple[int, float]:
        try:
            count_text, period_text = value.strip().lower().split("/", maxsplit=1)
            count = int(count_text)
            multipliers = {"second": 1, "minute": 60, "hour": 3600}
            unit = period_text.rstrip("s")
            period = multipliers[unit]
        except (ValueError, KeyError):
            raise RuntimeError("AUTH_RATE_LIMIT must use the form '<count>/minute'")
        if count < 0:
            raise RuntimeError("AUTH_RATE_LIMIT count cannot be negative")
        return count, float(period)

    def check(self, key: tuple[str, str]) -> None:
        limit, period = self._parse_limit(settings.auth_rate_limit)
        if limit == 0:
            return
        now = time.monotonic()
        cutoff = now - period
        with self._lock:
            events = self._events.setdefault(key, deque())
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= limit:
                retry_after = max(1, math.ceil(period - (now - events[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts. Try again later.",
                    headers={"Retry-After": str(retry_after)},
                )
            events.append(now)
            if len(self._events) > 2048:
                expired_keys = [
                    bucket for bucket, timestamps in self._events.items()
                    if not timestamps or timestamps[-1] <= cutoff
                ]
                for expired_key in expired_keys:
                    self._events.pop(expired_key, None)


auth_limiter = SlidingWindowLimiter()


def limit_auth_request(request: Request) -> None:
    auth_limiter.check((request.url.path, request.client.host if request.client else "unknown"))