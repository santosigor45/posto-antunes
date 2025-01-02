from models import EntregaCombustivel


def determine_pump(odometro_atual):
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
            for od in odometro_posto:
                diferenca[od] = odometro_atual - odometro_posto[od]

            menor_diferenca = min(diferenca, key=diferenca.get)

        elif len(odometro_posto) == 1:
            menor_diferenca = next(iter(odometro_posto.keys()))

    return menor_diferenca
