const serverPenCtx = document.getElementById('serverPenetrationChart').getContext('2d');
const attackerDistCtx = document.getElementById('attackerDistributionChart').getContext('2d');
let serverPenetrationGraph, attackerDistGraph;

function createPenetrationData(numAttackers, timeSteps, p) {
    const dt = 1 / timeSteps; // Intervallo temporale infinitesimale
    const attackResults = Array.from({ length: numAttackers }, () => [0]); // Traiettorie inizializzate

    for (let attacker = 0; attacker < numAttackers; attacker++) {
        for (let step = 1; step <= timeSteps; step++) {
            // Salto di ±sqrt(dt) basato sulla probabilità p
            const jump = (Math.random() < p ? 1 : -1) * Math.sqrt(dt);
            const lastValue = attackResults[attacker][step - 1];
            attackResults[attacker].push(lastValue + jump);
        }
    }

    const finalPenetrations = attackResults.map(results => results[results.length - 1]);
    const mean = finalPenetrations.reduce((sum, x) => sum + x, 0) / numAttackers;
    const variance = finalPenetrations.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / numAttackers;

    return { attackResults, finalPenetrations, mean, variance }; // Restituisce anche finalPenetrations
}

function drawPenetrationGraph(numAttackers, timeSteps, p) {
    const { attackResults, finalPenetrations, mean, variance } = createPenetrationData(numAttackers, timeSteps, p);
    const labels = Array.from({ length: timeSteps }, (_, i) => `${i + 1}`);
    const attackerDatasets = attackResults.map((attackerData, idx) => ({
        label: `Attacker ${idx + 1}`,
        data: attackerData,
        borderColor: `rgba(${Math.random() * 200 + 55}, ${Math.random() * 200 + 55}, ${Math.random() * 200 + 55}, 0.9)`,
        fill: false,
        stepped: true,
        borderWidth: 2
    }));

    const yMin = -Math.ceil(Math.sqrt(timeSteps)); // Limite minimo simmetrico
    const yMax = Math.ceil(Math.sqrt(timeSteps)); // Limite massimo simmetrico

    if (serverPenetrationGraph) {
        serverPenetrationGraph.data.labels = ['Start', ...labels];
        serverPenetrationGraph.data.datasets = attackerDatasets;
        serverPenetrationGraph.options.scales.y.min = yMin;
        serverPenetrationGraph.options.scales.y.max = yMax;
        serverPenetrationGraph.update();
    } else {
        serverPenetrationGraph = new Chart(serverPenCtx, {
            type: 'line',
            data: {
                labels: ['Start', ...labels],
                datasets: attackerDatasets
            },
            options: {
                scales: {
                    y: { 
                        min: yMin,
                        max: yMax,
                        grid: { display: false }, 
                        ticks: { color: '#999' } 
                    },
                    x: { grid: { display: false }, ticks: { color: '#999' } }
                },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
            }
        });
    }

    drawAttackerDistribution(finalPenetrations, mean, variance); // Passa correttamente finalPenetrations
}

function drawAttackerDistribution(finalPenetrations, mean, variance) {
    const minXValue = Math.min(...finalPenetrations);
    const maxXValue = Math.max(...finalPenetrations);
    const stepSize = 0.1;
    const labels = Array.from({ length: Math.ceil((maxXValue - minXValue) / stepSize) + 1 }, (_, i) => (minXValue + i * stepSize).toFixed(2));

    const distData = labels.map(label => {
        const floatLabel = parseFloat(label);
        return finalPenetrations.filter(score => Math.abs(score - floatLabel) < stepSize / 2).length;
    });

    const maxYValue = Math.max(...distData);

    if (attackerDistGraph) {
        attackerDistGraph.data.labels = labels;
        attackerDistGraph.data.datasets[0].data = distData;
        attackerDistGraph.options.scales.y.max = maxYValue;
        attackerDistGraph.update();
    } else {
        attackerDistGraph = new Chart(attackerDistCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: distData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        min: 0,
                        max: maxYValue,
                        grid: { display: false }, 
                        ticks: { color: '#999' }
                    },
                    x: {
                        grid: { display: false }, 
                        ticks: { color: '#999' }
                    }
                },
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { mode: 'index', intersect: false } 
                }
            }
        });
    }

    document.getElementById('mean').textContent = `Mean: ${mean.toFixed(4)}`;
    document.getElementById('variance').textContent = `Variance: ${variance.toFixed(4)}`;
}

// Listener aggiornato per includere il parametro p
document.getElementById('runSimulationBtn').addEventListener('click', function() {
    const numAttackers = parseInt(document.getElementById('hackerCount').value);
    const timeSteps = parseInt(document.getElementById('timeSteps').value);
    const p = parseFloat(document.getElementById('jumpProbability').value); // Nuovo parametro p
    drawPenetrationGraph(numAttackers, timeSteps, p);
});
