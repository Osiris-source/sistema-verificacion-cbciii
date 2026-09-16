# Publicar el sistema por Internet con Cloudflare Tunnel

Tu PC actúa como servidor (ya corre Docker con el backend en :1337 y el frontend en :4200).
Cloudflare Tunnel expone esos puertos a un **dominio HTTPS fijo sin abrir puertos ni tener IP pública**.

Resultado final:
- `https://cbc.cbciii.eu.org`      -> la aplicación (frontend)
- `https://cbc-api.cbciii.eu.org`  -> la API de Strapi (el frontend la detecta sola)

---

## Estado actual (tu dominio ya está pedido)
Se registró la solicitud de **cbciii.eu.org** en eu.org. Aún NO está aprobado
(por eso ahora sale "non-existent domain"). La aprobación tarda **días (y a veces semanas/meses)**:
te llega por email. Mientras tanto puedes crear la cuenta de Cloudflare (Paso B).

---

## Paso A — Dominio (eu.org)

Sitio correcto: **https://nic.eu.org/** (sin `www`)
- Registro de cuenta: https://nic.eu.org/arf/ -> botón **Register**
- Login: https://nic.eu.org/arf/ (el usuario es el **handle** del email de activación, formato `XXXXX-FREE`, incluye el `-FREE`; NO es tu email)
- Revisa el **spam**: el email de activación a veces llega ahí.
- Si olvidaste la contraseña: https://nic.eu.org/arf/en/contact/reset/
- Si olvidaste el handle pero recuerdas el dominio: https://nic.eu.org/arf/en/contact/bydom

Cuando el dominio esté aprobado, edita su **nameserver (NS)** desde el panel de eu.org
("Modify nameservers") y pon los 2 de Cloudflare que te dará el Paso B.

---

## Paso B — Crear cuenta de Cloudflare (gratis)

1. Entra a https://dash.cloudflare.com/sign-up y crea tu cuenta.
2. "Add a site" -> escribe `cbciii.eu.org` -> plan **Free**.
   Si Cloudflare dice que no encuentra el dominio, dale "Continue" igual (quedará pendiente hasta que aprobemos el NS).
3. Cloudflare te mostrará **2 nameservers** (ej. `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
4. En eu.org cambia los nameservers de `cbciii.eu.org` por esos 2.
5. Espera a que Cloudflare muestre "Active". Ya tu dominio está en Cloudflare.

---

## Paso C — Crear el túnel (scripts listos en `cloudflared/`)

Desde PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File cloudflared\setup.ps1
```

Te pedirá:
1. Abrir el navegador para **iniciar sesión en tu cuenta de Cloudflare** (autoriza cloudflared).
2. Nombre del túnel: presiona Enter (= `cbciii`).
3. Tu dominio: `cbciii.eu.org`

El script crea el túnel, genera el `config.yml` y registra los subdominios `cbc` y `cbc-api`.

Probar ahora (ventana abierta):
```powershell
powershell -ExecutionPolicy Bypass -File cloudflared\run.ps1
```

Para que corra **siempre solo** (servicio de Windows — PowerShell como **Administrador**):
```powershell
powershell -ExecutionPolicy Bypass -File cloudflared\install-servicio.ps1
```

Quitar el servicio:
```powershell
powershell -ExecutionPolicy Bypass -File cloudflared\remove-servicio.ps1
```

---

## Para probar tu PC sin dominio (opcional)
```powershell
powershell -ExecutionPolicy Bypass -File cloudflared\prueba-rapida.ps1
```
Te da una URL `https://xxx.trycloudflare.com` aleatoria (cambia en cada reinicio). Solo prueba rápida.

---

## Problemas comunes con eu.org (login "contraseña incorrecta")
1. El **usuario es el handle `XXXXX-FREE`**, no el email. Incluye el `-FREE` y sin espacios.
2. La cuenta hay que **validarla** desde el email (revisa spam). Sin validar, el login falla.
3. Escribe la contraseña a mano (el autocompletado suele meter una vieja).
4. Recuperación: reset de contraseña `nic.eu.org/arf/en/contact/reset/` o buscar handle `.../bydom`.

---

## Requisitos importantes
- Tu PC debe estar encendida y con Docker + los contenedores corriendo (`docker compose up -d`).
- ===== SEGURIDAD =====
  - El panel de administración de Strapi queda público: `https://cbc-api.cbciii.eu.org/admin`. Cambia la contraseña del admin de Strapi y no uses credenciales débiles.
  - Cualquiera con la URL puede **crear evaluaciones** (el API es abierto, no pide login). Si lo necesitas, lo protegemos después con Cloudflare Access (email/Google).
  - Los reportes/contenidos serán visibles para quien tenga el enlace.

## Nota para el frontend
La aplicación detecta la URL de la API sola:
- En `localhost` -> usa `http://localhost:1337`.
- En dominio público -> usa `https://cbc-api.<mismo dominio>`.

Si algún día cambias los subdominios, puedes forzarlo sin tocar código añadiendo en `frontend/src/index.html` antes de `</head>`:
```html
<script>window.__API_URL__ = 'https://mi-api.midominio.com';</script>
```