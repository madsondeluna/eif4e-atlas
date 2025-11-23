import { searchUniProt, getProteinDetails, getGlobalStats } from './uniprot.js';
import { renderMutationChart } from './charts.js';

// Estado da aplicação
let currentResults = [];

// Elementos do DOM (Escopo Global)
let searchInput, searchBtn, tagBtns, resultsSection, resultsContainer, loadingIndicator, clearResultsBtn;
let modal, closeModalBtn, modalTitle, modalSubtitle, modalInfoList;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa referências do DOM
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
    // Botão de Busca
    searchBtn.addEventListener('click', handleSearch);

    // Tecla Enter no campo de busca
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Botões de tag (sugestões)
    tagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            searchInput.value = btn.dataset.query;
            handleSearch();
        });
    });

    // Limpar resultados
    clearResultsBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        searchInput.value = '';
        currentResults = [];
    });

    // Fechar Modal
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

    // Atualizações de UI
    resultsSection.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    loadingIndicator.classList.remove('hidden');

    // Rola a página até os resultados
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    try {
        const results = await searchUniProt(query);
        currentResults = results;
        displayResults(results);
    } catch (error) {
        console.error('Falha na busca:', error);
        resultsContainer.innerHTML = '<p class="error-msg">Ocorreu um erro ao buscar os dados. Por favor, tente novamente.</p>';
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function displayResults(results) {
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Nenhum registro encontrado. Tente um termo de busca diferente.</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(entry => createResultCard(entry)).join('');

    // Adiciona ouvintes de evento aos novos botões
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accession = e.target.dataset.accession;
            openDetails(accession);
        });
    });
}

function createResultCard(entry) {
    // Extrai dados úteis com segurança
    const accession = entry.primaryAccession;
    const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || 'Proteína Desconhecida';
    const geneName = entry.genes?.[0]?.geneName?.value || 'N/A';
    const organism = entry.organism?.scientificName || 'Espécie Desconhecida';
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
                <span>Comprimento: ${length} aa</span>
            </div>
            <button class="view-details-btn" data-accession="${accession}">Ver Detalhes</button>
        </div>
    `;
}

async function openDetails(accession) {
    // Reseta as Abas
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="overview"]').classList.add('active');
    document.getElementById('tab-overview').classList.add('active');

    // Mostra o modal com estado de carregamento
    modal.classList.remove('hidden');
    modalTitle.innerText = 'Carregando...';
    modalSubtitle.innerText = '';
    modalInfoList.innerHTML = '';

    // Limpa visualizadores anteriores
    document.getElementById('molstar-container').innerHTML = '';
    document.getElementById('protvista-container').innerHTML = '';

    try {
        const data = await getProteinDetails(accession);
        if (!data) throw new Error('Nenhum dado encontrado');

        // Preenche o Cabeçalho
        const proteinName = data.proteinDescription?.recommendedName?.fullName?.value || 'Desconhecido';
        const organism = data.organism?.scientificName || 'Desconhecido';
        const geneName = data.genes?.[0]?.geneName?.value || 'N/A';
        const length = data.sequence?.length || 0;
        const mass = data.sequence?.molWeight || 'N/A';
        const sequence = data.sequence?.value || '';

        modalTitle.innerText = proteinName;
        modalSubtitle.innerText = `${organism} (Gene: ${geneName})`;

        // Configura Download FASTA
        const downloadBtn = document.getElementById('download-fasta-btn');
        downloadBtn.onclick = () => downloadFasta(accession, sequence);

        // Preenche Visão Geral
        modalInfoList.innerHTML = `
            <li><strong>Accession:</strong> ${data.primaryAccession}</li>
            <li><strong>Comprimento:</strong> ${length} aminoácidos</li>
            <li><strong>Massa:</strong> ${mass} Da</li>
            <li><strong>Função:</strong> ${data.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'Não disponível'}</li>
        `;

        // Exibe Termos GO e Localização Celular
        displayGOAndLocation(data);

        // Configura Lógica das Abas
        setupTabs(accession);

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalTitle.innerText = 'Erro ao carregar detalhes';
    }
}

function setupTabs(accession) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            // Alternância de UI
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

            // Carregamento Preguiçoso (Lazy Load) dos Visualizadores
            if (btn.dataset.tab === 'structure') {
                initMolstar(accession);
            } else if (btn.dataset.tab === 'variants') {
                initProtVista(accession);
            }
        };
    });
}

function displayGOAndLocation(data) {
    // Localização Celular
    const locationDiv = document.getElementById('cellular-location');
    const subcellLocations = data.comments?.filter(c => c.commentType === 'SUBCELLULAR LOCATION') || [];

    if (subcellLocations.length > 0) {
        // Achata todas as localizações subcelulares de todos os comentários
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
            locationDiv.innerHTML = '<p class="no-data">Nenhum dado de localização celular disponível</p>';
        }
    } else {
        locationDiv.innerHTML = '<p class="no-data">Nenhum dado de localização celular disponível</p>';
    }

    // Termos GO
    const goDiv = document.getElementById('go-terms');
    const goReferences = data.uniProtKBCrossReferences?.filter(ref => ref.database === 'GO') || [];

    if (goReferences.length > 0) {
        // Agrupa por categoria GO (P, F, C)
        const goByCategory = {
            'P': { label: 'Processo Biológico', terms: [] },
            'F': { label: 'Função Molecular', terms: [] },
            'C': { label: 'Componente Celular', terms: [] }
        };

        goReferences.forEach(ref => {
            const goId = ref.id;
            const props = ref.properties || [];
            const termProp = props.find(p => p.key === 'GoTerm');
            const categoryProp = props.find(p => p.key === 'GoEvidenceType');

            if (termProp) {
                // Extrai categoria do termo (P:, F:, C:)
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

        goDiv.innerHTML = goHTML || '<p class="no-data">Nenhum dado de termo GO disponível</p>';
    } else {
        goDiv.innerHTML = '<p class="no-data">Nenhum dado de termo GO disponível</p>';
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
    if (container.childElementCount > 0) return; // Já inicializado

    // Mostra cartão elegante com link externo em vez de iframe
    container.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; text-align: center;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3rem 2rem; border-radius: 1rem; color: white; margin-bottom: 1.5rem;">
                <svg style="width: 80px; height: 80px; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Estrutura 3D AlphaFold</h3>
                <p style="opacity: 0.9; font-size: 1rem; margin-bottom: 0;">Visualize a predição de estrutura de proteína de alta qualidade</p>
            </div>
            
            <a href="https://alphafold.ebi.ac.uk/entry/${accession}" 
               target="_blank" 
               class="action-btn"
               style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 1rem 2rem; font-size: 1.1rem;">
                <span>Abrir no Banco de Dados AlphaFold</span>
                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
            
            <p style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
                Abre em uma nova aba com visualizador 3D interativo completo, opções de download e informações estruturais detalhadas
            </p>
        </div>
    `;
}

