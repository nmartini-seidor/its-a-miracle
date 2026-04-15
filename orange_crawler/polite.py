from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen


DEFAULT_UA = "its-a-miracle-orange-product-research/0.1 (+https://www.orange.es/dispositivos)"


@dataclass
class FetchStats:
    request_count: int = 0
    retry_count: int = 0
    status_counts: dict[str, int] = field(default_factory=dict)
    backoff_events: list[dict[str, str | int | float]] = field(default_factory=list)


class PoliteFetcher:
    def __init__(self, user_agent: str = DEFAULT_UA, delay_range: tuple[float, float] = (1.5, 3.0), timeout: int = 25):
        self.user_agent = user_agent
        self.delay_range = delay_range
        self.timeout = timeout
        self._last_fetch_at = 0.0
        self.stats = FetchStats()
        self._robots: dict[str, RobotFileParser] = {}

    def _sleep(self) -> None:
        elapsed = time.monotonic() - self._last_fetch_at
        target = random.uniform(*self.delay_range)
        if elapsed < target:
            time.sleep(target - elapsed)

    def robots(self, url: str) -> RobotFileParser:
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        if base not in self._robots:
            rp = RobotFileParser()
            rp.set_url(base + "/robots.txt")
            try:
                rp.read()
            except Exception:
                # Fail closed for known disallowed internal paths, but do not block visible public pages if robots fetch fails.
                pass
            self._robots[base] = rp
        return self._robots[base]

    def can_fetch(self, url: str) -> bool:
        parsed = urlparse(url)
        if parsed.path.startswith("/on/") or parsed.path.startswith("/buscar"):
            return False
        if any(token in parsed.query for token in ("pmin", "pmax", "prefn", "prefv", "srule")):
            return False
        return self.robots(url).can_fetch(self.user_agent, url)

    def fetch_text(self, url: str, retries: int = 2) -> str:
        if not self.can_fetch(url):
            raise PermissionError(f"robots/disallowed path blocked: {url}")
        last_error: Exception | None = None
        for attempt in range(retries + 1):
            self._sleep()
            req = Request(url, headers={"User-Agent": self.user_agent, "Accept": "text/html,application/xhtml+xml"})
            self.stats.request_count += 1
            try:
                with urlopen(req, timeout=self.timeout) as response:
                    status = getattr(response, "status", 200)
                    self.stats.status_counts[str(status)] = self.stats.status_counts.get(str(status), 0) + 1
                    data = response.read()
                    self._last_fetch_at = time.monotonic()
                    return data.decode(response.headers.get_content_charset() or "utf-8", "replace")
            except Exception as exc:  # urllib HTTPError/URLError compatible
                last_error = exc
                self.stats.retry_count += 1
                wait = min(30.0, 2 ** attempt + random.random())
                self.stats.backoff_events.append({"url": url, "attempt": attempt, "wait": wait, "error": type(exc).__name__})
                time.sleep(wait)
        raise RuntimeError(f"failed to fetch {url}: {last_error}")
