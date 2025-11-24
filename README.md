# Plant eIF4E Atlas (A Data Warehouse Project)

Um Data Warehouse proteômico e genômico abrangente para eIF4E (Fator de Iniciação de Tradução Eucariótica 4E), apresentando armazenamento centralizado de dados, dados de mutação, insights estruturais e análise entre espécies.

## Funcionalidades

-   **Arquitetura de Data Warehouse**: Os dados são extraídos, transformados e carregados (ETL) em um banco de dados SQLite local, garantindo persistência dos dados e disponibilidade offline.
-   **Busca Centralizada**: Pesquise por Nome da Proteína, Espécie (ex: "Arabidopsis thaliana") ou ID UniProt (ex: "P29557") usando o conjunto de dados local.
-   **Visualização Interativa**:
    -   Cartões de resultados dinâmicos.
    -   **Paisagem de Mutação**: Gráficos de barras visualizando a distribuição de mutações ao longo da sequência da proteína.
    -   **Distribuição Taxonômica**: Gráfico interativo mostrando diversidade de proteínas através dos níveis taxonômicos (Reino, Filo, Classe, Ordem, Família, Gênero, Espécies).
    -   Visualizações modais detalhadas com informações genômicas e estruturais.
-   **Filogenia Interativa**:
    -   Árvore filogenética interativa com busca dinâmica por organismo.
    -   Gráfico de distribuição taxonômica com atualizações em tempo real.
    -   Estatísticas de diversidade (proteínas, espécies, reino).
-   **Design Responsivo**:
    -   Interface adaptativa com tipografia responsiva usando `clamp()`.
    -   Navegação mobile com menu hambúrguer.
    -   Espaçamentos fluidos que se adaptam ao tamanho da tela.
    -   Textos justificados para aparência mais elegante.

## Stack Tecnológico

-   **Backend / ETL**: Python 3, SQLite.
-   **Frontend**: HTML5, CSS3 (Propriedades Personalizadas), Vanilla JavaScript (ES6+).
-   **Bibliotecas**: Chart.js para visualização de dados (distribuição taxonômica e paisagens de mutação), D3.js para árvores filogenéticas.
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

## Customização e Manutenção

### Filtro de Dados (Plantas)
Para garantir que o Atlas exiba apenas dados de plantas, um filtro é aplicado no carregamento dos dados.
- **Arquivo**: `js/uniprot.js`
- **Função**: `loadData()`
- **Lógica**: O código filtra entradas onde `organism.lineage` inclui `'Viridiplantae'`. Para remover esse filtro ou alterar para outro grupo taxonômico, edite esta função.

### Gráficos da Página de Busca
- **Estilo:** "Frozen Glass Bubbles" (Bolhas de Vidro Fosco) com animação suave.
- **Interatividade:**
    - **Hover:** Realça a bolha e mostra tooltip.
    - **Clique:** Expande a bolha para revelar o nome completo (científico ou termo GO).
- **Layout:** Disposição vertical para melhor visualização dos Top 10 Organismos e Top 10 Termos GO.
- **Sincronização de Dados:** A página de busca tenta utilizar o cache da página de Filogenia para garantir que os números totais (ex: ~1.250 entradas) sejam consistentes em toda a aplicação. Se o cache não existir, ela carrega os dados locais com um mecanismo de fallback para evitar erros.
- **Abreviação de Nomes**: A função `abbreviateOrganism` abrevia o gênero (ex: "Vigna unguiculata" -> "V. unguiculata").
- **Dicionário de Termos GO**: A função `shortenGoTerm` utiliza um dicionário para mapear termos longos para versões curtas (ex: "translation initiation" -> "Transl. Init."). Adicione novos termos a este dicionário conforme necessário para ajustar a exibição nas bolhas.

## Licença

Esta aplicação é open source e está disponível sob a Licença MIT.