import sqlite3
import pandas as pd

# Conectar ao banco de dados
conn = sqlite3.connect('atlas.db')

def run_query(title, sql):
    print(f"\n--- {title} ---")
    try:
        # Usando pandas para deixar a tabela bonitinha no terminal
        df = pd.read_sql_query(sql, conn)
        print(df.to_string(index=False))
    except ImportError:
        # Fallback se não tiver pandas instalado
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchall()
        for row in rows:
            print(row)

# 1. Contagem total de proteínas
run_query("Total de Proteínas no Banco", 
          "SELECT COUNT(*) as total FROM proteins")

# 2. Top 5 Espécies com mais entradas de eIF4E
run_query("Top 5 Espécies com mais dados", '''
    SELECT o.scientific_name, COUNT(*) as contagem
    FROM proteins p
    JOIN organisms o ON p.organism_id = o.id
    GROUP BY o.scientific_name
    ORDER BY contagem DESC
    LIMIT 5
''')

# 3. Média de tamanho das proteínas (Aminoácidos)
run_query("Média de Tamanho (aa)", 
          "SELECT AVG(length) as media_tamanho FROM proteins")

# 4. Listar 3 genes diferentes encontrados
run_query("Exemplos de Genes", 
          "SELECT DISTINCT name FROM genes WHERE name != 'N/A' LIMIT 3")

conn.close()
