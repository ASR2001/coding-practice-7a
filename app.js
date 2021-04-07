const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "./cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (e) {
    console.log(`Error :${e.message}`);
    process.exit(1);
  }
};
initializeDBServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    player_id as playerId,
    player_name as playerName
    FROM
    player_details`;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM
    player_details
    WHERE
    player_id=${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    match_id as matchId,
    match,
    year
    FROM
    match_details
    WHERE
    match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfAPlayer = `
    SELECT
    match_details.match_id as matchId,
    match_details.match,
    match_details.year
    FROM
    match_details join player_match_score 
    on match_details.match_id=player_match_score.match_id
    WHERE
    player_match_score.player_id=${playerId};`;
  const matchDetailsOfAPlayer = await db.all(getMatchesOfAPlayer);
  response.send(matchDetailsOfAPlayer);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfAMatch = `
    SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName
    FROM
    player_details join player_match_score on
    player_details.player_id=player_match_score.player_id
    WHERE
    player_match_score.match_id=${matchId};`;
  const playersOfAMatch = await db.all(getPlayersOfAMatch);
  response.send(playersOfAMatch);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfAPlayer = `
    SELECT 
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(player_match_score.fours) as totalFours,
    SUM(player_match_score.sixes) as totalSixes
    FROM
    player_match_score join player_details
    on player_details.player_id=player_match_score.player_id
    WHERE
    player_details.player_id=${playerId};`;
  const statsOfAPlayer = await db.get(getStatsOfAPlayer);
  response.send(statsOfAPlayer);
});
module.exports = app;
