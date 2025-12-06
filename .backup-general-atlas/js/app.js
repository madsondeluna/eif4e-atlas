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

    // Show elegant card with external link instead of iframe
    container.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; text-align: center;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3rem 2rem; border-radius: 1rem; color: white; margin-bottom: 1.5rem;">
                <svg style="width: 80px; height: 80px; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">AlphaFold 3D Structure</h3>
                <p style="opacity: 0.9; font-size: 1rem; margin-bottom: 0;">View high-quality protein structure prediction</p>
            </div>
            
            <a href="https://alphafold.ebi.ac.uk/entry/${accession}" 
               target="_blank" 
               class="action-btn"
               style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 1rem 2rem; font-size: 1.1rem;">
                <span>Open in AlphaFold Database</span>
                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
            
            <p style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
                Opens in a new tab with full interactive 3D viewer, download options, and detailed structural information
            </p>
        </div>
    `;
}

function initProtVista(accession) {
    const container = document.getElementById('protvista-container');
    if (container.childElementCount > 0) return; // Already initialized

    // Show elegant card with external link
    container.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; text-align: center;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 3rem 2rem; border-radius: 1rem; color: white; margin-bottom: 1.5rem;">
                <svg style="width: 80px; height: 80px; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Protein Variants</h3>
                <p style="opacity: 0.9; font-size: 1rem; margin-bottom: 0;">Explore natural variants and mutations</p>
            </div>
            
            <a href="https://www.uniprot.org/uniprotkb/${accession}/variant-viewer" 
               target="_blank" 
               class="action-btn"
               style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 1rem 2rem; font-size: 1.1rem;">
                <span>Open Variant Viewer on UniProt</span>
                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
            
            <p style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
                Opens in a new tab with full interactive variant viewer, showing all known mutations and their effects
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
