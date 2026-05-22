import random

# Listas de nombres y apellidos comunes en Colombia para máxima veracidad
NOMBRES = ["Juan", "Carlos", "Andres", "Luis", "Santiago", "Mateo", "Maria", "Ana", "Andrea", "Diana", "Sandra", "Camila", "Daniela", "Jose", "Jorge", "David"]
APELLIDOS = ["Rodriguez", "Martinez", "Gomez", "Lopez", "Gonzalez", "Hernandez", "Perez", "Sanchez", "Ramirez", "Torres", "Diaz", "Castro", "Mendoza", "Ospina"]
PREFIJOS_CELULAR = ["300", "301", "302", "304", "310", "311", "312", "313", "314", "315", "316", "317", "318", "320", "321", "322", "350"]

def generar_contacto_falso():
    """Generar un nombre completo y un número celular colombiano aleatorio."""
    nombre = random.choice(NOMBRES)
    if random.random() > 0.5:
        nombre += f" {random.choice(NOMBRES)}"
        
    apellido = f"{random.choice(APELLIDOS)} {random.choice(APELLIDOS)}"
    
    prefijo = random.choice(PREFIJOS_CELULAR)
    cuerpo_numero = "".join([str(random.randint(0, 9)) for _ in range(7)])
    telefono = f"+57{prefijo}{cuerpo_numero}"
    
    return {
        "nombre_completo": f"{nombre} {apellido}",
        "telefono": telefono
    }

def crear_archivo_vcard(cantidad=200):
    """
    Genera una cadena de texto en formato .vcf (vCard) 
    con la cantidad de contactos especificada.
    """
    contenido_vcf = ""
    
    for _ in range(cantidad):
        contacto = generar_contacto_falso()
        
        contenido_vcf += "BEGIN:VCARD\n"
        contenido_vcf += "VERSION:3.0\n"
        contenido_vcf += f"FN:{contacto['nombre_completo']}\n"
        contenido_vcf += f"TEL;TYPE=CELL:{contacto['telefono']}\n"
        contenido_vcf += "END:VCARD\n"
        
    return contenido_vcf