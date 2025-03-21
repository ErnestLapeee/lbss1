// Current view and sort state
let currentView = 'batting';
let currentSort = { stat: 'AVG', direction: 'desc' };

// Calculate derived batting stats
function calculateBattingStats(stats) {
    const singles = stats.H - (stats['2B'] + stats['3B'] + stats.HR);
    return {
        ...stats,
        AVG: stats.AB > 0 ? (stats.H / stats.AB).toFixed(3) : '.000',
        OBP: (stats.AB + stats.BB + stats.HBP + stats.SF) > 0 ? 
            ((stats.H + stats.BB + stats.HBP) / (stats.AB + stats.BB + stats.HBP + stats.SF)).toFixed(3) : '.000',
        SLG: stats.AB > 0 ? 
            ((singles + 2 * stats['2B'] + 3 * stats['3B'] + 4 * stats.HR) / stats.AB).toFixed(3) : '.000',
        get OPS() { return (parseFloat(this.OBP) + parseFloat(this.SLG)).toFixed(3); }
    };
}

// Calculate derived pitching stats
function calculatePitchingStats(stats) {
    return {
        ...stats,
        ERA: stats.IP > 0 ? ((stats.ER * 9) / stats.IP).toFixed(2) : '0.00',
        WHIP: stats.IP > 0 ? ((stats.BB + stats.H) / stats.IP).toFixed(2) : '0.00',
        'K/9': stats.IP > 0 ? ((stats.SO * 9) / stats.IP).toFixed(1) : '0.0',
        'BB/9': stats.IP > 0 ? ((stats.BB * 9) / stats.IP).toFixed(1) : '0.0'
    };
}

// Add these functions to calculate global stats

function calculateGlobalStats() {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const teams = ['ARCHERS', 'SIGULDA', 'PLATONE'];
    const globalStats = {};

    // Initialize stats for each team
    teams.forEach(team => {
        globalStats[team] = {
            batting: {},
            pitching: {}
        };
    });

    // Process each completed game
    games.forEach(game => {
        if (!game.isCompleted) return;

        const gameStats = JSON.parse(localStorage.getItem(`stats_${game.id}`) || '{}');
        
        // Process each team's stats
        teams.forEach(team => {
            const teamGameStats = gameStats[team] || { batting: {}, pitching: {} };

            // Process batting stats
            Object.entries(teamGameStats.batting).forEach(([playerId, stats]) => {
                if (!globalStats[team].batting[playerId]) {
                    globalStats[team].batting[playerId] = createEmptyBattingStats();
                }
                
                // Sum up batting stats
                Object.keys(stats).forEach(stat => {
                    globalStats[team].batting[playerId][stat] += (stats[stat] || 0);
                });
            });

            // Process pitching stats
            Object.entries(teamGameStats.pitching).forEach(([playerId, stats]) => {
                if (!globalStats[team].pitching[playerId]) {
                    globalStats[team].pitching[playerId] = createEmptyPitchingStats();
                }
                
                // Sum up pitching stats
                Object.keys(stats).forEach(stat => {
                    globalStats[team].pitching[playerId][stat] += (stats[stat] || 0);
                });
            });
        });
    });
    
    // Calculate derived stats for each player
    teams.forEach(team => {
        // Calculate batting averages and other derived stats
        Object.values(globalStats[team].batting).forEach(stats => {
            calculateDerivedBattingStats(stats);
        });

        // Calculate ERA and other derived pitching stats
        Object.values(globalStats[team].pitching).forEach(stats => {
            calculateDerivedPitchingStats(stats);
        });
    });

    return globalStats;
}

function createEmptyBattingStats() {
    return {
        AB: 0, H: 0, '2B': 0, '3B': 0, HR: 0, RBI: 0, R: 0,
        BB: 0, SO: 0, HBP: 0, SF: 0, SAC: 0, SB: 0, CS: 0,
        AVG: '.000', OBP: '.000', SLG: '.000', OPS: '.000'
    };
}

function createEmptyPitchingStats() {
    return {
        IP: 0, H: 0, R: 0, ER: 0, BB: 0, SO: 0, HR: 0,
        BF: 0, HBP: 0, WP: 0, BK: 0, W: 0, L: 0, SV: 0,
        ERA: '0.00', WHIP: '0.00', 'K/9': '0.00', 'BB/9': '0.00'
    };
}

