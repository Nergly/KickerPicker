// app.js

document.addEventListener('DOMContentLoaded', function () {
    const updateBadge = document.getElementById('update-badge');
    const updatePopout = document.getElementById('update-popout');
    const closePopout = document.getElementById('close-popout');
    const updatesList = document.getElementById('updates-list');

    // Sample Recent Updates
    const recentUpdates = [
	'Green Bay Packers release Brayden Narveson'
	'Buffalo Bills pickup Lucas Havrisik'
    'Added season point total prediction.',
    'Real-time statistics now available!',
    'Added refresh timer to display next update.',
    'Improved live stats fetching mechanism.',
    'Fixed bugs in player data loading.',
    // Add more updates as needed
];


    // Populate the updates list
    recentUpdates.forEach(update => {
        const listItem = document.createElement('li');
        listItem.textContent = update;
        updatesList.appendChild(listItem);
    });
	
	

    // Update the notification indicator with the number of updates
const updateNotification = document.getElementById('update-notification');
if (recentUpdates.length > 0) {
    updateNotification.textContent = recentUpdates.length;
    updateNotification.style.display = 'block';
} else {
    updateNotification.style.display = 'none';
}

// Hide notification when pop-out is opened
updateBadge.addEventListener('click', function () {
    updatePopout.classList.toggle('hidden');
    updateNotification.style.display = 'none'; // Hide indicator after viewing updates
});


    // Hide pop-out when close button is clicked
    closePopout.addEventListener('click', function () {
        updatePopout.classList.add('hidden');
    });

    // Optional: Hide pop-out when clicking outside of it
    document.addEventListener('click', function (event) {
        if (!updatePopout.contains(event.target) && !updateBadge.contains(event.target)) {
            updatePopout.classList.add('hidden');
        }
    });
});

// Define the players and their selected NFL team kickers with their ESPN IDs
const players = {
    Andrew: {
        name: 'Andrew',
        kickers: [
            { name: 'Jake Bates', team: 'DET', id: 4689936 },
            { name: 'Jake Moody', team: 'SF', id: 4372066 },
            { name: 'Cade York', team: 'WSH', id: 4428963 },
            { name: 'Joshua Karty', team: 'LAR', id: 4566192 },
            { name: 'Wil Lutz', team: 'DEN', id: 2985659 },
            { name: 'Tyler Bass', team: 'BUF', id: 3917232 }
        ],
    },
    Nick: {
        name: 'Nick',
        kickers: [
            { name: 'Justin Tucker', team: 'BAL', id: 15683 },
            { name: 'Chase McLaughlin', team: 'TB', id: 3150744 },
            { name: 'Graham Gano', team: 'NYG', id: 12460 },
            { name: 'Matt Prater', team: 'ARI', id: 11122 },
            { name: 'Lucas Havrisik', team: 'BUF', id: 4245661 },
            { name: 'Will Reichard', team: 'MIN', id: 4567104 }
        ],
    },
    Eric: {
        name: 'Eric',
        kickers: [
            { name: 'Brandon Aubrey', team: 'DAL', id: 3953687 },
            { name: 'Cameron Dicker', team: 'LAC', id: 4362081 },
            { name: 'Younghoe Koo', team: 'ATL', id: 3049899 },
            { name: 'Cairo Santos', team: 'CHI', id: 17427 },
            { name: 'Jason Sanders', team: 'MIA', id: 3124679 },
            { name: "Ka'imi Fairbairn", team: 'HOU', id: 2971573 }
        ],
    },
    Geoff: {
        name: 'Geoff',
        kickers: [
            { name: 'Daniel Carlson', team: 'LV', id: 3051909 },
            { name: 'Matt Gay', team: 'IND', id: 4249087 },
            { name: 'Chris Boswell', team: 'PIT', id: 17372 },
            { name: 'Jake Elliott', team: 'PHI', id: 3050478 },
            { name: 'Jason Myers', team: 'SEA', id: 2473037 },
            { name: 'Evan McPherson', team: 'CIN', id: 4360234 }
        ],
    },
    Gavin: {
        name: 'Gavin',
        kickers: [
            { name: 'Eddy Pineiro', team: 'CAR', id: 4034949 },
            { name: 'Cam Little', team: 'JAX', id: 4686361 },
            { name: 'Harrison Butker', team: 'KC', id: 3055899 },
            { name: 'Brayden Narveson', team: 'GB', id: 4361765 },
            { name: 'Blake Grupe', team: 'NO', id: 4259619 },
            { name: 'Nick Folk', team: 'TEN', id: 10621 }
        ],
    },
};

