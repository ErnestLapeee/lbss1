// Tab functionality
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.style.display = 'block';
    selectedTab.classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Load content based on tab
    if (tabId === 'manage-games') {
        loadGames();
    } else if (tabId === 'team-players') {
        const teamSelect = document.getElementById('team-select');
        if (teamSelect) {
            loadTeamPlayers(teamSelect.value);
        }
    }
}

// Show success message
function showSuccessMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    const form = document.getElementById('add-game-form');
    form.parentNode.insertBefore(messageElement, form);

    // Remove message after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Toggle score inputs based on game completion status
function toggleScoreInputs(checkbox) {
    const scoreInputs = document.querySelector('.score-inputs');
    scoreInputs.style.display = checkbox.checked ? 'grid' : 'none';
    
    const scoreFields = scoreInputs.querySelectorAll('input');
    scoreFields.forEach(field => {
        field.required = checkbox.checked;
        if (!checkbox.checked) {
            field.value = '';
        }
    });
}

// Load games from localStorage
function loadGames() {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const gamesList = document.querySelector('.games-list');
    gamesList.innerHTML = '';

    // Sort games by date and time
    games.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
    });

    games.forEach(game => {
        const gameElement = createGameElement(game);
        gamesList.appendChild(gameElement);
    });

    if (games.length === 0) {
        gamesList.innerHTML = `
            <div class="no-games">
                <i class="fas fa-info-circle"></i>
                <p>Nav pievienotu spēļu</p>
            </div>
        `;
    }
}

