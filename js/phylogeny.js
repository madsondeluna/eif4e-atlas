/**
 * Módulo de Visualização de Filogenia
 * Renderiza árvore filogenética interativa usando D3.js
 */

import { fetchAllEIF4EProteins, buildTaxonomyTree } from './taxonomy.js';

// Estado
let treeData = null;
let svg = null;
let root = null;
let allProteins = []; // Armazena todas as proteínas para filtragem
let taxonomicChart = null; // Gráfico de distribuição taxonômica

// Inicializa no carregamento da página
document.addEventListener('DOMContentLoaded', async () => {
    await initializePhylogeny();
    setupEventListeners();
});

async function initializePhylogeny() {
    showLoading(true);

    try {
        // Busca dados
        allProteins = await fetchAllEIF4EProteins();
        if (allProteins.length === 0) {
            showError();
            return;
        }

        // Constrói árvore inicial com todos os dados
        updateTreeVisualization(allProteins);

        showLoading(false);
    } catch (error) {
        console.error('Erro ao inicializar filogenia:', error);
        showError();
    }
}

function updateTreeVisualization(proteins) {
    // Constrói árvore
    treeData = buildTaxonomyTree(proteins);

    // Atualiza estatísticas
    updateStats(proteins, treeData);

    // Atualiza/cria gráfico taxonômico
    updateTaxonomicChart(proteins);

    // Renderiza árvore
    renderTree(treeData);
}



function renderTree(data) {
    const container = document.getElementById('tree-container');
    container.classList.remove('hidden');

    const width = 1200;
    const height = 800;

    // Cria SVG
    svg = d3.select('#phylogeny-tree')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    // Limpa conteúdo anterior
    svg.selectAll('*').remove();

    // Cria layout da árvore
    const treeLayout = d3.tree()
        .size([height - 100, width - 400]);

    // Converte dados para hierarquia
    root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    // Colapsa todos os filhos inicialmente
    root.children.forEach(collapse);

    update(root);
}

