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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allData = await response.json();

        // Filter for Plants (Viridiplantae) to match Phylogeny page
        cachedData = allData.filter(entry =>
            entry.organism?.lineage?.includes('Viridiplantae')
        );

        return cachedData;
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return [];
    }
}

/**
 * Busca dados locais para entradas relacionadas a eIF4E.
 * @param {string} query - A consulta de busca.
 * @returns {Promise<Array>} - Lista de entradas de proteínas correspondentes.
 */
export async function searchUniProt(query) {
    const proteins = await loadData();
    if (!query) return proteins.slice(0, 20); // Retorna os primeiros 20 se não houver consulta

    const lowerQuery = query.toLowerCase();

    // Filtra dados localmente
    const results = proteins.filter(entry => {
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
    const proteins = await loadData();
    return proteins.find(entry => entry.primaryAccession === accession) || null;
}

/**
 * Busca estatísticas globais dos dados locais.
 * @returns {Promise<Object>} - Objeto de estatísticas com totalEntries, topOrganisms, topGOTerms.
 */
export async function getGlobalStats() {
    const proteins = await loadData();

    // Total Entries
    const totalEntries = proteins.length;

    // Top Organisms
    const organismCounts = {};
    proteins.forEach(p => {
        const org = p.organism?.scientificName || 'Unknown';
        organismCounts[org] = (organismCounts[org] || 0) + 1;
    });

    const topOrganisms = Object.entries(organismCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Top GO Terms
    const goCounts = {};
    proteins.forEach(p => {
        if (p.uniProtKBCrossReferences) {
            p.uniProtKBCrossReferences.forEach(ref => {
                if (ref.database === 'GO') {
                    const termProp = ref.properties?.find(prop => prop.key === 'GoTerm');
                    if (termProp) {
                        // Remove prefix like "P:F:"
                        const term = termProp.value.split(':').slice(2).join(':') || termProp.value;
                        goCounts[term] = (goCounts[term] || 0) + 1;
                    }
                }
            });
        }
    });

    const topGOTerms = Object.entries(goCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    return {
        totalEntries,
        topOrganisms,
        topGOTerms
    };
}
