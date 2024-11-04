from ext.database import db
from flask_login import UserMixin


class Postos(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    cidade = db.Column(db.String(30))

    def __repr__(self):
        return f'<Posto id={self.id} posto={self.posto}>'


class Cidades(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    cidade = db.Column(db.String(30), nullable=False)

    def __repr__(self):
        return f'<Cidade id={self.id} cidade={self.cidade}>'


class Placas(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    placa = db.Column(db.String(10), nullable=False)
    veiculo = db.Column(db.String(30))

    def __repr__(self):
        return f'<Placa id={self.id} placa={self.placa}>'


class Motoristas(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    motorista = db.Column(db.String(50), nullable=False)
    cidade = db.Column(db.String(30))

    def __repr__(self):
        return f'<Motorista id={self.id} motorista={self.motorista}>'


class VolumeAtual(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    volume_restante = db.Column(db.Integer, nullable=False)


class PontoVirada(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro_inicial = db.Column(db.Integer, nullable=False)
    volume = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.DECIMAL(3, 2), nullable=False)


class EntregaCombustivel(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    user = db.Column(db.String(10), nullable=False)
    data_lanc = db.Column(db.DateTime)
    data_abast = db.Column(db.Date, nullable=False)
    volume = db.Column(db.Integer, nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.DECIMAL(3, 2), nullable=False)


class Abastecimentos(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    user = db.Column(db.String(10), nullable=False)
    data_lanc = db.Column(db.DateTime)
    data_abast = db.Column(db.Date, nullable=False)
    motorista = db.Column(db.String(50), nullable=False)
    placa = db.Column(db.String(10), nullable=False)
    observacoes = db.Column(db.String(100))
    quilometragem = db.Column(db.Integer)
    volume = db.Column(db.DECIMAL(3, 3), nullable=False)
    cidade = db.Column(db.String(30), nullable=False)
    posto = db.Column(db.String(30), nullable=False)
    odometro = db.Column(db.Integer)
    combustivel = db.Column(db.String(30))
    preco = db.Column(db.DECIMAL(3, 2))


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
