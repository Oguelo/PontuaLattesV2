"""
Camada de dados — Peewee + PostgreSQL.

Interface pública idêntica à versão anterior (Google Sheets), portanto
controller.py e main.py não precisam de alterações.

Variáveis de ambiente:
  DATABASE_URL               postgresql://user:pass@host:5432/dbname
  SESSION_TTL_HOURS          Vida útil do token de sessão (padrão: 24)
  DEFAULT_DASHBOARD_USERNAME Login do usuário padrão (padrão: admin)
  DEFAULT_DASHBOARD_PASSWORD Senha do usuário padrão (padrão: pontualattes)

Nota para main.py:
  Cada thread do ThreadingHTTPServer obtém e devolve conexões automaticamente
  via connection_context(). Para liberar a conexão ao fim de cada request,
  adicione ao handler:

      def handle(self):
          with database.db.connection_context():
              super().handle()

  Sem isso as conexões são devolvidas ao pool assim que cada função retorna,
  o que já é suficiente para a maioria dos casos.
"""

import hashlib
import json
import os
import re
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlparse

from peewee import fn

from models import Barema, Consulta, Session, User, db

SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))
DEFAULT_DASHBOARD_USERNAME = os.getenv("DEFAULT_DASHBOARD_USERNAME", "admin")
DEFAULT_DASHBOARD_PASSWORD = os.getenv("DEFAULT_DASHBOARD_PASSWORD", "pontualattes")


# ── helpers internos ──────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now()


def _extract_public_lattes_code(value) -> str | None:
    value = str(value or "").strip()
    if not value:
        return None
    if re.fullmatch(r"\d+", value):
        return value
    url = value if re.match(r"^https?://", value, re.IGNORECASE) else f"http://{value}"
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    path = (parsed.path or "").strip("/")
    if host.endswith("lattes.cnpq.br") and re.fullmatch(r"\d+", path):
        return path
    return None


def _ensure_default_dashboard_user() -> None:
    """Cria o usuário admin padrão apenas se ainda não existir."""
    if User.select().where(User.username == DEFAULT_DASHBOARD_USERNAME).exists():
        return
    pwd_hash, salt = hash_password(DEFAULT_DASHBOARD_PASSWORD)
    User.create(
        username=DEFAULT_DASHBOARD_USERNAME,
        password_hash=pwd_hash,
        salt=salt,
    )


# ── interface pública ─────────────────────────────────────────────────────────

def init_database() -> None:
    """Cria as tabelas (idempotente) e garante o usuário padrão."""
    with db.connection_context():
        db.create_tables([User, Session, Consulta, Barema], safe=True)
        _ensure_default_dashboard_user()


def formatar_url_lattes(url_ou_numero) -> str:
    if not url_ou_numero:
        return ""
    url_ou_numero = str(url_ou_numero).strip()
    if url_ou_numero.startswith("http://lattes.cnpq.br/"):
        return url_ou_numero
    return f"http://lattes.cnpq.br/{url_ou_numero}"


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return pwd_hash.hex(), salt


def create_user(username: str, password: str) -> bool:
    username = str(username or "").strip()
    if not username:
        return False
    with db.connection_context():
        if User.select().where(User.username == username).exists():
            return False
        pwd_hash, salt = hash_password(password)
        User.create(username=username, password_hash=pwd_hash, salt=salt)
    return True


def verify_login(username: str, password: str) -> str | None:
    """Valida credenciais e retorna um novo token de sessão, ou None."""
    with db.connection_context():
        user = User.get_or_none(User.username == str(username or "").strip())
        if not user:
            return None
        pwd_hash, _ = hash_password(password, user.salt)
        if pwd_hash != user.password_hash:
            return None
        token = secrets.token_hex(32)
        Session.create(token=token, user=user, created_at=_now())
        return token


def delete_session(token: str) -> None:
    with db.connection_context():
        Session.delete().where(Session.token == token).execute()


def get_user_id_by_token(token: str) -> int | None:
    """Retorna o user_id associado ao token se ele ainda estiver dentro do TTL."""
    expiry = _now() - timedelta(hours=SESSION_TTL_HOURS)
    with db.connection_context():
        session = Session.get_or_none(
            Session.token == token,
            Session.created_at >= expiry,
        )
        return session.user_id if session else None


def registrar_consulta(url_informada: str, resultado: dict) -> int:
    """
    Insere ou atualiza uma consulta.

    Critério de deduplicação (por ordem de prioridade):
      1. Mesmo code Lattes (identificador estável)
      2. Mesma url_informada
    """
    code = str(resultado.get("code") or "").strip() or None
    data = {
        "url_informada": str(url_informada or "").strip() or None,
        "url_consultada": resultado.get("url") or None,
        "code": code,
        "success": 1 if resultado.get("success") else 0,
        "message": resultado.get("message") or None,
        "created_at": _now(),
    }
    with db.connection_context():
        existing = None
        if code:
            existing = Consulta.get_or_none(Consulta.code == code)
        if existing is None and data["url_informada"]:
            existing = Consulta.get_or_none(
                Consulta.url_informada == data["url_informada"]
            )

        if existing:
            Consulta.update(data).where(Consulta.id == existing.id).execute()
            return existing.id

        consulta = Consulta.create(**data)
        return consulta.id


