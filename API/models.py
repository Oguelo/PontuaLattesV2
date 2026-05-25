import os
import re

from peewee import (
    AutoField,
    CharField,
    DateTimeField,
    FloatField,
    ForeignKeyField,
    Model,
    SmallIntegerField,
    TextField,
)
from playhouse.pool import PooledPostgresqlDatabase

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/iccollect")


def _build_db(url: str) -> PooledPostgresqlDatabase:
    match = re.match(
        r"postgres(?:ql)?://(?:([^:@]+)(?::([^@]*))?@)?([^/:]+)(?::(\d+))?/(.+)",
        url,
    )
    if not match:
        raise ValueError(f"DATABASE_URL inválida: {url!r}")

    user, password, host, port, dbname = match.groups()

    return PooledPostgresqlDatabase(
        dbname,
        max_connections=10,
        stale_timeout=300,
        host=host,
        port=int(port or 5432),
        user=user or None,
        password=password or None,
    )


db = _build_db(DATABASE_URL)


class BaseModel(Model):
    class Meta:
        database = db


class User(BaseModel):
    id = AutoField()
    username = CharField(unique=True, max_length=255)
    password_hash = CharField(max_length=512)
    salt = CharField(max_length=64)

    class Meta:
        table_name = "users"


class Session(BaseModel):
    token = CharField(primary_key=True, max_length=64)
    user = ForeignKeyField(User, backref="sessions", on_delete="CASCADE")
    created_at = DateTimeField()

    class Meta:
        table_name = "sessions"


class Consulta(BaseModel):
    id = AutoField()
    url_informada = TextField(null=True)
    url_consultada = TextField(null=True)
    code = CharField(max_length=64, null=True, index=True)
    success = SmallIntegerField(default=0)
    message = TextField(null=True)
    created_at = DateTimeField()

    class Meta:
        table_name = "consultas"


class Barema(BaseModel):
    id = AutoField()
    consulta = ForeignKeyField(
        Consulta, backref="barema_set", on_delete="SET NULL", null=True
    )
    code = CharField(max_length=64, null=True, index=True)
    nome = TextField(null=True)

    # Tipo de barema: "professor" ou "aeri"
    tipo = CharField(max_length=20, default="professor")

    # ── Barema Professor ──────────────────────────────────────────────────
    titulacao_bruto = FloatField(default=0)
    titulacao_limitado = FloatField(default=0)
    producao_bruto = FloatField(default=0)
    producao_limitado = FloatField(default=0)
    formacao_bruto = FloatField(default=0)
    formacao_limitado = FloatField(default=0)
    eventos_bruto = FloatField(default=0)
    eventos_limitado = FloatField(default=0)

    # ── Barema AERI ───────────────────────────────────────────────────────
    participacao_eventos_bruto = FloatField(default=0)
    participacao_eventos_limitado = FloatField(default=0)
    producao_cientifica_bruto = FloatField(default=0)
    producao_cientifica_limitado = FloatField(default=0)
    lideranca_bruto = FloatField(default=0)
    lideranca_limitado = FloatField(default=0)
    programas_academicos_bruto = FloatField(default=0)
    programas_academicos_limitado = FloatField(default=0)

    # ── Comum ─────────────────────────────────────────────────────────────
    total_bruto = FloatField(default=0)
    total_limitado = FloatField(default=0)
    barema_json = TextField(null=True)
    updated_at = DateTimeField()

    class Meta:
        table_name = "barema"