function calculateDerivedBattingStats(stats) {
    // Calculate AVG
    stats.AVG = stats.AB > 0 ? (stats.H / stats.AB).toFixed(3) : '.000';
    
    // Calculate OBP
    const onBaseEvents = stats.H + stats.BB + stats.HBP;
    const onBaseOpportunities = stats.AB + stats.BB + stats.HBP + stats.SF;
    stats.OBP = onBaseOpportunities > 0 ? 
        (onBaseEvents / onBaseOpportunities).toFixed(3) : '.000';
    
    // Calculate SLG
    const bases = stats.H + stats['2B'] + (2 * stats['3B']) + (3 * stats.HR);
    stats.SLG = stats.AB > 0 ? (bases / stats.AB).toFixed(3) : '.000';
    
    // Calculate OPS
    stats.OPS = (parseFloat(stats.OBP) + parseFloat(stats.SLG)).toFixed(3);
}

function calculateDerivedPitchingStats(stats) {
    // Calculate ERA
    stats.ERA = stats.IP > 0 ? ((stats.ER * 9) / stats.IP).toFixed(2) : '0.00';
    
    // Calculate WHIP
    stats.WHIP = stats.IP > 0 ? 
        ((stats.BB + stats.H) / stats.IP).toFixed(2) : '0.00';
    
    // Calculate K/9
    stats['K/9'] = stats.IP > 0 ? 
        ((stats.SO * 9) / stats.IP).toFixed(1) : '0.0';
    
    // Calculate BB/9
    stats['BB/9'] = stats.IP > 0 ? 
        ((stats.BB * 9) / stats.IP).toFixed(1) : '0.0';
}

// Update the loadStats function to use global stats
function loadStats() {
    const globalStats = calculateGlobalStats();
    const teamFilter = document.getElementById('team-filter').value;
    
    const statsToDisplay = teamFilter ? 
        { [teamFilter]: globalStats[teamFilter] } : 
        globalStats;

    displayStats(statsToDisplay);
}

// Update displayStats function to handle the new stats format
function displayStats(stats) {
    const tbody = document.getElementById(`${currentView}-stats-body`);
    tbody.innerHTML = '';
    
    Object.entries(stats).forEach(([team, teamStats]) => {
        const statsForView = teamStats[currentView];
        
        Object.entries(statsForView).forEach(([playerId, playerStats]) => {
            const player = getPlayerInfo(playerId, team);
            if (!player) return;

        const row = document.createElement('tr');
            row.className = 'clickable';
            row.onclick = () => showPlayerDetails(playerId, team, currentView);
        
        if (currentView === 'batting') {
            row.innerHTML = `
                    <td>${player.firstName} ${player.lastName}</td>
                    <td>${team}</td>
                    <td>${playerStats.AB}</td>
                    <td>${playerStats.H}</td>
                    <td>${playerStats['2B']}</td>
                    <td>${playerStats['3B']}</td>
                    <td>${playerStats.HR}</td>
                    <td>${playerStats.RBI}</td>
                    <td>${playerStats.R}</td>
                    <td>${playerStats.BB}</td>
                    <td>${playerStats.SO}</td>
                    <td>${playerStats.HBP}</td>
                    <td>${playerStats.SF}</td>
                    <td>${playerStats.SAC}</td>
                    <td>${playerStats.SB}</td>
                    <td>${playerStats.CS}</td>
                    <td>${playerStats.AVG}</td>
                    <td>${playerStats.OBP}</td>
                    <td>${playerStats.SLG}</td>
                    <td>${playerStats.OPS}</td>
            `;
        } else {
            row.innerHTML = `
                    <td>${player.firstName} ${player.lastName}</td>
                    <td>${team}</td>
                    <td>${playerStats.IP.toFixed(1)}</td>
                    <td>${playerStats.H}</td>
                    <td>${playerStats.R}</td>
                    <td>${playerStats.ER}</td>
                    <td>${playerStats.BB}</td>
                    <td>${playerStats.SO}</td>
                    <td>${playerStats.HR}</td>
                    <td>${playerStats.BF}</td>
                    <td>${playerStats.HBP}</td>
                    <td>${playerStats.WP}</td>
                    <td>${playerStats.BK}</td>
                    <td>${playerStats.W}</td>
                    <td>${playerStats.L}</td>
                    <td>${playerStats.SV}</td>
                    <td>${playerStats.ERA}</td>
                    <td>${playerStats.WHIP}</td>
                    <td>${playerStats['K/9']}</td>
                    <td>${playerStats['BB/9']}</td>
            `;
        }
        
        tbody.appendChild(row);
        });
    });
}

