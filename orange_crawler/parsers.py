from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from html import unescape
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from bs4.element import Tag

from .models import Attribute, AttributeGroup, ProductRecord

BASE = "https://www.orange.es"
PRODUCT_RE = re.compile(r"https?://www\.orange\.es/dispositivos/[^\"'<>\s]+?\.html|/dispositivos/[^\"'<>\s]+?\.html")
UNIT_RE = re.compile(r"^\s*([\d.,]+(?:\s*[×x]\s*[\d.,]+)*)\s*([A-Za-zÁÉÍÓÚáéíóúµ/]+)\s*$")


def clean(text: str | None) -> str:
    return " ".join(unescape(text or "").replace("\xa0", " ").split())


def slug_from_url(url: str) -> str:
    path = urlparse(url).path.rstrip("/").split("/")
    return path[-1] if path else ""


def visible_text(tag: Tag | None) -> str:
    return clean(tag.get_text(" ", strip=True)) if tag else ""


def parse_json_ld(soup: BeautifulSoup) -> list[object]:
    out: list[object] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        text = script.get_text(strip=True)
        if not text:
            continue
        try:
            out.append(json.loads(text))
        except json.JSONDecodeError:
            continue
    return out


def product_ld(soup: BeautifulSoup) -> dict:
    for obj in parse_json_ld(soup):
        target = obj
        if isinstance(obj, dict) and obj.get("@type") == "BuyAction":
            target = obj.get("object", {})
        if isinstance(target, dict) and target.get("@type") == "Product":
            return target
    return {}


def breadcrumb_from_ld(soup: BeautifulSoup) -> list[str]:
    for obj in parse_json_ld(soup):
        if isinstance(obj, dict) and obj.get("@type") == "BreadcrumbList":
            items = obj.get("itemListElement") or []
            names = [clean(item.get("name")) for item in items if isinstance(item, dict) and item.get("name")]
            if names:
                return names
    return []


def breadcrumb_from_dom(soup: BeautifulSoup) -> list[str]:
    crumbs = []
    for selector in ['nav[aria-label="breadcrumb"] a', '.breadcrumb a', '.breadcrumb li']:
        vals = [clean(el.get_text(" ", strip=True)) for el in soup.select(selector)]
        vals = [v for v in vals if v]
        if vals:
            crumbs = vals
            break
    return crumbs


def extract_breadcrumb(soup: BeautifulSoup) -> list[str]:
    return breadcrumb_from_ld(soup) or breadcrumb_from_dom(soup)


def navigation_path_from_breadcrumb(crumbs: list[str]) -> list[str]:
    normalized = []
    for crumb in crumbs:
        c = clean(crumb).lower()
        if c in {"inicio", "dispositivos"}:
            continue
        normalized.append(c.replace(" y ", "-").replace(" ", "-"))
    return normalized[:-1] if len(normalized) > 1 else normalized


def parse_navigation_links(html: str, base_url: str = BASE + "/dispositivos") -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"].split("#")[0])
        text = clean(a.get_text(" ", strip=True))
        parsed = urlparse(href)
        if not text or parsed.netloc != "www.orange.es" or not parsed.path.startswith("/dispositivos"):
            continue
        if href in seen or href.endswith(".html"):
            continue
        seen.add(href)
        links.append({"label": text, "url": href, "slug": slug_from_url(href)})
    return links


def parse_product_urls(html: str, listing_url: str) -> list[str]:
    urls = set()
    for match in PRODUCT_RE.findall(html):
        urls.add(urljoin(listing_url, match))
    return sorted(urls)


