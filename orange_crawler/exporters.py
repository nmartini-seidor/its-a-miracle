from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterable

from .models import ProductRecord


def write_jsonl(path: Path, records: Iterable[ProductRecord]) -> int:
    count = 0
    with path.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")
            count += 1
    return count


def write_product_sources_csv(path: Path, records: list[ProductRecord]) -> None:
    fields = ["source", "source_url", "item_no", "navigation_path", "category_leaf", "breadcrumb_path", "brand", "product_name", "description_visible_text", "description_seo_text", "seller_text", "availability_text", "retrieved_at", "extraction_status"]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "source": r.source,
                "source_url": r.source_url,
                "item_no": r.item_no,
                "navigation_path": " / ".join(r.navigation_path),
                "category_leaf": r.category_leaf,
                "breadcrumb_path": " / ".join(r.breadcrumb_path),
                "brand": r.brand,
                "product_name": r.product_name,
                "description_visible_text": r.description.get("visible_text"),
                "description_seo_text": r.description.get("seo_text"),
                "seller_text": r.seller_text,
                "availability_text": r.availability_text,
                "retrieved_at": r.retrieved_at,
                "extraction_status": r.extraction.get("status"),
            })


def write_attributes_csv(path: Path, records: list[ProductRecord]) -> None:
    fields = ["item_no", "source_url", "navigation_path", "category_leaf", "group_name", "attribute_name", "attribute_path", "value", "unit", "raw_text", "position"]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for r in records:
            pos = 0
            for group in r.attribute_groups:
                for attr in group.attributes:
                    pos += 1
                    writer.writerow({
                        "item_no": r.item_no,
                        "source_url": r.source_url,
                        "navigation_path": " / ".join(r.navigation_path),
                        "category_leaf": r.category_leaf,
                        "group_name": group.group,
                        "attribute_name": attr.name,
                        "attribute_path": attr.path or f"{group.group} / {attr.name}",
                        "value": attr.value,
                        "unit": attr.unit,
                        "raw_text": attr.raw,
                        "position": pos,
                    })
