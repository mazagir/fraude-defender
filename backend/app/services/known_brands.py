"""
Base de datos de marcas oficiales y dominios legítimos de Latinoamérica.

Se usa para verificar si un dominio analizado coincide con una entidad real
(banco, fintech, operador, comercio) o si es una imitación fraudulenta
(typosquatting / dominio suplantado).

Cada entrada contiene:
- name: nombre comercial de la entidad
- country: país principal
- kind: tipo de entidad (banco, fintech, telecom, comercio, gobierno)
- domains: dominios oficiales legítimos (raíz, sin www/http)
"""

KNOWN_BRANDS = [
    # Colombia
    {"name": "Bancolombia", "country": "CO", "kind": "banco",
     "domains": ["bancolombia.com", "bancolombia.com.co", "grupobancolombia.com"]},
    {"name": "Nequi", "country": "CO", "kind": "fintech",
     "domains": ["nequi.com.co", "nequi.com"]},
    {"name": "Daviplata", "country": "CO", "kind": "fintech",
     "domains": ["daviplata.com", "davivienda.com"]},
    {"name": "BBVA Colombia", "country": "CO", "kind": "banco",
     "domains": ["bbva.com.co", "bbva.co"]},
    {"name": "Banco de Bogotá", "country": "CO", "kind": "banco",
     "domains": ["bancobogota.com", "bancodebogota.com.co"]},
    {"name": "Banco Popular Colombia", "country": "CO", "kind": "banco",
     "domains": ["bancopopular.com.co"]},
    {"name": "Banco AV Villas", "country": "CO", "kind": "banco",
     "domains": ["bancoavvillas.com.co"]},
    {"name": "Colpatria / Scotiabank", "country": "CO", "kind": "banco",
     "domains": ["colpatria.com", "scotiabankcolpatria.com"]},
    {"name": "Banco Agrario", "country": "CO", "kind": "banco",
     "domains": ["bancoagrario.gov.co"]},
    {"name": "Bancamia", "country": "CO", "kind": "banco",
     "domains": ["bancamia.com.co"]},
    {"name": "Movii", "country": "CO", "kind": "fintech",
     "domains": ["movii.com.co"]},
    {"name": "Addi", "country": "CO", "kind": "fintech",
     "domains": ["addi.com"]},
    {"name": "Rappi", "country": "CO", "kind": "comercio",
     "domains": ["rappi.com", "rappi.com.co"]},
    # México
    {"name": "Banorte", "country": "MX", "kind": "banco",
     "domains": ["banorte.com", "banorte.com.mx"]},
    {"name": "BBVA México", "country": "MX", "kind": "banco",
     "domains": ["bbva.mx"]},
    {"name": "Santander México", "country": "MX", "kind": "banco",
     "domains": ["santander.com.mx"]},
    {"name": "Banamex", "country": "MX", "kind": "banco",
     "domains": ["banamex.com"]},
    {"name": "HSBC México", "country": "MX", "kind": "banco",
     "domains": ["hsbc.com.mx"]},
    {"name": "Coppel", "country": "MX", "kind": "comercio",
     "domains": ["coppel.com"]},
    {"name": "Elektra", "country": "MX", "kind": "comercio",
     "domains": ["elektra.com.mx"]},
    {"name": "MercadoPago", "country": "MX", "kind": "fintech",
     "domains": ["mercadopago.com.mx", "mercadolibre.com.mx"]},
    {"name": "Nu México", "country": "MX", "kind": "fintech",
     "domains": ["nu.com.mx"]},
    # Argentina
    {"name": "Banco Nación", "country": "AR", "kind": "banco",
     "domains": ["bna.com.ar"]},
    {"name": "Banco Provincia", "country": "AR", "kind": "banco",
     "domains": ["provincianet.com.ar"]},
    {"name": "Galicia", "country": "AR", "kind": "banco",
     "domains": ["banco Galicia", "banco galicia", "galicia.com.ar", "banco-galic"]},
    {"name": "Santander Argentina", "country": "AR", "kind": "banco",
     "domains": ["santander.com.ar"]},
    {"name": "BBVA Argentina", "country": "AR", "kind": "banco",
     "domains": ["bbva.com.ar"]},
    {"name": "MercadoPago Argentina", "country": "AR", "kind": "fintech",
     "domains": ["mercadopago.com.ar", "mercadolibre.com.ar"]},
    {"name": "Ualá", "country": "AR", "kind": "fintech",
     "domains": ["uala.com.ar"]},
    {"name": "Naranja X", "country": "AR", "kind": "fintech",
     "domains": ["naranjax.com"]},
    {"name": "Personal Pay", "country": "AR", "kind": "fintech",
     "domains": ["personalpay.com.ar"]},
    # Chile
    {"name": "Banco de Chile", "country": "CL", "kind": "banco",
     "domains": ["bancochile.cl", "banco de chile", "bancodechile"]},
    {"name": "Banco Estado", "country": "CL", "kind": "banco",
     "domains": ["bancoestado.cl"]},
    {"name": "Banco Santander Chile", "country": "CL", "kind": "banco",
     "domains": ["santander.cl"]},
    {"name": "BBVA Chile", "country": "CL", "kind": "banco",
     "domains": ["bbva.cl"]},
    {"name": "Banco BCI", "country": "CL", "kind": "banco",
     "domains": ["bci.cl"]},
    {"name": "Banco Falabella", "country": "CL", "kind": "banco",
     "domains": ["bancofalabella.cl"]},
    {"name": "MercadoPago Chile", "country": "CL", "kind": "fintech",
     "domains": ["mercadopago.cl"]},
    {"name": "Ripley", "country": "CL", "kind": "comercio",
     "domains": ["ripley.cl"]},
    {"name": "Cencosud / Paris", "country": "CL", "kind": "comercio",
     "domains": ["paris.cl", "cencosud.cl"]},
    # Perú
    {"name": "Banco de Crédito del Perú", "country": "PE", "kind": "banco",
     "domains": ["viabcp.com", "bcp.com.pe"]},
    {"name": "Banco Interbank", "country": "PE", "kind": "banco",
     "domains": ["interbank.pe"]},
    {"name": "BBVA Perú", "country": "PE", "kind": "banco",
     "domains": ["bbva.pe", "bbvacontinental.pe"]},
    {"name": "Banco de la Nación", "country": "PE", "kind": "banco",
     "domains": ["bn.com.pe"]},
    {"name": "Scotiabank Perú", "country": "PE", "kind": "banco",
     "domains": ["scotiabank.com.pe"]},
    {"name": "Yape", "country": "PE", "kind": "fintech",
     "domains": ["yape.com.pe", "yape.pe"]},
    {"name": "Plin", "country": "PE", "kind": "fintech",
     "domains": ["plin.pe"]},
    # Ecuador
    {"name": "Banco Pichincha", "country": "EC", "kind": "banco",
     "domains": ["pichincha.com", "bancopichincha.com"]},
    {"name": "Banco Guayaquil", "country": "EC", "kind": "banco",
     "domains": ["banco guayaquil", "bancoguayaquil.com", "guayaquil.com"]},
    {"name": "Banco Produbanco", "country": "EC", "kind": "banco",
     "domains": ["produbanco.com"]},
    {"name": "Banco del Austro", "country": "EC", "kind": "banco",
     "domains": ["austro.com.ec"]},
    # Paraguay
    {"name": "Itaú Brasil", "country": "BR", "kind": "banco",
     "domains": ["itau.com.br", "itau.com"]},
    {"name": "Banco Itaú Paraguay", "country": "PY", "kind": "banco",
     "domains": ["itau.com.py"]},
    {"name": "Banco Continental", "country": "PY", "kind": "banco",
     "domains": ["bancocontinental.com.py"]},
    {"name": "Banco de la Nación Argentina", "country": "PY", "kind": "banco",
     "domains": []},
    # Uruguay
    {"name": "Banco República", "country": "UY", "kind": "banco",
     "domains": ["brou.com.uy"]},
    {"name": "Santander Uruguay", "country": "UY", "kind": "banco",
     "domains": ["santander.com.uy"]},
    # Venezuela
    {"name": "Banco de Venezuela", "country": "VE", "kind": "banco",
     "domains": ["bancodevenezuela.com"]},
    # Costa Rica
    {"name": "Banco Nacional", "country": "CR", "kind": "banco",
     "domains": ["bncr.fi.cr"]},
    {"name": "Banco de Costa Rica", "country": "CR", "kind": "banco",
     "domains": ["banco bcr", "banco de costa rica", "bcr.fi.cr"]},
    # Panamá
    {"name": "Banco General", "country": "PA", "kind": "banco",
     "domains": ["banco general", "bgeneral.com"]},
    {"name": "Banistmo", "country": "PA", "kind": "banco",
     "domains": ["banistmo.com"]},
    # Rep. Dominicana
    {"name": "Banreservas", "country": "DO", "kind": "banco",
     "domains": ["banreservas.com"]},
    {"name": "Banco Popular Dominicano", "country": "DO", "kind": "banco",
     "domains": ["bancopopular.com.do"]},
]

# TLDs de bajo costo / frecuentemente usados en fraudes
SUSPICIOUS_TLDS = [
    ".xyz", ".click", ".top", ".info", ".live", ".work", ".support",
    ".tk", ".ml", ".ga", ".cf", ".gq", ".icu", ".buzz", ".loan", ".win",
    ".zip", ".mov", ".mom", ".lol", ".vip", ".club", ".online", ".site",
    ".review", ".stream", ".money", ".party", ".country", ".download",
]
