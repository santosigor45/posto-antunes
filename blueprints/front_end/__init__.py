from flask import Blueprint
from flask_login import login_required
from .views import (home, abastecimentos, entrega_combustivel, ultimos_lancamentos, processar_formulario,
                    graficos_relatorios, reports, login, logout, serve_file, health_check)

bp = Blueprint("front_end", __name__)


bp.add_url_rule("/", view_func=login_required(home), endpoint="default")
bp.add_url_rule("/home", view_func=login_required(home))
bp.add_url_rule("/abastecimentos", view_func=login_required(abastecimentos))
bp.add_url_rule("/entrega_combustivel", view_func=login_required(entrega_combustivel))
bp.add_url_rule("/ultimos_lancamentos", view_func=login_required(ultimos_lancamentos))
bp.add_url_rule("/graficos_relatorios", view_func=login_required(graficos_relatorios))
bp.add_url_rule("/processar_formulario", view_func=login_required(processar_formulario), methods=["POST"])
bp.add_url_rule("/reports", view_func=login_required(reports), methods=["POST"])
bp.add_url_rule("/login", view_func=login, methods=["POST", "GET"])
bp.add_url_rule("/logout/", view_func=login_required(logout), methods=["POST", "GET"])
bp.add_url_rule("/<path:filename>", view_func=login_required(serve_file))
bp.add_url_rule("/ping", view_func=health_check)


def init_app(app):
    app.register_blueprint(bp)
