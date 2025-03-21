// Calculate team standings from game results
function calculateStandings() {
    // Get all games from localStorage
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    
    // Initialize standings object
    const standings = {
        'ARCHERS': { games: 0, wins: 0, losses: 0, percentage: 0 },
        'SIGULDA': { games: 0, wins: 0, losses: 0, percentage: 0 },
        'PLATONE': { games: 0, wins: 0, losses: 0, percentage: 0 }
    };
    
    // Process completed games
    games.forEach(game => {
        if (!game.isCompleted) return;
        
        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        const homeScore = parseInt(game.homeScore);
        const awayScore = parseInt(game.awayScore);
        
        // Update home team stats
        standings[homeTeam].games++;
        if (homeScore > awayScore) {
            standings[homeTeam].wins++;
        } else {
            standings[homeTeam].losses++;
        }
        
        // Update away team stats
        standings[awayTeam].games++;
        if (awayScore > homeScore) {
            standings[awayTeam].wins++;
        } else {
            standings[awayTeam].losses++;
        }
    });
    
    // Calculate percentages and convert to array for sorting
    const teamsArray = Object.entries(standings).map(([team, stats]) => {
        stats.percentage = stats.games > 0 ? (stats.wins / stats.games) : 0;
        return {
            team,
            ...stats
        };
    });
    
    // Sort teams by percentage, then by number of wins
    teamsArray.sort((a, b) => {
        if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
        }
        return b.wins - a.wins;
    });
    
    return teamsArray;
}

// Update standings table in the DOM
function updateStandingsTable() {
    const standings = calculateStandings();
    const tbody = document.querySelector('.standings-table tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    standings.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="team-name">${team.team}</td>
            <td>${team.games}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.percentage.toFixed(3).replace(/^0+/, '')}</td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize standings when page loads
document.addEventListener('DOMContentLoaded', updateStandingsTable); 