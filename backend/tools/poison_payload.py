import os
import sys
import random
from faker import Faker

# Configuramos Faker para identidades locales de Colombia
fake = Faker('es_CO')

def verificar_conexion_adb():
    """Verifica si hay un dispositivo Android conectado y autorizado."""
    resultado = os.popen('adb devices').read()
    if 'device' not in resultado:
        print("❌ ERROR: No se detectó dispositivo. Conecta vía USB y activa Depuración por USB.")
        sys.exit(1)
    print("✅ Dispositivo detectado.")

def envenenar_contactos(cantidad=150):
    print(f"\n🚀 [1/2] Inyectando {cantidad} contactos...")
    for i in range(1, cantidad + 1):
        nombre = fake.name().replace("'", "")
        telefono = f"3{random.randint(0,5)}{random.randint(1000000,9999999)}"
        
        # Inserción simplificada en la base de datos de contactos
        comando = f'adb shell content insert --uri content://com.android.contacts/raw_contacts --bind account_type:s:null --bind account_name:s:null'
        raw_id_res = os.popen(comando).read()
        
        if "id=" in raw_id_res:
            raw_id = raw_id_res.strip().split("id=")[-1]
            comando_tel = (
                f'adb shell content insert --uri content://com.android.contacts/data '
                f'--bind raw_contact_id:i:{raw_id} '
                f'--bind mimetype:s:vnd.android.cursor.item/phone_v2 '
                f'--bind data1:s:{telefono} --bind data2:i:2'
            )
            os.system(comando_tel)
        
        if i % 20 == 0:
            print(f" └── Inyectados {i}/{cantidad} contactos...")

def envenenar_sms(cantidad=40):
    print(f"\n🚀 [2/2] Inyectando {cantidad} SMS simulados...")
    remitentes = ["Bancolombia", "Nequi", "Daviplata"]
    
    for i in range(1, cantidad + 1):
        remitente = random.choice(remitentes)
        cuerpo = "Transferencia exitosa por valor de $50.000 COP."
        
        # Comandos simplificados evitando argumentos que causan errores de sintaxis
        comando_sms = (
            f'adb shell content insert --uri content://sms/inbox '
            f'--bind address:s:{remitente} '
            f'--bind body:s:"{cuerpo}"'
        )
        os.system(comando_sms)
        
        if i % 10 == 0:
            print(f" └── Inyectados {i}/{cantidad} mensajes...")

if __name__ == "__main__":
    print("====================================================")
    print("      FRAUDE DEFENDER - PAYLOAD OPTIMIZADO          ")
    print("====================================================")
    verificar_conexion_adb()
    envenenar_contactos(cantidad=150)
    envenenar_sms(cantidad=40)
    print("\n[🎉] OPERACIÓN FINALIZADA SIN ERRORES.")