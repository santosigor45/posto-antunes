from flask import request, jsonify, abort
from ext.utils import determine_pump
from flask_login import current_user
from models import db, Abastecimentos, EntregaCombustivel, table_object


def api_data(data):
    if data in ["placas", "motoristas"]:
        return {
            "data": [row.to_dict() for row in db.session.query(table_object(table_name=data))],
        }

    query = db.session.query(table_object(table_name=data))

    # date range filter
    min_date = request.args.get("minDate")
    max_date = request.args.get("maxDate")
    if min_date and max_date:
        query = query.filter(db.and_(
            db.func.date(table_object(table_name=data).data_lanc) >= min_date,
            db.func.date(table_object(table_name=data).data_lanc) <= max_date
        ))

    # user filter
    if not (current_user.is_admin or current_user.is_manager):
        query = query.filter_by(user=current_user.username)

    # search filter
    search = request.args.get("search[value]")

    if search:
        search_str = str(search).strip()
        if data == "abastecimentos":
            query = query.filter(db.or_(
                Abastecimentos.data_lanc.icontains(search_str),
                Abastecimentos.user.icontains(search_str),
                Abastecimentos.motorista.icontains(search_str),
                Abastecimentos.placa.icontains(search_str),
                Abastecimentos.observacoes.icontains(search_str),
                Abastecimentos.volume.icontains(search_str),
                Abastecimentos.cidade.icontains(search_str),
                Abastecimentos.posto.icontains(search_str),
                Abastecimentos.combustivel.icontains(search_str),
                Abastecimentos.preco.icontains(search_str)
            ))

        elif data == "entrega_combustivel":
            query = query.filter(db.or_(
                EntregaCombustivel.data_lanc.icontains(search_str),
                EntregaCombustivel.user.icontains(search_str),
                EntregaCombustivel.posto.icontains(search_str),
                EntregaCombustivel.volume.icontains(search_str),
                EntregaCombustivel.preco.icontains(search_str)
            ))

    total_filtered = query.count()

    # sorting
    order = []
    i = 0
    while True:
        col_index = request.args.get(f"order[{i}][column]")
        if col_index is None:
            break
        col_name = request.args.get(f"columns[{col_index}][data]")
        if data == "abastecimentos":
            if col_name not in ["data_lanc", "user", "motorista", "placa", "quilometragem", "volume", "cidade",
                                "posto", "odometro", "combustivel"]:
                col_name = "name"
            col = getattr(Abastecimentos, col_name)
        elif data == "entrega_combustivel":
            if col_name not in ["data_lanc", "user", "posto", "volume", "odometro", "preco"]:
                col_name = "name"
            col = getattr(EntregaCombustivel, col_name)
        descending = request.args.get(f"order[{i}][dir]") == "desc"
        if descending:
            col = col.desc()
        order.append(col)
        i += 1
    if order:
        query = query.order_by(*order)

    # pagination
    start = request.args.get("start", type=int)
    length = request.args.get("length", type=int)

    if length == -1:
        final_query = query.offset(start)
    else:
        final_query = query.offset(start).limit(length)

    # response
    return {
        "data": [row.to_dict() for row in final_query],
        "recordsFiltered": total_filtered,
        "recordsTotal": query.count(),
        "draw": request.args.get("draw", type=int),
    }


def validate_mileage(placa, km):
    try:
        query = Abastecimentos.query.filter_by(placa=placa).order_by(
            Abastecimentos.id.desc()).first()

        if query:
            result = (query.quilometragem + 3000) > int(km) > query.quilometragem

            if result:
                message = "Ok!"
                return jsonify({'message': f'{message}', 'result': result})
            else:
                message = "Por favor, verifique se o KM digitado está correto!"
                return jsonify({'message': f'{message}', 'result': result})

        else:
            message = "Nenhum registro encontrado!"
            return jsonify({'message': f'{message}', 'result': True})

    except Exception as e:
        abort(500, description=str(e))


def validate_odometer(posto, odometro, form_id):
    try:
        posto = determine_pump(odometro) if posto == "BOMBA - PINDA" else posto
        query = None

        if form_id == "abastecimentos":
            query = Abastecimentos.query.filter_by(posto=posto).order_by(
                Abastecimentos.id.desc()).first()

        elif form_id == "entrega_combustivel":
            query = EntregaCombustivel.query.filter_by(posto=posto).order_by(
                EntregaCombustivel.id.desc()).first()

        if query:
            result = (query.odometro + 3000) > int(odometro) > query.odometro

            if result:
                message = "Ok!"
                return jsonify({'message': f'{message}', 'result': result})

            else:
                message = "Por favor, verifique se o odômetro digitado está correto!"
                return jsonify({'message': f'{message}', 'result': result})

        else:
            message = "Nenhum registro encontrado!"
            return jsonify({'message': f'{message}', 'result': True})

    except Exception as e:
        abort(500, description=str(e))