def registrar_barema(
    consulta_id: int,
    code: str,
    nome: str | None,
    barema_resultado: dict,
) -> None:
    """Insere ou atualiza o barema de um currículo (chave: code + tipo)."""
    if not (consulta_id and code and barema_resultado and barema_resultado.get("success")):
        return

    def _sub(key: str, subkey: str, default: float = 0) -> float:
        return barema_resultado.get(key, {}).get(subkey, default)

    tipo = barema_resultado.get("tipo", "professor")

    data = {
        "consulta_id": consulta_id,
        "code": code,
        "nome": nome or "",
        "tipo": tipo,
        "total_bruto":    barema_resultado.get("total_bruto", 0),
        "total_limitado": barema_resultado.get("total_limitado", 0),
        "barema_json":    json.dumps(barema_resultado, ensure_ascii=False),
        "updated_at":     _now(),
        # professor
        "titulacao_bruto":    _sub("titulacao", "subtotal_bruto"),
        "titulacao_limitado": _sub("titulacao", "subtotal_limitado"),
        "producao_bruto":     _sub("producao", "subtotal_bruto"),
        "producao_limitado":  _sub("producao", "subtotal_limitado"),
        "formacao_bruto":     _sub("formacao_recursos_humanos", "subtotal_bruto"),
        "formacao_limitado":  _sub("formacao_recursos_humanos", "subtotal_limitado"),
        "eventos_bruto":      _sub("participacao_eventos_comite", "subtotal_bruto"),
        "eventos_limitado":   _sub("participacao_eventos_comite", "subtotal_limitado"),
        # aeri
        "participacao_eventos_bruto":     _sub("participacao_eventos", "subtotal_bruto"),
        "participacao_eventos_limitado":  _sub("participacao_eventos", "subtotal_limitado"),
        "producao_cientifica_bruto":      _sub("producao_cientifica", "subtotal_bruto"),
        "producao_cientifica_limitado":   _sub("producao_cientifica", "subtotal_limitado"),
        "lideranca_bruto":                _sub("lideranca_estudantil", "subtotal_bruto"),
        "lideranca_limitado":             _sub("lideranca_estudantil", "subtotal_limitado"),
        "programas_academicos_bruto":     _sub("programas_academicos", "subtotal_bruto"),
        "programas_academicos_limitado":  _sub("programas_academicos", "subtotal_limitado"),
    }
    with db.connection_context():
        existing = Barema.get_or_none(
            (Barema.code == code) & (Barema.tipo == tipo)
        )
        if existing:
            Barema.update(data).where(Barema.id == existing.id).execute()
        else:
            Barema.create(**data)


def get_consultas(
    success: int | None = None,
    page: int = 1,
    per_page: int = 10,
) -> list[dict]:
    offset = max(page - 1, 0) * per_page
    with db.connection_context():
        query = Consulta.select().order_by(Consulta.created_at.desc())
        if success is not None:
            query = query.where(Consulta.success == int(success))

        consultas = list(query.offset(offset).limit(per_page))

        # Busca baremas de uma vez para evitar N+1
        codes = [c.code for c in consultas if c.code]
        baremas: dict[str, Barema] = {}
        if codes:
            for b in Barema.select(
                Barema.code, Barema.nome, Barema.total_limitado
            ).where(Barema.code.in_(codes)):
                baremas[b.code] = b

        result = []
        for c in consultas:
            b = baremas.get(c.code)
            result.append({
                "id":             c.id,
                "url_informada":  c.url_informada,
                "url_consultada": c.url_consultada,
                "code":           c.code,
                "success":        c.success,
                "message":        c.message,
                "created_at":     c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else None,
                "nome":           b.nome if b else None,
                "total_limitado": b.total_limitado if b else None,
            })
        return result


def count_consultas(success: int | None = None) -> int:
    with db.connection_context():
        query = Consulta.select()
        if success is not None:
            query = query.where(Consulta.success == int(success))
        return query.count()


def get_top5_consultas() -> list[dict]:
    with db.connection_context():
        rows = list(
            Consulta.select(
                Consulta.code,
                fn.COUNT(Consulta.id).alias("total"),
            )
            .where(Consulta.code.is_null(False))
            .group_by(Consulta.code)
            .order_by(fn.COUNT(Consulta.id).desc())
            .limit(5)
            .namedtuples()
        )

        codes = [r.code for r in rows]
        baremas: dict[str, str] = {}
        if codes:
            for b in Barema.select(Barema.code, Barema.nome).where(
                Barema.code.in_(codes)
            ):
                baremas[b.code] = b.nome or "Sem nome"

        return [
            {
                "nome":  baremas.get(r.code, "Sem nome"),
                "code":  r.code,
                "total": r.total,
            }
            for r in rows
        ]


def get_consultas_por_dia() -> list[dict]:
    with db.connection_context():
        rows = list(
            Consulta.select(
                fn.DATE(Consulta.created_at).alias("dia"),
                fn.COUNT(Consulta.id).alias("total"),
            )
            .group_by(fn.DATE(Consulta.created_at))
            .order_by(fn.DATE(Consulta.created_at))
            .namedtuples()
        )
        return [{"dia": str(r.dia), "total": r.total} for r in rows]


__all__ = [
    "create_user",
    "count_consultas",
    "delete_session",
    "formatar_url_lattes",
    "get_consultas",
    "get_consultas_por_dia",
    "get_top5_consultas",
    "get_user_id_by_token",
    "hash_password",
    "init_database",
    "registrar_barema",
    "registrar_consulta",
    "verify_login",
]
