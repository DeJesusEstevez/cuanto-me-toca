# ¿Cuánto Me Toca? — Calculadora de Prestaciones Laborales RD

Calculadora web/PWA que le dice a cualquier trabajador dominicano, en segundos, **cuánto
dinero le corresponde** cuando lo despiden o renuncia: preaviso, cesantía, vacaciones,
salario de Navidad proporcional y participación en los beneficios (bonificación).

**Sitio 100% estático. $0 de costo. Sin backend. Sin base de datos.** Todo el cálculo
corre en el navegador del usuario. **Funciona offline** una vez cargada. Los datos que la
persona escribe (salario, fecha de entrada) **no se envían a ningún servidor**: se procesan
solo en su dispositivo.

> ⚖️ Es una herramienta **orientativa**, no asesoría legal. El monto final depende de la
> causa de terminación y de la revisión del Ministerio de Trabajo / un abogado. El sitio lo
> deja claro en el footer.

---

## 🧪 Cómo probar en local

Dos formas, elige la que te sea más fácil:

1. **Doble clic** en `index.html`. Abre en tu navegador y ya funciona (cálculo, PWA, todo).
2. **Servidor local** (recomendado para probar el Service Worker / modo offline):
   ```bash
   # dentro de la carpeta calculadora-prestaciones
   python -m http.server 8000
   ```
   Luego abre `http://localhost:8000`. Para probar offline: carga la página, apaga el WiFi
   y recárgala — debe seguir funcionando.

---

## 🚀 Desplegar GRATIS (elige una)

Cualquiera de estas te da una URL pública en minutos, sin tarjeta de crédito.

**Opción A — Netlify Drop (la más fácil, ~2 min):**
1. Entra a https://app.netlify.com/drop
2. Arrastra la carpeta **completa** `calculadora-prestaciones` a la página.
3. Listo: te da una URL tipo `algo.netlify.app`. Puedes conectar un dominio propio después.

**Opción B — Vercel:**
1. Sube la carpeta a un repositorio de GitHub.
2. En https://vercel.com → **Add New Project** → importa el repo → **Deploy**.
   No necesita configuración: es un sitio estático.

**Opción C — GitHub Pages:**
1. Crea un repositorio nuevo y sube estos archivos.
2. **Settings → Pages →** rama `main`, carpeta raíz (`/`) → **Save**.
3. En un par de minutos tendrás `tu-usuario.github.io/tu-repo`.

> ⚠️ **Al redesplegar, sube siempre la carpeta completa** para que viajen también
> `favicon.svg`, `og.png` y los iconos — los previews de WhatsApp/Facebook necesitan el
> `og.png`, y la PWA necesita el manifest y los iconos.

---

## 🖼️ Generar los iconos y la imagen social (PNG) — gratis, sin herramientas

El proyecto trae las **fuentes vectoriales** (`icon.svg`, `favicon.svg`, `og.svg`), pero
Google Play y los previews sociales necesitan **PNG**. No hace falta Photoshop ni webs raras:

1. Abre **`assets/generar-imagenes.html`** en tu navegador (doble clic).
2. Pulsa los botones para **dibujar y descargar**:
   - `icon-192.png` (icono PWA)
   - `icon-512.png` (icono PWA / Play Store)
   - `og.png` (1200×630, para compartir en redes y WhatsApp)
3. Guarda `icon-192.png` e `icon-512.png` en la **raíz** del proyecto (junto a `index.html`)
   y `og.png` también en la raíz. Vuelve a desplegar.

Todo se dibuja con `<canvas>` en tu propia máquina: cero costo, cero dependencias.

---

## 📦 Empaquetar para Google Play (Android TWA)

Una TWA (*Trusted Web Activity*) es tu PWA metida dentro de un `.aab` que subes a Play. El
usuario la instala como cualquier app y no ve barra de navegador.

