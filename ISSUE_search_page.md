# Issue: Search page broken

**Descrição:**
A página de busca está quebrada. Não está conseguindo fazer buscas no banco interno e não está mostrando o levantamento de números.

**Passos para reproduzir:**
1. Abrir a página de busca.
2. Tentar realizar uma busca.
3. Observar que nenhum resultado é retornado e o levantamento de números não aparece.

**Comportamento esperado:**
- A busca deve consultar o banco interno e retornar resultados relevantes.
- A página deve exibir o levantamento de números indicando a quantidade de itens encontrados.

**Impacto:** Usuários não conseguem encontrar informações, prejudicando a usabilidade da aplicação.

**Possíveis correções:**
- Verificar o endpoint da API que consulta o banco interno.
- Garantir que o front‑end manipule corretamente a resposta e atualize a UI.
- Checar se o componente de levantamento de números está corretamente ligado à fonte de dados.
