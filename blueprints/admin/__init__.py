from flask_admin import Admin
from .admin_views import MyModelView, MyAdminIndexView
from ext.database import db
from models import Abastecimentos, EntregaCombustivel, Placas, Motoristas, Cidades, Postos, PontoVirada, VolumeAtual


def init_app(app):
    admin = Admin(app, template_mode='bootstrap3', base_template='admin_template.html', url='/admin', index_view=MyAdminIndexView())

    admin.add_view(MyModelView(Abastecimentos, db.session, category='Lançamentos'))
    admin.add_view(MyModelView(EntregaCombustivel, db.session, category='Lançamentos'))
    admin.add_view(MyModelView(Placas, db.session, category='Dados'))
    admin.add_view(MyModelView(Motoristas, db.session, category='Dados'))
    admin.add_view(MyModelView(Cidades, db.session, category='Dados'))
    admin.add_view(MyModelView(Postos, db.session, category='Dados'))
    admin.add_view(MyModelView(PontoVirada, db.session, category='Dados'))
    admin.add_view(MyModelView(VolumeAtual, db.session, category='Dados'))
