Chart.defaults.color = '#a5c6fe';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function loadAccountCreationChart() {
  firebase.database().ref("users").once("value").then(snapshot => {
    let createdDates = {};
    let deletedDates = {};

    snapshot.forEach(child => {
      const user = child.val();
      const conta = user.conta || {};

      const created = conta.timestamp || conta.dataCriacao;
      if (created) {
        const key = new Date(created).toISOString().split("T")[0];
        createdDates[key] = (createdDates[key] || 0) + 1;
      }

      const deleted = conta.dataExclusao || conta.exclusaoTimestamp;
      if (deleted) {
        const key = new Date(deleted).toISOString().split("T")[0];
        deletedDates[key] = (deletedDates[key] || 0) + 1;
      }
    });

    const allDates = Array.from(new Set([
      ...Object.keys(createdDates),
      ...Object.keys(deletedDates)
    ])).sort();

    const labels = allDates.map(d => formatDateLabel(d));

    let total = 0;
    const accumulated = allDates.map(date => {
      total += (createdDates[date] || 0) - (deletedDates[date] || 0);
      total = Math.max(0, total); // Nunca abaixo de 0
      return total;
    });

    const ctx = document.getElementById('accountCreationChart').getContext('2d');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total de Contas (Variação Real)',
          data: accumulated,
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79,172,254,0.20)',
          pointBackgroundColor: '#4facfe',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#fff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#a5c6fe' },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#a5c6fe',
              stepSize: 1,
              callback: function(value) { return Math.floor(value); }
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  });
}

function loadServiceRequestsChart() {
  firebase.firestore().collection("solicitacoes_servico").get().then(querySnapshot => {
    let events = {};

    querySnapshot.forEach(doc => {
      let data = doc.data();
      let createdTimestamp = data.timestamp || data.dataCriacao || data.createdAt;

      if (createdTimestamp) {
        let createdDate = (createdTimestamp.toDate) ? createdTimestamp.toDate() : new Date(createdTimestamp);
        let createdKey = createdDate.toISOString().split('T')[0];
        if (!events[createdKey]) events[createdKey] = 0;
        events[createdKey] += 1; // +1 for creation
      }

      // Check for completion
      if (data.status && data.status.toLowerCase() === "concluido") {
        let completedTimestamp = data.timestampConclusao || data.dataConclusao || data.completedAt;
        if (completedTimestamp) {
          let completedDate = (completedTimestamp.toDate) ? completedTimestamp.toDate() : new Date(completedTimestamp);
          let completedKey = completedDate.toISOString().split('T')[0];
          if (!events[completedKey]) events[completedKey] = 0;
          events[completedKey] -= 1; // -1 for completion
        }
      }
    });

    let allDates = Object.keys(events).sort();
    let labels = allDates.map(d => formatDateLabel(d));

    let total = 0;
    let accumulated = allDates.map(date => {
      total += events[date];
      return total;
    });

    let ctx = document.getElementById('serviceRequestsChart').getContext('2d');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total de Serviços Ativos',
          data: accumulated,
          borderColor: '#f6d365',
          backgroundColor: 'rgba(246, 211, 101, 0.1)',
          pointBackgroundColor: '#f6d365',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#fff' }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#a5c6fe' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { stepSize: 1, color: '#a5c6fe' },
            title: {
              display: true,
              text: 'Total Ativos',
              color: '#fff'
            }
          }
        }
      }
    });
  }).catch(error => {
    console.error("Erro ao carregar dados de serviços:", error);
  });
}

function fallbackLoadServiceRequests() {
    firebase.firestore().collection("solicitacoes_servico").get().then(querySnapshot => {
        let dates = {};
        querySnapshot.forEach(doc => {
            let data = doc.data();
            let timestamp = data.timestamp || data.dataCriacao || data.createdAt;
            if (timestamp) {
                let dateObj = (timestamp.toDate) ? timestamp.toDate() : new Date(timestamp);
                let dateKey = dateObj.toISOString().split('T')[0];
                dates[dateKey] = (dates[dateKey] || 0) + 1;
            }
        });
    });
}

window.addEventListener('load', () => {
  loadAccountCreationChart();
  loadServiceRequestsChart();
});
