from ext.database import db
from sqlalchemy.inspection import inspect
from flask_login import UserMixin


class Postos(db.Model):
    __tablename__ = "postos"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    cidade = db.Column(db.String(30))

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

    def __repr__(self):
        return f"<Posto id={self.id} posto={self.posto}>"


class Cidades(db.Model):
    __tablename__ = "cidades"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    cidade = db.Column(db.String(30), nullable=False)

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

    def __repr__(self):
        return f"<Cidade id={self.id} cidade={self.cidade}>"


class Placas(db.Model):
    __tablename__ = "placas"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    placa = db.Column(db.String(10), nullable=False)
    veiculo = db.Column(db.String(30))
    km_necessario = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

    def __repr__(self):
        return f"<Placa id={self.id} placa={self.placa}>"


class Motoristas(db.Model):
    __tablename__ = "motoristas"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    motorista = db.Column(db.String(50), nullable=False)
    cidade = db.Column(db.String(30))

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

    def __repr__(self):
        return f"<Motorista id={self.id} motorista={self.motorista}>"


class VolumeAtual(db.Model):
    __tablename__ = "volume_atual"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    volume_restante = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


class PontoVirada(db.Model):
    __tablename__ = "ponto_virada"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro_inicial = db.Column(db.Integer, nullable=False)
    volume = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.DECIMAL(3, 2), nullable=False)

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


class Abastecimentos(db.Model):
    __tablename__ = "abastecimentos"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    user = db.Column(db.String(10), nullable=False)
    data_lanc = db.Column(db.DateTime)
    data_reg = db.Column(db.Date, nullable=False)
    motorista = db.Column(db.String(50), nullable=False)
    placa = db.Column(db.String(10), nullable=False)
    observacoes = db.Column(db.String(100))
    quilometragem = db.Column(db.Integer)
    volume = db.Column(db.DECIMAL(7, 3), nullable=False)
    cidade = db.Column(db.String(30), nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro = db.Column(db.Integer)
    combustivel = db.Column(db.String(30))
    preco = db.Column(db.DECIMAL(3, 2))

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


class EntregaCombustivel(db.Model):
    __tablename__ = "entrega_combustivel"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    user = db.Column(db.String(10), nullable=False)
    data_lanc = db.Column(db.DateTime)
    data_reg = db.Column(db.Date, nullable=False)
    volume = db.Column(db.Integer, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.DECIMAL(3, 2), nullable=False)

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


class User(db.Model, UserMixin):
    __tablename__ = "posto_users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    username = db.Column(db.String(140))
    password = db.Column(db.String(512))
    is_admin = db.Column(db.Boolean, default=False)
    is_manager = db.Column(db.Boolean, default=False)

    def __init__(self, username, password):
        self.username = username
        self.password = password


tables_dict = {table.__tablename__: table for table in db.Model.__subclasses__()}


def table_object(table_name):
    return tables_dict.get(table_name)
