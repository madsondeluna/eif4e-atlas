import sqlite3
import requests
import json
import os
import time

# Configurações
DB_PATH = 'atlas.db'
UNIPROT_API_BASE = 'https://rest.uniprot.org/uniprotkb'
SEARCH_QUERY = '(eif4e OR eif4e1a OR "translation initiation factor 4e") AND taxonomy_name:Viridiplantae'

def create_database():
    """Cria o banco de dados SQLite e as tabelas necessárias."""
    print(f"Criando banco de dados em {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Habilita chaves estrangeiras para garantir a integridade dos dados
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Tabela de Organismos
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS organisms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT UNIQUE,
        taxonomy_id INTEGER
    )
    ''')

    # Tabela de Genes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS genes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        organism_id INTEGER,
        FOREIGN KEY (organism_id) REFERENCES organisms(id)
    )
    ''')

    # Tabela de Proteínas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS proteins (
        accession TEXT PRIMARY KEY,
        name TEXT,
        sequence TEXT,
        length INTEGER,
        mass INTEGER,
        gene_id INTEGER,
        organism_id INTEGER,
        FOREIGN KEY (gene_id) REFERENCES genes(id),
        FOREIGN KEY (organism_id) REFERENCES organisms(id)
    )
    ''')

    # Tabela de Anotações (para termos GO, funções, etc.)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS annotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        protein_accession TEXT,
        type TEXT,
        value TEXT,
        FOREIGN KEY (protein_accession) REFERENCES proteins(accession)
    )
    ''')

    conn.commit()
    return conn

def fetch_uniprot_data():
    """Busca todos os dados correspondentes no UniProt com paginação."""
    print("Buscando dados do UniProt...")
    url = f"{UNIPROT_API_BASE}/search"
    params = {
        'query': SEARCH_QUERY,
        'fields': 'accession,id,protein_name,gene_names,organism_name,length,sequence,mass,cc_function,cc_subcellular_location,go',
        'format': 'json',
        'size': 500  # Tamanho da página
    }
    
    all_results = []
    
    while True:
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = data.get('results', [])
            all_results.extend(results)
            print(f"Baixados {len(results)} registros. Total até agora: {len(all_results)}")
            
            # Verifica se tem próxima página
            if 'next' in response.links:
                url = response.links['next']['url']
                params = {} # Parâmetros já estão incluídos no link 'next'
            else:
                break
                
            time.sleep(1) # Vamos ser gentis com a API e esperar um pouco
            
        except Exception as e:
            print(f"Erro ao buscar dados: {e}")
            break
            
    return all_results

def insert_data(conn, results):
    """Insere os dados baixados no banco de dados."""
    print("Inserindo dados no banco de dados...")
    cursor = conn.cursor()
    
    count = 0
    for entry in results:
        try:
            # 1. Organismo
            organism_name = entry.get('organism', {}).get('scientificName', 'Unknown')
            taxonomy_id = entry.get('organism', {}).get('taxonId', 0)
            
            cursor.execute('INSERT OR IGNORE INTO organisms (scientific_name, taxonomy_id) VALUES (?, ?)', 
                           (organism_name, taxonomy_id))
            
            # Pega o ID do organismo
            cursor.execute('SELECT id FROM organisms WHERE scientific_name = ?', (organism_name,))
            organism_id = cursor.fetchone()[0]
            
            # 2. Gene
            gene_name = 'N/A'
            if entry.get('genes'):
                gene_name = entry['genes'][0].get('geneName', {}).get('value', 'N/A')
                
            cursor.execute('INSERT INTO genes (name, organism_id) VALUES (?, ?)', (gene_name, organism_id))
            gene_id = cursor.lastrowid
            
            # 3. Proteína
            accession = entry.get('primaryAccession')
            protein_name = entry.get('proteinDescription', {}).get('recommendedName', {}).get('fullName', {}).get('value', 'Unknown Protein')
            sequence = entry.get('sequence', {}).get('value', '')
            length = entry.get('sequence', {}).get('length', 0)
            mass = entry.get('sequence', {}).get('molWeight', 0)
            
            cursor.execute('''
            INSERT OR REPLACE INTO proteins (accession, name, sequence, length, mass, gene_id, organism_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (accession, protein_name, sequence, length, mass, gene_id, organism_id))
            
            # 4. Anotações (Termos GO)
            if 'uniProtKBCrossReferences' in entry:
                for ref in entry['uniProtKBCrossReferences']:
                    if ref['database'] == 'GO':
                        go_id = ref['id']
                        term = next((p['value'] for p in ref.get('properties', []) if p['key'] == 'GoTerm'), '')
                        cursor.execute('INSERT INTO annotations (protein_accession, type, value) VALUES (?, ?, ?)',
                                       (accession, 'GO', f"{go_id}|{term}"))

            count += 1
            
        except Exception as e:
            print(f"Erro ao inserir registro {entry.get('primaryAccession', 'unknown')}: {e}")
            continue

    conn.commit()
    print(f"Sucesso! Inseridos {count} registros.")

def main():
    conn = create_database()
    data = fetch_uniprot_data()
    if data:
        insert_data(conn, data)
    conn.close()
    print("Processo ETL concluído.")

if __name__ == "__main__":
    main()
