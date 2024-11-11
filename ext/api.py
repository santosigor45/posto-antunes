from flask import request
from models import *


def api_data(data):
    if data in ["placas", "motoristas"]:
        return {
            "data": [row.to_dict() for row in db.session.query(table_object(table_name=data))],
        }

    query = db.session.query(table_object(table_name=data))

    # search filter
    search = request.args.get("search[value]")

    if search:
        search_str = str(search).strip()
        if data == "abastecimentos":
            query = query.filter(db.or_(
                Abastecimentos.data_reg.icontains(search_str),
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
                EntregaCombustivel.data_reg.icontains(search_str),
                EntregaCombustivel.user.icontains(search_str),
                EntregaCombustivel.posto.icontains(search_str),
                EntregaCombustivel.volume.icontains(search_str),
                EntregaCombustivel.preco.icontains(search_str)
            ))

    # date range filter
    min_date = request.args.get("minDate")
    max_date = request.args.get("maxDate")
    if min_date and max_date:
        query = query.filter(db.and_(
            db.func.date(table_object(table_name=data).data_reg) >= min_date,
            db.func.date(table_object(table_name=data).data_reg) <= max_date
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
            if col_name not in ["data_reg", "user", "motorista", "placa", "quilometragem", "volume", "cidade",
                                "posto", "odometro", "combustivel"]:
                col_name = "name"
            col = getattr(Abastecimentos, col_name)
        elif data == "entrega_combustivel":
            if col_name not in ["data_reg", "user", "posto", "volume", "odometro", "preco"]:
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
