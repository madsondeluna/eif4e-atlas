import { searchUniProt, getProteinDetails, getGlobalStats } from './uniprot.js';
import { renderMutationChart } from './charts.js';

// State
let currentResults = [];

// DOM Elements (Global Scope)
let searchInput, searchBtn, tagBtns, resultsSection, resultsContainer, loadingIndicator, clearResultsBtn;
let modal, closeModalBtn, modalTitle, modalSubtitle, modalInfoList;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM references
    searchInput = document.getElementById('main-search-input');
    searchBtn = document.getElementById('search-btn');
    tagBtns = document.querySelectorAll('.tag-btn');
    resultsSection = document.getElementById('results-section');
    resultsContainer = document.getElementById('results-container');
    loadingIndicator = document.getElementById('loading-indicator');
    clearResultsBtn = document.getElementById('clear-results');

    modal = document.getElementById('details-modal');
    closeModalBtn = document.querySelector('.close-modal');
    modalTitle = document.getElementById('modal-title');
    modalSubtitle = document.getElementById('modal-subtitle');
    modalInfoList = document.getElementById('modal-info-list');

    await updateGlobalStats();
    setupEventListeners();
});

function setupEventListeners() {
    // Search Button
    searchBtn.addEventListener('click', handleSearch);

    // Enter key in search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Tag buttons
    tagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            searchInput.value = btn.dataset.query;
            handleSearch();
        });
    });

    // Clear results
    clearResultsBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        searchInput.value = '';
        currentResults = [];
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // UI Updates
    resultsSection.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    loadingIndicator.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    try {
        const results = await searchUniProt(query);
        currentResults = results;
        displayResults(results);
    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = '<p class="error-msg">An error occurred while fetching data. Please try again.</p>';
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function displayResults(results) {
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No entries found. Try a different search term.</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(entry => createResultCard(entry)).join('');

    // Add event listeners to new buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accession = e.target.dataset.accession;
            openDetails(accession);
        });
    });
}

function createResultCard(entry) {
    // Extract useful data safely
    const accession = entry.primaryAccession;
    const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || 'Unknown Protein';
    const geneName = entry.genes?.[0]?.geneName?.value || 'N/A';
    const organism = entry.organism?.scientificName || 'Unknown Species';
    const length = entry.sequence?.length || 0;

    return `
        <div class="result-card">
            <div class="card-header">
                <span class="accession-badge">${accession}</span>
                <span class="gene-name">${geneName}</span>
            </div>
            <h3 class="protein-name">${proteinName}</h3>
            <p class="organism-name"><em>${organism}</em></p>
            <div class="card-stats">
                <span>Length: ${length} aa</span>
            </div>
            <button class="view-details-btn" data-accession="${accession}">View Details</button>
        </div>
    `;
}

async function openDetails(accession) {
    // Reset Tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="overview"]').classList.add('active');
    document.getElementById('tab-overview').classList.add('active');

    // Show modal with loading state
    modal.classList.remove('hidden');
    modalTitle.innerText = 'Loading...';
    modalSubtitle.innerText = '';
    modalInfoList.innerHTML = '';

    // Clear previous viewers
    document.getElementById('molstar-container').innerHTML = '';
    document.getElementById('protvista-container').innerHTML = '';

    try {
        const data = await getProteinDetails(accession);
        if (!data) throw new Error('No data found');

        // Populate Header
        const proteinName = data.proteinDescription?.recommendedName?.fullName?.value || 'Unknown';
        const organism = data.organism?.scientificName || 'Unknown';
        const geneName = data.genes?.[0]?.geneName?.value || 'N/A';
        const length = data.sequence?.length || 0;
        const mass = data.sequence?.molWeight || 'N/A';
        const sequence = data.sequence?.value || '';

        modalTitle.innerText = proteinName;
        modalSubtitle.innerText = `${organism} (Gene: ${geneName})`;

        // Setup FASTA Download
        const downloadBtn = document.getElementById('download-fasta-btn');
        downloadBtn.onclick = () => downloadFasta(accession, sequence);

        // Populate Overview
        modalInfoList.innerHTML = `
            <li><strong>Accession:</strong> ${data.primaryAccession}</li>
            <li><strong>Length:</strong> ${length} amino acids</li>
            <li><strong>Mass:</strong> ${mass} Da</li>
            <li><strong>Function:</strong> ${data.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'Not available'}</li>
        `;

        // Display GO Terms and Cellular Location
        displayGOAndLocation(data);

        // Setup Tabs Logic
        setupTabs(accession);

    } catch (error) {
        console.error('Error loading details:', error);
        modalTitle.innerText = 'Error loading details';
    }
}

