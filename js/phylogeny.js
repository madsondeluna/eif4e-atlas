/**
 * Módulo de Visualização de Filogenia
 * Renderiza árvore filogenética interativa usando D3.js
 */

import { fetchAllEIF4EProteins, buildTaxonomyTree } from './taxonomy.js';

// Estado
let treeData = null;
let svg = null;
let root = null;

// Inicializa no carregamento da página
document.addEventListener('DOMContentLoaded', async () => {
    await initializePhylogeny();
    setupEventListeners();
});

async function initializePhylogeny() {
    showLoading(true);

    try {
        // Busca dados
        const proteins = await fetchAllEIF4EProteins();
        if (proteins.length === 0) {
            showError();
            return;
        }

        // Constrói árvore
        treeData = buildTaxonomyTree(proteins);

        // Atualiza estatísticas
        updateStats(proteins, treeData);

        // Renderiza árvore
        renderTree(treeData);

        showLoading(false);
    } catch (error) {
        console.error('Erro ao inicializar filogenia:', error);
        showError();
    }
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

    const kingdoms = tree.children.length;
    document.getElementById('total-kingdoms').textContent = kingdoms;
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
        // TODO: Implementar busca/filtro
        console.log('Busca:', e.target.value);
    });

    // Filtros de reino
    document.querySelectorAll('.kingdom-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // TODO: Implementar filtragem
            console.log('Filtro alterado');
        });
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
