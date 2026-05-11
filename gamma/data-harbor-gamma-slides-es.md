# DataHarbor by SEIDOR - Guion para presentacion comercial en Gamma

## Objetivo

Crear una presentacion comercial en espanol para vender DataHarbor by SEIDOR como una solucion de enriquecimiento y gobierno de calidad de datos de producto. La narrativa debe mostrar que mantener un catalogo actualizado es costoso, manual y dificil de escalar, y que DataHarbor reduce ese coste con agentes, evidencia, configuracion gobernada y sincronizacion controlada.

## Audiencia

- Directores de eCommerce, marketplace, operaciones de catalogo y data/product owners.
- Equipos que publican productos en Mirakl, Akeneo, Sales Layer, Salsify, inriver u otros sistemas PIM/marketplace.
- Compradores que necesitan entender impacto economico, riesgo operativo y facilidad de adopcion.

## Mensaje central

DataHarbor convierte un proceso manual de revision de catalogo en un flujo gobernado: importa productos, detecta gaps de calidad, lanza agentes para buscar evidencia externa, propone cambios trazables y permite aprobarlos antes de sincronizar con los sistemas de negocio.

## Estilo recomendado

- Idioma: espanol.
- Tono: ejecutivo, directo, orientado a ahorro operativo y mejora de conversion.
- Visual: limpio, premium SaaS, fondo claro para capturas y acentos azul DataHarbor / SEIDOR.
- Ritmo: problema -> coste -> solucion -> flujo -> gobierno -> impacto.
- Uso de capturas: una captura protagonista por slide cuando aplique, con callouts cortos.

## Mapa de screenshots disponibles

| Archivo | Funcionalidad | Uso recomendado |
| --- | --- | --- |
| `gamma/catalog-configuration.png` | Configuracion de integraciones del workspace | Inicio del flujo: conectar catalogo y fuentes |
| `gamma/catalog-baseline-schema-assignment.png` | Catalog baseline e importacion/asignacion de schemas | Importar productos y preparar revision |
| `gamma/product-triage-dashboard.png` | Dashboard de triage/calidad de catalogo | Ver calidad, prioridades y productos pendientes |
| `gamma/product-compare-empty-candidates.png` | Producto sin candidatos antes de lanzar agente | Estado inicial: gaps detectados |
| `gamma/research-agent-queue.png` | Cola de agentes de investigacion | Lanzamiento masivo y seguimiento de agentes |
| `gamma/product-data-comparison.png` | Comparacion Mirakl vs candidatos + evidencia | Resultado del agente con datos estructurados |
| `gamma/candidate-attribute-review.png` | Revision y aprobacion campo a campo | Control humano y aprobacion granular |
| `gamma/product-evidence-sources.png` | Fuentes de evidencia del producto | Trazabilidad de fuentes externas |
| `gamma/schema-configuration-overview.png` | Vista de schemas por categoria | Gobierno por tipo de producto |
| `gamma/schema-field-requirements-and-rules.png` | Reglas y campos requeridos/recomendados | Calidad, SEO y reglas por categoria |
| `gamma/aggregator-configuration-overview.png` | Aggregators con autoridad/confianza | Fuentes y niveles de confianza |
| `gamma/official-manufacturer-aggregator-settings.png` | Configuracion de un aggregator oficial | Reglas de autoridad, cobertura y dominios |

## Slides

### 1. Portada

- **Titulo:** DataHarbor by SEIDOR
- **Subtitulo:** Calidad de datos de producto con agentes, evidencia y control humano.
- **Tipo de contenido:** Hero/portada con logo DataHarbor y SEIDOR.
- **Visual:** Sin captura o con una composicion discreta de varias capturas en segundo plano.
- **Mensaje clave:** Tu catalogo puede moverse mas rapido sin perder control.

### 2. El problema: el catalogo cambia mas rapido que el equipo

- **Titulo:** La calidad del catalogo no escala con trabajo manual.
- **Contenido:**
  - Cada producto trae atributos, formatos, categorias y reglas distintas.
  - Cada campo incompleto retrasa publicacion, SEO, conversion y ventas.
  - El coste real no esta solo en corregir datos: esta en revisar, buscar, validar y sincronizar.
