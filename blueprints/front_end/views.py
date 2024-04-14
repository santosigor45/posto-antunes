from flask import render_template, request, flash, redirect, url_for, send_from_directory, jsonify
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user, current_user
from models import *
from sqlalchemy import not_
from datetime import datetime


def home():
    if current_user.is_authenticated:
        return render_template("home.html")
    else:
        return redirect(url_for('front_end.login'))


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
    lancamentos_bomba = Abastecimentos.query\
        .filter(Abastecimentos.user == current_user.username)\
        .filter(Abastecimentos.posto.contains("BOMBA"))\
        .order_by(Abastecimentos.id.desc()).limit(5).all()

    lancamentos_posto = Abastecimentos.query\
        .filter(Abastecimentos.user == current_user.username)\
        .filter(not_(Abastecimentos.posto.contains("BOMBA")))\
        .order_by(Abastecimentos.id.desc()).limit(5).all()

    lancamentos_entrega = EntregaCombustivel.query\
        .filter(EntregaCombustivel.user == current_user.username)\
        .order_by(EntregaCombustivel.id.desc()).limit(5).all()

    resultados_bomba = [{'data': lancamento.data,
                         'motorista': lancamento.motorista,
                         'placa': lancamento.placa,
                         'volume': int(lancamento.volume),
                         'quilometragem': lancamento.quilometragem,
                         'posto': lancamento.posto} for lancamento in lancamentos_bomba]

    resultados_posto = [{'data': lancamento.data,
                         'motorista': lancamento.motorista,
                         'placa': lancamento.placa,
                         'volume': lancamento.volume,
                         'quilometragem': lancamento.quilometragem,
                         'posto': lancamento.posto,
                         'preco': lancamento.preco} for lancamento in lancamentos_posto]

    resultados_entrega = [{'data': lancamento.data,
                           'volume': int(lancamento.volume),
                           'posto': lancamento.posto,
                           'odometro': lancamento.odometro,
                           'preco': lancamento.preco} for lancamento in lancamentos_entrega]

    return render_template('ultimos_lancamentos.html',
                           resultados_bomba=resultados_bomba,
                           resultados_posto=resultados_posto,
                           resultados_entrega=resultados_entrega)


def processar_formulario():
    try:
        enviar_dados = []
        dados_coletados = None
        formulario_id = request.form.get('formulario_id')

        if formulario_id == "abastecimentos":
            dados_coletados = Abastecimentos(
                user=current_user.username,
                data=datetime.strptime(request.form.get("data"), "%Y-%m-%d").date(),
                motorista=request.form.get("motorista"),
                placa=request.form.get("placa"),
                observacoes=request.form.get("observacoes") or None,
                quilometragem=request.form.get("quilometragem") or None,
                volume=request.form.get("volume").replace(",", "."),
                cidade=request.form.get("cidade"),
                posto=request.form.get("posto"),
                odometro=request.form.get("odometro") or None,
                combustivel=request.form.get("combustivel") or None,
                preco=request.form.get("preco").replace(",", ".") or None
            )

        elif formulario_id == "entrega_combustivel":
            dados_coletados = EntregaCombustivel(
                user=current_user.username,
                data=datetime.strptime(request.form.get("data"), "%Y-%m-%d").date(),
                volume=request.form.get("volume"),
                posto=request.form.get("posto"),
                odometro=request.form.get("odometro"),
                preco=request.form.get("preco").replace(",", ".")
            )

        if "BOMBA" in dados_coletados.posto:
            odometro_atual = int(dados_coletados.odometro)

            if dados_coletados.posto == "BOMBA - PINDA":
                menor_diferenca = None
                odometro_posto = {}
                for bomba in ["BOMBA - PINDA 1", "BOMBA - PINDA 2"]:
                    resultado = EntregaCombustivel.query.filter_by(posto=bomba).filter(
                        EntregaCombustivel.odometro <= odometro_atual).order_by(
                        EntregaCombustivel.odometro.desc()).first()
                    if resultado:
                        odometro_posto[bomba] = int(resultado.odometro)

                if odometro_posto:
                    if len(odometro_posto) == 2:
                        diferenca = {}
                        print(odometro_posto)
                        for od in odometro_posto:
                            diferenca[od] = odometro_atual - odometro_posto[od]

                        menor_diferenca = min(diferenca, key=diferenca.get)

                    elif len(odometro_posto) == 1:
                        menor_diferenca = next(iter(odometro_posto.keys()))

                    dados_coletados.posto = menor_diferenca
                    print(f"Bomba de entrega alterada para {menor_diferenca}.")

            if formulario_id == "entrega_combustivel":
                ultima_entrega = PontoVirada.query.filter_by(posto=dados_coletados.posto).order_by(
                    PontoVirada.id.desc()).first()
                aumentar_volume = VolumeAtual.query.filter_by(posto=dados_coletados.posto).first()

                if ultima_entrega:
                    odometro_inicial = int(ultima_entrega.odometro_inicial) + int(ultima_entrega.volume)
                else:
                    odometro_inicial = dados_coletados.odometro

                novo_ponto = PontoVirada(
                    posto=dados_coletados.posto,
                    odometro_inicial=odometro_inicial,
                    volume=dados_coletados.volume,
                    preco=dados_coletados.preco
                )

                enviar_dados.append(novo_ponto)

                if aumentar_volume:
                    novo_volume = int(aumentar_volume.volume_restante) + int(dados_coletados.volume)
                    aumentar_volume.volume_restante = novo_volume
                else:
                    criar_volume = VolumeAtual(
                        posto=dados_coletados.posto,
                        volume_restante=dados_coletados.volume
                    )
                    enviar_dados.append(criar_volume)

            if formulario_id == "abastecimentos":
                lanc_mais_prox = PontoVirada.query.filter_by(posto=dados_coletados.posto).filter(
                    PontoVirada.odometro_inicial <= odometro_atual).order_by(
                    PontoVirada.id.desc()).first()
                diminuir_volume = VolumeAtual.query.filter_by(posto=dados_coletados.posto).first()

                if diminuir_volume:
                    novo_volume = int(diminuir_volume.volume_restante) - int(dados_coletados.volume)
                    diminuir_volume.volume_restante = novo_volume

                if lanc_mais_prox:
                    dados_coletados.preco = lanc_mais_prox.preco

        enviar_dados.append(dados_coletados)

        for dado in enviar_dados:
            db.session.add(dado)

        db.session.commit()

        return jsonify({'type': 'success', 'message': 'Dados enviados com sucesso!'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'type': 'error', 'message': str(e)})


def login():
    if request.method == "POST":
        username = request.form["username"].lower()
        password = request.form["password"]

        if not username or not password:
            flash('Preencha os dados corretamente!', 'info')
            return redirect(url_for('front_end.login'))

        existing_user = User.query.filter_by(username=username).first()
        if not existing_user:
            flash('Usuário não encontrado!', 'info')
            return redirect(url_for('front_end.login'))

        if not check_password_hash(existing_user.password, password):
            flash('Senha incorreta!', 'info')
            return redirect(url_for('front_end.login'))
        login_user(existing_user, remember=True)
        return redirect(url_for("front_end.home"))

    if current_user.is_authenticated:
        return redirect(url_for("front_end.home"))
    else:
        return render_template("login.html")


def logout():
    logout_user()
    return redirect(url_for('front_end.login'))


def serve_file(filename):
    return send_from_directory('', filename)


def health_check():
    return 'OK', 200