let lastUpdateTime = Date.now();
const updateInterval = 60000; // Update interval in milliseconds (1 minute)

// Base URLs for ESPN APIs
const STATS_API_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes';
const TEAM_PLAYERS_API_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/teams';
const PLAYER_PICTURE_BASE_URL = 'https://a.espncdn.com/i/headshots/nfl/players/full';
const PLAYER_STATUS_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/athletes';
const LIVE_STATS_API_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/athletes';

// Caches to store fetched data
const teamPlayersCache = {}; // { teamAbbreviation: [playerIds] }
const playerStatsCache = {};  // { playerId: { fieldGoals, kickExtraPoints } }

/**
 * Constructs the ESPN profile URL for the player.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @returns {string} - The URL to the player's ESPN profile.
 */
function getPlayerProfileUrl(playerId) {
    return `https://www.espn.com/nfl/player/_/id/${playerId}`;
}

/**
 * Constructs the player image URL.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @returns {string} - The URL to the player's image.
 */
function getPlayerImageUrl(playerId) {
    return `${PLAYER_PICTURE_BASE_URL}/${playerId}.png`;
}

/**
 * Fetches player data including injuries from ESPN API.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @returns {Promise<Object>} - Returns the player data or an empty object if an error occurs.
 */
async function fetchPlayerData(playerId) {
    // Use HTTPS for the URL
    const url = `${PLAYER_STATUS_BASE_URL}/${playerId}?lang=en&region=us`.replace("http://", "https://");
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch player data for ID ${playerId}: ${response.statusText}`);
        }
        const data = await response.json();

        // Fetch injury details if available
        if (data.injuries && data.injuries.length > 0) {
            const injuryDetails = await Promise.all(data.injuries.map(async (injury) => {
                const injuryUrl = injury.$ref.replace("http://", "https://"); // Ensure HTTPS for injury details
                const injuryResponse = await fetch(injuryUrl);
                if (injuryResponse.ok) {
                    return injuryResponse.json();
                } else {
                    console.warn(`Failed to fetch injury data: ${injuryResponse.statusText}`);
                    return null;
                }
            }));
            data.injuries = injuryDetails.filter(injury => injury); // Remove null entries
        }

        return data;
    } catch (error) {
        console.error(`Error fetching player data: ${error}`);
        return {};
    }
}

/**
 * Fetches players from a team and caches the player IDs.
 *
 * @param {string} teamAbbreviation - The team's 2-3 letter abbreviation (e.g., 'DET').
 * @returns {Promise<number[]>} - Returns an array of player IDs.
 */
async function fetchTeamPlayers(teamAbbreviation) {
    if (teamPlayersCache[teamAbbreviation]) {
        return teamPlayersCache[teamAbbreviation];
    }

    const url = `${TEAM_PLAYERS_API_BASE_URL}/${teamAbbreviation}/athletes?limit=200`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch players for team ${teamAbbreviation}: ${response.statusText}`);
        }
        const data = await response.json();

        const playerIds = data.items.map(player => {
            const refUrl = player.$ref;
            const idMatch = refUrl.match(/athletes\/(\d+)/);
            return idMatch ? parseInt(idMatch[1], 10) : null;
        }).filter(id => id !== null);

        teamPlayersCache[teamAbbreviation] = playerIds;
        return playerIds;
    } catch (error) {
        console.error(error);
        teamPlayersCache[teamAbbreviation] = [];
        return [];
    }
}

/**
 * Checks if a player is active on their specified team.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @param {string} teamAbbreviation - The team's 2-3 letter abbreviation.
 * @returns {Promise<boolean>} - Returns true if active, false if released.
 */
