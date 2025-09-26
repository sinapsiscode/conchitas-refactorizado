# Backend - Sistema de Cultivo de Conchas de Abanico

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Ejecutar servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start

# Solo JSON Server básico
npm run db
```

El servidor estará disponible en: **http://localhost:3001**

## 📋 Endpoints Disponibles

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

### Recursos (CRUD completo)
- `/users` - Usuarios
- `/sectors` - Sectores de cultivo
- `/batteries` - Baterías
- `/cultivationLines` - Líneas de cultivo
- `/lots` - Lotes de siembra
- `/monitoring` - Registros de monitoreo
- `/expenses` - Gastos
- `/harvests` - Cosechas
- `/income` - Ingresos
- `/inventory` - Inventario
- `/investments` - Inversiones
- `/notifications` - Notificaciones

## 🔑 Credenciales de Prueba

```
maricultor1@conchas.com / password123 (Rol: Maricultor)
admin@conchas.com / password123 (Rol: Admin)
investor1@conchas.com / password123 (Rol: Inversor)
```

## 📊 Base de Datos

La base de datos está en `db.json` y se puede:
- Ver completa en: http://localhost:3001/db
- Modificar directamente (los cambios se guardan automáticamente)

## 🔧 Configuración CORS

El servidor acepta peticiones desde:
- http://localhost:3000 (Create React App)
- http://localhost:5173 (Vite)

## 🛠️ Personalización

Para agregar más rutas personalizadas, editar `server.js` y agregar antes de `server.use(router)`.

## 📝 Notas

- Los tokens son simulados (base64), en producción usar JWT real
- Las contraseñas están en texto plano, en producción usar bcrypt
- La base de datos es un archivo JSON, en producción usar PostgreSQL/MongoDB