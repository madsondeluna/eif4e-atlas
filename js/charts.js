/**
 * Módulo de Gráficos
 * Lida com a visualização de dados de proteínas usando Chart.js
 */

let mutationChartInstance = null;

export function renderMutationChart(features, sequenceLength) {
    const canvas = document.getElementById('mutationChart');
    if (!canvas) {
        console.error('Canvas do gráfico não encontrado');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Filtra por variantes/mutações
    const variants = features.filter(f => f.type === 'Variant');

    // Se não houver comprimento da sequência, usa um padrão ou pula
    if (!sequenceLength || sequenceLength === 0) {
        console.warn('Nenhum comprimento de sequência fornecido para o gráfico');
        sequenceLength = 500; // Fallback padrão
    }

    // Decide o que visualizar
    if (variants.length > 0) {
        // Mostra distribuição de variantes
        renderVariantDistribution(ctx, variants, sequenceLength);
    } else {
        // Mostra distribuição de domínios/regiões em vez disso
        const domains = features.filter(f => f.type === 'Domain' || f.type === 'Region' || f.type === 'Motif');
        if (domains.length > 0) {
            renderDomainDistribution(ctx, domains, sequenceLength);
        } else {
            // Nenhum dado útil disponível
            renderNoDataMessage(canvas);
        }
    }
}

function renderVariantDistribution(ctx, variants, sequenceLength) {
    const binSize = 10;
    const bins = new Array(Math.ceil(sequenceLength / binSize)).fill(0);

    variants.forEach(v => {
        const start = v.location?.start?.value || 0;
        const binIndex = Math.floor(start / binSize);
        if (binIndex < bins.length) {
            bins[binIndex]++;
        }
    });

    const labels = bins.map((_, i) => `${i * binSize}-${(i + 1) * binSize}`);

    if (mutationChartInstance) {
        mutationChartInstance.destroy();
    }

    mutationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequência de Variantes',
                data: bins,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Contagem' }
                },
                x: {
                    title: { display: true, text: 'Posição do Resíduo' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Distribuição de Variantes (Total: ${variants.length})`
                }
            }
        }
    });
}

function renderDomainDistribution(ctx, domains, sequenceLength) {
    // Conta tipos de características
    const typeCounts = {};
    domains.forEach(d => {
        const type = d.type || 'Desconhecido';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    const colors = generateColors(labels.length);

    if (mutationChartInstance) {
        mutationChartInstance.destroy();
    }

    mutationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Contagem de Características',
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Características da Proteína (Total: ${domains.length})`
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function renderNoDataMessage(canvas) {
    if (mutationChartInstance) {
        mutationChartInstance.destroy();
        mutationChartInstance = null;
    }

    const parent = canvas.parentElement;
    parent.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: #64748b; background: #f8fafc; border-radius: 0.5rem;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p style="font-weight: 500; margin-bottom: 0.5rem;">Nenhum Dado de Característica Disponível</p>
            <p style="font-size: 0.9rem;">Esta entrada de proteína tem anotações limitadas no UniProt.</p>
            <canvas id="mutationChart" style="display: none;"></canvas>
        </div>
    `;
}

function generateColors(count) {
    const colors = [
        'rgba(59, 130, 246, 0.6)',   // Azul
        'rgba(16, 185, 129, 0.6)',   // Verde
        'rgba(245, 158, 11, 0.6)',   // Laranja
        'rgba(139, 92, 246, 0.6)',   // Roxo
        'rgba(236, 72, 153, 0.6)',   // Rosa
        'rgba(239, 68, 68, 0.6)',    // Vermelho
    ];
    return colors.slice(0, count);
}