async function isPlayerActive(playerId, teamAbbreviation) {
    const teamPlayerIds = await fetchTeamPlayers(teamAbbreviation);
    return teamPlayerIds.includes(playerId);
}

/**
 * Fetches live player statistics using the event log API.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @returns {Promise<Object|null>} - Returns an object with fieldGoals and kickExtraPoints, or null if not available.
 */
async function fetchLivePlayerStats(playerId) {
    const url = `${LIVE_STATS_API_BASE_URL}/${playerId}/eventlog?lang=en&region=us`;
    try {
        console.log(`Fetching live stats for player ID ${playerId} from URL: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch live stats for player ID ${playerId}: ${response.statusText}`);
        }
        const data = await response.json();

        // Corrected line to access events
        const events = (data.events && data.events.items) || [];
        if (events.length === 0) {
            console.warn(`No events found for player ID ${playerId}`);
            return null;
        }

        let totalFieldGoalsMade = 0;
        let totalExtraPointsMade = 0;

        // Iterate over each event
        for (const event of events) {
            console.log(`Processing event for player ID ${playerId}:`, event);

            let statsRefs = [];

            // Check if event.statistics is an array or an object
            if (Array.isArray(event.statistics)) {
                statsRefs = event.statistics.map(stat => stat.$ref);
            } else if (event.statistics && event.statistics.$ref) {
                statsRefs.push(event.statistics.$ref);
            } else {
                console.warn(`No statistics link found in event for player ID ${playerId}`);
                continue;
            }

            // Fetch statistics for each statsRef
            for (const statsRef of statsRefs) {
                if (!statsRef) {
                    console.warn(`Invalid statistics reference for player ID ${playerId}`);
                    continue;
                }

                // Ensure HTTPS in the statsRef URL
                const statsUrl = statsRef.replace('http://', 'https://');

                // Fetch the statistics
                const statsResponse = await fetch(statsUrl);
                if (!statsResponse.ok) {
                    console.warn(`Failed to fetch statistics for player ID ${playerId} in event: ${statsResponse.statusText}`);
                    continue;
                }
                const statsData = await statsResponse.json();
                console.log(`Stats data for player ID ${playerId}:`, statsData);

                // Check if stats are under statsData.stats or statsData.categories
                let statsArray = [];

                if (statsData.stats && Array.isArray(statsData.stats)) {
                    // If statsData.stats exists and is an array, use it
                    statsArray = statsData.stats;
                } else if (statsData.categories && Array.isArray(statsData.categories)) {
                    // If statsData.categories exists, extract stats from each category
                    for (const category of statsData.categories) {
                        if (category.stats && Array.isArray(category.stats)) {
                            statsArray = statsArray.concat(category.stats);
                        }
                    }
                } else if (statsData.splits && Array.isArray(statsData.splits.categories)) {
                    // Handle case where stats are under splits.categories
                    for (const category of statsData.splits.categories) {
                        if (category.stats && Array.isArray(category.stats)) {
                            statsArray = statsArray.concat(category.stats);
                        }
                    }
                } else {
                    console.warn(`No stats found in statsData for player ID ${playerId}`);
                    continue;
                }

                // Look for fieldGoalsMade and extraPointsMade
                for (const stat of statsArray) {
                    if (stat.name === 'fieldGoalsMade') {
                        totalFieldGoalsMade += parseInt(stat.value || 0, 10);
                    } else if (stat.name === 'extraPointsMade') {
                        totalExtraPointsMade += parseInt(stat.value || 0, 10);
                    }
                }
            }
        }

        return { fieldGoals: totalFieldGoalsMade, kickExtraPoints: totalExtraPointsMade };

    } catch (error) {
        console.error(`Error fetching live stats for player ID ${playerId}: ${error.message}`);
        return null;
    }
}


/**
 * Fetches player statistics and caches them.
 *
 * @param {number} playerId - The player's ESPN ID.
 * @returns {Promise<Object>} - Returns an object with fieldGoals and kickExtraPoints.
 */
