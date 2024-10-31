const serverPenCtx = document.getElementById('serverPenetrationChart').getContext('2d');
const attackerDistCtx = document.getElementById('attackerDistributionChart').getContext('2d');
let serverPenetrationGraph, attackerDistGraph;

function createPenetrationData(numAttackers, lambda, timeSteps) {
    const dt = 1 / timeSteps;  // Intervallo temporale infinitesimale
    const attackResults = Array.from({ length: numAttackers }, () => [0]);
    const finalPenetrations = Array(numAttackers).fill(0);
    const savedScores = [];

    for (let attacker = 0; attacker < numAttackers; attacker++) {
        let penetrations = 0;
        for (let step = 1; step <= timeSteps; step++) {
            // Probabilità di attacco in questo intervallo dt
            const attackSuccess = Math.random() < lambda * dt;
            penetrations += attackSuccess ? 1 : 0;
            attackResults[attacker].push(penetrations);

            if (step === timeSteps) {
                savedScores.push(penetrations);
            }
        }
        finalPenetrations[attacker] = penetrations;
    }

    const penetrationDistribution = finalPenetrations.reduce((acc, numPenetrations) => {
        acc[numPenetrations] = (acc[numPenetrations] || 0) + 1;
        return acc;
    }, {});

    const mean = finalPenetrations.reduce((sum, x) => sum + x, 0) / numAttackers;
    let variance = finalPenetrations.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / numAttackers;

    return { attackResults, penetrationDistribution, mean, variance, savedScores };
}

function drawPenetrationGraph(numAttackers, lambda, timeSteps) {
    const { attackResults, penetrationDistribution, mean, variance, savedScores } = createPenetrationData(numAttackers, lambda, timeSteps);
    const labels = Array.from({ length: timeSteps }, (_, i) => `${i + 1}`);
    const attackerDatasets = attackResults.map((attackerData, idx) => ({
        label: `Attacker ${idx + 1}`,
        data: attackerData,
        borderColor: `rgba(${Math.random() * 200 + 55}, ${Math.random() * 200 + 55}, ${Math.random() * 200 + 55}, 0.9)`,
        fill: false,
        stepped: true,
        borderWidth: 2
    }));

    const yMin = 0;
    const yMax = timeSteps;

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

    drawAttackerDistribution(penetrationDistribution, timeSteps, mean, variance, savedScores);
}

function drawAttackerDistribution(penetrationDistribution, timeSteps, mean, variance, savedScores) {
    let minXValue = Math.min(...savedScores);
    let maxXValue = Math.max(...savedScores);

    const stepSize = 1;
    const labels = Array.from({ length: Math.ceil((maxXValue - minXValue) / stepSize) + 1 }, (_, i) => (minXValue + i * stepSize).toFixed(1));

    const distData = labels.map(label => {
        const floatLabel = parseFloat(label);
        return savedScores.filter(score => Math.abs(score - floatLabel) < stepSize / 2).length;
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

document.getElementById('runSimulationBtn').addEventListener('click', function() {
    const numAttackers = parseInt(document.getElementById('hackerCount').value);
    const lambda = parseFloat(document.getElementById('attackRate').value);
    const timeSteps = parseInt(document.getElementById('timeSteps').value);
    drawPenetrationGraph(numAttackers, lambda, timeSteps);
});

drawPenetrationGraph(50, 50, 70);

