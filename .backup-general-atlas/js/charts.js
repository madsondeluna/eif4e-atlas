/**
 * Charts Module
 * Handles visualization of protein data using Chart.js
 */

let mutationChartInstance = null;

export function renderMutationChart(features, sequenceLength) {
    const canvas = document.getElementById('mutationChart');
    if (!canvas) {
        console.error('Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Filter for variants/mutations
    const variants = features.filter(f => f.type === 'Variant');

    // If no sequence length, use a default or skip
    if (!sequenceLength || sequenceLength === 0) {
        console.warn('No sequence length provided for chart');
        sequenceLength = 500; // Default fallback
    }

    // Decide what to visualize
    if (variants.length > 0) {
        // Show variant distribution
        renderVariantDistribution(ctx, variants, sequenceLength);
    } else {
        // Show domain/region distribution instead
        const domains = features.filter(f => f.type === 'Domain' || f.type === 'Region' || f.type === 'Motif');
        if (domains.length > 0) {
            renderDomainDistribution(ctx, domains, sequenceLength);
        } else {
            // No useful data available
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
                label: 'Variant Frequency',
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
                    title: { display: true, text: 'Count' }
                },
                x: {
                    title: { display: true, text: 'Residue Position' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Variant Distribution (Total: ${variants.length})`
                }
            }
        }
    });
}

function renderDomainDistribution(ctx, domains, sequenceLength) {
    // Count feature types
    const typeCounts = {};
    domains.forEach(d => {
        const type = d.type || 'Unknown';
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
                label: 'Feature Count',
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
                    text: `Protein Features (Total: ${domains.length})`
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
            <p style="font-weight: 500; margin-bottom: 0.5rem;">No Feature Data Available</p>
            <p style="font-size: 0.9rem;">This protein entry has limited annotation in UniProt.</p>
            <canvas id="mutationChart" style="display: none;"></canvas>
        </div>
    `;
}

function generateColors(count) {
    const colors = [
        'rgba(59, 130, 246, 0.6)',   // Blue
        'rgba(16, 185, 129, 0.6)',   // Green
        'rgba(245, 158, 11, 0.6)',   // Orange
        'rgba(139, 92, 246, 0.6)',   // Purple
        'rgba(236, 72, 153, 0.6)',   // Pink
        'rgba(239, 68, 68, 0.6)',    // Red
    ];
    return colors.slice(0, count);
}