async function fetchPlayerStats(playerId) {
    if (playerStatsCache[playerId]) {
        return playerStatsCache[playerId];
    }

    // First, try to get live stats
    const liveStats = await fetchLivePlayerStats(playerId);
    if (liveStats) {
        playerStatsCache[playerId] = liveStats;
        return liveStats;
    }

    // If live stats are not available, fall back to the old method
    const url = `${STATS_API_BASE_URL}/${playerId}/statistics?lang=en&region=us`;
    try {
        console.log(`Fetching stats for player ID ${playerId} from URL: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch stats for player ID ${playerId}: ${response.statusText}`);
        }
        const data = await response.json();

        const splits = data.splits || {};
        const categories = splits.categories || [];
        const scoringCategory = categories.find(category => category.name.toLowerCase() === 'scoring');

        if (scoringCategory && scoringCategory.stats) {
            const fieldGoalsStat = scoringCategory.stats.find(stat => stat.name.toLowerCase() === 'fieldgoals');
            const kickExtraPointsStat = scoringCategory.stats.find(stat => stat.name.toLowerCase() === 'kickextrapoints');

            const fieldGoals = fieldGoalsStat ? parseInt(fieldGoalsStat.value || 0, 10) : 0;
            const kickExtraPoints = kickExtraPointsStat ? parseInt(kickExtraPointsStat.value || 0, 10) : 0;

            const stats = { fieldGoals, kickExtraPoints };
            playerStatsCache[playerId] = stats;
            return stats;
        } else {
            console.warn(`No scoring stats found for player ID ${playerId}`);
            const stats = { fieldGoals: 0, kickExtraPoints: 0 };
            playerStatsCache[playerId] = stats;
            return stats;
        }
    } catch (error) {
        console.error(`Error fetching stats for player ID ${playerId}: ${error.message}`);
        return { fieldGoals: null, kickExtraPoints: null, error: true };
    }
}

/**
 * Updates the kicker stats and status in the UI.
 */
async function updateKickerStats() {
    for (const userId in players) {
        const user = players[userId];
        const kickerListElement = document.getElementById(`${userId}-kickers`);
        const playerTotalElement = document.getElementById(`${userId}-total`);
        const loaderElement = document.getElementById(`${userId}-loader`);

        if (!kickerListElement || !playerTotalElement || !loaderElement) {
            console.warn(`Missing HTML elements for user ${userId}`);
            continue;
        }

        loaderElement.style.display = 'block';

        kickerListElement.innerHTML = '';
        let totalPoints = 0;

        for (const kicker of user.kickers) {
            const { name, team, id } = kicker;
            let status = '';
            let fieldGoals = 0;
            let kickExtraPoints = 0;
            let points = 0;
            let injuryStatus = '';
            let returnDate = '';
            const playerImageUrl = getPlayerImageUrl(id);
            const playerProfileUrl = getPlayerProfileUrl(id);

            // Fetch player stats first
            const stats = await fetchPlayerStats(id);
            if (stats && !stats.error) {
                fieldGoals = stats.fieldGoals;
                kickExtraPoints = stats.kickExtraPoints;
                points = (fieldGoals * 3) + (kickExtraPoints * 1);
                status = `${points} pts`;
                totalPoints += points;
                console.log(`Player: ${name}, Field Goals: ${fieldGoals}, Extra Points: ${kickExtraPoints}, Points: ${points}`); // Log points calculation
            } else {
                // If no stats are available or an error occurred
                status = 'No Stats';
            }

            // Fetch player data to check for injury status
            const playerData = await fetchPlayerData(id);
            let isActive = false; // Initialize as false

            if (playerData.injuries && playerData.injuries.length > 0) {
                // If the player has injuries, display injury information
                const injury = playerData.injuries[0];
                injuryStatus = injury.status || 'Injured';
                returnDate = injury.details?.returnDate ? new Date(injury.details.returnDate).toLocaleDateString() : 'Unknown';

                // Construct the status message based on injury details
                status = injuryStatus;
            }

            // Check if the player is active on their team
            isActive = await isPlayerActive(id, team);

            // Create kicker list item
            const listItem = document.createElement('li');
            listItem.classList.add('kicker-item');

            // Apply appropriate classes based on player status
            if (!isActive) {
                listItem.classList.add('released-kicker'); // Apply released class
                if (points > 0) {
                    // If player has points, show points even if released
                    status = `${points} pts (Released)`;
                } else {
                    // If no points, just show as released
                    status = 'Released';
                }
            } else if (injuryStatus) {
                listItem.classList.add('injured-kicker'); // Apply injured class
            } else if (status === 'No Stats') {
                listItem.classList.add('no-stats-kicker'); // Apply no-stats class
                listItem.title = "Player currently hasn't played this season"; // Tooltip for no stats
            }

            // Construct the list item HTML
            const statusClass = injuryStatus ? 'injury' : ''; // Add class for injury status

            listItem.innerHTML = `
                <div class="kicker-info">
                    <img src="${playerImageUrl}" alt="${name}" onerror="this.src='placeholder.jpg'">
                    <div class="kicker-details">
                        <a href="${playerProfileUrl}" target="_blank" class="kicker-name">${name}</a><br>
                        <span class="kicker-team">${team}</span><br>
                        <span class="kicker-stats">FG: ${fieldGoals}, XP: ${kickExtraPoints}</span>
                    </div>
                </div>
                <span class="kicker-status ${statusClass}" title="${returnDate}">${status}</span>
            `;

            kickerListElement.appendChild(listItem);
        }

        user.totalPoints = totalPoints;
        console.log(`User: ${userId}, Calculated Total Points: ${totalPoints}`); // Log total points for each user
        playerTotalElement.textContent = `Total Points: ${totalPoints}`;

        loaderElement.style.display = 'none';
    }

    updatePodium();
}