**Requisitos previos:**
- La PWA **ya publicada en HTTPS** (Netlify/Vercel/Pages sirven HTTPS gratis).
- `manifest.webmanifest` válido con `name`, `short_name`, `icons` 192 y 512, `start_url`,
  `display: standalone` (ya viene listo).
- **`icon-512.png`** e **`icon-192.png`** generados (ver sección anterior).
- Una **política de privacidad** con URL pública (Play la exige). Puedes publicar una página
  simple diciendo: *"Esta app calcula prestaciones en tu dispositivo; no recolecta ni envía
  datos personales."*
- **Cuenta de Google Play Console: US$25, pago único** (una sola vez, de por vida).
- La app se **firma** (Play App Signing genera y guarda la clave; solo acéptalo).

**Camino recomendado — PWABuilder (sin instalar nada):**
1. Entra a https://www.pwabuilder.com
2. Pega la URL de tu PWA desplegada → **Start**.
3. Corrige lo que marque en rojo (casi todo ya está resuelto en este proyecto).
4. Pestaña **Android → Generate Package** → descarga el `.aab` + instrucciones de firma
   (`assetlinks.json` incluido).
5. Sube el **`assetlinks.json`** a tu sitio en la ruta `/.well-known/assetlinks.json`
   (así Android confirma que la web y la app son tuyas y quita la barra del navegador).
6. En **Play Console**: crea la app → sube el `.aab` → completa ficha, capturas y política
   de privacidad → envía a revisión.

**Alternativa — Bubblewrap (línea de comandos, más control):**
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU-URL/manifest.webmanifest
bubblewrap build          # genera el .aab firmado
```
Luego subes el `.aab` a Play Console igual que arriba.

> 💡 Consejo: publica primero como PWA y consigue usuarios reales. El paso a Play lo haces
> cuando ya tengas tracción; el TWA solo empaqueta la misma web.

---

## 📁 Lista de archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única: hero, el problema, la calculadora, cómo funciona/cómo gana dinero, FAQ, footer legal. |
| `styles.css` | Diseño con tokens CSS (paleta y tipografía propias del brand), responsive mobile-first, accesible. |
| `app.js` | Lógica de la calculadora (preaviso, cesantía, vacaciones, Navidad, bonificación), formato RD$ y registro del Service Worker. |
| `manifest.webmanifest` | Manifiesto PWA (nombre, iconos, colores, standalone) — base para instalar y para el TWA. |
| `sw.js` | Service Worker: cachea el app shell (cache-first) para uso offline; cache versionado. |
| `icon.svg` | Icono fuente maskable de la PWA. |
| `favicon.svg` | Icono de la pestaña del navegador. |
| `og.svg` | Fuente vectorial de la imagen social (1200×630). |
| `assets/generar-imagenes.html` | Página con `<canvas>` que dibuja y descarga `icon-192.png`, `icon-512.png` y `og.png`. |
| `README.md` | Este archivo. |
| `KIT-DE-VENTA.md` | Modelo de negocio, proyección, canales gratis y copys listos para promocionar. |

> Los PNG (`icon-192.png`, `icon-512.png`, `og.png`) **no vienen incluidos**: los generas tú
> con `assets/generar-imagenes.html` (ver arriba). Es parte del flujo $0.

---

## ⚖️ Aviso legal / privacidad

**¿Cuánto Me Toca?** es una herramienta informativa independiente. **No es asesoría legal
ni representa al Ministerio de Trabajo de la República Dominicana.** Los resultados son
estimados basados en el Código de Trabajo (Ley 16-92) y pueden variar según la causa de
terminación, tiempo trabajado y la revisión de un abogado o del Ministerio de Trabajo.
**Verifica siempre tu caso con un profesional.**

**Privacidad:** todos los cálculos ocurren en tu dispositivo. La app **no envía tus datos a
ningún servidor** y no los comparte con nadie. Si en el futuro se activa el historial, se
guarda solo en tu navegador (localStorage), en tu propio equipo.

---

**Contacto / soporte:** WhatsApp **829-441-8256** → https://wa.me/18294418256