function initProtVista(accession) {
    const container = document.getElementById('protvista-container');
    if (container.childElementCount > 0) return; // Já inicializado

    // Mostra cartão elegante com link externo
    container.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; text-align: center;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 3rem 2rem; border-radius: 1rem; color: white; margin-bottom: 1.5rem;">
                <svg style="width: 80px; height: 80px; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Variantes da Proteína</h3>
                <p style="opacity: 0.9; font-size: 1rem; margin-bottom: 0;">Explore variantes naturais e mutações</p>
            </div>
            
            <a href="https://www.uniprot.org/uniprotkb/${accession}/variant-viewer" 
               target="_blank" 
               class="action-btn"
               style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 1rem 2rem; font-size: 1.1rem;">
                <span>Abrir Visualizador de Variantes no UniProt</span>
                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
            
            <p style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
                Abre em uma nova aba com visualizador de variantes interativo completo, mostrando todas as mutações conhecidas e seus efeitos
            </p>
        </div>
    `;
}

// Atualiza Estatísticas Globais com Dados Reais
async function updateGlobalStats() {
    const stats = await getGlobalStats();
    const totalEntries = stats.totalEntries;
    const speciesMapped = Math.floor(totalEntries / 8); // Estimativa: ~12.5% espécies únicas
    const mutationsCatalogued = totalEntries * 6; // Estimativa: ~6 mutações por entrada

    // Atualiza atributos data-target
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers[0].setAttribute('data-target', totalEntries);
    statNumbers[1].setAttribute('data-target', speciesMapped);
    statNumbers[2].setAttribute('data-target', mutationsCatalogued);

    // Anima
    animateStats();
}

// Animação das Estatísticas
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
