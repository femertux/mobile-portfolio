# Portafolio de Julio García Carballo

Portafolio Bento estático con páginas reutilizables de detalle y seis secciones en el Home: perfil, plataformas, herramientas, proyectos, formación y contacto. HTML, CSS, JavaScript nativo y `data.json`; sin instalación ni compilación.

## Revisar localmente

Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Abrir http://localhost:8000 y detener con Ctrl+C. Servir por HTTP; no abrir `index.html` con `file://`, porque el contenido se carga con `fetch`.

## Detalles de proyectos

Todas las tarjetas navegan a `project.html?project=<id>`. MiCHV tiene datos y galerías completos; los demás muestran el estado pendiente hasta agregar su JSON. Consulta [PROJECTS.md](./PROJECTS.md) para el formato de datos, capturas, tiendas y cómo añadir proyectos sin modificar HTML o JavaScript.

## Contenido y recursos

`data.json` contiene la descripción breve del perfil, cuatro plataformas, el distintivo separado de Kotlin Multiplatform, seis grupos de herramientas, cinco proyectos, formación e idiomas. La trayectoria laboral detallada está en el CV descargable; no se renderiza en la página. Contacto y metadatos están en `index.html`.

La fotografía y el PDF ya están incluidos. El encuadre de la fotografía se conserva mediante CSS, sin modificar el archivo original.

| Recurso | Ruta |
| --- | --- |
| Fotografía | `assets/profile/julio-garcia.jpg` |
| MiCHV | `assets/projects/michv/michv.webp` |
| Bi Banking | `assets/projects/bi-banking.png` |
| 13Go | `assets/projects/13go.png` |
| Aventón | `assets/projects/aventon.png` |
| Vive Health | `assets/projects/vive-health.png` |
| CV descargable | `assets/documents/julio-garcia-cv.pdf` |

Incorporar las imágenes de proyectos con esos nombres exactos, respetando mayúsculas y minúsculas. Las imágenes aparecen al recargar. Hasta entonces se muestran monogramas decorativos, sin iconos rotos. Se admiten PNG, JPEG, WebP, AVIF y SVG con rutas `./assets/...`; las imágenes de proyectos se muestran completas dentro de su área.

El PDF conserva el aviso de archivo ausente por si se mueve o elimina. La descarga y la fotografía mantienen sus referencias locales.

Para agregar enlaces reales a un proyecto, completar su propiedad `links`:

```json
"links": [
  { "label": "App Store", "url": "https://apps.apple.com/..." },
  { "label": "Google Play", "url": "https://play.google.com/..." }
]
```

Si `links` está vacío, no se muestran botones inactivos. Usar URLs HTTPS reales.

## SVG externos

Los iconos de plataformas y tecnologías se cargan como imágenes SVG desde la API pública de [Iconify](https://iconify.design/docs/api/svg.html), sin instalar librerías ni guardar SVG de tecnologías en el proyecto. La fotografía, el favicon y los SVG de contacto y formación conservan su implementación local.

Los mapas `technologyIcons`, `platforms[].icon` y `multiplatform.icon` incluyen URL, identificador de catálogo, tipo de representación y licencia. Solo se aceptan URLs HTTPS de `api.iconify.design` para los conjuntos Simple Icons y Lucide. No se inyecta HTML o SVG remoto en el documento.

| Uso | Colección / identificador | Tipo |
| --- | --- | --- |
| Android | `simple-icons:android` | Marca Android |
| iOS | `simple-icons:apple` | Marca Apple |
| Android TV | `lucide:tv` | Conceptual: televisión |
| tvOS | `lucide:tv-minimal` | Conceptual: pantalla |
| Kotlin Multiplatform | `lucide:layers` | Conceptual: multiplataforma |
| Kotlin | `simple-icons:kotlin` | Logo |
| Swift | `simple-icons:swift` | Logo |
| Compose | `simple-icons:jetpackcompose` | Logo |
| Firebase | `simple-icons:firebase` | Logo |
| Google Maps | `simple-icons:googlemaps` | Logo |
| SwiftUI | `lucide:layout-grid` | Conceptual: interfaces |
| Media3 | `lucide:film` | Conceptual: multimedia |
| Hilt | `lucide:git-fork` | Conceptual: dependencias |
| MVVM | `lucide:workflow` | Conceptual: arquitectura |
| Twilio | `lucide:messages-square` | Conceptual: comunicación |
| AVPlayer (preparado para uso futuro) | `lucide:video` | Conceptual: video |

No se presentan los iconos conceptuales como logos oficiales. En proyectos, el tooltip y el nombre accesible identifican la tecnología y el carácter conceptual del icono. Los tooltips se muestran al pasar el cursor y al enfocar con Tab. El color se fija en la URL; las superficies claras de los iconos mantienen su visibilidad en ambos temas sin cambiar los colores de marca.

Si un SVG falla o tarda más de diez segundos, se conserva un placeholder discreto, sin imágenes rotas y sin alterar las dimensiones. El nombre accesible y el tooltip siguen disponibles. No se muestran iniciales como reemplazo de iconos de plataformas.

### Fuentes y licencias

- [Simple Icons](https://simpleicons.org/): [CC0-1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md). Los logos y marcas siguen sujetos a los derechos y políticas de sus respectivos titulares.
- [Lucide](https://lucide.dev/): [ISC](https://lucide.dev/license). Iconos conceptuales, sin asociación con las marcas representadas.
- [Devicon](https://devicon.dev/) se revisó como alternativa; esta implementación no utiliza sus recursos.

Las URLs de catálogo están registradas junto a cada icono. La verificación de existencia en el catálogo no sustituye la comprobación HTTP de cada SVG desde la red de destino.

## Caché y publicación

Las referencias de CSS, JavaScript (incluido `shared.js`) y JSON usan `20261119-2` para evitar mezclas con archivos antiguos. En futuras actualizaciones, incrementar la versión de CSS y JS en `index.html` y la del JSON en `script.js` y `project.js`. Recargar con Cmd+Shift+R si se mantiene una copia antigua en el navegador.

Las rutas son relativas y compatibles con GitHub Pages en una subcarpeta. No se configuró ni ejecutó el despliegue. Publicar, cuando corresponda, HTML, CSS, JS, JSON y `assets/`; las carpetas vacías pueden no conservarse al subir a Git.

## Validación

- Comprobar escritorio, tablet y móvil en ambos temas, incluyendo anchos de 320, 390, 768, 1024 y 1440 px.
- Verificar que Plataformas mantenga dos columnas y dos filas, y KMP permanezca separado.
- Probar navegación por teclado, tooltips, foco, movimiento reducido y persistencia del tema.
- Confirmar las seis secciones, cinco proyectos y todos los grupos de herramientas.
- Bloquear un SVG: debe mantenerse el nombre accesible y aparecer el fallback sin saltos de tamaño.
- Bloquear `data.json`, comprobar el aviso y reintentar; confirmar la descarga del CV.
