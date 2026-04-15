from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class Attribute:
    name: str
    value: str | bool | None
    raw: str
    unit: str | None = None
    path: str | None = None


@dataclass
class AttributeGroup:
    group: str
    attributes: list[Attribute] = field(default_factory=list)


@dataclass
class ProductRecord:
    source: str
    source_url: str
    retrieved_at: str
    navigation_path: list[str]
    breadcrumb_path: list[str]
    category_leaf: str | None
    brand: str | None
    product_name: str | None
    item_no: str | None
    description: dict[str, Any]
    attribute_groups: list[AttributeGroup]
    flat_attributes: list[Attribute]
    media: list[dict[str, str | None]] = field(default_factory=list)
    availability_text: str | None = None
    seller_text: str | None = None
    discovered_paths: list[list[str]] = field(default_factory=list)
    listing_url: str | None = None
    discovered_from_url: str | None = None
    extraction: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
