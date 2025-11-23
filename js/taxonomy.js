/**
 * Módulo de Dados de Taxonomia
 * Busca proteínas eIF4E do UniProt e constrói estrutura de árvore hierárquica
 */

const UNIPROT_API_BASE = 'https://rest.uniprot.org/uniprotkb';
const CACHE_KEY = 'eif4e_taxonomy_data';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Busca todas as proteínas eIF4E do UniProt com dados de taxonomia
 */
export async function fetchAllEIF4EProteins() {
    // Verifica cache primeiro
    const cached = getFromCache();
    if (cached) {
        console.log('Usando dados de taxonomia em cache');
        return cached;
    }

    try {
        const proteins = [];
        let cursor = null;
        const maxPages = 50; // Limite para prevenir loops infinitos (~1000 proteínas)
        let page = 0;

        do {
            const url = cursor
                ? `${UNIPROT_API_BASE}/search?query=(eif4e OR eif4e1a OR "translation initiation factor 4e") AND taxonomy_name:Viridiplantae&fields=accession,organism_name,lineage,gene_names&format=json&size=25&cursor=${cursor}`
                : `${UNIPROT_API_BASE}/search?query=(eif4e OR eif4e1a OR "translation initiation factor 4e") AND taxonomy_name:Viridiplantae&fields=accession,organism_name,lineage,gene_names&format=json&size=25`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const data = await response.json();
            proteins.push(...data.results);

            // Obtém próximo cursor do cabeçalho Link
            const linkHeader = response.headers.get('Link');
            cursor = extractCursor(linkHeader);
            page++;

        } while (cursor && page < maxPages);

        console.log(`Buscou ${proteins.length} proteínas eIF4E`);

        // Salva no cache
        saveToCache(proteins);

        return proteins;
    } catch (error) {
        console.error('Erro ao buscar dados de taxonomia:', error);
        return [];
    }
}

/**
 * Constrói árvore hierárquica a partir de dados de linhagem de proteínas
 */
export function buildTaxonomyTree(proteins) {
    // Começa com Viridiplantae como raiz
    const tree = {
        name: 'Viridiplantae (Plants)',
        children: []
    };

    // Agrupa por níveis taxonômicos de plantas
    const plantGroups = {};

    proteins.forEach(protein => {
        const lineage = protein.organism?.lineage || [];
        const organismName = protein.organism?.scientificName || 'Desconhecido';
        const accession = protein.primaryAccession;

        // Verifica se é uma proteína de planta
        if (!lineage.includes('Viridiplantae')) {
            console.warn(`Pulando proteína não vegetal: ${accession} (${organismName})`);
            return;
        }

        // Encontra índice de Viridiplantae na linhagem
        const plantIndex = lineage.indexOf('Viridiplantae');

        // Obtém linhagem específica de planta (tudo após Viridiplantae)
        const plantLineage = lineage.slice(plantIndex + 1);

        // Constrói caminho através da taxonomia de plantas
        let currentNode = plantGroups;

        for (let i = 0; i < Math.min(plantLineage.length, 6); i++) {
            const taxonName = plantLineage[i];

            if (!currentNode[taxonName]) {
                currentNode[taxonName] = {
                    name: taxonName,
                    type: i === plantLineage.length - 1 ? 'species' : 'taxon',
                    children: {},
                    proteins: [],
                    count: 0
                };
            }

            if (i === plantLineage.length - 1 || i === 5) {
                // Nó folha - adiciona proteína
                currentNode[taxonName].proteins.push({
                    accession,
                    organism: organismName
                });
            }

            currentNode[taxonName].count++;
            currentNode = currentNode[taxonName].children;
        }
    });

    // Converte para formato amigável ao D3
    tree.children = convertToArray(plantGroups);

    return tree;
}

/**
 * Converte objeto aninhado para array para D3
 */
function convertToArray(obj) {
    return Object.values(obj).map(node => ({
        name: node.name,
        type: node.type,
        count: node.count,
        proteins: node.proteins || [],
        children: node.children && Object.keys(node.children).length > 0
            ? convertToArray(node.children)
            : undefined
    }));
}

/**
 * Extrai cursor do cabeçalho Link
 */
function extractCursor(linkHeader) {
    if (!linkHeader) return null;

    const match = linkHeader.match(/cursor=([^&>]+)/);
    return match ? match[1] : null;
}

/**
 * Auxiliares de cache
 */
function getFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data;
    } catch (e) {
        return null;
    }
}

function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('Falha ao armazenar dados em cache:', e);
    }
}

/**
 * Limpa cache (útil para depuração)
 */
export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}
