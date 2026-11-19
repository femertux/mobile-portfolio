# Detalles de proyectos

Se utiliza una sola plantilla: `project.html?project=michv`. La lógica está en `project.js`, los estilos exclusivos del detalle en `project.css` y los helpers compartidos de tema, imágenes e iconos en `shared.js`.

## Índice del Home

El `data.json` de la raíz continúa siendo la fuente de las tarjetas Bento. Cada elemento de `projects` tiene un `id` estable, además de su resumen, plataformas, tecnologías e imagen. Por defecto, el ID coincide con su carpeta en `assets/projects/`. Se conservan los IDs históricos `bi-banking` y `vive-health`, resueltos a las carpetas `bibanking` y `vivehealth` respectivamente.

IDs actuales: `michv`, `bi-banking`, `13go`, `aventon`, `vive-health`.

No es necesario registrar una segunda ruta: la ubicación se obtiene como `assets/projects/<id>/data.json`, aplicando las dos equivalencias históricas anteriores. Los enlaces nuevos usan `project=bibanking` y `project=vivehealth`; las URLs anteriores también funcionan. El detalle solo carga IDs registrados en el índice principal. Se admiten letras minúsculas ASCII, números y guiones entre palabras, con máximo 64 caracteres. No se aceptan barras, puntos, espacios ni segmentos de ruta.

## JSON del detalle

`assets/projects/michv/data.json` es un ejemplo funcional con los datos reales. Solo `id` y `name` son obligatorios; las demás secciones son opcionales. Una sección vacía no se renderiza.

| Campo | Formato | Uso |
| --- | --- | --- |
| `id` | string | Debe coincidir con la carpeta (y el ID resuelto del índice principal). |
| `name` | string | Nombre no vacío. |
| `description` | string o string[] | Descripción; cada entrada es un párrafo. |
| `participation` | string o string[] | Dato opcional conservado para uso futuro; no se muestra una tarjeta independiente. |
| `platforms` | string[] | Plataformas realmente soportadas. |
| `features` | string[] | Funcionalidades documentadas. |
| `technologies` | string[] | Tecnologías o capacidades, respetando sus nombres. |
| `image` | string | Imagen principal relativa a la carpeta del proyecto. |
| `stores` | object[] | Enlaces de Google Play y/o App Store. |
| `galleries.mobile` | object[] | Capturas móviles. |
| `galleries.tv` | object[] | Capturas TV; no implica una galería separada de tvOS. |

Las rutas de imágenes son relativas a la carpeta del proyecto: `michv.webp`, `mobile/1.png` o `tv/1.png`. No usar rutas absolutas, `./`, `../`, URLs externas ni rutas de otros proyectos. Se aceptan PNG, JPEG, WebP, AVIF y GIF. Cada recurso se comprueba contra el directorio del proyecto antes de asignarlo a una imagen.

Una captura tiene este formato (ejemplo real de MiCHV):

```json
{
  "src": "mobile/1.png",
  "alt": "MiCHV — captura móvil 1",
  "width": 1260,
  "height": 2736
}
```

`width` y `height` son opcionales, pero se recomiendan con las dimensiones reales para reservar espacio antes de cargar. No cambian el encuadre: las capturas se muestran completas, sin deformar ni recortar.

Los enlaces tienen este formato:

```json
"stores": [
  {
    "type": "google-play",
    "label": "Google Play",
    "url": "https://play.google.com/store/apps/details?id=com.mdstrm.michv"
  },
  {
    "type": "app-store",
    "label": "App Store",
    "url": "https://apps.apple.com/cl/app/michv/id6479047173"
  }
]
```

Para perfiles de desarrollador Google Play también se acepta `/store/apps/developer?id=…`; debe indicarse como página del desarrollador mediante `label`.

`label` es opcional. Se validan HTTPS, dominio de la tienda y estructura de la URL. Los enlaces abren otra pestaña con `noopener noreferrer`. No se generan enlaces distintos para TV ni tiendas que no estén declaradas.

## Agregar un proyecto

1. Crear `assets/projects/<id>/`.
2. Agregar un JSON válido con `id`, `name` y la información real disponible; se puede tomar MiCHV como referencia y quitar las secciones no aplicables.
3. Colocar su imagen principal y las capturas en esa carpeta. Añadir cada captura al array `galleries.mobile` o `galleries.tv`; el sitio no escanea carpetas automáticamente.
4. Añadir su tarjeta a `projects` en el JSON raíz, con el mismo `id`, un resumen breve y la ruta de imagen usada en el Home.
5. Abrir `project.html?project=<id>`.

Para completar uno de los proyectos ya registrados, basta con agregar su JSON y sus recursos. No hay que editar HTML ni JavaScript. Si se desea cambiar su imagen o resumen del Home, editar únicamente esos campos en el JSON principal.

Las tecnologías del detalle se muestran como etiquetas de texto, respetando los nombres y el orden del JSON. Los iconos SVG de las tarjetas del Home se conservan. Las capturas no tienen leyendas visibles; mantienen sus textos alternativos, botones accesibles y navegación en lightbox.

## Estados y galería

- JSON inexistente: muestra «El detalle de este proyecto todavía no está disponible» y el nombre del índice, cuando existe.
- JSON incorrecto o estructura no válida: muestra un mensaje comprensible y permite reintentar; el error técnico queda en consola.
- ID incorrecto o desconocido: no se construye una ruta arbitraria.
- Imagen ausente: mantiene un placeholder; las demás imágenes y secciones continúan funcionando.
- Sin capturas, enlaces, tecnologías u otra sección opcional: esa sección se omite.

Las galerías permiten desplazamiento horizontal táctil. Una captura abre un diálogo con navegación cíclica dentro de su propia galería. Flechas izquierda/derecha cambian de captura, Escape cierra y Tab permanece dentro del diálogo. Al cerrar se devuelve el foco al botón de origen.

El regreso siempre apunta a `./index.html#proyectos`, incluso en una URL compartida. El Home resuelve ese ancla después de cargar sus tarjetas. El tema se comparte mediante la misma preferencia `portfolio-theme`.

## Probar localmente

Desde la raíz del proyecto:

```sh
python3 -m http.server 8000
```

Abrir:

- Home: http://localhost:8000/
- MiCHV: http://localhost:8000/project.html?project=michv
- 13Go: http://localhost:8000/project.html?project=13go
- Aventón: http://localhost:8000/project.html?project=aventon
- Vive Health: http://localhost:8000/project.html?project=vivehealth
- Bi Banking: http://localhost:8000/project.html?project=bibanking

No abrir el HTML con `file://`. Las rutas relativas permiten alojar el sitio en una subcarpeta de GitHub Pages.

Pruebas de rutas, esquema y enlaces, sin instalar dependencias:

```sh
node --test tests/project-detail.test.cjs
```
