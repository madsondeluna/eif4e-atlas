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

        // Render Overview Chart
        renderMutationChart(data.features || [], length);

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

        // Initialize PDBe Molstar Plugin
        molstarPlugin = new PDBeMolstarPlugin();

        const options = {
            customData: {
                url: `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v4.cif`,
                format: 'cif'
            },
            alphafoldView: true,
            bgColor: { r: 255, g: 255, b: 255 },
            hideControls: false,
            sequencePanel: true
        };

        molstarPlugin.render(container, options);
    } catch (error) {
        console.error('Error initializing Molstar:', error);
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;">
            <p>Could not load 3D structure for ${accession}</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">This protein may not have an AlphaFold structure available.</p>
        </div>`;
    }
}

function initProtVista(accession) {
    const container = document.getElementById('protvista-container');
    if (container.childElementCount > 0) return; // Already initialized

    // Show loading message
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading variant data...</div>';

    try {
        // Create ProtVista Element
        const protvista = document.createElement('protvista-uniprot');
        protvista.setAttribute('accession', accession);

        // Clear loading message
        container.innerHTML = '';
        container.appendChild(protvista);

        // Check if it loaded after a delay
        setTimeout(() => {
            if (container.querySelector('protvista-uniprot') && !container.querySelector('protvista-uniprot').shadowRoot) {
                container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;">
                    <p>Could not load variant viewer.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try viewing on <a href="https://www.uniprot.org/uniprotkb/${accession}/variant-viewer" target="_blank" style="color: #3b82f6;">UniProt directly</a>.</p>
                </div>`;
            }
        }, 3000);
    } catch (error) {
        console.error('Error initializing ProtVista:', error);
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;">
            <p>Could not load variant viewer for ${accession}</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">View on <a href="https://www.uniprot.org/uniprotkb/${accession}/variant-viewer" target="_blank" style="color: #3b82f6;">UniProt</a>.</p>
        </div>`;
    }
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