// Switch between batting and pitching views
function switchStatsView(view) {
    currentView = view;
    // Update button states
    document.querySelectorAll('.stats-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.stats-btn[onclick*="${view}"]`).classList.add('active');
    
    // Show/hide appropriate stats table
    document.getElementById('batting-stats').style.display = view === 'batting' ? 'block' : 'none';
    document.getElementById('pitching-stats').style.display = view === 'pitching' ? 'block' : 'none';
    
    loadStats();
}

// Sort stats by column
function sortStats(type, stat) {
    const statsTable = document.querySelector(`#${type}-stats table`);
    const headers = statsTable.querySelectorAll('th');
    
    // Remove sort indicators from all headers
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // Update sort direction
    if (currentSort.stat === stat) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.stat = stat;
        currentSort.direction = 'desc'; // Default to descending for new sort
    }

    // Add sort indicator to current header
    const currentHeader = Array.from(headers).find(h => h.dataset.stat === stat);
    if (currentHeader) {
        currentHeader.classList.add(`sort-${currentSort.direction}`);
    }

    // Get and sort the data
    const stats = calculateGlobalStats();
    const filteredTeam = document.getElementById('team-filter').value;
    
    let allPlayers = [];
    Object.entries(stats).forEach(([team, teamStats]) => {
        if (!filteredTeam || team === filteredTeam) {
            Object.entries(teamStats[type]).forEach(([playerId, playerStats]) => {
                const player = getPlayerInfo(playerId, team);
                allPlayers.push({
                    ...playerStats,
                    team,
                    playerId,
                    name: player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'
                });
            });
        }
    });

    // Sort the players
    allPlayers.sort((a, b) => {
        let aVal = a[stat];
        let bVal = b[stat];
        
        // Convert string numbers to actual numbers for comparison
        if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        // Special handling for text values
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (currentSort.direction === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    // Update the display
    const tbody = statsTable.querySelector('tbody');
    tbody.innerHTML = '';
    allPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'clickable';
        row.onclick = () => showPlayerDetails(player.playerId, player.team, type);
        
        if (type === 'batting') {
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.team}</td>
                <td>${player.AB}</td>
                <td>${player.H}</td>
                <td>${player['2B']}</td>
                <td>${player['3B']}</td>
                <td>${player.HR}</td>
                <td>${player.RBI}</td>
                <td>${player.R}</td>
                <td>${player.BB}</td>
                <td>${player.SO}</td>
                <td>${player.HBP}</td>
                <td>${player.SF}</td>
                <td>${player.SAC}</td>
                <td>${player.SB}</td>
                <td>${player.CS}</td>
                <td>${player.AVG}</td>
                <td>${player.OBP}</td>
                <td>${player.SLG}</td>
                <td>${player.OPS}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.team}</td>
                <td>${typeof player.IP === 'number' ? player.IP.toFixed(1) : player.IP}</td>
                <td>${player.H}</td>
                <td>${player.R}</td>
                <td>${player.ER}</td>
                <td>${player.BB}</td>
                <td>${player.SO}</td>
                <td>${player.HR}</td>
                <td>${player.BF}</td>
                <td>${player.HBP}</td>
                <td>${player.WP}</td>
                <td>${player.BK}</td>
                <td>${player.W}</td>
                <td>${player.L}</td>
                <td>${player.SV}</td>
                <td>${player.ERA}</td>
                <td>${player.WHIP}</td>
                <td>${player['K/9']}</td>
                <td>${player['BB/9']}</td>
            `;
        }
        tbody.appendChild(row);
    });
}

// Filter stats by team
function filterStats() {
    loadStats();
}

// Add these functions
function showPlayerDetails(playerId, team, type) {
    const modal = document.getElementById('player-details-modal');
    const player = getPlayerInfo(playerId, team);
    if (!player) return;

    // Set player info
    document.getElementById('player-name').textContent = `${player.firstName} ${player.lastName}`;
    document.getElementById('player-number').textContent = player.number || '-';
    document.getElementById('player-team').textContent = team;
    document.getElementById('player-bats').textContent = formatBatsThrows(player.bats || 'R');
    document.getElementById('player-throws').textContent = formatBatsThrows(player.throws || 'R');

    // Show initial stats view
    switchPlayerStatsView(type);

    // Load both types of stats
    displayPlayerStats(playerId, team, 'batting');
    displayPlayerStats(playerId, team, 'pitching');

    modal.style.display = 'block';
    modal.classList.add('show');
}

function switchPlayerStatsView(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick*="${type}"]`).classList.add('active');

    // Show/hide appropriate stats view
    document.getElementById('player-batting-stats').style.display = type === 'batting' ? 'block' : 'none';
    document.getElementById('player-pitching-stats').style.display = type === 'pitching' ? 'block' : 'none';
}

function displayPlayerStats(playerId, team, type) {
    const gameStats = getPlayerGameStats(playerId, team, type);
    displayGameStats(gameStats, type, `${type}-games-stats`);
}

function formatBatsThrows(value) {
    switch(value) {
        case 'R': return 'R';
        case 'L': return 'L';
        case 'S': return 'SWITCH';
        default: return value;
    }
}

function calculatePlayerSeasonStats(playerId, team, type) {
    const globalStats = calculateGlobalStats();
    return globalStats[team]?.[type]?.[playerId] || 
        (type === 'batting' ? createEmptyBattingStats() : createEmptyPitchingStats());
}

function getPlayerGameStats(playerId, team, type) {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const gameStats = [];

    games.forEach(game => {
        if (!game.isCompleted) return;

        const stats = JSON.parse(localStorage.getItem(`stats_${game.id}`) || '{}');
        const teamStats = stats[team];
        if (!teamStats || !teamStats[type] || !teamStats[type][playerId]) return;

        const playerStats = teamStats[type][playerId];
        
        // Add game and team info to stats
        gameStats.push({
            game: game,
            stats: {
                ...playerStats,
                team: team,
                ...(type === 'batting' ? 
                    calculateBattingStats(playerStats) : 
                    calculatePitchingStats(playerStats))
            }
        });
    });

    return gameStats;
}

function displayGameStats(gameStats, type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    container.innerHTML = '';

    if (!gameStats || gameStats.length === 0) {
        container.innerHTML = '<div class="no-stats">Nav pieejama statistika</div>';
        return;
    }

    // Create table for all games
    const table = document.createElement('table');
    table.className = 'stats-table game-stats-table';

    // Create header row with all stat categories
    const headerRow = document.createElement('tr');
    if (type === 'batting') {
        headerRow.innerHTML = `
            <th>Datums</th>
            <th>Pret</th>
            <th>AB</th>
            <th>H</th>
            <th>2B</th>
            <th>3B</th>
            <th>HR</th>
            <th>RBI</th>
            <th>R</th>
            <th>BB</th>
            <th>SO</th>
            <th>HBP</th>
            <th>SF</th>
            <th>SAC</th>
            <th>SB</th>
            <th>CS</th>
            <th>AVG</th>
            <th>OBP</th>
            <th>SLG</th>
            <th>OPS</th>
        `;
    } else {
        headerRow.innerHTML = `
            <th>Datums</th>
            <th>Pret</th>
            <th>IP</th>
            <th>H</th>
            <th>R</th>
            <th>ER</th>
            <th>BB</th>
            <th>SO</th>
            <th>HR</th>
            <th>BF</th>
            <th>HBP</th>
            <th>WP</th>
            <th>BK</th>
            <th>W</th>
            <th>L</th>
            <th>SV</th>
            <th>ERA</th>
            <th>WHIP</th>
            <th>K/9</th>
            <th>BB/9</th>
        `;
    }
    table.appendChild(headerRow);

    // Add individual game rows
    gameStats.sort((a, b) => new Date(b.game.date) - new Date(a.game.date))
        .forEach(({ game, stats }) => {
            const row = document.createElement('tr');
            const opponent = game.homeTeam === stats.team ? game.awayTeam : game.homeTeam;
            const date = new Date(game.date).toLocaleDateString('lv-LV', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            if (type === 'batting') {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>vs ${opponent}</td>
                    <td>${stats.AB}</td>
                    <td>${stats.H}</td>
                    <td>${stats['2B']}</td>
                    <td>${stats['3B']}</td>
                    <td>${stats.HR}</td>
                    <td>${stats.RBI}</td>
                    <td>${stats.R}</td>
                    <td>${stats.BB}</td>
                    <td>${stats.SO}</td>
                    <td>${stats.HBP}</td>
                    <td>${stats.SF}</td>
                    <td>${stats.SAC}</td>
                    <td>${stats.SB}</td>
                    <td>${stats.CS}</td>
                    <td>${stats.AVG}</td>
                    <td>${stats.OBP}</td>
                    <td>${stats.SLG}</td>
                    <td>${stats.OPS}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>vs ${opponent}</td>
                    <td>${stats.IP.toFixed(1)}</td>
                    <td>${stats.H}</td>
                    <td>${stats.R}</td>
                    <td>${stats.ER}</td>
                    <td>${stats.BB}</td>
                    <td>${stats.SO}</td>
                    <td>${stats.HR}</td>
                    <td>${stats.BF}</td>
                    <td>${stats.HBP}</td>
                    <td>${stats.WP}</td>
                    <td>${stats.BK}</td>
                    <td>${stats.W}</td>
                    <td>${stats.L}</td>
                    <td>${stats.SV}</td>
                    <td>${stats.ERA}</td>
                    <td>${stats.WHIP}</td>
                    <td>${stats['K/9']}</td>
                    <td>${stats['BB/9']}</td>
                `;
            }
            table.appendChild(row);
        });

    // Add total row at the bottom
    const totalStats = calculateTotalStats(gameStats, type);
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-stats-row';
    if (type === 'batting') {
        totalRow.innerHTML = `
            <td colspan="2"><strong>Kopā</strong></td>
            <td>${totalStats.AB}</td>
            <td>${totalStats.H}</td>
            <td>${totalStats['2B']}</td>
            <td>${totalStats['3B']}</td>
            <td>${totalStats.HR}</td>
            <td>${totalStats.RBI}</td>
            <td>${totalStats.R}</td>
            <td>${totalStats.BB}</td>
            <td>${totalStats.SO}</td>
            <td>${totalStats.HBP}</td>
            <td>${totalStats.SF}</td>
            <td>${totalStats.SAC}</td>
            <td>${totalStats.SB}</td>
            <td>${totalStats.CS}</td>
            <td>${totalStats.AVG}</td>
            <td>${totalStats.OBP}</td>
            <td>${totalStats.SLG}</td>
            <td>${totalStats.OPS}</td>
        `;
    } else {
        totalRow.innerHTML = `
            <td colspan="2"><strong>Kopā</strong></td>
            <td>${totalStats.IP.toFixed(1)}</td>
            <td>${totalStats.H}</td>
            <td>${totalStats.R}</td>
            <td>${totalStats.ER}</td>
            <td>${totalStats.BB}</td>
            <td>${totalStats.SO}</td>
            <td>${totalStats.HR}</td>
            <td>${totalStats.BF}</td>
            <td>${totalStats.HBP}</td>
            <td>${totalStats.WP}</td>
            <td>${totalStats.BK}</td>
            <td>${totalStats.W}</td>
            <td>${totalStats.L}</td>
            <td>${totalStats.SV}</td>
            <td>${totalStats.ERA}</td>
            <td>${totalStats.WHIP}</td>
            <td>${totalStats['K/9']}</td>
            <td>${totalStats['BB/9']}</td>
        `;
    }
    table.appendChild(totalRow);

    container.appendChild(table);
}

function calculateTotalStats(gameStats, type) {
    if (type === 'batting') {
        const totals = gameStats.reduce((acc, { stats }) => {
            Object.keys(stats).forEach(key => {
                if (typeof stats[key] === 'number') {
                    acc[key] = (acc[key] || 0) + stats[key];
                }
            });
            return acc;
        }, {});
        return calculateBattingStats(totals);
    } else {
        const totals = gameStats.reduce((acc, { stats }) => {
            Object.keys(stats).forEach(key => {
                if (typeof stats[key] === 'number') {
                    acc[key] = (acc[key] || 0) + stats[key];
                }
            });
            return acc;
        }, {});
        return calculatePitchingStats(totals);
    }
}

// Add modal close functionality
document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    const playerModal = document.getElementById('player-details-modal');
    const closeBtn = playerModal.querySelector('.close');
    
    closeBtn.onclick = () => {
        playerModal.style.display = 'none';
        playerModal.classList.remove('show');
    };

    window.onclick = (event) => {
        if (event.target === playerModal) {
            playerModal.style.display = 'none';
            playerModal.classList.remove('show');
        }
    };
});

// Add some styles for no stats message
const style = document.createElement('style');
style.textContent = `
    .no-stats {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style); 