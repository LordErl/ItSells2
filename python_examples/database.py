import pyodbc
from contextlib import contextmanager
from datetime import datetime
import logging


logger = logging.getLogger(__name__)


# ODBC connection string
DATABASE_URL = (
    "Driver={SQL Server};"
    "Server=ITSERP\\ITSERPSRV;"
    "Database=ConectudoPDV;"
    "Trusted_Connection=yes;"
)

@contextmanager
def get_db_connection():
    conn = pyodbc.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

def registrar_pagamento(referencia: str, valor: float, nome: str, documento: str, status: str, tipo: str,
                        origem: str, referencia_externa: str = None, status_detail: str = None,
                        url_pagamento: str = None):
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Verificar se já existe pagamento aprovado
        cursor.execute("""
            SELECT COUNT(*) FROM pagamentos WHERE referencia = ? AND status = 'approved'
        """, (referencia,))
        if cursor.fetchone()[0]:
            logger.info(f"Pagamento já aprovado para a referência {referencia}. Ignorado.")
            return

        # Excluir rejeitados
        cursor.execute("""
            DELETE FROM pagamentos WHERE referencia = ? AND status = 'rejected'
        """, (referencia,))
        if cursor.rowcount:
            logger.info(f"Pagamentos rejeitados removidos para a referência {referencia}.")

        # Inserir novo
        cursor.execute("""
            INSERT INTO pagamentos (
                referencia, valor, nome, documento, status, tipo, origem,
                criado_em, referencia_externa, status_detail, atualizado_em,
                url_pagamento
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            referencia, valor, nome, documento, status, tipo, origem,
            datetime.now(), referencia_externa, status_detail, datetime.now(),
            url_pagamento
        ))

        conn.commit()
        logger.info(f"Pagamento registrado para {referencia}.")
    except Exception as e:
        logger.error(f"Erro ao registrar pagamento: {e}")
        raise