/**
 * Updates the podium display for the top 3 players.
 */
function updatePodium() {
    const playersArray = Object.values(players);
    playersArray.sort((a, b) => b.totalPoints - a.totalPoints);

    const profilePictures = {
        'Andrew': 'imgs/andrew.webp',
        'Nick': 'imgs/nick.jpg',
        'Eric': 'imgs/eric.jpg',
        'Geoff': 'imgs/geoff.jpg',
        'Gavin': 'imgs/gavin.jpg'
    };

    if (playersArray[0]) {
        document.getElementById('first-place-player').textContent = playersArray[0].name;
        document.getElementById('first-place-points').textContent = `${playersArray[0].totalPoints} pts`;
        document.getElementById('first-place-image').src = profilePictures[playersArray[0].name] || 'imgs/placeholder.png';
    }

    if (playersArray[1]) {
        document.getElementById('second-place-player').textContent = playersArray[1].name;
        document.getElementById('second-place-points').textContent = `${playersArray[1].totalPoints} pts`;
        document.getElementById('second-place-image').src = profilePictures[playersArray[1].name] || 'imgs/placeholder.png';
    }

    if (playersArray[2]) {
        document.getElementById('third-place-player').textContent = playersArray[2].name;
        document.getElementById('third-place-points').textContent = `${playersArray[2].totalPoints} pts`;
        document.getElementById('third-place-image').src = profilePictures[playersArray[2].name] || 'imgs/placeholder.png';
    }
    calculatePredictedPoints();
}

/**
 * Function to calculate predicted points with improved accuracy.
 */
function calculatePredictedPoints() {
    const totalWeeks = 23; // Total number of weeks in the season
    const currentWeek = getCurrentWeek(); // Determine the current week of the season

    console.log(`Current Week: ${currentWeek}`);

    for (const userId in players) {
        const user = players[userId];
        let totalPoints = user.totalPoints || 0;
        let predictedPoints = 0;

        console.log(`User: ${userId}, Total Points: ${totalPoints}`);

        // Calculate average points per week
        const weeksPlayed = currentWeek > 0 ? currentWeek : 1; // Use 1 to avoid division by zero
        const averagePointsPerWeek = totalPoints / weeksPlayed;

        console.log(`User: ${userId}, Weeks Played: ${weeksPlayed}, Average Points Per Week: ${averagePointsPerWeek}`);

        // Predict points for the remaining weeks
        const remainingWeeks = totalWeeks - currentWeek;
        predictedPoints = totalPoints + (averagePointsPerWeek * remainingWeeks);

        console.log(`User: ${userId}, Predicted Points: ${predictedPoints}`);

        // Display predicted points in the UI
        const predictionElement = document.getElementById(`${userId}-prediction`);
        if (predictionElement) {
            predictionElement.textContent = `Projected Season Total: ${Math.round(predictedPoints)}`;

            // Add dynamic color coding based on prediction
            predictionElement.classList.remove('green', 'red', 'accurate');
            if (predictedPoints > totalPoints) {
                predictionElement.classList.add('green');
            } else if (predictedPoints < totalPoints) {
                predictionElement.classList.add('red');
            } else {
                predictionElement.classList.add('accurate');
            }
        }
    }
}

