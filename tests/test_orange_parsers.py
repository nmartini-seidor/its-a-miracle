from __future__ import annotations

import json
import unittest
from pathlib import Path

from orange_crawler.models import AttributeGroup
from orange_crawler.parsers import parse_product_detail

PS5_HTML = """
<html><head>
<meta name="description" content="Estrena tu PlayStation 5 Chasis E Sony Blanco al mejor precio con Orange."/>
<script type="application/ld+json">{"@context":"http://schema.org/","@type":"BuyAction","object":{"@type":"Product","brand":{"@type":"Brand","name":"Sony"},"description":"PlayStation 5 Chasis E","sku":"3711191","image":"https://example.invalid/ps5.png","name":"PlayStation 5 Chasis E","url":"https://www.orange.es/dispositivos/gaming/sony/playstation-5-chasise-blanco/3711191.html"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio"},{"@type":"ListItem","position":2,"name":"Dispositivos"},{"@type":"ListItem","position":3,"name":"Gaming"},{"@type":"ListItem","position":4,"name":"PlayStation"},{"@type":"ListItem","position":5,"name":"PlayStation 5 Chasis E"}]}</script>
</head><body>
<h1 class="product-header">Sony PlayStation 5 Chasis E</h1>
<h2>Información detallada</h2>
<div>La consola PlayStation 5 Chasis E ofrece una nueva forma de disfrutar de los videojuegos, con un diseño más compacto y ligero.</div>
<table class="table js-features-table">
<thead><tr><th colspan="2">Sistema operativo</th></tr></thead><tbody><tr><td>Tipo de sistema operativo</td><td>Propio de PS5</td></tr></tbody>
<thead><tr><th colspan="2">Memoria</th></tr></thead><tbody><tr><td>Memoria interna (almacenamiento) (GB)</td><td>1000 GB</td></tr><tr><td>Memoria RAM (GB)</td><td>16 GB</td></tr></tbody>
<thead><tr><th colspan="2">Conectividad</th></tr></thead><tbody><tr><td>Wifi</td></tr><tr><td>Bluetooth</td></tr></tbody>
<thead><tr><th colspan="2">Características destacadas</th></tr></thead><tbody><tr><td>Comandos de voz</td></tr><tr><td>Wifi</td></tr><tr><td>Manos libres</td></tr><tr><td>MP4</td></tr></tbody>
<thead><tr><th colspan="2">Dimensiones</th></tr></thead><tbody><tr><td>Peso del dispositivo (gr)</td><td>3200 gr</td></tr><tr><td>Tamaño (largo x ancho x fondo) (mm)</td><td>358 × 96 × 216 mm</td></tr></tbody>
<thead><tr><th colspan="2">Conectores</th></tr></thead><tbody><tr><td>USB tipo C</td></tr></tbody>
<thead><tr><th colspan="2">Otros detalles</th></tr></thead><tbody><tr><td>Contenido de la caja</td><td>Mando inalámbrico 2 soportes horizontales Cable HDMI Cable USB Cable alimentación Astro´s Playroom (juego preinstalado)</td></tr></tbody>
</table>
</body></html>
"""


class ParserTests(unittest.TestCase):
    def test_ps5_fixture_expectations(self) -> None:
        expected = json.loads(Path("fixtures/orange/ps5.expected.json").read_text())
        record = parse_product_detail(PS5_HTML, expected["source_url"], navigation_path=["gaming", "playstation"])
        self.assertEqual(record.brand, expected["brand"])
        self.assertEqual(record.product_name, expected["product_name"])
        self.assertEqual(record.item_no, expected["item_no"])
        self.assertIn(expected["required_description_snippet"], record.description["visible_text"])
        groups = {group.group: group for group in record.attribute_groups}
        for group in expected["required_groups"]:
            self.assertIn(group, groups)
        attrs = {attr.path: attr for attr in record.flat_attributes}
        for path, value in expected["required_attributes"].items():
            self.assertIn(path, attrs)
            self.assertEqual(attrs[path].value, value)
        box = attrs["Otros detalles / Contenido de la caja"].raw
        for snippet in expected["required_box_contents"]:
            self.assertIn(snippet, box)


if __name__ == "__main__":
    unittest.main()
