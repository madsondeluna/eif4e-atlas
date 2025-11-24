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
            </p >
        </div >
        `;
}

// Placeholder for new function 1
function newFunctionOne() {
    // Implementação da nova função 1
    console.log('Nova função um executada.');
}

// Placeholder for new function 2
function newFunctionTwo() {
    // Implementação da nova função 2
    console.log('Nova função dois executada.');
}

// Atualiza Estatísticas Globais com Dados Reais
async function updateGlobalStats() {
    const stats = await getGlobalStats();

    // Chamada das novas funções após a obtenção das estatísticas globais
    newFunctionOne();
    newFunctionTwo();

    const totalEntries = stats.totalEntries;
    const speciesMapped = Math.floor(totalEntries / 8); // Estimativa: ~12.5% espécies únicas
    // Atualiza atributos data-target (apenas duas estatísticas)
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 1) statNumbers[0].setAttribute('data-target', totalEntries);
    if (statNumbers.length >= 2) statNumbers[1].setAttribute('data-target', speciesMapped);
    // Se houver um terceiro card antigo, remove-o do DOM
    if (statNumbers.length >= 3) {
        const thirdCard = statNumbers[2].closest('.stat-card');
        if (thirdCard) thirdCard.remove();
    }

    // Render Charts
    renderCharts(stats);

    // Anima
    animateStats();
}

function renderCharts(stats) {
    // Format Organism Labels (e.g., "Vigna unguiculata" -> "V. unguiculata")
    const formattedOrganisms = stats.topOrganisms.map(o => ({
        ...o,
        label: abbreviateOrganism(o.label)
    }));

    // Format GO Term Labels (e.g., "translation initiation" -> "Transl. Init.")
    const formattedGOTerms = stats.topGOTerms.map(g => ({
        ...g,
        label: shortenGoTerm(g.label)
    }));

    // Top Organisms Chart (Frozen Glass Bubbles)
    renderBubbleChart(formattedOrganisms, 'topOrganismsChart', d3.schemeSet2);

    // Top GO Terms Chart (Frozen Glass Bubbles)
    renderBubbleChart(formattedGOTerms, 'topGoTermsChart', d3.schemeTableau10);
}

function abbreviateOrganism(name) {
    if (!name.includes(' ')) return name;
    const parts = name.split(' ');
    return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`;
}

function shortenGoTerm(term) {
    const dictionary = {
        'translation initiation': 'Transl. Init.',
        'translation elongation': 'Transl. Elong.',
        'cytoplasm': 'Cytoplasm',
        'cytosol': 'Cytosol',
        'nucleus': 'Nucleus',
        'RNA binding': 'RNA Binding',
        'mRNA binding': 'mRNA Binding',
        'eukaryotic translation initiation factor 4E complex': 'eIF4E Complex',
        'cap-dependent translation initiation': 'Cap-Dep. Transl.',
        'viral life cycle': 'Viral Life Cycle',
        'host-virus interaction': 'Host-Virus',
        'defense response to virus': 'Virus Defense',
        'protein binding': 'Protein Binding',
        'ATP binding': 'ATP Binding'
    };

    // Check exact match first
    if (dictionary[term]) return dictionary[term];

    // Check case-insensitive match
    const lowerTerm = term.toLowerCase();
    for (const [key, value] of Object.entries(dictionary)) {
        if (key.toLowerCase() === lowerTerm) return value;
    }

    // Fallback: Truncate if too long
    return term.length > 15 ? term.substring(0, 12) + '...' : term;
}

function renderBubbleChart(data, containerId, colorScheme) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const height = 400;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .style('background', 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)')
        .style('border-radius', '12px');

    // Prepare data
    const bubbleData = data.map((d, i) => ({
        name: d.label,
        value: d.value,
        color: colorScheme[i % colorScheme.length]
    }));

    // Scale
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(bubbleData, d => d.value)])
        .range([20, 70]);

    bubbleData.forEach(d => {
        d.radius = radiusScale(d.value);
        d.x = Math.random() * width;
        d.y = Math.random() * height;
    });

    // Simulation
    const simulation = d3.forceSimulation(bubbleData)
        .force('charge', d3.forceManyBody().strength(5))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 2))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

    // Bubbles Group
    const bubbles = svg.selectAll('g.bubble')
        .data(bubbleData)
        .join('g')
        .attr('class', 'bubble')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }));

    // Definitions for filters/gradients
    const defs = svg.append('defs');

    // Glass Filter
    const filter = defs.append('filter')
        .attr('id', `glass-effect-${containerId}`)
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2').attr('result', 'blur');
    filter.append('feColorMatrix').attr('in', 'blur').attr('mode', 'matrix').attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0').attr('result', 'glow');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'glow');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Border Gradients
    bubbleData.forEach((d, i) => {
        const gradient = defs.append('linearGradient')
            .attr('id', `border-gradient-${containerId}-${i}`)
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('style', `stop-color:rgba(255,255,255,0.8);stop-opacity:1`);
        gradient.append('stop').attr('offset', '100%').attr('style', `stop-color:rgba(255,255,255,0.6);stop-opacity:1`);
    });

    // Background Blur Circle
    bubbles.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', 'rgba(255, 255, 255, 0.1)')
        .style('filter', 'blur(8px)');

    // Main Glass Circle
    bubbles.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => {
            const c = d3.color(d.color);
            c.opacity = 0.25;
            return c.toString();
        })
        .attr('stroke', (d, i) => `url(#border-gradient-${containerId}-${i})`)
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))')
        .on('mouseover', function (event, d) {
            d3.select(this).transition().duration(200).attr('r', d.radius * 1.1).attr('fill', d3.color(d.color).copy({ opacity: 0.4 }));
        })
        .on('mouseout', function (event, d) {
            d3.select(this).transition().duration(200).attr('r', d.radius).attr('fill', d3.color(d.color).copy({ opacity: 0.25 }));
        });

    // Inner Highlight
    bubbles.append('circle')
        .attr('r', d => d.radius * 0.6)
        .attr('cy', d => -d.radius * 0.3)
        .attr('fill', 'rgba(255, 255, 255, 0.3)')
        .attr('filter', 'blur(5px)')
        .style('pointer-events', 'none');

    // Text Label (Name)
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', '#1e293b')
        .attr('font-size', d => Math.min(d.radius / 3, 12) + 'px')
        .attr('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name);

    // Text Label (Value)
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('fill', '#475569')
        .attr('font-size', d => Math.min(d.radius / 4, 10) + 'px')
        .style('pointer-events', 'none')
        .text(d => d.value);

    // Update positions
    simulation.on('tick', () => {
        bubbles.attr('transform', d => `translate(${d.x},${d.y})`);
    });
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
