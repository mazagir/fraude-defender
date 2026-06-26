import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

logger = logging.getLogger("aegisshield.event_bus")


class EventBus:
    """Async in-process pub/sub bus.

    Note: in-memory only — does not survive restarts or span multiple workers.
    Swap for Redis in production when scaling horizontally.
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, topic: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[topic].add(queue)
        return queue

    def unsubscribe(self, topic: str, queue: asyncio.Queue) -> None:
        self._subscribers[topic].discard(queue)

    async def publish(self, topic: str, event: dict[str, Any]) -> None:
        for queue in self._subscribers.get(topic, set()):
            await queue.put(event)

    def publish_sync(self, topic: str, event: dict[str, Any]) -> None:
        """Versión síncrona para usar desde endpoints FastAPI sync."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish(topic, event))
        except RuntimeError:
            pass


event_bus = EventBus()


def build_event(
    event_type: str,
    severity: str,
    message: str,
    source: str = "risk-engine",
    ioc: dict[str, str] | None = None,
    risk_score: int = 0,
) -> dict[str, Any]:
    return {
        "id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "event_type": event_type,
        "severity": severity,
        "risk_score": risk_score,
        "ioc": ioc or {"type": "unknown", "value": "N/A"},
        "message": message,
    }
