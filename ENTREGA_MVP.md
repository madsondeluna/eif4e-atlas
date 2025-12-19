# Entrega do MVP - Atlas eIF4E de Plantas

## Informações Gerais

**Aluno:** Madson Aragão  
**Disciplina:** Engenharia de Dados (código 40530010057_20250_02)  
**Curso:** Pós-Graduação em Data Science and Analytics - PUC-Rio  
**Data de Entrega:** 19 de dezembro de 2024

---

## Links de Acesso

**Site do Projeto (GitHub Pages):**  
https://madsondeluna.github.io/eif4e-atlas/

**Repositório no GitHub:**  
https://github.com/madsondeluna/eif4e-atlas

**Documentação Completa (README):**  
https://github.com/madsondeluna/eif4e-atlas/blob/main/README.md

---

## Sobre o Projeto

O **Atlas eIF4E de Plantas** é um Data Warehouse desenvolvido para consolidar e analisar dados proteômicos e genômicos de proteínas eIF4E (fator de iniciação de tradução eucariótica 4E) em plantas. Este projeto constitui o MVP (Minimum Viable Product) da Sprint de Engenharia de Dados, demonstrando a aplicação prática de conceitos de modelagem dimensional, ETL e análise de dados em um contexto de bioinformática aplicada.

### Problema Abordado

As proteínas eIF4E são essenciais para a síntese proteica em plantas e desempenham papel crucial na resistência a vírus agrícolas, particularmente Potyvirus. No entanto, os dados sobre estas proteínas estão dispersos em repositórios públicos sem integração estruturada, dificultando análises comparativas e identificação de variantes para melhoramento genético. Este projeto resolve esse problema através da construção de um data warehouse que consolida dados de 1.247 proteínas de 450+ espécies vegetais.

### Principais Características

**Fonte de Dados:**
- Base: UniProtKB (Universal Protein Knowledgebase)
- Licença: Creative Commons Attribution 4.0 (CC BY 4.0)
- Volume: 1.247 proteínas, 450+ espécies, 120+ famílias botânicas
- Qualidade: 84.5% revisadas manualmente (Swiss-Prot)

**Arquitetura Técnica:**
- Modelo dimensional: Star Schema com 9 tabelas (1 fato principal + 5 dimensões + 2 fatos adicionais + 2 associativas)
- Banco de dados: SQLite (3.7 MB)
- Pipeline ETL: Automatizado em Python com tratamento de erros e logging
- Export: JSON otimizado (5.9 MB) para consumo no frontend
- Frontend: HTML5, CSS3, JavaScript Vanilla, Chart.js, D3.js
- Deploy: GitHub Pages (hospedagem gratuita e confiável)

**Funcionalidades Implementadas:**
1. Interface web interativa com 8 páginas navegáveis
2. Busca de proteínas por nome, espécie ou família taxonômica
3. Visualizações gráficas (distribuição por família, comprimento de sequências, funções GO)
4. Árvore filogenética navegável com D3.js
5. Alinhamento múltiplo de sequências (MSA) com coloração por conservação
6. Análise estrutural de domínios proteicos
7. Mapeamento de variantes de resistência viral

### Resultados e Análises

O projeto responde 16 perguntas de pesquisa organizadas em 4 categorias:

1. **Diversidade Taxonômica:** Fabaceae lidera com 28% das proteínas, seguida por Solanaceae (15%) e Brassicaceae (12%)

2. **Características Moleculares:** Comprimento médio de 217 aminoácidos, com domínio IF4E presente em 98% das proteínas

3. **Anotações Funcionais:** 94.6% das proteínas anotadas com função de iniciação de tradução, 91.8% com ligação ao cap 5' do mRNA

4. **Resistência Viral:** 45 variantes documentadas conferem resistência a Potyvirus, concentradas nas posições 56-76 (região VPg-binding)

**Score de Qualidade dos Dados:** 95.1%
- Completude: 95.8%
- Integridade referencial: 100%
- Consistência: 98.5%
- Acurácia científica: 92.0%

### Documentação

O projeto possui documentação técnica completa com **2.122 linhas** no arquivo README.md, incluindo:

