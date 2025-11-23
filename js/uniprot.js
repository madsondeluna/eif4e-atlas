/**
 * Módulo de Integração de Dados Locais
 * Lida com a busca de dados do Data Warehouse JSON local.
 */

const DATA_URL = 'assets/data/data.json';
let cachedData = null;

/**
 * Carrega dados do arquivo JSON local.
 * @returns {Promise<Array>} - O conjunto de dados completo.
 */
async function loadData() {
    if (cachedData) return cachedData;

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Falha ao carregar dados locais');
        cachedData = await response.json();
        return cachedData;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return [];
    }
}

/**
 * Busca dados locais para entradas relacionadas a eIF4E.
 * @param {string} query - A consulta de busca.
 * @returns {Promise<Array>} - Lista de entradas de proteínas correspondentes.
 */
export async function searchUniProt(query) {
    const data = await loadData();
    if (!query) return data.slice(0, 20); // Retorna os primeiros 20 se não houver consulta

    const lowerQuery = query.toLowerCase();

    // Filtra dados localmente
    const results = data.filter(entry => {
        const accession = entry.primaryAccession.toLowerCase();
        const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value?.toLowerCase() || '';
        const geneName = entry.genes?.[0]?.geneName?.value?.toLowerCase() || '';
        const organism = entry.organism?.scientificName?.toLowerCase() || '';

        return accession.includes(lowerQuery) ||
            proteinName.includes(lowerQuery) ||
            geneName.includes(lowerQuery) ||
            organism.includes(lowerQuery);
    });

    return results.slice(0, 50); // Limita resultados para desempenho
}

/**
 * Busca informações detalhadas para um accession específico dos dados locais.
 * @param {string} accession - O ID de acesso UniProt.
 * @returns {Promise<Object>} - Dados detalhados da proteína.
 */
export async function getProteinDetails(accession) {
    const data = await loadData();
    return data.find(entry => entry.primaryAccession === accession) || null;
}

/**
 * Busca estatísticas globais dos dados locais.
 * @returns {Promise<Object>} - Objeto de estatísticas com totalEntries.
 */
export async function getGlobalStats() {
    const data = await loadData();
    return { totalEntries: data.length };
}
