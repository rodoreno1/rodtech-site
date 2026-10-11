# RodTech — sitio web

Sitio de **RodTech**: tecnología a la medida para negocios — automatización, sistemas
personalizados, apps, tiendas en línea, integraciones y paneles de control.

Contacto: WhatsApp [+52 953 134 2851](https://wa.me/529531342851)

## Estructura

```
rodtech-site/
├── index.html          Markup: nav fija con scrollspy, secciones one-page y el modal de demos
├── css/
│   └── styles.css      Todos los estilos (variables de color, layout, animaciones CSS)
├── js/
│   ├── app.js          Preloader, canvas de partículas, auroras, scrollspy, reveals
│   │                   con ScrollTrigger, tilt 3D, botones magnéticos, modal de demos
│   └── demos.js        Utilidades compartidas + el objeto DEMOS (6 mini-apps interactivas)
├── demos/              Versión de escritorio de las 6 mini-apps (páginas completas)
├── scripts/
│   └── cambiar-dominio.sh  Cambia la dirección del sitio en todos los archivos
├── video/              Deja aquí hero.mp4 y el fondo cinematográfico se activa
├── favicon.svg         Monograma R con el degradado de marca (fuente de los iconos)
├── og-image.png        1200×630, previsualización al compartir el enlace
├── site.webmanifest    Nombre, colores e iconos al instalar el sitio en el celular
├── sitemap.xml         Una sola URL (sitio de una página)
├── robots.txt          Indexación permitida
├── vercel.json         Cabeceras de seguridad y política de caché en Vercel
└── .gitignore
```

### Si cambias el dominio

La dirección del sitio aparece escrita de forma absoluta en `index.html`
(canonical, `og:url`, `og:image`, `twitter:image` y el JSON-LD),
`aviso-privacidad.html`, `sitemap.xml`, `robots.txt` y este README. No los edites
a mano: hay un script que los cambia todos juntos y actualiza la fecha del sitemap.

```bash
./scripts/cambiar-dominio.sh https://rodtech.com.mx
```

Se puede correr las veces que haga falta: primero con el subdominio de Vercel y
después con el dominio propio.

### Cómo se regeneraron los PNG

`og-image.png` y los iconos salen de SVG convertidos con
[sharp](https://sharp.pixelplumbing.com/). El SVG fuente de la imagen social y el
script de conversión no viven en el repo (son de un solo uso); si necesitas
rehacerlos, basta con volver a exportar desde `favicon.svg` a 32, 180, 192 y 512 px.

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

## Sistema de diseño: liquid glass

Las superficies (nav, tarjetas, CTA, chips) usan `.liquid-glass` o
`.liquid-glass-strong`. El borde luminoso **no es un `border`**: es un
`::before` con un degradado vertical recortado con `mask-composite: exclude`,
de modo que la luz es intensa arriba y abajo y se apaga a media altura —
imitando cómo un canto de vidrio real atrapa la luz.

Como el pseudo-elemento ocupa toda la caja, el contenido lleva
`position:relative; z-index:2` para quedar por encima.

Estas clases necesitan algo detrás que desenfocar: funcionan gracias al canvas
de partículas, las auroras y (si lo agregas) el video del hero.

## Tecnologías

- **GSAP 3.12.5 + ScrollTrigger** — preloader, reveals de secciones al hacer scroll,
  tilt 3D de tarjetas, botones magnéticos, auroras flotantes.
- **anime.js 3.2.2** — trazado del circuito SVG del hero, palabra rotativa letra por
  letra, iconos con rebote elástico, letras del logo que saltan.
- **Canvas** — fondo global de partículas conectadas que reaccionan al cursor.

Todas las animaciones respetan `prefers-reduced-motion: reduce`.

## El formulario de contacto

Vercel no recolecta formularios (Netlify sí lo hacía). El envío se arma en el
navegador: `js/app.js` compone un mensaje legible con lo que escribió la persona y
abre **WhatsApp** con el texto listo, que es por donde ya entran los demás clientes.
Nada se guarda en un servidor propio, y el aviso de privacidad lo dice tal cual.

Si más adelante quieres que los mensajes lleguen por correo, no hay que reescribir
nada: contrata un servicio de formularios (Formspree, Web3Forms, una función
serverless con Resend…) y pon su URL en el atributo `data-endpoint` del `<form>` de
`index.html`.

```html
<form class="contact-form" id="contactForm" data-endpoint="https://formspree.io/f/xxxxxxx">
```

Con eso el formulario hace `POST` ahí y lleva a `gracias.html`; si ese servicio
falla, el mensaje se va por WhatsApp de todos modos. Nunca se pierde un contacto.

## Despliegue en Vercel

Sitio 100% estático: **no hay comando de build ni dependencias que instalar**.

1. En [vercel.com/new](https://vercel.com/new) importa este repositorio de GitHub.
2. En *Framework Preset* elige **Other**. Deja vacíos *Build Command* y
   *Install Command*; *Output Directory* es la raíz (`.`).
3. Despliega. Cada `git push` a `main` vuelve a publicar solo.
4. El proyecto queda en `https://<nombre-del-proyecto>.vercel.app`. El nombre se
   cambia en *Settings → General → Project Name*, y el dominio propio se conecta
   en *Settings → Domains*.
5. Después de fijar la dirección definitiva, corre
   `./scripts/cambiar-dominio.sh https://esa-direccion` y haz commit.

`vercel.json` trae las cabeceras de seguridad y la política de caché: el HTML, el
CSS y el JS se revalidan siempre (los nombres no llevan hash de contenido, así que
con caché larga alguien seguiría viendo la versión vieja después de cada
despliegue), y los iconos y la imagen social se cachean una semana.