def parse_load_more_url(html: str, listing_url: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    link = soup.select_one("a.more[data-url]")
    if not link:
        return None
    return urljoin(listing_url, link.get("data-url"))


def parse_listing_total(html: str) -> int | None:
    text = clean(BeautifulSoup(html, "html.parser").get_text(" ", strip=True))
    for pattern in (r"(\d+)\s+resultados", r"(\d+)\s+productos", r"Mostrando\s+\d+\s+de\s+(\d+)"):
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def split_brand_name(h1: str, ld: dict) -> tuple[str | None, str | None]:
    brand_obj = ld.get("brand") if isinstance(ld, dict) else None
    brand = None
    if isinstance(brand_obj, dict):
        brand = clean(brand_obj.get("name")) or None
    elif isinstance(brand_obj, str):
        brand = clean(brand_obj) or None
    name = clean(ld.get("name")) if isinstance(ld, dict) else ""
    if not name:
        name = h1
    if brand and name.lower().startswith(brand.lower() + " "):
        name = clean(name[len(brand):])
    elif not brand and h1:
        parts = h1.split(maxsplit=1)
        if len(parts) == 2:
            brand, name = parts[0], parts[1]
    return brand, name or None


def parse_media(soup: BeautifulSoup, ld: dict) -> list[dict[str, str | None]]:
    media: list[dict[str, str | None]] = []
    image = ld.get("image") if isinstance(ld, dict) else None
    if image:
        media.append({"url": str(image), "alt": ld.get("name")})
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        alt = clean(img.get("alt")) or None
        if src and ("/images/" in src or "dw/image" in src):
            url = urljoin(BASE, src)
            if not any(m["url"] == url for m in media):
                media.append({"url": url, "alt": alt})
    return media[:10]


def parse_description(soup: BeautifulSoup) -> dict:
    meta = soup.find("meta", attrs={"name": "description"})
    og = soup.find("meta", attrs={"property": "og:description"})
    seo = clean((meta or og or {}).get("content") if (meta or og) else None) or None
    visible = None
    for node in soup.find_all(string=lambda s: bool(s and "La consola PlayStation" in s)):
        parent = node.parent if isinstance(node.parent, Tag) else None
        candidate = visible_text(parent)
        if len(candidate) > 80:
            visible = candidate
            break
    if not visible:
        # Generic fallback: pick the longest text block inside detailed info sections.
        candidates = []
        for div in soup.find_all(["p", "div"]):
            txt = visible_text(div)
            if 120 <= len(txt) <= 2500 and "cookie" not in txt.lower() and "inicia sesión" not in txt.lower():
                candidates.append(txt)
        visible = max(candidates, key=len, default=None)
    sources = []
    if visible:
        sources.append("detail_tab")
    if seo:
        sources.append("meta_description")
    return {"visible_text": visible, "seo_text": seo, "sources": sources}


def parse_unit(raw: str) -> tuple[str | bool | None, str | None]:
    raw_clean = clean(raw)
    if not raw_clean:
        return True, None
    m = UNIT_RE.match(raw_clean)
    if m:
        return m.group(1).replace(",", "."), m.group(2)
    return raw_clean, None


def parse_feature_tables(soup: BeautifulSoup) -> list[AttributeGroup]:
    groups: list[AttributeGroup] = []
    for table in soup.select("table.js-features-table"):
        # Prefer structured multi-thead tables; ignore duplicate flattened table if groups already found.
        current: AttributeGroup | None = None
        for child in table.children:
            if not isinstance(child, Tag):
                continue
            if child.name == "thead":
                title = visible_text(child)
                if title:
                    current = AttributeGroup(group=title, attributes=[])
                    groups.append(current)
            elif child.name == "tbody" and current is not None:
                for tr in child.find_all("tr", recursive=False):
                    cells = [visible_text(td) for td in tr.find_all(["td", "th"], recursive=False)]
                    cells = [c for c in cells if c]
                    if not cells:
                        continue
                    if len(cells) == 1:
                        name = cells[0]
                        value, unit = True, None
                        raw = name
                    else:
                        name, raw = cells[0], cells[1]
                        value, unit = parse_unit(raw)
                    current.attributes.append(Attribute(name=name, value=value, unit=unit, raw=raw, path=f"{current.group} / {name}"))
        if groups:
            break
    return groups


def flatten_groups(groups: list[AttributeGroup]) -> list[Attribute]:
    flat: list[Attribute] = []
    for group in groups:
        for attr in group.attributes:
            attr.path = attr.path or f"{group.group} / {attr.name}"
            flat.append(attr)
    return flat


def parse_product_detail(html: str, url: str, navigation_path: list[str] | None = None, listing_url: str | None = None, method: str = "static_html") -> ProductRecord:
    soup = BeautifulSoup(html, "html.parser")
    ld = product_ld(soup)
    h1 = visible_text(soup.find("h1"))
    brand, product_name = split_brand_name(h1, ld)
    item_no = clean(str(ld.get("sku", ""))) if isinstance(ld, dict) and ld.get("sku") else None
    if not item_no:
        m = re.search(r"/(MKP\d+|\d+)\.html", url)
        item_no = m.group(1) if m else None
    crumbs = extract_breadcrumb(soup)
    nav_path = navigation_path or navigation_path_from_breadcrumb(crumbs)
    groups = parse_feature_tables(soup)
    desc = parse_description(soup)
    text = clean(soup.get_text(" ", strip=True))
    availability = None
    for phrase in ["Este producto no está disponible actualmente", "En stock", "Sin stock"]:
        if phrase.lower() in text.lower():
            availability = phrase
            break
    seller = None
    m = re.search(r"Vendido por\s+([^\n\r]+?)(?:\s{2,}|$|\))", text)
    if m:
        seller = clean("Vendido por " + m.group(1))
    warnings = []
    if not groups:
        warnings.append("attributes_missing")
    if not desc.get("visible_text"):
        warnings.append("visible_description_missing")
    return ProductRecord(
        source="orange_es",
        source_url=url,
        retrieved_at=datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        navigation_path=nav_path,
        breadcrumb_path=crumbs,
        category_leaf=nav_path[-1] if nav_path else None,
        brand=brand,
        product_name=product_name,
        item_no=item_no,
        description=desc,
        attribute_groups=groups,
        flat_attributes=flatten_groups(groups),
        media=parse_media(soup, ld),
        availability_text=availability,
        seller_text=seller,
        discovered_paths=[nav_path] if nav_path else [],
        listing_url=listing_url,
        discovered_from_url=listing_url,
        extraction={"method": method, "page_template": "orange_product_detail_v1", "status": "ok", "warnings": warnings},
    )
