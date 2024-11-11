from flask import request, jsonify
from flask_login import current_user
from models import *
from datetime import datetime
from zoneinfo import ZoneInfo


def send_data(data_to_send, collected_data, message):
    try:
        if collected_data:
            data_to_send.append(collected_data)

        if data_to_send:
            for data in data_to_send:
                db.session.merge(data)

        db.session.commit()
        return jsonify({'type': 'success', 'message': message})

    except Exception as e:
        db.session.rollback()
        return jsonify({'type': 'error', 'message': 'db error:' + str(e)})


def edit_form(form_id):
    pass
    # try:
    #     data_to_send = []
    #     collected_data = None
    #     message = 'Dados alterados com sucesso!'
    #     if form_id == "editFormPlacas":
    #         collected_data = Placas.query.get(request.form.get('id'))
    #         duplicado = Placas.query.filter_by(placa=request.form.get('placa')).all()
    #         if not collected_data:
    #             if not duplicado:
    #                 collected_data = Placas(
    #                     placa=request.form.get('placa'),
    #                     veiculo=request.form.get('veiculo'),
    #                     km_necessario=bool(request.form.get('km-needed'))
    #                 )
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Placa já cadastrada!'})
    #         else:
    #             if len(duplicado) == 1 and duplicado[0].id == collected_data.id or len(duplicado) == 0:
    #                 collected_data.placa = request.form.get('placa')
    #                 collected_data.veiculo = request.form.get('veiculo')
    #                 collected_data.km_necessario = bool(request.form.get('km-needed'))
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Placa já cadastrada!'})
    #
    #     elif form_id == "editFormMotoristas":
    #         collected_data = Motoristas.query.get(request.form.get('id'))
    #         duplicado = Motoristas.query.filter_by(motorista=request.form.get('motorista')).all()
    #         if not collected_data:
    #             if not duplicado:
    #                 collected_data = Motoristas(
    #                     motorista=request.form.get('motorista'),
    #                     cidade=request.form.get('cidade')
    #                 )
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Motorista já cadastrado!'})
    #         else:
    #             if len(duplicado) == 1 and duplicado[0].id == collected_data.id or len(duplicado) == 0:
    #                 collected_data.motorista = request.form.get('motorista')
    #                 collected_data.cidade = request.form.get('cidade')
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Motorista já cadastrado!'})
    #
    #     elif form_id == "editFormVisitantes":
    #         collected_data = Visitantes.query.get(request.form.get('id'))
    #         duplicado = Visitantes.query.filter_by(nome=request.form.get('nome')).all()
    #         if not collected_data:
    #             if not duplicado:
    #                 collected_data = Visitantes(
    #                     nome=request.form.get('nome'),
    #                     documento=request.form.get('documento'),
    #                     empresa=request.form.get('empresa')
    #                 )
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Visitante já cadastrado!'})
    #         else:
    #             if len(duplicado) == 1 and duplicado[0].id == collected_data.id or len(duplicado) == 0:
    #                 collected_data.nome = request.form.get('nome')
    #                 collected_data.documento = request.form.get('documento')
    #                 collected_data.empresa = request.form.get('empresa')
    #             else:
    #                 return jsonify({'type': 'info', 'message': 'Visitante já cadastrado!'})
    #
    #     elif form_id.startswith("editFormRegistros"):
    #         if form_id == "editFormRegistros_empresa":
    #             collected_data = RegistrosEmpresa.query.get(request.form.get('id'))
    #             fields = [
    #                 ('categoria', 'categoria'),
    #                 ('data_reg', lambda: request.form.get("data") + " " + request.form.get("hora") + ":00"),
    #                 ('motorista', 'motorista'),
    #                 ('placa', 'placa'),
    #                 ('quilometragem', 'km'),
    #                 ('destino', 'destino'),
    #                 ('observacoes', 'obs')
    #             ]
    #         if form_id == "editFormRegistros_visitantes":
    #             collected_data = RegistrosVisitantes.query.get(request.form.get('id'))
    #             fields = [
    #                 ('categoria', 'categoria'),
    #                 ('data_reg', lambda: request.form.get("data") + ' ' + request.form.get("hora") + ":00"),
    #                 ('nome', 'nome'),
    #                 ('documento', 'documento'),
    #                 ('empresa', 'empresa'),
    #                 ('placa', 'placa'),
    #                 ('destino', 'destino'),
    #                 ('observacoes', 'obs')
    #             ]
    #
    #         col_alteradas = f"{form_id.replace('editForm', '').lower()}: "
    #         val_antigo = ''
    #
    #         for attr, form_field in fields:
    #             old_value = getattr(collected_data, attr) if attr != 'data_reg' else getattr(collected_data, attr).strftime('%Y-%m-%d %H:%M:%S')
    #             new_value = form_field() if callable(form_field) else request.form.get(form_field) or None
    #             if str(old_value) != str(new_value):
    #                 col_alteradas += f'({attr}), '
    #                 val_antigo += f'({old_value}), '
    #                 setattr(collected_data, attr, new_value)
    #
    #         if val_antigo:
    #             col_alteradas = col_alteradas[:-2]
    #             val_antigo = val_antigo[:-2]
    #             history = PortariaHistory(
    #                 id_reg=collected_data.id,
    #                 user=current_user.username,
    #                 colunas_alteradas=col_alteradas,
    #                 valores_antigos=val_antigo
    #             )
    #             data_to_send.append(history)
    #         else:
    #             return jsonify({'type': 'info', 'message': 'Nenhum dado alterado!'})
    #
    #     return send_data(data_to_send, collected_data, message)
    #
    # except Exception as e:
    #     return jsonify({'type': 'error', 'message': 'function error:' + str(e)})


