# RodTech — sitio web

Sitio de **RodTech**: tecnología a la medida para negocios — automatización, sistemas
personalizados, apps, tiendas en línea, integraciones y paneles de control.

Fundador: Rodolfo David Bautista Reyes · WhatsApp [+52 953 134 2851](https://wa.me/529531342851)

## Estructura

```
rodtech-site/
├── index.html          Markup: nav, barra de pestañas, las 6 vistas y el modal de demos
├── css/
│   └── styles.css      Todos los estilos (variables de color, layout, animaciones CSS)
├── js/
│   ├── app.js          Preloader, canvas de partículas, auroras, pestañas, tilt 3D,
│   │                   botones magnéticos, apertura/cierre del modal
│   └── demos.js        successScreen() + el objeto DEMOS (6 mini-apps interactivas)
├── netlify.toml        Configuración de despliegue (sitio estático, sin build)
└── .gitignore
```

Sitio 100% estático: no hay paso de compilación ni dependencias que instalar.

### Orden de carga de los scripts

`index.html` carga GSAP + ScrollTrigger + anime.js desde CDN, luego `app.js` y después
`demos.js`. El orden importa por dos dependencias cruzadas:

- `demos.js` usa `money()` (definida en `app.js`) y la propia `successScreen()`.
- `app.js` usa `DEMOS` (definido en `demos.js`), pero solo dentro de `openDemo()`, que
  se ejecuta al hacer clic — para entonces ambos archivos ya están cargados.

Ambos son scripts clásicos, así que sus declaraciones de nivel superior comparten el
mismo ámbito global. **No les pongas `type="module"` ni `defer` sin revisar esto.**

## Desarrollo local

Los archivos son estáticos, pero conviene servirlos por HTTP (con `file://` algunos
navegadores restringen ciertas cosas). Con Node instalado:

```bash
npx serve rodtech-site
```

## Tecnologías

- **GSAP 3.12.5 + ScrollTrigger** — preloader, transición entre pestañas, píldora
  deslizante, tilt 3D de tarjetas, botones magnéticos, auroras flotantes.
- **anime.js 3.2.2** — trazado del circuito SVG del hero, palabra rotativa letra por
  letra, iconos con rebote elástico, letras del logo que saltan.
- **Canvas** — fondo global de partículas conectadas que reaccionan al cursor.

Todas las animaciones respetan `prefers-reduced-motion: reduce`.

## Despliegue

Ver la sección de despliegue más abajo o las instrucciones entregadas aparte.
El sitio se publica desde la raíz del repositorio, sin comando de build.
