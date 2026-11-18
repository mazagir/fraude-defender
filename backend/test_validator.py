from app.models.schemas import UsuarioCreate

# Test valid domain
try:
    u = UsuarioCreate(nombre='Test', email='test@gmail.com', password='12345678')
    print('Valid domain OK:', u.email)
except Exception as e:
    print('Valid domain error:', e)

# Test invalid domain
try:
    u = UsuarioCreate(nombre='Test', email='test@invalid.com', password='12345678')
    print('Invalid domain OK (should not happen):', u.email)
except Exception as e:
    print('Invalid domain rejected:', e)

# Test short password (should fail min_length)
try:
    u = UsuarioCreate(nombre='Test', email='test@gmail.com', password='123456')
    print('Short password OK (should not happen):', u.password)
except Exception as e:
    print('Short password rejected:', e)