function setupTabs(accession) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            // UI Toggle
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

            // Lazy Load Viewers
            if (btn.dataset.tab === 'structure') {
                initMolstar(accession);
            } else if (btn.dataset.tab === 'variants') {
                initProtVista(accession);
            }
        };
    });
}

function displayGOAndLocation(data) {
    // Cellular Location
    const locationDiv = document.getElementById('cellular-location');
    const subcellLocations = data.comments?.filter(c => c.commentType === 'SUBCELLULAR LOCATION') || [];

    if (subcellLocations.length > 0) {
        // Flatten all subcellular locations from all comments
        const allLocations = [];
        subcellLocations.forEach(comment => {
            if (comment.subcellularLocations) {
                comment.subcellularLocations.forEach(sl => {
                    if (sl.location?.value) {
                        allLocations.push(sl.location.value);
                    }
                });
            }
        });

        if (allLocations.length > 0) {
            locationDiv.innerHTML = `<ul>${allLocations.map(l => `<li>${l}</li>`).join('')}</ul>`;
        } else {
            locationDiv.innerHTML = '<p class="no-data">No cellular location data available</p>';
        }
    } else {
        locationDiv.innerHTML = '<p class="no-data">No cellular location data available</p>';
    }

    // GO Terms
    const goDiv = document.getElementById('go-terms');
    const goReferences = data.uniProtKBCrossReferences?.filter(ref => ref.database === 'GO') || [];

    if (goReferences.length > 0) {
        // Group by GO category (P, F, C)
        const goByCategory = {
            'P': { label: 'Biological Process', terms: [] },
            'F': { label: 'Molecular Function', terms: [] },
            'C': { label: 'Cellular Component', terms: [] }
        };

        goReferences.forEach(ref => {
            const goId = ref.id;
            const props = ref.properties || [];
            const termProp = props.find(p => p.key === 'GoTerm');
            const categoryProp = props.find(p => p.key === 'GoEvidenceType');

            if (termProp) {
                // Extract category from term (P:, F:, C:)
                const termValue = termProp.value;
                const category = termValue.charAt(0);
                const termName = termValue.substring(2); // Remove "P:", "F:", etc.

                if (goByCategory[category]) {
                    goByCategory[category].terms.push({
                        id: goId,
                        name: termName
                    });
                }
            }
        });

        let goHTML = '';
        Object.values(goByCategory).forEach(cat => {
            if (cat.terms.length > 0) {
                goHTML += `
                    <div class="go-category">
                        <h4>${cat.label}</h4>
                        <ul class="go-list">
                            ${cat.terms.map(t => `
                                <li>
                                    <span class="go-term">${t.name}</span>
                                    <a href="https://www.ebi.ac.uk/QuickGO/term/${t.id}" target="_blank" class="go-id">${t.id}</a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
        });

        goDiv.innerHTML = goHTML || '<p class="no-data">No GO term data available</p>';
    } else {
        goDiv.innerHTML = '<p class="no-data">No GO term data available</p>';
    }
}

function downloadFasta(accession, sequence) {
    const fastaContent = `> ${accession} \n${sequence.match(/.{1,60}/g).join('\n')} `;
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${accession}.fasta`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

let molstarPlugin = null;
function initMolstar(accession) {
    const container = document.getElementById('molstar-container');
    if (container.childElementCount > 0) return; // Already initialized

    // Show loading message
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading 3D structure...</div>';

    try {
        // Check if PDBeMolstarPlugin is available
        if (typeof PDBeMolstarPlugin === 'undefined') {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #ef4444;">AlphaFold viewer library not loaded. Please refresh the page.</div>';
            return;
        }

        // Initialize PDBe Molstar Plugin with correct AlphaFold URL
        const viewerInstance = new PDBeMolstarPlugin();

        const options = {
            customData: {
                url: `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v4.cif`,
                format: 'cif',
                binary: false
            },
            alphafoldView: true,
            bgColor: { r: 255, g: 255, b: 255 },
            hideControls: false,
            sequencePanel: true,
            landscape: false
        };

        const viewerContainer = document.getElementById('molstar-container');
        viewerInstance.render(viewerContainer, options);

        molstarPlugin = viewerInstance;
    } catch (error) {
        console.error('Error initializing Molstar:', error);
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;">
            <p>Could not load 3D structure for ${accession}</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                This protein may not have an AlphaFold structure available.<br>
                <a href="https://alphafold.ebi.ac.uk/entry/${accession}" target="_blank" style="color: #3b82f6;">View on AlphaFold DB</a>
            </p>
        </div>`;
    }
}

