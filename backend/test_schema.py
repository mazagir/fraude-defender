from app.models.schemas import UsuarioCreate

u = UsuarioCreate(nombre='Test', email='test@gmail.com', password='12345678')
print('OK', u.password, u.email)