- **Tipo de contenido:** Slide de problema, texto ejecutivo + metric cards.
- **Visual:** Sin captura o fondo con fragmentos de tabla/productos.
- **Mensaje clave:** El mantenimiento manual crea deuda operativa.

### 3. Conecta tu catalogo y tus sistemas

- **Titulo:** Empieza conectando el ecosistema de producto.
- **Contenido:**
  - Conecta Mirakl y sistemas PIM como Akeneo, Salsify, inriver o Sales Layer.
  - Centraliza la configuracion de integraciones, investigacion, schemas, evidencia y export.
  - Mantiene el flujo preparado para operar con sistemas reales, no con hojas sueltas.
- **Tipo de contenido:** Captura + callouts.
- **Visual:** `gamma/catalog-configuration.png`
- **Callouts sugeridos:**
  - Integraciones listas para el workflow de catalogo.
  - Configuracion por workspace.
  - Preparado para sincronizacion gobernada.

### 4. Importa productos y asigna schemas

- **Titulo:** Importa el catalogo y prepara cada producto para revision.
- **Contenido:**
  - Los productos importados se clasifican por schema/categoria.
  - Se identifican productos que necesitan enriquecimiento.
  - El equipo ve warnings y readiness antes de iniciar trabajo manual.
- **Tipo de contenido:** Captura de tabla + 3 bullets.
- **Visual:** `gamma/catalog-baseline-schema-assignment.png`
- **Mensaje clave:** DataHarbor convierte una importacion en una cola priorizada de calidad.

### 5. Visualiza la calidad del catalogo

- **Titulo:** Prioriza por impacto, no por intuicion.
- **Contenido:**
  - Vista general de productos, gaps, candidatos y evidencia.
  - Filtros por necesidades de enriquecimiento, candidatos disponibles y warnings.
  - Puntuacion de calidad para decidir donde actuar primero.
- **Tipo de contenido:** Captura principal con callouts sobre metricas.
- **Visual:** `gamma/product-triage-dashboard.png`
- **Mensaje clave:** El equipo sabe que revisar y por que.

### 6. Detecta gaps antes de investigar

- **Titulo:** Cada producto muestra exactamente que falta.
- **Contenido:**
  - Comparacion del baseline Mirakl contra campos candidatos.
  - Estado inicial con campos missing y warnings.
  - Boton para lanzar agentes desde el producto cuando faltan datos.
- **Tipo de contenido:** Captura + microhistoria del flujo.
- **Visual:** `gamma/product-compare-empty-candidates.png`
- **Mensaje clave:** El sistema no solo reporta problemas; prepara la accion siguiente.

### 7. Lanza agentes para buscar datos externos

- **Titulo:** Agentes que investigan por ti, con trazabilidad.
- **Contenido:**
  - Un agente busca informacion externa relevante para cada producto.
  - Puede ejecutarse desde una ficha individual o en bloque para multiples productos.
  - Cada ejecucion queda en cola con estado, runner, evidencia y candidatos generados.
- **Tipo de contenido:** Captura de cola + iconografia de agentes.
- **Visual:** `gamma/research-agent-queue.png`
- **Callouts sugeridos:**
  - Ejecuciones activas y en cola.
  - Evidencia recogida.
  - Candidatos listos para revision.
- **Mensaje clave:** Pasas de trabajo manual repetitivo a investigacion asistida y escalable.

### 8. Recibe datos estructurados con evidencia

- **Titulo:** De fuentes externas a atributos listos para revisar.
- **Contenido:**
  - DataHarbor compara el valor actual, el candidato y la fuente.
  - Los atributos se mapean de forma estructurada: EAN, conectividad, peso, bateria, descripcion y mas.
  - La evidencia acompana cada propuesta para reducir discusiones y retrabajo.
- **Tipo de contenido:** Captura de comparacion + callouts de columnas.
- **Visual:** `gamma/product-data-comparison.png`
- **Mensaje clave:** El resultado no es texto suelto: son cambios mapeados al producto.