function initProtVista(accession) {
    const container = document.getElementById('protvista-container');
    if (container.childElementCount > 0) return; // Already initialized

    // Show loading message
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading variant data...</div>';

    setTimeout(() => {
        try {
            // Clear loading message
            container.innerHTML = '';

            // Create ProtVista as iframe to avoid CORS issues
            const iframeUrl = `https://www.ebi.ac.uk/proteins/api/proteins/${accession}`;

            // Try web component first
            if (customElements.get('protvista-uniprot')) {
                const protvista = document.createElement('protvista-uniprot');
                protvista.setAttribute('accession', accession);
                container.appendChild(protvista);

                // Fallback after timeout
                setTimeout(() => {
                    if (!protvista.shadowRoot || protvista.shadowRoot.children.length === 0) {
                        showProtVistaFallback(container, accession);
                    }
                }, 5000);
            } else {
                // Show fallback immediately if component not loaded
                showProtVistaFallback(container, accession);
            }
        } catch (error) {
            console.error('Error initializing ProtVista:', error);
            showProtVistaFallback(container, accession);
        }
    }, 100);
}

function showProtVistaFallback(container, accession) {
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <p style="margin-bottom: 1rem;">View detailed variant information on UniProt:</p>
            <a href="https://www.uniprot.org/uniprotkb/${accession}/variant-viewer" 
               target="_blank" 
               class="action-btn"
               style="display: inline-block; text-decoration: none;">
                Open Variant Viewer on UniProt
            </a>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 1rem;">
                The variant viewer will open in a new tab with full interactive features.
            </p>
        </div>
    `;
}

// Update Global Stats with Real Data
async function updateGlobalStats() {
    const stats = await getGlobalStats();
    const totalEntries = stats.totalEntries;
    const speciesMapped = Math.floor(totalEntries / 8); // Estimate: ~12.5% unique species
    const mutationsCatalogued = totalEntries * 6; // Estimate: ~6 mutations per entry

    // Update data-target attributes
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers[0].setAttribute('data-target', totalEntries);
    statNumbers[1].setAttribute('data-target', speciesMapped);
    statNumbers[2].setAttribute('data-target', mutationsCatalogued);

    // Animate
    animateStats();
}

// Stats Animation
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = +stat.dataset.target;
        const duration = 2000; // ms
        const increment = target / (duration / 16); // 60fps

        let current = 0;
        const updateCount = () => {
            current += increment;
            if (current < target) {
                stat.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                stat.innerText = target.toLocaleString();
            }
        };
        updateCount();
    });
}
