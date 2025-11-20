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
        // Construct a query that prioritizes eIF4E and the user's term
        // We search for "eIF4E" AND the user query to keep results relevant to the atlas
        // Or if the user query looks like an ID, we search for that directly.
        
        let searchQuery = '';
        
        // Simple heuristic: if it looks like an accession (e.g. P06730), search directly
        if (/^[A-Z0-9]{6,10}$/i.test(query)) {
            searchQuery = `accession:${query}`;
        } else {
            // Otherwise search for eIF4E AND the term (species or name)
            // We use parentheses to group the OR clause if we wanted to expand, but here we keep it strict for now.
            searchQuery = `(gene:EIF4E OR protein_name:eIF4E) AND ${query}`;
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
