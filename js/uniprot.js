/**
 * UniProt API Integration Module
 * Handles fetching data from the UniProt REST API.
 */

const UNIPROT_API_BASE = 'https://rest.uniprot.org/uniprotkb';

/**
 * Search UniProt for eIF4E related entries.
 * @param {string} query - The search query (e.g., "human", "P06730").
 * @returns {Promise<Array>} - List of protein entries.
 */
export async function searchUniProt(query) {
    try {
        let searchQuery = '';

        // Simple heuristic: if it looks like an accession (e.g. P06730), search directly
        if (/^[A-Z0-9]{6,10}$/i.test(query)) {
            searchQuery = `accession:${query}`;
        } else {
            // For named queries, search eIF4E across multiple fields AND the query in organism/taxonomy
            // This allows searches like "vigna", "human", "vigna unguiculata" to work properly
            searchQuery = `(gene:EIF4E OR protein_name:eIF4E) AND (organism_name:${query} OR taxonomy_name:${query})`;
        }

        const url = `${UNIPROT_API_BASE}/search?query=${encodeURIComponent(searchQuery)}&fields=accession,id,protein_name,gene_names,organism_name,length,sequence&format=json&size=20`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`UniProt API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching from UniProt:', error);
        return [];
    }
}

/**
 * Fetch detailed information for a specific accession.
 * @param {string} accession - The UniProt accession ID.
 * @returns {Promise<Object>} - Detailed protein data.
 */
export async function getProteinDetails(accession) {
    try {
        const url = `${UNIPROT_API_BASE}/${accession}.json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch details for ${accession}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching details:', error);
        return null;
    }
}

/**
 * Fetch global statistics for eIF4E across UniProt.
 * @returns {Promise<Object>} - Stats object with totalEntries.
 */
export async function getGlobalStats() {
    try {
        const url = `${UNIPROT_API_BASE}/search?query=(gene:EIF4E OR protein_name:eIF4E)&size=0`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const total = response.headers.get('x-total-results');
        return {
            totalEntries: parseInt(total) || 3500
        };
    } catch (error) {
        console.error('Error fetching global stats:', error);
        return { totalEntries: 3500 }; // Fallback
    }
}
