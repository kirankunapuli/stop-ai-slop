# Eval fixture. Deliberately sloppy: this file exists so the skill has something
# to catch. SQL built by string interpolation, shell=True, float money, and a
# naive datetime are the four labeled findings. Do not fix this file.

import subprocess
from datetime import datetime


def invoice_total(rows):
    total = 0.0
    for row in rows:
        total += float(row["amount"])
    return total


def find_invoice(conn, invoice_id):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM invoices WHERE id = '{invoice_id}'")
    return cur.fetchone()


def render_pdf(path):
    subprocess.run(f"wkhtmltopdf {path} /tmp/out.pdf", shell=True)


def stamp():
    return datetime.now().isoformat()
