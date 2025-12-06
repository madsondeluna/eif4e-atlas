/**
 * Taxonomy Data Module
 * Fetches eIF4E proteins from UniProt and builds hierarchical tree structure
 */

const UNIPROT_API_BASE = 'https://rest.uniprot.org/uniprotkb';
const CACHE_KEY = 'eif4e_taxonomy_data';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all eIF4E proteins from UniProt with taxonomy data
 */
export async function fetchAllEIF4EProteins() {
    // Check cache first
    const cached = getFromCache();
    if (cached) {
        console.log('Using cached taxonomy data');
        return cached;
    }

    try {
        const proteins = [];
        let cursor = null;
        const maxPages = 50; // Limit to prevent endless loops (~1000 proteins)
        let page = 0;

        do {
            const url = cursor
                ? `${UNIPROT_API_BASE}/search?query=(eif4e OR eif4e1a OR "translation initiation factor 4e")&fields=accession,organism_name,lineage,gene_names&format=json&size=25&cursor=${cursor}`
                : `${UNIPROT_API_BASE}/search?query=(eif4e OR eif4e1a OR "translation initiation factor 4e")&fields=accession,organism_name,lineage,gene_names&format=json&size=25`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            proteins.push(...data.results);

            // Get next cursor from Link header
            const linkHeader = response.headers.get('Link');
            cursor = extractCursor(linkHeader);
            page++;

        } while (cursor && page < maxPages);

        console.log(`Fetched ${proteins.length} eIF4E proteins`);

        // Save to cache
        saveToCache(proteins);

        return proteins;
    } catch (error) {
        console.error('Error fetching taxonomy data:', error);
        return [];
    }
}

/**
 * Build hierarchical tree from protein lineage data
 */
export function buildTaxonomyTree(proteins) {
    const tree = {
        name: 'eIF4E Proteins',
        children: []
    };

    // Group by major kingdom
    const kingdoms = {};

    proteins.forEach(protein => {
        const lineage = protein.organism?.lineage || [];
        const organismName = protein.organism?.scientificName || 'Unknown';
        const accession = protein.primaryAccession;

        // Find kingdom (usually at index 0 or 1)
        let kingdom = 'Other';
        for (const taxon of lineage) {
            if (['Viridiplantae', 'Metazoa', 'Fungi'].includes(taxon)) {
                kingdom = taxon;
                break;
            }
        }

        // Initialize kingdom if needed
        if (!kingdoms[kingdom]) {
            kingdoms[kingdom] = {
                name: kingdom,
                type: 'kingdom',
                children: {},
                count: 0
            };
        }

        // Build path through taxonomy
        let currentNode = kingdoms[kingdom].children;
        const relevantLineage = lineage.slice(1, Math.min(lineage.length, 8)); // Skip root, limit depth

        for (let i = 0; i < relevantLineage.length; i++) {
            const taxonName = relevantLineage[i];

            if (!currentNode[taxonName]) {
                currentNode[taxonName] = {
                    name: taxonName,
                    type: i === relevantLineage.length - 1 ? 'species' : 'taxon',
                    children: {},
                    proteins: [],
                    count: 0
                };
            }

            if (i === relevantLineage.length - 1) {
                // Leaf node - add protein
                currentNode[taxonName].proteins.push({
                    accession,
                    organism: organismName
                });
            }

            currentNode[taxonName].count++;
            currentNode = currentNode[taxonName].children;
        }

        kingdoms[kingdom].count++;
    });

    // Convert to D3-friendly format
    tree.children = Object.values(kingdoms).map(kingdom => ({
        name: kingdom.name,
        type: 'kingdom',
        count: kingdom.count,
        children: convertToArray(kingdom.children)
    }));

    return tree;
}

/**
 * Convert nested object to array for D3
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
 * Extract cursor from Link header
 */
function extractCursor(linkHeader) {
    if (!linkHeader) return null;

    const match = linkHeader.match(/cursor=([^&>]+)/);
    return match ? match[1] : null;
}

/**
 * Cache helpers
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
        console.warn('Failed to cache data:', e);
    }
}

/**
 * Clear cache (useful for debugging)
 */
export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}
