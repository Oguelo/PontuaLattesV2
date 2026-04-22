"""
Sistema de migrations para o banco PostgreSQL (Peewee).

Uso:
  python migrations.py            # aplica todas as migrations pendentes
  python migrations.py --status   # mostra o estado atual
  python migrations.py --rollback # desfaz a última migration aplicada

Cada migration é uma função com o padrão:
  def migration_NNNN_descricao(migrator): ...

O histórico de migrations aplicadas é salvo na tabela schema_migrations.
"""

import argparse
import os
import sys
from datetime import datetime

from peewee import (
    CharField,
    DateTimeField,
    Model,
    PostgresqlDatabase,
)
from playhouse.migrate import PostgresqlMigrator, migrate

# ── conexão ───────────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://localhost/iccollect"
)


def _build_db(url: str) -> PostgresqlDatabase:
    import re
    match = re.match(
        r"postgres(?:ql)?://(?:([^:@]+)(?::([^@]*))?@)?([^/:]+)(?::(\d+))?/(.+)",
        url,
    )
    if not match:
        raise ValueError(f"DATABASE_URL inválida: {url!r}")
    user, password, host, port, dbname = match.groups()
    return PostgresqlDatabase(
        dbname,
        host=host,
        port=int(port or 5432),
        user=user or None,
        password=password or None,
    )


db = _build_db(DATABASE_URL)
migrator = PostgresqlMigrator(db)


# ── tabela de controle ────────────────────────────────────────────────────────

class SchemaMigration(Model):
    name = CharField(unique=True, max_length=255)
    applied_at = DateTimeField(default=datetime.now)

    class Meta:
        database = db
        table_name = "schema_migrations"


def _ensure_migrations_table():
    db.create_tables([SchemaMigration], safe=True)


def _applied() -> set:
    return {m.name for m in SchemaMigration.select()}


def _mark_applied(name: str):
    SchemaMigration.create(name=name, applied_at=datetime.now())


def _mark_rolledback(name: str):
    SchemaMigration.delete().where(SchemaMigration.name == name).execute()


# ── migrations ────────────────────────────────────────────────────────────────
# Adicione novas migrations SEMPRE no final da lista.
# Nunca altere ou remova uma migration já aplicada em produção.
# ─────────────────────────────────────────────────────────────────────────────

def migration_0001_initial_schema(migrator):
    """
    Cria as tabelas iniciais do projeto.
    Equivale ao init_database() do database.py — só roda se as tabelas
    ainda não existirem (safe=True no create_tables).
    """
    from models import User, Session, Consulta, Barema
    db.create_tables([User, Session, Consulta, Barema], safe=True)


def migration_0001_initial_schema_rollback(migrator):
    from models import User, Session, Consulta, Barema
    db.drop_tables([Barema, Consulta, Session, User], safe=True)


# Exemplo de migration futura — adicionar coluna:
#
# def migration_0002_consulta_add_ip(migrator):
#     """Adiciona coluna ip_address na tabela consultas."""
#     from peewee import CharField
#     migrate(
#         migrator.add_column("consultas", "ip_address", CharField(null=True, max_length=45))
#     )
#
# def migration_0002_consulta_add_ip_rollback(migrator):
#     migrate(migrator.drop_column("consultas", "ip_address"))


# ── registro de migrations ────────────────────────────────────────────────────
# A ordem importa — migrations são aplicadas na ordem da lista.

MIGRATIONS = [
    migration_0001_initial_schema,
    # migration_0002_consulta_add_ip,  ← próximas entram aqui
]

ROLLBACKS = {
    "migration_0001_initial_schema": migration_0001_initial_schema_rollback,
    # "migration_0002_consulta_add_ip": migration_0002_consulta_add_ip_rollback,
}


# ── runner ────────────────────────────────────────────────────────────────────

def run_migrations():
    _ensure_migrations_table()
    applied = _applied()
    pending = [m for m in MIGRATIONS if m.__name__ not in applied]

    if not pending:
        print("Nenhuma migration pendente.")
        return

    for migration_fn in pending:
        name = migration_fn.__name__
        print(f"  Aplicando {name}...", end=" ")
        try:
            with db.atomic():
                migration_fn(migrator)
                _mark_applied(name)
            print("OK")
        except Exception as exc:
            print(f"ERRO: {exc}")
            sys.exit(1)

    print(f"\n{len(pending)} migration(s) aplicada(s).")


def show_status():
    _ensure_migrations_table()
    applied = _applied()

    print(f"{'Migration':<50} {'Status'}")
    print("-" * 60)
    for m in MIGRATIONS:
        status = "✅ aplicada" if m.__name__ in applied else "⏳ pendente"
        print(f"{m.__name__:<50} {status}")


def run_rollback():
    _ensure_migrations_table()
    applied = _applied()

    applied_in_order = [
        m for m in reversed(MIGRATIONS)
        if m.__name__ in applied
    ]

    if not applied_in_order:
        print("Nenhuma migration aplicada para desfazer.")
        return

    last = applied_in_order[0]
    name = last.__name__
    rollback_fn = ROLLBACKS.get(name)

    if not rollback_fn:
        print(f"Sem rollback definido para {name}.")
        sys.exit(1)

    print(f"  Desfazendo {name}...", end=" ")
    try:
        with db.atomic():
            rollback_fn(migrator)
            _mark_rolledback(name)
        print("OK")
    except Exception as exc:
        print(f"ERRO: {exc}")
        sys.exit(1)


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gerenciador de migrations")
    parser.add_argument("--status",   action="store_true", help="Mostra o estado das migrations")
    parser.add_argument("--rollback", action="store_true", help="Desfaz a última migration")
    args = parser.parse_args()

    with db.connection_context():
        if args.status:
            show_status()
        elif args.rollback:
            run_rollback()
        else:
            run_migrations()
