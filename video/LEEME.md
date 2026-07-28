# Video de fondo del hero

Deja aquí un archivo llamado **`hero.mp4`** y el fondo cinematográfico se
enciende solo. No hay que tocar código: `js/app.js` intenta cargar
`video/hero.mp4` al arrancar y, si el archivo no existe, se queda el fondo de
partículas sin mostrar ningún hueco negro.

Cuando el video sí carga, el sitio además baja la opacidad de las partículas y
la rejilla para que no compitan con la imagen.

## Qué video funciona bien aquí

| | |
|---|---|
| **Duración** | 8–15 segundos (se repite en bucle con fundido) |
| **Resolución** | 1920×1080 es suficiente; más pesa de más |
| **Peso** | Idealmente menos de 3 MB. Arriba de 5 MB el hero tarda en aparecer |
| **Formato** | MP4 (H.264) — es el que reproducen todos los navegadores |
| **Encuadre** | El video se ancla arriba y se recorta: lo importante debe estar en la parte superior |
| **Contenido** | Algo abstracto y oscuro. Sobre el video va una vela oscura, así que las escenas muy claras dejan el texto ilegible |

Sirven bien: tomas cenitales de un almacén, líneas de código desenfocadas,
maquinaria en movimiento, texturas abstractas violeta/cian.

## Comprimir antes de subirlo

Con [ffmpeg](https://ffmpeg.org):

```bash
ffmpeg -i original.mp4 -t 12 -an -vf "scale=1920:-2" -c:v libx264 -crf 30 -preset slow -movflags +faststart hero.mp4
```

- `-an` quita el audio (el video va silenciado de todos modos, y sin pista de
  audio pesa bastante menos)
- `-crf 30` es la palanca de calidad: sube el número para que pese menos
- `+faststart` mueve el índice al inicio para que empiece a reproducirse antes
  de descargarse completo

## Cómo funciona el bucle

El atributo `loop` del `<video>` está apagado a propósito. En su lugar,
`fadingVideo()` en `js/app.js` desvanece el video a 0 durante los últimos
0.55 s, lo regresa al segundo cero y lo vuelve a subir a 1. Así no se ve el
salto seco que deja el `loop` nativo.

La opacidad se anima con `requestAnimationFrame`, nunca con una transición
CSS, porque cada fundido debe poder arrancar desde donde quedó el anterior.
