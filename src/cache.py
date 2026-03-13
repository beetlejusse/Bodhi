"""Redis cache layer (Tier 2) — sub-millisecond reads for session and entity data."""

import json
import os

import redis


def _default_redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379")


class BodhiCache:
    """Cache-aside wrapper around Redis.

    Key patterns:
        entity:{company}     — company context (TTL 24h)
        session:{session_id} — live session scores/phase (TTL 2h)
    """

    def __init__(self, redis_url: str | None = None):
        url = redis_url or _default_redis_url()
        self.r = redis.from_url(url, decode_responses=True)

    def ping(self) -> bool:
        try:
            return self.r.ping()
        except redis.ConnectionError:
            return False

    # ── Entity cache ──────────────────────────────────────────────

    def get_entity(self, company: str) -> str | None:
        """Return cached company context or None on miss."""
        return self.r.get(f"entity:{company.lower().strip()}")

    def set_entity(self, company: str, context: str, ttl: int = 86400) -> None:
        self.r.setex(f"entity:{company.lower().strip()}", ttl, context)

    # ── Session cache ─────────────────────────────────────────────

    def save_session_state(
        self, session_id: str, data: dict, ttl: int = 7200,
    ) -> None:
        """Persist session snapshot (scores, phase, difficulty) in Redis."""
        self.r.setex(f"session:{session_id}", ttl, json.dumps(data))

    def get_session_state(self, session_id: str) -> dict | None:
        raw = self.r.get(f"session:{session_id}")
        if raw is None:
            return None
        return json.loads(raw)

    def delete_session(self, session_id: str) -> None:
        self.r.delete(f"session:{session_id}")
