from flask import url_for, request, redirect, flash
from flask_admin.contrib.sqla import ModelView
from flask_admin import AdminIndexView
from flask_login import current_user


class MyModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        flash('Você não tem permissão para acessar esta página.', 'error')
        return redirect(url_for('front_end.home', next=request.url))


class AbastecimentosView(MyModelView):
    column_filters = ['user', 'data', 'motorista', 'placa', 'cidade', 'posto']
    column_searchable_list = ['id', 'user', 'data', 'motorista', 'placa']


class EntregaCombustivelView(MyModelView):
    column_filters = ['user', 'data', 'posto']
    column_searchable_list = ['id', 'user', 'data', 'posto']


class PlacasView(MyModelView):
    column_filters = ['veiculo']
    column_searchable_list = ['placa']


class MotoristasView(MyModelView):
    column_filters = ['cidade']
    column_searchable_list = ['motorista']


class MyAdminIndexView(AdminIndexView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        flash('Você não tem permissão para acessar esta página.', 'error')
        return redirect(url_for('front_end.home', next=request.url))
