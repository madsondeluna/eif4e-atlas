# Documentação do Plant eIF4E Atlas (A Data Warehouse Project)

Este documento detalha a arquitetura técnica do Data Warehouse do Plant eIF4E Atlas. Ele explica como os dados são adquiridos, armazenados e servidos para a aplicação frontend.

## Visão Geral da Arquitetura

O projeto segue uma arquitetura padrão de Data Warehouse adaptada para uma implantação web estática:

1.  **Fonte**: API REST UniProtKB.
2.  **Camada ETL**: Scripts Python (`etl.py`) extraem dados, transformam-nos em um formato relacional e carregam-nos em um banco de dados local.
3.  **Armazenamento**: Banco de dados SQLite (`atlas.db`) atuando como o repositório central.
4.  **Camada de Distribuição**: Script Python (`export_json.py`) exporta dados processados para um arquivo JSON estático (`assets/data/data.json`).
5.  **Camada de Apresentação**: O frontend (`index.html`, `js/uniprot.js`) busca o arquivo JSON estático para exibir dados ao usuário.

## Esquema do Banco de Dados

Os dados são armazenados em um banco de dados relacional SQLite (`atlas.db`) com o seguinte esquema:

### Tabelas

1.  **organisms** (organismos)
    -   `id` (Inteiro, Chave Primária): ID Interno.
    -   `scientific_name` (Texto, Único): Nome científico da espécie.
    -   `taxonomy_id` (Inteiro): ID de Taxonomia do NCBI.

2.  **genes**
    -   `id` (Inteiro, Chave Primária): ID Interno.
    -   `name` (Texto): Nome do gene (ex: eIF4E1).
    -   `organism_id` (Inteiro, Chave Estrangeira): Referência à tabela `organisms`.

3.  **proteins** (proteínas)
    -   `accession` (Texto, Chave Primária): ID de Acesso UniProt.
    -   `name` (Texto): Nome completo da proteína.
    -   `sequence` (Texto): Sequência de aminoácidos.
    -   `length` (Inteiro): Comprimento da sequência.
    -   `mass` (Inteiro): Peso molecular em Daltons.
    -   `gene_id` (Inteiro, Chave Estrangeira): Referência à tabela `genes`.
    -   `organism_id` (Inteiro, Chave Estrangeira): Referência à tabela `organisms`.

4.  **annotations** (anotações)
    -   `id` (Inteiro, Chave Primária): ID Interno.
    -   `protein_accession` (Texto, Chave Estrangeira): Referência à tabela `proteins`.
    -   `type` (Texto): Tipo de anotação (ex: 'GO').
    -   `value` (Texto): O valor da anotação.

## Pipeline ETL (Extrair, Transformar, Carregar)

O processo ETL é gerenciado por `data_warehouse/etl.py`.

### 1. Extração (Extraction)
O script envia uma requisição para a API REST UniProtKB.
-   **Endpoint**: `https://rest.uniprot.org/uniprotkb/search`
-   **Consulta**: `(eif4e OR eif4e1a OR "translation initiation factor 4e") AND taxonomy_name:Viridiplantae`
-   **Paginação**: O script lida automaticamente com a paginação para buscar todos os registros disponíveis (atualmente 3000+).

### 2. Transformação (Transformation)
Os dados JSON brutos do UniProt são analisados.
-   Informações de Organismo e Gene são extraídas e normalizadas para evitar duplicatas.
-   Sequências de proteínas e metadados (comprimento, massa) são validados.
-   Termos GO são extraídos de referências cruzadas.

### 3. Carregamento (Loading)
Os dados são inseridos no banco de dados SQLite.
-   `INSERT OR IGNORE` é usado para organismos para garantir unicidade.
-   `INSERT OR REPLACE` é usado para proteínas para garantir que os dados mais recentes sejam armazenados.

### 4. Exemplos de Dados (Input/Output)

Para ilustrar o processo de transformação, aqui está um exemplo simplificado de como os dados fluem através do sistema.

