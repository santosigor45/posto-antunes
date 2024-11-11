from flask import render_template, redirect, url_for, send_from_directory
from flask_login import current_user
from models import *
from sqlalchemy import not_


def home():
    if current_user.is_authenticated:
        return render_template("home.html")
    else:
        return redirect(url_for('views.login'))


def abastecimentos():
    motoristas = [motorista for motorista in Motoristas.query.all()]
    postos = [posto for posto in Postos.query.all()]
    cidades = [cidade for cidade in Cidades.query.all()]
    placas = [placa for placa in Placas.query.all()]
    return render_template("abastecimentos.html", placas=placas, postos=postos,
                           cidades=cidades, motoristas=motoristas)


def entrega_combustivel():
    postos_proprios = [posto for posto in Postos.query.all() if "bomba" in posto.posto.lower()]
    return render_template("entrega_combustivel.html", postos_proprios=postos_proprios)


def ultimos_lancamentos():
    # Query the last five fueling records at stations labeled "BOMBA"
    lancamentos_bomba = Abastecimentos.query\
        .filter(Abastecimentos.user == current_user.username)\
        .filter(Abastecimentos.posto.contains("BOMBA"))\
        .order_by(Abastecimentos.id.desc()).limit(5).all()

    # Query the last five fueling records at other stations
    lancamentos_posto = Abastecimentos.query\
        .filter(Abastecimentos.user == current_user.username)\
        .filter(not_(Abastecimentos.posto.contains("BOMBA")))\
        .order_by(Abastecimentos.id.desc()).limit(5).all()

    # Query the last five fuel delivery records
    lancamentos_entrega = EntregaCombustivel.query\
        .filter(EntregaCombustivel.user == current_user.username)\
        .order_by(EntregaCombustivel.id.desc()).limit(5).all()

    # Construct a list of dicts from the "BOMBA" fueling records for the template
    resultados_bomba = [{'data': lancamento.data_abast,
                         'motorista': lancamento.motorista,
                         'placa': lancamento.placa,
                         'volume': int(lancamento.volume),
                         'quilometragem': lancamento.quilometragem,
                         'posto': lancamento.posto} for lancamento in lancamentos_bomba]

    # Construct a list of dicts from other fueling records for the template
    resultados_posto = [{'data': lancamento.data_abast,
                         'motorista': lancamento.motorista,
                         'placa': lancamento.placa,
                         'volume': lancamento.volume,
                         'quilometragem': lancamento.quilometragem,
                         'posto': lancamento.posto,
                         'preco': lancamento.preco} for lancamento in lancamentos_posto]

    # Construct a list of dicts from fuel delivery records for the template
    resultados_entrega = [{'data': lancamento.data_abast,
                           'volume': int(lancamento.volume),
                           'posto': lancamento.posto,
                           'odometro': lancamento.odometro,
                           'preco': lancamento.preco} for lancamento in lancamentos_entrega]

    # Return the results to the specified template
    return render_template('ultimos_lancamentos.html',
                           resultados_bomba=resultados_bomba,
                           resultados_posto=resultados_posto,
                           resultados_entrega=resultados_entrega)


def pesquisar():
    return render_template('pesquisar/pesquisar.html')


def pesquisar_tables(table):
    return render_template(f'pesquisar/pesquisar_{table}.html')


def serve_file(filename):
    return send_from_directory('', filename)


def health_check():
    return 'OK', 200