/**
 * Helper function to determine the current week of the season.
 * @returns {number} - The current week number (1-23).
 */
function getCurrentWeek() {
    const today = new Date();
    const weekDates = [
        { start: new Date('2024-09-04'), end: new Date('2024-09-10') },  // Week 1
        { start: new Date('2024-09-11'), end: new Date('2024-09-17') },  // Week 2
        { start: new Date('2024-09-18'), end: new Date('2024-09-24') },  // Week 3
        { start: new Date('2024-09-25'), end: new Date('2024-10-01') },  // Week 4
        { start: new Date('2024-10-02'), end: new Date('2024-10-08') },  // Week 5
        { start: new Date('2024-10-09'), end: new Date('2024-10-15') },  // Week 6
        { start: new Date('2024-10-16'), end: new Date('2024-10-22') },  // Week 7
        { start: new Date('2024-10-23'), end: new Date('2024-10-29') },  // Week 8
        { start: new Date('2024-10-30'), end: new Date('2024-11-05') },  // Week 9
        { start: new Date('2024-11-06'), end: new Date('2024-11-12') },  // Week 10
        { start: new Date('2024-11-13'), end: new Date('2024-11-19') },  // Week 11
        { start: new Date('2024-11-20'), end: new Date('2024-11-26') },  // Week 12
        { start: new Date('2024-11-27'), end: new Date('2024-12-03') },  // Week 13
        { start: new Date('2024-12-04'), end: new Date('2024-12-10') },  // Week 14
        { start: new Date('2024-12-11'), end: new Date('2024-12-17') },  // Week 15
        { start: new Date('2024-12-18'), end: new Date('2024-12-24') },  // Week 16
        { start: new Date('2024-12-25'), end: new Date('2024-12-31') },  // Week 17
        { start: new Date('2025-01-01'), end: new Date('2025-01-07') },  // Week 18
        { start: new Date('2025-01-08'), end: new Date('2025-01-14') },  // Wild Card Round
        { start: new Date('2025-01-15'), end: new Date('2025-01-21') },  // Divisional Round
        { start: new Date('2025-01-22'), end: new Date('2025-01-28') },  // Conference Round
        { start: new Date('2025-01-29'), end: new Date('2025-02-04') },  // Pro Bowl
        { start: new Date('2025-02-05'), end: new Date('2025-02-11') }   // Superbowl LIX
    ];

    // Find the current week
    for (let i = 0; i < weekDates.length; i++) {
        if (today >= weekDates[i].start && today <= weekDates[i].end) {
            return i + 1;
        }
    }

    return 1; // Default to week 1 if current date is before the season starts
}

// Add the updateRefreshTimer function
function updateRefreshTimer() {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    const timeUntilNextUpdate = updateInterval - (timeSinceLastUpdate % updateInterval);
    const secondsUntilNextUpdate = Math.ceil(timeUntilNextUpdate / 1000);
    const refreshTimerElement = document.getElementById('refresh-timer');
    if (refreshTimerElement) {
        refreshTimerElement.textContent = `Next update in: ${secondsUntilNextUpdate} seconds`;
    }
}

// Start the refresh timer interval
setInterval(updateRefreshTimer, 1000); // Update every second
updateRefreshTimer(); // Initialize the timer display

// Call the calculatePredictedPoints function after updating kicker stats
updateKickerStats();
calculatePredictedPoints();

// Optional: Update stats periodically (e.g., every 1 minute)
setInterval(() => {
    updateKickerStats();
    updatePodium();
}, updateInterval);

