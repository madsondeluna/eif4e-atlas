import sqlite3
import json
import os

DB_PATH = 'atlas.db'
OUTPUT_FILE = 'assets/data/data.json'

def export_to_json():
    print(f"Exportando dados de {DB_PATH} para {OUTPUT_FILE}...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Busca todas as proteínas com suas informações relacionadas
    query = '''
    SELECT 
        p.accession, p.name as protein_name, p.sequence, p.length, p.mass,
        g.name as gene_name,
        o.scientific_name, o.taxonomy_id
    FROM proteins p
    LEFT JOIN genes g ON p.gene_id = g.id
    LEFT JOIN organisms o ON p.organism_id = o.id
    '''
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        # Reconstrói a estrutura estilo UniProt que o frontend espera
        entry = {
            "primaryAccession": row['accession'],
            "proteinDescription": {
                "recommendedName": {
                    "fullName": {
                        "value": row['protein_name']
                    }
                }
            },
            "genes": [
                {
                    "geneName": {
                        "value": row['gene_name']
                    }
                }
            ],
            "organism": {
                "scientificName": row['scientific_name'],
                "taxonId": row['taxonomy_id']
            },
            "sequence": {
                "value": row['sequence'],
                "length": row['length'],
                "molWeight": row['mass']
            },
            # Precisamos buscar as anotações (termos GO) separadamente ou agregá-las
            # Por enquanto, vamos manter simples para a visualização em lista.
            # A visualização detalhada pode precisar de mais dados, mas vamos começar com isso.
            "uniProtKBCrossReferences": [] 
        }
        
        # Busca termos GO para esta proteína
        # Isso é um pouco ineficiente (consultas N+1), mas ok para 3000 entradas em um script de execução única.
        # Otimização: Buscar todas as anotações e criar um mapa.
        
        results.append(entry)

    # Otimização: Busca todas as anotações
    print("Buscando anotações...")
    cursor.execute("SELECT protein_accession, value FROM annotations WHERE type = 'GO'")
    annotations = cursor.fetchall()
    
    # Mapeia anotações para as entradas
    # Isso requer uma busca eficiente. Vamos indexar os resultados pelo accession.
    results_map = {r['primaryAccession']: r for r in results}
    
    for ann in annotations:
        accession = ann['protein_accession']
        if accession in results_map:
            # Formato do valor: "GO:0001234|Nome do Termo"
            parts = ann['value'].split('|')
            if len(parts) == 2:
                go_id, term = parts
                results_map[accession]['uniProtKBCrossReferences'].append({
                    "database": "GO",
                    "id": go_id,
                    "properties": [{"key": "GoTerm", "value": f"P:{term}"}] # Simplificado, assumindo P por enquanto ou apenas passando a string
                })

    # ---- ESTATÍSTICAS ----
    total_entries = len(results)
    # Contagem dos organismos
    from collections import Counter
    org_counter = Counter(r['organism']['scientificName'] for r in results)
    top5_org = org_counter.most_common(5)
    # Contagem dos termos GO
    go_counter = Counter()
    for r in results:
        for ref in r.get('uniProtKBCrossReferences', []):
            if ref['database'] == 'GO':
                go_counter[ref['id']] += 1
    top10_go = go_counter.most_common(10)
    stats = {
        "totalEntries": total_entries,
        "topOrganisms": [{"name": name, "count": cnt} for name, cnt in top5_org],
        "topGOTerms": [{"id": go_id, "count": cnt} for go_id, cnt in top10_go]
    }
    # Escreve no arquivo como objeto com stats e proteins
    with open(OUTPUT_FILE, 'w') as f:
        json.dump({"stats": stats, "proteins": results}, f)
    
    print(f"Sucesso! Exportados {len(results)} registros para {OUTPUT_FILE}")
    conn.close()

if __name__ == "__main__":
    export_to_json()
