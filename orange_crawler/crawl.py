from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

from .exporters import write_attributes_csv, write_jsonl, write_product_sources_csv
from .models import ProductRecord
from .parsers import BASE, parse_listing_total, parse_load_more_url, parse_navigation_links, parse_product_detail, parse_product_urls
from .polite import PoliteFetcher

SEED_LEAFS = [
    ("https://www.orange.es/dispositivos/videojuegos", ["gaming", "videojuegos"]),
    ("https://www.orange.es/dispositivos/playstation", ["gaming", "playstation"]),
    ("https://www.orange.es/dispositivos/nintendo-switch", ["gaming", "nintendo-switch"]),
    ("https://www.orange.es/dispositivos/xbox", ["gaming", "xbox"]),
    ("https://www.orange.es/dispositivos/monitores-gaming", ["gaming", "monitores-gaming"]),
    ("https://www.orange.es/dispositivos/moviles", ["smartphones", "moviles"]),
    ("https://www.orange.es/dispositivos/tablets", ["informatica", "tablets"]),
    ("https://www.orange.es/dispositivos/portatiles", ["informatica", "portatiles"]),
]

PS5_URL = "https://www.orange.es/dispositivos/gaming/sony/playstation-5-chasise-blanco/3711191.html"


@dataclass
class ProductTarget:
    url: str
    navigation_path: list[str]
    listing_url: str


@dataclass
class RunManifest:
    run_id: str
    started_at: str
    finished_at: str | None = None
    stop_reason: str | None = None
    target_product_budget: int = 0
    actual_unique_product_count: int = 0
    category_counts: dict[str, int] = field(default_factory=dict)
    duplicate_collapse_count: int = 0
    static_fetch_count: int = 0
    playwright_render_count: int = 0
    request_count: int = 0
    retry_count: int = 0
    status_counts: dict[str, int] = field(default_factory=dict)
    backoff_events: list[dict] = field(default_factory=list)
    warnings_count: int = 0
    sample_only: bool = True
    crawler_version: str = "0.1.0"

    def to_dict(self) -> dict:
        return asdict(self)


