# Plant eIF4E Atlas (A Data Warehouse Project)

Um Data Warehouse proteômico e genômico abrangente para eIF4E (Fator de Iniciação de Tradução Eucariótica 4E), apresentando armazenamento centralizado de dados, dados de mutação, insights estruturais e análise entre espécies.

## Funcionalidades

-   **Arquitetura de Data Warehouse**: Os dados são extraídos, transformados e carregados (ETL) em um banco de dados SQLite local, garantindo persistência dos dados e disponibilidade offline.
-   **Busca Centralizada**: Pesquise por Nome da Proteína, Espécie (ex: "Arabidopsis thaliana") ou ID UniProt (ex: "P29557") usando o conjunto de dados local.
-   **Visualização Interativa**:
    -   Cartões de resultados dinâmicos.
    -   **Paisagem de Mutação**: Gráficos de barras visualizando a distribuição de mutações ao longo da sequência da proteína.
    -   Visualizações modais detalhadas com informações genômicas e estruturais.
-   **Design Responsivo**: Funciona perfeitamente em desktop e dispositivos móveis.

## Stack Tecnológico

-   **Backend / ETL**: Python 3, SQLite.
-   **Frontend**: HTML5, CSS3 (Propriedades Personalizadas), Vanilla JavaScript (ES6+).
-   **Bibliotecas**: Chart.js para visualização de dados.
-   **Fonte de Dados**: API REST UniProtKB (processada via ETL).
-   **Implantação**: GitHub Pages (Client-side com dados JSON estáticos).

## Configuração e Implantação

### Desenvolvimento Local

1.  Clone o repositório:
    ```bash
    git clone https://github.com/madsondeluna/eif4e-atlas.git
    ```

2.  (Opcional) Atualize o Data Warehouse:
    Veja `data_warehouse/README.md` para instruções detalhadas sobre como executar o pipeline ETL.

3.  Abra `index.html` no seu navegador.

### Implantando no GitHub Pages

1.  Envie o código para o seu repositório GitHub.
2.  Vá para **Settings** > **Pages**.
3.  Em **Source**, selecione `Deploy from a branch`.
4.  Selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
5.  Clique em **Save**.
6.  Seu site estará no ar em: `https://madsondeluna.github.io/eif4e-atlas/`

## Licença

Esta aplicação é open source e está disponível sob a Licença MIT.