import json
import os

# Ruta al archivo db.json
db_file = 'db.json'

# Leer el archivo actual
with open(db_file, 'r', encoding='utf-8') as f:
    db = json.load(f)

# Agregar nuevas colecciones si no existen
if 'categories' not in db:
    db['categories'] = []
    print("✅ Colección 'categories' agregada")

if 'pricing' not in db:
    db['pricing'] = []
    print("✅ Colección 'pricing' agregada")

if 'systemSettings' not in db:
    db['systemSettings'] = []
    print("✅ Colección 'systemSettings' agregada")

# Guardar el archivo actualizado
with open(db_file, 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print("\n✨ Colecciones agregadas exitosamente a db.json")
print("📌 Nuevas colecciones:")
print("  - categories")
print("  - pricing")
print("  - systemSettings")