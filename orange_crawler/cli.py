from __future__ import annotations

import argparse
import json
from pathlib import Path

from .crawl import OrangeCrawler, PS5_URL, ProductTarget
from .exporters import write_attributes_csv, write_jsonl, write_product_sources_csv
from .polite import PoliteFetcher


def cmd_ps5(args: argparse.Namespace) -> None:
    crawler = OrangeCrawler(PoliteFetcher(delay_range=(0.0, 0.0)))
    record = crawler.fetch_product(ProductTarget(PS5_URL, ["gaming", "playstation"], "https://www.orange.es/dispositivos/playstation"))
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    write_jsonl(out / "products.jsonl", [record])
    write_product_sources_csv(out / "orange_product_sources.csv", [record])
    write_attributes_csv(out / "orange_product_attributes.csv", [record])
    print(json.dumps(record.to_dict(), ensure_ascii=False, indent=2))


def cmd_sample(args: argparse.Namespace) -> None:
    manifest = OrangeCrawler().run_sample(Path(args.output), max_products=args.max_products, max_categories=args.max_categories)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def cmd_navigation(args: argparse.Namespace) -> None:
    crawler = OrangeCrawler(PoliteFetcher(delay_range=(0.0, 0.0)))
    nav = crawler.discover_navigation()
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(nav, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"count": len(nav), "output": args.output}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Orange.es public product extractor")
    sub = parser.add_subparsers(required=True)
    p = sub.add_parser("ps5", help="Fetch and parse the PS5 golden product page")
    p.add_argument("--output", default="data/orange/runs/ps5")
    p.set_defaults(func=cmd_ps5)
    p = sub.add_parser("sample", help="Run a polite static sample extraction")
    p.add_argument("--output", required=True)
    p.add_argument("--max-products", type=int, default=20)
    p.add_argument("--max-categories", type=int, default=3)
    p.set_defaults(func=cmd_sample)
    p = sub.add_parser("navigation", help="Discover public navigation links")
    p.add_argument("--output", default="data/orange/navigation.json")
    p.set_defaults(func=cmd_navigation)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
