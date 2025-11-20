/**
 * Charts Module
 * Handles visualization of protein data using Chart.js
 */

let mutationChartInstance = null;

export function renderMutationChart(features, sequenceLength) {
    const ctx = document.getElementById('mutationChart').getContext('2d');

    // Filter for variants/mutations
    const variants = features.filter(f => f.type === 'Variant');

    // Create a distribution of mutations across the sequence
    // We'll bin them to show "hotspots"
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
                label: 'Mutation Frequency',
                data: bins,
                backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue 500
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
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Residue Position'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Mutation Distribution (Total: ${variants.length})`
                }
            }
        }
    });
}
