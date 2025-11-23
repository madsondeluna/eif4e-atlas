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
    const container = document.getElementById('taxonomic-chart');
    if (!container) return;

    // Extrai contagens taxonômicas
    const taxonomicData = extractTaxonomicData(proteins);

    // Limpa gráfico anterior
    container.innerHTML = '';

    // Prepara dados para bubble chart
    const bubbleData = [
        {
            name: "Species",
            value: taxonomicData.species,
            color: '#8B5CF6'
        },
        {
            name: "Genera",
            value: taxonomicData.genus,
            color: '#7C3AED'
        },
        {
            name: "Families",
            value: taxonomicData.family,
            color: '#6D28D9'
        },
        {
            name: "Orders",
            value: taxonomicData.order,
            color: '#5B21B6'
        },
        {
            name: "Classes",
            value: taxonomicData.class,
            color: '#4C1D95'
        },
        {
            name: "Phyla",
            value: taxonomicData.phylum,
            color: '#3B0764'
        },
        {
            name: "Kingdom",
            value: 1,
            color: '#312E81'
        }
    ];

    // Dimensões
    const width = container.clientWidth || 800;
    const height = 400;

    // Cria SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .style('background', 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)')
        .style('border-radius', '12px');

    // Escala de raio baseada no valor
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(bubbleData, d => d.value)])
        .range([20, 80]);

    // Adiciona valores de raio aos dados
    bubbleData.forEach(d => {
        d.radius = radiusScale(d.value);
        d.x = Math.random() * width;
        d.y = Math.random() * height;
    });

    // Cria tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'bubble-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(15, 23, 42, 0.95)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('font-size', '14px')
        .style('font-family', 'Inter, sans-serif')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)');

    // Cria simulação de força
    const simulation = d3.forceSimulation(bubbleData)
        .force('charge', d3.forceManyBody().strength(5))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 2))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

    // Cria grupos para cada bolha
    const bubbles = svg.selectAll('g.bubble')
        .data(bubbleData)
        .join('g')
        .attr('class', 'bubble')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Adiciona círculos
    bubbles.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
        .style('transition', 'all 0.3s ease')
        .on('mouseover', function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', d.radius * 1.15)
                .attr('stroke-width', 4)
                .style('filter', 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))');

            tooltip
                .style('visibility', 'visible')
                .html(`<strong>${d.name}</strong><br/>${d.value} unique`);
        })
        .on('mousemove', function (event) {
            tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', d.radius)
                .attr('stroke-width', 3)
                .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');

            tooltip.style('visibility', 'hidden');
        });

    // Adiciona texto no centro das bolhas
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .attr('fill', 'white')
        .attr('font-size', d => Math.min(d.radius / 3, 16) + 'px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text(d => d.name);

    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .attr('fill', 'white')
        .attr('font-size', d => Math.min(d.radius / 4, 14) + 'px')
        .attr('font-weight', '400')
        .attr('pointer-events', 'none')
        .text(d => d.value);

    // Atualiza posições na simulação
    simulation.on('tick', () => {
        bubbles.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Funções de drag
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
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
