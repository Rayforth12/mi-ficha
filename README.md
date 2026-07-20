# Mi Ficha — Control de finanzas personales

App web con login, base de datos y gráficas para llevar el control de tus
ingresos y gastos. Pensada para que vos y quien más quiera usarla se
registren y cada quien vea solo sus propios datos.

**Stack usado (100% gratuito en el plan que vamos a usar):**
- [Next.js](https://nextjs.org) — el sitio web en sí
- [Supabase](https://supabase.com) — base de datos (Postgres) + login/registro de usuarios
- [Vercel](https://vercel.com) — hosting donde vive el sitio, gratis

---

## Paso 1 — Crear el proyecto en Supabase (base de datos + login)

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratis (podés usar tu cuenta de GitHub o Google).
2. Creá un **New Project**. Ponele un nombre (ej. "mi-ficha"), una contraseña para la base de datos (guardala en un lugar seguro) y elegí la región más cercana (ej. `us-east-1`).
3. Esperá 1-2 minutos a que el proyecto termine de crearse.
4. En el menú izquierdo, andá a **SQL Editor** → **New query**, pegá el contenido completo del archivo `supabase/schema.sql` (incluido en este proyecto) y hacé clic en **Run**. Esto crea la tabla de movimientos y las reglas de seguridad (cada usuario solo ve lo suyo).
5. Andá a **Project Settings → API**. Ahí vas a ver:
   - **Project URL**
   - **anon public key**

   Vas a necesitar esos dos valores en el paso 3.

6. (Opcional pero recomendado) En **Authentication → Providers**, confirmá que "Email" esté habilitado. Por defecto Supabase pide confirmar el correo antes de poder iniciar sesión — así ya viene configurado.

---

## Paso 2 — Subir el proyecto a GitHub

1. Creá una cuenta gratis en [github.com](https://github.com) si no tenés.
2. Creá un repositorio nuevo (puede ser privado), por ejemplo `mi-ficha-web`.
3. Subí todos los archivos de esta carpeta a ese repositorio. Si nunca usaste git, la forma más fácil es:
   - Instalá [GitHub Desktop](https://desktop.github.com/)
   - "Add Local Repository" → elegí esta carpeta → "Publish repository"

---

## Paso 3 — Poner el sitio en línea con Vercel (gratis)

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta con tu GitHub.
2. Hacé clic en **Add New → Project** y elegí el repositorio `mi-ficha-web`.
3. Antes de darle a "Deploy", abrí **Environment Variables** y agregá:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | el "Project URL" de Supabase (paso 1.5) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | el "anon public key" de Supabase (paso 1.5) |

4. Hacé clic en **Deploy**. En 1-2 minutos vas a tener una URL tipo `https://mi-ficha-web.vercel.app` que podés abrir desde cualquier celular o computadora.

Cada vez que subas un cambio a GitHub, Vercel vuelve a publicar el sitio automáticamente.

---

## Probarlo en tu computadora antes de publicarlo (opcional)

Si tenés Node.js instalado:

```bash
npm install
cp .env.local.example .env.local
# editá .env.local y pegá tu Project URL y anon key de Supabase
npm run dev
```

Abrí `http://localhost:3000`.

---

## Qué hay que configurar para correrlo y probarlo

Esto es lo único que tenés que tocar — todo lo demás ya está escrito:

1. **Crear el proyecto en Supabase** y correr `supabase/schema.sql` (Paso 1 arriba). Esto es lo único "manual" de verdad.
2. **Copiar 2 valores** de Supabase (Project URL y anon key) a:
   - `.env.local` si lo vas a correr en tu computadora, o
   - las Environment Variables de Vercel si lo vas a publicar directo.
3. Nada más. No hay que instalar base de datos, no hay que configurar servidor, no hay contraseñas de servidor que manejar — Supabase y Vercel se encargan de eso.

### Probar que todo funciona (checklist)

Una vez que tengas la URL (local o de Vercel), probá en este orden:

1. **Registro**: entrá a `/register`, creá una cuenta con tu correo real. Te va a llegar un correo de Supabase — hacé clic en el link para confirmar.
2. **Login**: iniciá sesión con esa cuenta en `/login`. Deberías caer en `/dashboard`.
3. **Agregar un gasto**: pestaña "Movimientos" → elegí "Gasto" → categoría "Antojos" → monto 1500 → descripción "Refresco" → Agregar gasto. Debería aparecer al instante en el recibo de abajo y en el total del mes.
4. **Editar ese gasto**: hacé clic en el ✎ junto al movimiento, cambiá el monto, "Guardar cambios" — debería actualizarse en el recibo y en las gráficas.
5. **Borrar**: hacé clic en el ✕ — debería desaparecer.
6. **Agregar un ingreso**: mismo proceso pero con "Ingreso" → "Salario quincenal".
7. **Revisar las gráficas**: deberían reflejar los movimientos que acabás de agregar (puede que necesites agregar movimientos en más de un mes para ver algo en "Ingresos vs. gastos" o "Balance acumulado").
8. **Pestaña Ahorros**: "+ Nuevo ahorro" → probá crear uno "Con meta" (ej. "Viaje" con meta ₡100,000) y uno "Sin meta" (ej. "Ahorro libre"). Agregale un aporte a cada uno con "+ Agregar aporte" y confirmá que la barra de progreso y el total se actualizan.
9. **Segunda cuenta**: registrate con otro correo (o pedile a otra persona que se registre) y confirmá que esa cuenta *no* ve tus movimientos ni tus ahorros — cada quien debe ver solo lo suyo.
10. **Cerrar sesión** y confirmar que te devuelve a `/login`, y que intentar entrar directo a `/dashboard` sin sesión te redirige a `/login`.

Si algún paso falla, lo más común es que falte alguna de las dos variables de entorno o que el script SQL no se haya corrido completo — revisá esos dos primero.

## Cómo funciona por dentro

- **`app/login` y `app/register`** — pantallas de inicio de sesión y registro (usan Supabase Auth). El registro pide confirmar el correo antes de poder entrar.
- **`app/dashboard`** — el panel principal: formulario para agregar movimientos, el "recibo" con el detalle del mes, y las 6 gráficas.
- **`middleware.js`** — protege `/dashboard`: si no iniciaste sesión, te manda a `/login`.
- **`supabase/schema.sql`** — la tabla `transactions` con Row Level Security: cada fila tiene un `user_id`, y las reglas de seguridad hacen que nadie pueda ver ni tocar los datos de otra persona, aunque compartan la misma app.
- **Categorías** están definidas en `lib/categories.js` — si querés agregar o cambiar categorías (ej. "Mascota", "Estudios"), es el único archivo que hay que tocar.

## Las 6 gráficas incluidas (pestaña Movimientos)

1. **Ingresos vs. gastos** — barras comparando los últimos 6 meses.
2. **Gastos por categoría** — dona con el desglose del mes que estás viendo.
3. **Balance acumulado** — cómo ha crecido (o bajado) tu balance total mes a mes.
4. **Categorías a través del tiempo** — barras apiladas para ver qué categoría se te dispara.
5. **Gastos por día** — dentro del mes actual, para detectar días de gasto fuerte.
6. **Tasa de ahorro mensual** — qué porcentaje de tus ingresos lográs ahorrar cada mes.

Además, la pestaña **Ahorros** tiene su propia gráfica de progreso hacia tus metas.

## Pestaña Ahorros

- Podés crear varios **"ahorros"** (potes), cada uno con o sin una meta de monto.
- **Con meta**: ves una barra de progreso, el % alcanzado y cuánto falta.
- **Sin meta**: ves el total acumulado, sin presión de una cifra objetivo — para el ahorro libre de "lo que sobre".
- Cada aporte queda con fecha y nota opcional, y podés ver el historial de aportes por ahorro o borrar cualquiera.

## Editar movimientos

En el recibo de "Movimientos", cada fila tiene un ✎ para editar (cambiar monto, categoría, descripción o fecha) y un ✕ para borrar.

## Límites gratuitos a tener en cuenta

- **Supabase free tier**: 500MB de base de datos y hasta 50,000 usuarios activos al mes — de sobra para uso personal o entre varias personas conocidas. Si el proyecto está **inactivo por 7 días seguidos**, se pausa automáticamente (se reactiva solo con un clic desde el panel de Supabase).
- **Vercel free tier**: más que suficiente para un sitio de uso personal, sin límite de tiempo.

## Ideas para más adelante

- Exportar el mes a Excel (puedo generarte ese botón cuando quieras).
- Notificación o resumen automático el día de pago.
- Transferir plata de un ahorro de vuelta a gastos (retiro parcial).