function update(source) {
    const duration = 750;
    const width = 1200;
    const height = 800;

    // Calcula novo layout da árvore
    const treeLayout = d3.tree().size([height - 100, width - 400]);
    const nodes = root.descendants();
    const links = root.links();

    treeLayout(root);

    // Atualiza nós
    const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    // Insere novos nós
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0},${source.x0})`)
        .on('click', clicked);

    nodeEnter.append('circle')
        .attr('r', 6)
        .attr('class', d => `kingdom-${getKingdomClass(d)}`)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff');

    nodeEnter.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => d.children || d._children ? -10 : 10)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => `${d.data.name} ${d.data.count ? `(${d.data.count})` : ''}`)
        .clone(true).lower()
        .attr('stroke', 'white')
        .attr('stroke-width', 3);

    // Transiciona nós para sua nova posição
    const nodeUpdate = nodeEnter.merge(node)
        .transition().duration(duration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
        .attr('r', 6)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff');

    // Remove nós que estão saindo
    node.exit().transition().duration(duration)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();

    // Atualiza links
    const link = svg.selectAll('path.link')
        .data(links, d => d.target.id);

    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    linkEnter.merge(link).transition().duration(duration)
        .attr('d', d => diagonal(d.source, d.target));

    link.exit().transition().duration(duration)
        .attr('d', d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    // Armazena posições antigas
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Contador de nós
let i = 0;

// Manipulador de clique
function clicked(event, d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);

    // Mostra painel de informações se for nó folha com proteínas
    if (d.data.proteins && d.data.proteins.length > 0) {
        showInfoPanel(d.data);
    }
}

// Função de colapso
function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

// Gerador de caminho diagonal
function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
}

// Obtém classe de reino para coloração
function getKingdomClass(d) {
    const data = d.data;
    if (data.type === 'kingdom') {
        return data.name.toLowerCase();
    }
    // Percorre para cima para encontrar o reino
    let current = d;
    while (current.parent) {
        if (current.data.type === 'kingdom') {
            return current.data.name.toLowerCase();
        }
        current = current.parent;
    }
    return 'other';
}

// Mostra painel de informações
function showInfoPanel(data) {
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');

    content.innerHTML = `
        <h2>${data.name}</h2>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Protein Count:</strong> ${data.count || data.proteins.length}</p>
        ${data.proteins && data.proteins.length > 0 ? `
            <h3>Proteins:</h3>
            <ul>
                ${data.proteins.map(p => `
                    <li>
                        <strong>${p.accession}</strong><br>
                        <small>${p.organism}</small>
                    </li>
                `).join('')}
            </ul>
        ` : ''}
    `;

    panel.classList.remove('hidden');
}

// Atualiza estatísticas
function updateStats(proteins, tree) {
    document.getElementById('total-proteins').textContent = proteins.length;

    const species = new Set(proteins.map(p => p.organism?.scientificName)).size;
    document.getElementById('total-species').textContent = species;

    // Sempre 1 reino (Viridiplantae) já que trabalhamos apenas com plantas
    document.getElementById('total-kingdoms').textContent = 1;
}

// Atualiza gráfico de distribuição taxonômica
function updateTaxonomicChart(proteins) {
    const ctx = document.getElementById('taxonomic-chart');
    if (!ctx) return;

    // Extrai contagens taxonômicas
    const taxonomicData = extractTaxonomicData(proteins);

    // Destrói gráfico anterior se existir
    if (taxonomicChart) {
        taxonomicChart.destroy();
    }

    // Cria novo gráfico
    taxonomicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Espécies', 'Gêneros', 'Famílias', 'Ordens', 'Classes', 'Filos', 'Reino'],
            datasets: [{
                label: 'Diversidade Taxonômica',
                data: [
                    taxonomicData.species,
                    taxonomicData.genus,
                    taxonomicData.family,
                    taxonomicData.order,
                    taxonomicData.class,
                    taxonomicData.phylum,
                    1 // Sempre 1 reino (Viridiplantae)
                ],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',   // Species - purple
                    'rgba(124, 58, 237, 0.8)',   // Genus
                    'rgba(109, 40, 217, 0.8)',   // Family
                    'rgba(91, 33, 182, 0.8)',    // Order
                    'rgba(76, 29, 149, 0.8)',    // Class
                    'rgba(59, 7, 100, 0.8)',     // Phylum
                    'rgba(49, 46, 129, 0.8)'     // Kingdom
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(124, 58, 237, 1)',
                    'rgba(109, 40, 217, 1)',
                    'rgba(91, 33, 182, 1)',
                    'rgba(76, 29, 149, 1)',
                    'rgba(59, 7, 100, 1)',
                    'rgba(49, 46, 129, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.parsed.x} únicos`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 13, weight: '500' }
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Extrai dados taxonômicos das proteínas
function extractTaxonomicData(proteins) {
    const species = new Set();
    const genus = new Set();
    const family = new Set();
    const order = new Set();
    const classSet = new Set();
    const phylum = new Set();

    proteins.forEach(protein => {
        const lineage = protein.organism?.lineage || [];
        const scientificName = protein.organism?.scientificName;

        if (scientificName) species.add(scientificName);

        // Extrai níveis taxonômicos da linhagem
        // Ordem típica: Eukaryota, Viridiplantae, Streptophyta, ...
        lineage.forEach((taxon, index) => {
            // Phylum (logo após Viridiplantae)
            if (index > 0 && lineage[index - 1] === 'Viridiplantae') {
                phylum.add(taxon);
            }
            // Heurística simples baseada em padrões comuns
            if (taxon.endsWith('idae') || taxon.endsWith('ales')) order.add(taxon);
            if (taxon.endsWith('aceae')) family.add(taxon);
            if (taxon.endsWith('opsida') || taxon.endsWith('phyceae')) classSet.add(taxon);
        });

        // Para gênero, pega a primeira parte do nome científico
        if (scientificName && scientificName.includes(' ')) {
            const genusName = scientificName.split(' ')[0];
            genus.add(genusName);
        }
    });

    return {
        species: species.size,
        genus: genus.size,
        family: family.size,
        order: order.size,
        class: classSet.size,
        phylum: phylum.size
    };
}

// Configura ouvintes de eventos
function setupEventListeners() {
    // Fecha painel
    document.querySelector('.close-panel')?.addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
    });

    // Busca
    const searchInput = document.getElementById('organism-search');
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            // Se busca vazia, mostra tudo
            updateTreeVisualization(allProteins);
            return;
        }

        // Filtra proteínas
        const filteredProteins = allProteins.filter(p =>
            p.organism && p.organism.scientificName.toLowerCase().includes(query)
        );

        // Atualiza visualização
        updateTreeVisualization(filteredProteins);
    });
}

// Auxiliares de Carregamento/Erro
function showLoading(show) {
    document.getElementById('loading-tree').classList.toggle('hidden', !show);
}

function showError() {
    showLoading(false);
    document.getElementById('tree-error').classList.remove('hidden');
}
