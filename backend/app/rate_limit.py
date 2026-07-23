import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request

# In-memory sliding-window limiter keyed by client IP. This only holds a true
# limit per-process — fine for the current single-instance Railway deployment,
# but won't share state if the backend is ever scaled to multiple instances.
_buckets: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def rate_limit(max_requests: int, window_seconds: int):
    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{client_ip}"
        now = time.monotonic()

        with _lock:
            bucket = _buckets[key]
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= max_requests:
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            bucket.append(now)

    return dependency