- Objetivos detalhados e 16 perguntas de pesquisa (com respostas em itálico)
- Justificativa da escolha da fonte de dados (comparação com alternativas)
- Pipeline ETL documentado com código Python comentado
- Modelo dimensional com diagrama ERD (Draw.io SVG)
- Catálogo completo de dados (9 tabelas, 100+ campos documentados)
- Análise de qualidade em 6 dimensões
- 16 análises SQL respondendo às perguntas de pesquisa
- Autoavaliação detalhada segundo os 7 critérios do MVP
- 15 referências bibliográficas
- Instruções de instalação e execução
- Exemplos de queries SQL (Anexo B)

### Tecnologias Utilizadas

**Backend:**
- Python 3.11 (requests, pandas, numpy, biopython)
- SQLite 3.43
- ETL automatizado com logging e tratamento de erros

**Frontend:**
- HTML5, CSS3 (Glassmorphism design)
- JavaScript ES6+ (Vanilla, sem frameworks)
- Chart.js (gráficos interativos)
- D3.js (árvore filogenética)
- Design responsivo (mobile-friendly)

**Infraestrutura:**
- Git + GitHub (controle de versão)
- GitHub Pages (deploy em nuvem)
- Visual Studio Code (desenvolvimento)
- GitHub Copilot (assistência de código)

### Aplicações e Impacto

**Acadêmico:**
- Base de conhecimento para estudos comparativos de eIF4E
- Recurso educacional para bioinformática e engenharia de dados
- Benchmark dataset para algoritmos de predição

**Agronômico:**
- Identificação de candidatos para melhoramento genético
- Planejamento de edição genética (CRISPR) para resistência viral
- Cobertura de 85% das top-20 culturas de importância econômica

**Potencial:** Redução de 10-30% de perdas agrícolas em regiões com alta incidência viral

### Autoavaliação

O projeto atende plenamente aos 7 critérios de avaliação do MVP:

| Critério | Pontuação | Observações |
|----------|-----------|-------------|
| 1. Objetivo | 1,0/1,0 | 16 perguntas bem definidas, problema claro |
| 2. Coleta | 0,5/0,5 | UniProtKB justificado, 1.247 proteínas, 100% sucesso |
| 3. Modelagem | 2,0/2,0 | Star schema + catálogo completo de 9 tabelas |
| 4. Carga | 1,0/1,0 | ETL documentado, integridade 100% |
| 5. Análise | 3,0/3,0 | Qualidade 95.1%, 16 análises, discussões |
| 6. Autoavaliação | 0,5/0,5 | Reflexão sobre objetivos e processo |
| 7. Capricho | 2,0/2,0 | 2.122 linhas doc, interface funcional |
| **TOTAL** | **9,0-10,0** | **90-100%** |

### Diferenciais do Projeto

1. **Rigor Científico:** Dados validados biologicamente (92% conservação em resíduos críticos)
2. **Completude Documental:** README com 2.122 linhas cobrindo todos os aspectos técnicos
3. **Interface Funcional:** 8 páginas com visualizações interativas (não apenas mockups)
4. **Reprodutibilidade:** Pipeline completamente automatizado e documentado
5. **Aplicabilidade Real:** Identificação de 45 variantes com potencial para agricultura
6. **Qualidade de Dados:** Score geral de 95.1% em 6 dimensões
7. **Inovação:** Primeiro data warehouse consolidado para eIF4E de plantas

### Como Explorar o Projeto

1. **Site Interativo:** Acesse https://madsondeluna.github.io/eif4e-atlas/ para explorar as visualizações e dados
2. **Código-Fonte:** Veja o repositório completo em https://github.com/madsondeluna/eif4e-atlas
3. **Documentação:** Leia o README.md detalhado no repositório
4. **Replicação:** Clone o repositório e execute `python data_warehouse/etl.py` para recriar o warehouse

### Contato

**Aluno:** Madson Aragão  
**GitHub:** @madsondeluna  
**Repositório:** github.com/madsondeluna/eif4e-atlas

---

**Observações Finais:**

Este MVP demonstra a aplicação prática de conceitos de engenharia de dados em um problema real de bioinformática, com potencial impacto em segurança alimentar através do melhoramento genético vegetal. O projeto é completamente reproduzível, bem documentado e possui interface funcional acessível publicamente.

Agradeço a oportunidade de desenvolver este trabalho e coloco-me à disposição para esclarecimentos.

**Data da Entrega:** 19 de dezembro de 2024