### 9. Mejora descripcion, SEO y atributos criticos

- **Titulo:** Mejora el contenido que impacta busqueda y conversion.
- **Contenido:**
  - Identifica baja calidad SEO y descripciones incompletas.
  - Propone descripciones enriquecidas, atributos tecnicos y campos faltantes.
  - Mantiene aprobacion humana antes de aplicar cambios.
- **Tipo de contenido:** Captura + antes/despues conceptual.
- **Visual:** `gamma/candidate-attribute-review.png`
- **Mensaje clave:** Mejor contenido sin sacrificar control editorial.

### 10. Revisa, aprueba y sincroniza

- **Titulo:** Control humano campo a campo.
- **Contenido:**
  - Aprueba o rechaza candidatos por atributo.
  - Conserva el baseline original y el candidato recomendado.
  - Prepara cambios aprobados para sincronizar con tus sistemas.
- **Tipo de contenido:** Captura de revision + bullets.
- **Visual:** `gamma/candidate-attribute-review.png`
- **Mensaje clave:** Los agentes aceleran; el equipo decide.

### 11. Evidencia visible para cada decision

- **Titulo:** Cada propuesta tiene una fuente detras.
- **Contenido:**
  - Se diferencian fuentes de retailer, fabricante y otras referencias.
  - La evidencia se vincula al producto y a los campos que soporta.
  - Los operadores pueden abrir la fuente para revisar el origen.
- **Tipo de contenido:** Captura + callouts de evidencia.
- **Visual:** `gamma/product-evidence-sources.png`
- **Mensaje clave:** La confianza viene de la fuente, no de una caja negra.

### 12. Schemas por tipo de producto

- **Titulo:** Cada categoria tiene sus propias reglas de calidad.
- **Contenido:**
  - Configura familias de schema para auriculares, smartphones, televisiones, tablets, laptops y mas.
  - Define campos requeridos, recomendados, warnings y scoring rules.
  - Permite que la calidad sea especifica por categoria.
- **Tipo de contenido:** Captura de configuracion + resumen de gobierno.
- **Visual:** `gamma/schema-configuration-overview.png`
- **Mensaje clave:** No todos los productos se revisan igual; DataHarbor lo entiende.

### 13. Reglas para calidad, SEO y scoring

- **Titulo:** Convierte criterio de negocio en reglas operativas.
- **Contenido:**
  - Campos requeridos y recomendados por schema.
  - Reglas de warning como brand missing, descripcion comercial ausente o campo requerido faltante.
  - Scoring rules para penalizar gaps de EAN, descripcion debil o informacion critica ausente.
- **Tipo de contenido:** Captura + lista de reglas.
- **Visual:** `gamma/schema-field-requirements-and-rules.png`
- **Mensaje clave:** La calidad deja de depender de memoria tribal.

### 14. Aggregators con confianza y autoridad

- **Titulo:** No todas las fuentes pesan igual.
- **Contenido:**
  - Define aggregators por autoridad: fabricante oficial, retailer, base tecnica, marketplace o referencia interna.
  - Asigna niveles de confianza, cobertura y uso actual.
  - Evita que fuentes de baja autoridad sobrescriban valores canonicos.
- **Tipo de contenido:** Captura + matriz de autoridad.
- **Visual:** `gamma/aggregator-configuration-overview.png`
- **Mensaje clave:** DataHarbor gobierna de donde viene cada dato y cuanto confiar en el.

### 15. Configura reglas por fuente

- **Titulo:** Fuentes oficiales con reglas claras.
- **Contenido:**
  - Define el tipo de fuente, URL base, autoridad, confianza y dominios de cobertura.
  - Controla si una fuente participa o no en el workflow de revision.
  - Ajusta la confianza por contexto y por categoria.
- **Tipo de contenido:** Captura de detalle + callouts.
- **Visual:** `gamma/official-manufacturer-aggregator-settings.png`
- **Mensaje clave:** La automatizacion es configurable, auditable y segura.

### 16. Impacto esperado