class OrangeCrawler:
    def __init__(self, fetcher: PoliteFetcher | None = None):
        self.fetcher = fetcher or PoliteFetcher()

    def discover_navigation(self) -> list[dict]:
        html = self.fetcher.fetch_text(BASE + "/dispositivos")
        links = parse_navigation_links(html)
        edges = [{"parent_url": BASE + "/dispositivos", "child_url": link["url"], "label": link["label"], "path": [link["slug"]]} for link in links]
        # Add known leafs from current public navigation evidence. Static pages do not expose every child reliably.
        known = {edge["child_url"] for edge in edges}
        for url, path in SEED_LEAFS:
            if url not in known:
                edges.append({"parent_url": BASE + "/dispositivos/" + path[0], "child_url": url, "label": path[-1], "path": path})
        return edges

    def _listing_candidates(self) -> list[tuple[str, list[str]]]:
        candidates: list[tuple[str, list[str]]] = []
        seen: set[str] = set()
        for url, path in SEED_LEAFS:
            if url not in seen:
                candidates.append((url, path))
                seen.add(url)
        try:
            for edge in self.discover_navigation():
                url = edge.get("child_url")
                path = edge.get("path") or [slug_from_url(url or "")]
                if url and url not in seen and not url.endswith(".html"):
                    candidates.append((url, path))
                    seen.add(url)
        except Exception:
            # Navigation discovery failure should not block known seed listings.
            pass
        return candidates

    def _sitemap_product_targets(self, known: set[str]) -> list[ProductTarget]:
        sitemap_url = "https://www.orange.es/sitemap_0-product.xml"
        try:
            xml = self.fetcher.fetch_text(sitemap_url)
        except Exception:
            return []
        urls = re.findall(r"<loc>(https://www\.orange\.es/dispositivos/[^<]+?\.html)</loc>", xml)
        targets: list[ProductTarget] = []
        for url in urls:
            canonical = re.sub(r"\?.*$", "", url)
            if canonical in known:
                continue
            parts = urlparse(canonical).path.strip("/").split("/")
            if len(parts) < 3 or parts[0] != "dispositivos":
                continue
            # URL-derived fallback path: category slug, preserving source as sitemap in listing_url.
            nav_path = [parts[1]]
            targets.append(ProductTarget(canonical, nav_path, sitemap_url))
        return targets

    def discover_product_targets(self, max_products: int = 20, max_categories: int = 3) -> tuple[list[ProductTarget], list[dict]]:
        targets: list[ProductTarget] = []
        listing_meta: list[dict] = []
        seen: set[str] = set()
        selected_leafs = self._listing_candidates()[:max_categories]
        per_category_cap = max(1, (max_products + max(1, len(selected_leafs)) - 1) // max(1, len(selected_leafs)))
        deferred: list[ProductTarget] = []
        for listing_url, nav_path in selected_leafs:
            try:
                html = self.fetcher.fetch_text(listing_url)
            except Exception as exc:
                listing_meta.append({"listing_url": listing_url, "navigation_path": nav_path, "error": type(exc).__name__, "message": str(exc)})
                continue
            urls = parse_product_urls(html, listing_url)
            listing_meta.append({"listing_url": listing_url, "navigation_path": nav_path, "static_product_count": len(urls), "reported_total": parse_listing_total(html), "load_more_url": parse_load_more_url(html, listing_url), "per_category_cap": per_category_cap})
            added_for_category = 0
            for url in urls:
                canonical = re.sub(r"\?.*$", "", url)
                if canonical in seen:
                    continue
                seen.add(canonical)
                target = ProductTarget(canonical, nav_path, listing_url)
                if added_for_category < per_category_cap and len(targets) < max_products:
                    targets.append(target)
                    added_for_category += 1
                else:
                    deferred.append(target)
        for target in deferred:
            if len(targets) >= max_products:
                break
            targets.append(target)
        if len(targets) < max_products:
            sitemap_added = 0
            for target in self._sitemap_product_targets(seen):
                if len(targets) >= max_products:
                    break
                seen.add(target.url)
                targets.append(target)
                sitemap_added += 1
            listing_meta.append({"listing_url": "https://www.orange.es/sitemap_0-product.xml", "navigation_path": ["sitemap_fallback"], "static_product_count": sitemap_added, "fallback_reason": "visible listing pages yielded fewer products than budget"})
        return targets, listing_meta

    def fetch_product(self, target: ProductTarget) -> ProductRecord:
        html = self.fetcher.fetch_text(target.url)
        return parse_product_detail(html, target.url, navigation_path=target.navigation_path, listing_url=target.listing_url, method="static_html")

    def run_sample(self, output_dir: Path, max_products: int = 20, max_categories: int = 3) -> dict:
        output_dir.mkdir(parents=True, exist_ok=True)
        started = datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")
        manifest = RunManifest(run_id=output_dir.name, started_at=started, target_product_budget=max_products, sample_only=True)
        navigation = self.discover_navigation()
        (output_dir / "navigation.json").write_text(json.dumps(navigation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        targets, listing_meta = self.discover_product_targets(max_products=max_products, max_categories=max_categories)
        (output_dir / "listing_meta.json").write_text(json.dumps(listing_meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        records: list[ProductRecord] = []
        warnings = []
        for target in targets:
            try:
                record = self.fetch_product(target)
                records.append(record)
                key = " / ".join(target.navigation_path)
                manifest.category_counts[key] = manifest.category_counts.get(key, 0) + 1
                if record.extraction.get("warnings"):
                    warnings.append({"url": target.url, "warnings": record.extraction.get("warnings")})
            except Exception as exc:
                warnings.append({"url": target.url, "error": type(exc).__name__, "message": str(exc)})
        write_jsonl(output_dir / "products.jsonl", records)
        write_product_sources_csv(output_dir / "orange_product_sources.csv", records)
        write_attributes_csv(output_dir / "orange_product_attributes.csv", records)
        with (output_dir / "warnings.jsonl").open("w", encoding="utf-8") as fh:
            for warning in warnings:
                fh.write(json.dumps(warning, ensure_ascii=False) + "\n")
        manifest.finished_at = datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")
        manifest.stop_reason = "sample_complete"
        manifest.actual_unique_product_count = len(records)
        manifest.static_fetch_count = self.fetcher.stats.request_count
        manifest.request_count = self.fetcher.stats.request_count
        manifest.retry_count = self.fetcher.stats.retry_count
        manifest.status_counts = self.fetcher.stats.status_counts
        manifest.backoff_events = self.fetcher.stats.backoff_events
        manifest.warnings_count = len(warnings)
        (output_dir / "manifest.json").write_text(json.dumps(manifest.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return manifest.to_dict()