#### Input (API UniProt)
Este é um trecho do JSON bruto recebido da API UniProt para uma proteína de *Arabidopsis thaliana*:

```json
{
  "primaryAccession": "P29557",
  "uniProtkbId": "IF4E_ARATH",
  "organism": {
    "scientificName": "Arabidopsis thaliana",
    "commonName": "Mouse-ear cress",
    "taxonId": 3702,
    "lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Embryophyta", "Tracheophyta", "Spermatophyta", "Magnoliopsida", "Eudicotyledons", "Gunneridae", "Pentapetalae", "Rosids", "Malvids", "Brassicales", "Brassicaceae", "Camelineae", "Arabidopsis"]
  },
  "proteinDescription": {
    "recommendedName": {
      "fullName": { "value": "Eukaryotic translation initiation factor 4E-1" }
    }
  },
  "genes": [
    { "geneName": { "value": "EIF4E1" } }
  ],
  "sequence": {
    "value": "MAVVEGKSKLTLL...",
    "length": 220,
    "molWeight": 25123
  }
}
```

#### Output (Banco de Dados SQLite)
O script ETL normaliza e insere esses dados em várias tabelas relacionais:

**Tabela `organisms`**:
| id | scientific_name | taxonomy_id |
|----|-----------------|-------------|
| 1  | Arabidopsis thaliana | 3702 |

**Tabela `genes`**:
| id | name | organism_id |
|----|------|-------------|
| 1  | EIF4E1 | 1 |

**Tabela `proteins`**:
| accession | name | sequence | length | mass | gene_id | organism_id |
|-----------|------|----------|--------|------|---------|-------------|
| P29557    | Eukaryotic translation initiation factor 4E-1 | MAVVEGKSKLTLL... | 220 | 25123 | 1 | 1 |

#### Output (Exportação JSON para Frontend)
Finalmente, o script de exportação reconstrói um objeto JSON otimizado para o frontend:

```json
[
  {
    "primaryAccession": "P29557",
    "proteinDescription": {
      "recommendedName": {
        "fullName": { "value": "Eukaryotic translation initiation factor 4E-1" }
      }
    },
    "genes": [
      { "geneName": { "value": "EIF4E1" } }
    ],
    "organism": {
      "scientificName": "Arabidopsis thaliana",
      "lineage": ["Viridiplantae", "...", "Arabidopsis"]
    },
    "sequence": {
      "value": "MAVVEGKSKLTLL...",
      "length": 220,
      "molWeight": 25123
    }
  }
]
```

## Integração com Frontend

O frontend não se conecta diretamente ao banco de dados SQLite. Em vez disso, ele consome uma exportação JSON estática.

### Exportação de Dados
O script `data_warehouse/export_json.py` consulta o banco de dados `atlas.db` e constrói um objeto JSON que espelha a estrutura esperada pelo frontend (semelhante ao formato de resposta da API UniProt). Este arquivo é salvo em `assets/data/data.json`.

### Carregamento Client-Side
O arquivo JavaScript `js/uniprot.js` foi modificado para:
1.  Buscar `assets/data/data.json` no carregamento da página.
2.  Armazenar os dados em cache na memória.
3.  Realizar operações de busca e filtragem localmente no navegador usando métodos de array JavaScript (`filter`, `includes`).

## Automação

Para manter o Data Warehouse atualizado, você pode automatizar o processo ETL.

### Atualização Manual
Execute os seguintes comandos no seu terminal:

```bash
# 1. Atualizar o Banco de Dados
python3 data_warehouse/etl.py

# 2. Atualizar os Dados do Frontend
python3 data_warehouse/export_json.py
```

### Automação Agendada (Cron)
Você pode configurar um cron job em um servidor (ou na sua máquina local) para executar esses scripts semanalmente.

Exemplo de entrada `crontab` para executar toda segunda-feira às 3 da manhã:
```bash
0 3 * * 1 cd /caminho/para/projeto && python3 data_warehouse/etl.py && python3 data_warehouse/export_json.py
```