- **Titulo:** Menos coste operativo. Mas calidad. Mas velocidad.
- **Contenido:**
  - Reduce horas manuales de busqueda y comparacion.
  - Acelera publicacion de productos con datos completos.
  - Mejora SEO y conversion con atributos y descripciones mas completas.
  - Mantiene trazabilidad, governance y aprobacion humana.
- **Tipo de contenido:** Slide de beneficios con 4 metric cards.
- **Visual:** Composicion de `product-triage-dashboard.png`, `research-agent-queue.png` y `product-data-comparison.png`.
- **Mensaje clave:** DataHarbor convierte calidad de catalogo en una ventaja operativa.

### 17. Cierre

- **Titulo:** DataHarbor by SEIDOR
- **Subtitulo:** Agentes que enriquecen. Evidencia que respalda. Equipos que aprueban.
- **Contenido:**
  - Conecta tus catalogos.
  - Lanza agentes.
  - Revisa evidencia.
  - Sincroniza cambios con control.
- **Tipo de contenido:** Cierre comercial / call to action.
- **Visual:** Logo DataHarbor + SEIDOR + mini mosaico de capturas.
- **Mensaje clave:** La calidad del catalogo puede escalar sin perder control.

## Analisis comercial

### Fortalezas de venta

- **Dolor claro:** el comprador entiende rapido el problema: catalogos incompletos, mantenimiento manual, retrasos y coste operativo.
- **Demo concreta:** las capturas muestran producto real, no promesas genericas.
- **Diferenciacion:** agentes + evidencia + aprobacion humana evita el miedo a automatizacion opaca.
- **Gobierno:** schemas, reglas y aggregators convierten la solucion en plataforma operativa, no en feature aislada.
- **Integracion:** el slide de workspace conecta la historia con sistemas que el cliente ya conoce.

### Riesgos narrativos

- **Demasiada configuracion antes del valor:** si se muestran schemas/aggregators muy pronto, puede parecer complejo. Por eso van despues del flujo de valor.
- **Agentes sin control pueden generar desconfianza:** insistir en evidencia, aprobacion y sincronizacion controlada.
- **Falta de metricas reales:** no inventar ROI numerico; usar beneficios cualitativos o placeholders editables si Gamma requiere metricas.

### Recomendacion de estructura

La mejor estructura comercial es:

1. Dolor y coste oculto.
2. Conexion/importacion del catalogo.
3. Calidad y priorizacion.
4. Agentes y cola de ejecucion.
5. Evidencia, revision y aprobacion.
6. Gobierno por schemas y aggregators.
7. Impacto operativo y cierre.

Esta secuencia vende primero el resultado y despues justifica la robustez tecnica.

### Claims a evitar

- No prometer escritura automatica en Mirakl sin aprobacion humana.
- No afirmar porcentajes exactos de ahorro si no hay datos medidos.
- No presentar retailers como fuentes canonicas; deben ser apoyo salvo politica aprobada.
- No decir que la IA reemplaza al equipo; posicionarla como acelerador con control humano.

## Prompt recomendado para Gamma

Crear una presentacion comercial en espanol, formato widescreen 16:9, para vender DataHarbor by SEIDOR. La audiencia son directores de eCommerce, marketplace, operaciones de catalogo y product data owners. El objetivo es mostrar que mantener la calidad de datos de producto es caro, manual y dificil de escalar, y que DataHarbor reduce ese coste con agentes de investigacion, evidencia trazable, aprobacion humana, schemas por categoria, aggregators con niveles de confianza y sincronizacion controlada.

Usa un tono ejecutivo, claro y premium SaaS. Estilo visual limpio, fondo claro para capturas, acentos azul DataHarbor/SEIDOR, pocos textos por slide, titulares potentes y callouts sobre las capturas. No inventes metricas de ROI. Enfatiza ahorro operativo, velocidad de publicacion, mejora de SEO/conversion y gobierno de datos.

Crear 17 slides siguiendo el guion de este archivo. Usar las capturas indicadas como visual principal en cada slide cuando aplique. Mantener los nombres DataHarbor by SEIDOR, Mirakl, Akeneo, Salsify, inriver y Sales Layer tal como aparecen.