// Create game element for the manage games list
function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-item';
    
    const dateObj = new Date(game.date + 'T' + game.time);
    const formattedDate = dateObj.toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isUpcoming = new Date() < dateObj;
    const stageDisplay = game.stage ? `${game.stage}. POSMS` : 'POSMS NAV NORĀDĪTS';

    div.innerHTML = `
        <div class="game-info">
            <h3>${stageDisplay}</h3>
            <p><i class="fas fa-calendar"></i> ${formattedDate}, ${game.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${game.location}</p>
            <p><i class="fas fa-baseball-ball"></i> ${game.homeTeam} vs ${game.awayTeam}</p>
            ${game.isCompleted ? 
                `<p><i class="fas fa-trophy"></i> Rezultāts: ${game.homeScore} - ${game.awayScore}</p>` : 
                `<p><i class="fas fa-clock"></i> ${isUpcoming ? 'Gaidāma spēle' : 'Nav ievadīts rezultāts'}</p>`
            }
        </div>
        <div class="game-actions">
            ${game.isCompleted ? `
                <button class="action-btn" onclick="openGameStats('${game.id}')" title="Pievienot/Rediģēt statistiku">
                    <i class="fas fa-chart-bar"></i>
                </button>
            ` : ''}
            <button class="action-btn" onclick="editGame('${game.id}')" title="Rediģēt spēli">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn" onclick="deleteGame('${game.id}')" title="Dzēst spēli">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

// Delete game
function deleteGame(gameId) {
    if (!gameId) {
        console.error('No game ID provided for deletion');
        return;
    }

    if (!confirm('Vai tiešām vēlaties dzēst šo spēli?')) return;
    
    try {
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        console.log('Current games:', games);
        console.log('Attempting to delete game with ID:', gameId);
        
        // Convert gameId to number for comparison since it might be stored as a number
        const numericGameId = Number(gameId);
        const gameToDelete = games.find(g => g.id === gameId || g.id === numericGameId);
        
        if (!gameToDelete) {
            console.error('Game not found:', gameId);
            // Log all game IDs to help debug
            console.log('Available game IDs:', games.map(g => `${g.id} (${typeof g.id})`));
            return;
        }

        const updatedGames = games.filter(g => String(g.id) !== String(gameId));
        console.log('Games after deletion:', updatedGames);
        
        localStorage.setItem('games', JSON.stringify(updatedGames));
        loadGames();
        showSuccessMessage('Spēle veiksmīgi dzēsta!');
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Kļūda dzēšot spēli. Lūdzu, mēģiniet vēlreiz.');
    }
}

// Handle form submission
document.getElementById('add-game-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const editId = this.dataset.editId;
    
    const game = {
        id: editId || String(Date.now()),  // Ensure ID is always a string
        stage: formData.get('stage'),
        date: formData.get('date'),
        time: formData.get('time'),
        homeTeam: formData.get('home-team'),
        awayTeam: formData.get('away-team'),
        location: formData.get('location'),
        isCompleted: formData.get('is-completed') === 'on',
        homeScore: formData.get('home-score') || null,
        awayScore: formData.get('away-score') || null
    };
    
    try {
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        
        if (editId) {
            // Update existing game
            const index = games.findIndex(g => g.id === editId);
            if (index !== -1) {
                games[index] = game;
            }
            delete this.dataset.editId;
            showSuccessMessage('Spēle veiksmīgi atjaunināta!');
        } else {
            // Add new game
            games.push(game);
            showSuccessMessage('Spēle veiksmīgi pievienota!');
        }
        
        localStorage.setItem('games', JSON.stringify(games));
        
        // Reset form
        this.reset();
        document.querySelector('.score-inputs').style.display = 'none';
        
        // Reload games list if we're on the manage tab
        if (document.querySelector('.tab-btn.active').getAttribute('onclick').includes('manage-games')) {
            loadGames();
        }

        // Update standings if the page exists
        if (typeof updateStandingsTable === 'function') {
            updateStandingsTable();
        }
    } catch (error) {
        console.error('Error saving game:', error);
        alert('Kļūda saglabājot spēli. Lūdzu, mēģiniet vēlreiz.');
    }
});

// Edit game
function editGame(gameId) {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const game = games.find(g => g.id === gameId);
    
    if (!game) return;
    
    // Switch to add game tab
    showTab('add-game');
    
    // Fill form with game data
    const form = document.getElementById('add-game-form');
    form.querySelector('[name="stage"]').value = game.stage;
    form.querySelector('[name="date"]').value = game.date;
    form.querySelector('[name="time"]').value = game.time;
    form.querySelector('[name="home-team"]').value = game.homeTeam;
    form.querySelector('[name="away-team"]').value = game.awayTeam;
    form.querySelector('[name="location"]').value = game.location;
    
    const completedCheckbox = form.querySelector('[name="is-completed"]');
    completedCheckbox.checked = game.isCompleted;
    toggleScoreInputs(completedCheckbox);
    
    if (game.isCompleted) {
        form.querySelector('[name="home-score"]').value = game.homeScore;
        form.querySelector('[name="away-score"]').value = game.awayScore;
    }
    
    // Update form submission to handle edit
    form.dataset.editId = gameId;
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

// Reset form
document.querySelector('button[type="reset"]').addEventListener('click', function(e) {
    const form = document.getElementById('add-game-form');
    delete form.dataset.editId;
    document.querySelector('.score-inputs').style.display = 'none';
});

// Handle player form submission
document.getElementById('add-player-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const teamId = document.getElementById('team-select').value;
    if (!teamId) {
        alert('Lūdzu izvēlieties komandu!');
        return;
    }
    
    console.log('Saving player for team:', teamId);
    
    const formData = new FormData(this);
    
    const player = {
        id: String(Date.now()),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        number: Number(formData.get('number')),
        bats: formData.get('bats'),
        throws: formData.get('throws')
    };
    
    console.log('Player data to save:', player);
    
    try {
        const storageKey = `players_${teamId}`;
        const players = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Check if number is already taken by another player
        const numberExists = players.some(p => p.number === player.number);
        if (numberExists) {
            alert('Šis numurs jau ir piešķirts citam spēlētājam!');
            return;
        }
        
        players.push(player);
        localStorage.setItem(storageKey, JSON.stringify(players));
        console.log('Saved players:', players);
        
        this.reset();
        showSuccessMessage('Spēlētājs veiksmīgi pievienots!');
    } catch (error) {
        console.error('Error saving player:', error);
        alert('Kļūda saglabājot spēlētāju. Lūdzu, mēģiniet vēlreiz.');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show the first tab (add-game) by default
    showTab('add-game');
    
    // Load games if on manage games tab
    if (document.querySelector('.tab-btn.active').getAttribute('onclick').includes('manage-games')) {
        loadGames();
    }
});

// Update openGameStats function
function openGameStats(gameId) {
    // Call the openGameStatsModal function from game-stats.js
    openGameStatsModal(gameId);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing admin panel...');
    
    // Add team selection change handler
    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        console.log('Team select found:', teamSelect);
        teamSelect.addEventListener('change', () => {
            console.log('Team changed to:', teamSelect.value);
            loadTeamPlayers(teamSelect.value);
        });
    } else {
        console.error('Team select element not found');
    }

    // Set up team tabs
    document.querySelectorAll('.team-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTeam(tab.dataset.team));
    });

    // Check which tab is active and load appropriate content
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabAction = activeTab.getAttribute('onclick');
        if (tabAction) {
            if (tabAction.includes('manage-games')) {
                loadGames();
            }
        }
    }
});

// Add this function to help with testing
function addTestPlayer() {
    const teamId = document.getElementById('team-select').value;
    const testPlayer = {
        id: Date.now().toString(),
        firstName: "Test",
        lastName: "Player",
        number: 99,
        bats: "R",
        throws: "R"
    };
    
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    players.push(testPlayer);
    localStorage.setItem(`players_${teamId}`, JSON.stringify(players));
    console.log(`Added test player to team ${teamId}:`, testPlayer);
}

// Export data
function exportData() {
    try {
        // Collect all localStorage data
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = JSON.parse(localStorage.getItem(key));
        }
        
        // Convert to JSON string
        const jsonData = JSON.stringify(data, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lbss-data-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        showSuccessMessage('Dati veiksmīgi eksportēti!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Kļūda eksportējot datus. Lūdzu, mēģiniet vēlreiz.');
    }
}

// Import data
function importData() {
    try {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Update localStorage with imported data
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    });
                    
                    // Reload current tab
                    const activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab) {
                        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
                        showTab(tabId);
                    }
                    
                    showSuccessMessage('Dati veiksmīgi importēti!');
                } catch (err) {
                    console.error('Error parsing imported data:', err);
                    alert('Kļūda importējot datus. Pārbaudiet faila formātu.');
                }
            };
            
            reader.readAsText(file);
        };
        
        document.body.appendChild(input);
        input.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(input);
        }, 0);
    } catch (error) {
        console.error('Error importing data:', error);
        alert('Kļūda importējot datus. Lūdzu, mēģiniet vēlreiz.');
    }
} 