def delete_form(form_id):
    pass
    # try:
    #     data_to_send = []
    #     collected_data = None
    #     message = 'Dados excluídos com sucesso!'
    #     if form_id.startswith("deleteForm"):
    #         table_id = form_id.replace("deleteForm", '').lower()
    #         data_to_delete = db.session.query(table_object(table_name=table_id)).get(request.form.get('id'))
    #
    #         col_alteradas = f'{table_id}: '
    #         val_antigo = ''
    #
    #         for column in data_to_delete.__table__.columns:
    #             value = getattr(data_to_delete, column.name)
    #             col_alteradas += f'({column.name}), '
    #             val_antigo += f'({value}), '
    #
    #         if val_antigo:
    #             col_alteradas = col_alteradas[:-2]
    #             val_antigo = val_antigo[:-2]
    #             history = PortariaHistory(
    #                 id_reg=data_to_delete.id,
    #                 user=current_user.username,
    #                 colunas_alteradas=col_alteradas,
    #                 valores_antigos=val_antigo
    #             )
    #             data_to_send.append(history)
    #
    #         db.session.delete(data_to_delete)
    #
    #     return send_data(data_to_send, collected_data, message)
    #
    # except Exception as e:
    #     return jsonify({'type': 'error', 'message': 'function error:' + str(e)})


def send_form(form_id):
    try:
        data_to_send = []
        collected_data = None
        message = 'Dados enviados com sucesso!'

        # Collect data based on form ID
        if form_id == "abastecimentos":
            collected_data = Abastecimentos(
                user=current_user.username,
                data_lanc=datetime.now(ZoneInfo("America/Sao_Paulo")).replace(microsecond=0),
                data_reg=datetime.strptime(request.form.get("data"), "%Y-%m-%d").date(),
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

        elif form_id == "entrega_combustivel":
            collected_data = EntregaCombustivel(
                user=current_user.username,
                data_lanc=datetime.now(ZoneInfo("America/Sao_Paulo")).replace(microsecond=0),
                data_reg=datetime.strptime(request.form.get("data"), "%Y-%m-%d").date(),
                volume=request.form.get("volume"),
                posto=request.form.get("posto"),
                odometro=request.form.get("odometro"),
                preco=request.form.get("preco").replace(",", ".")
            )

        # Adjust posto field for "BOMBA" entries
        if "BOMBA" in collected_data.posto:
            odometro_atual = int(collected_data.odometro)

            if collected_data.posto == "BOMBA - PINDA":
                menor_diferenca = None
                odometro_posto = {}
                # Check for closest odometer reading at specific pumps
                for bomba in ["BOMBA - PINDA 1", "BOMBA - PINDA 2"]:
                    resultado = EntregaCombustivel.query.filter_by(posto=bomba).filter(
                        EntregaCombustivel.odometro <= odometro_atual).order_by(
                        EntregaCombustivel.odometro.desc()).first()
                    if resultado:
                        odometro_posto[bomba] = int(resultado.odometro)

                if odometro_posto:
                    # Determine the pump with the smallest difference in odometer readings
                    if len(odometro_posto) == 2:
                        diferenca = {}
                        print(odometro_posto)
                        for od in odometro_posto:
                            diferenca[od] = odometro_atual - odometro_posto[od]

                        menor_diferenca = min(diferenca, key=diferenca.get)

                    elif len(odometro_posto) == 1:
                        menor_diferenca = next(iter(odometro_posto.keys()))

                    collected_data.posto = menor_diferenca

            # Handle delivery or fueling based on form ID
            if form_id == "entrega_combustivel":
                ultima_entrega = PontoVirada.query.filter_by(posto=collected_data.posto).order_by(
                    PontoVirada.id.desc()).first()
                aumentar_volume = VolumeAtual.query.filter_by(posto=collected_data.posto).first()

                if ultima_entrega:
                    odometro_inicial = int(ultima_entrega.odometro_inicial) + int(ultima_entrega.volume)
                else:
                    odometro_inicial = collected_data.odometro

                novo_ponto = PontoVirada(
                    posto=collected_data.posto,
                    odometro_inicial=odometro_inicial,
                    volume=collected_data.volume,
                    preco=collected_data.preco
                )

                data_to_send.append(novo_ponto)

                if aumentar_volume:
                    novo_volume = int(aumentar_volume.volume_restante) + int(collected_data.volume)
                    aumentar_volume.volume_restante = novo_volume
                else:
                    criar_volume = VolumeAtual(
                        posto=collected_data.posto,
                        volume_restante=collected_data.volume
                    )
                    data_to_send.append(criar_volume)

            if form_id == "abastecimentos":
                lanc_mais_prox = PontoVirada.query.filter_by(posto=collected_data.posto).filter(
                    PontoVirada.odometro_inicial <= odometro_atual).order_by(
                    PontoVirada.id.desc()).first()
                diminuir_volume = VolumeAtual.query.filter_by(posto=collected_data.posto).first()

                if diminuir_volume:
                    novo_volume = int(diminuir_volume.volume_restante) - int(collected_data.volume)
                    diminuir_volume.volume_restante = novo_volume

                if lanc_mais_prox:
                    collected_data.preco = lanc_mais_prox.preco

        data_to_send.append(collected_data)

        return send_data(data_to_send, collected_data, message)

    except Exception as e:
        return jsonify({'type': 'error', 'message': 'function error:' + str(e)})
