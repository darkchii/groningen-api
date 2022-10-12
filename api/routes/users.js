var express = require('express');
var router = express.Router();
const mysql = require('mysql-await');
var cacheService = require("express-api-cache");
var cache = cacheService.cache;

require('dotenv').config();

const connConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DB,
  password: process.env.MYSQL_PASS,
};

function buildQuery(params) {
  let query = ``;
  let queryVars = [];

  if (params.mode) {
    query += ` AND mode = ?`;
    queryVars.push(params.mode);
  }

  return [query, queryVars];
}

/* GET users listing. */
router.get('/', cache("5 minutes"), async function (req, res, next) {
  const connection = mysql.createConnection(connConfig);
  connection.on('error', (err) => {
    res.json({
      message: 'Unable to connect to database',
      error: err,
    });
  });
  const query = buildQuery(req.query);
  const selector = `
  DISTINCT(groningen_user_ids.id) as id, groningen_users.username as username, added, note, is_fetched, city, is_groningen, color,
  osu_id, join_date, level, pp_rank, groningen_users.pp as pp, ranked_score, hit_accuracy, play_count, play_time, total_score, total_hits, maximum_combo, replays_watched, is_ranked, country_rank, 
  scores.total_pp, scores.clears, (scores.count_ss+scores.count_ssh) as total_ss, scores.count_ssh, scores.count_ss, (scores.count_s+scores.count_sh) as total_s, scores.count_sh, scores.count_s, scores.count_a, scores.count_b, scores.count_c, scores.count_d,
  scores.latest_activity
  `;
  let result = await connection.awaitQuery(`
    SELECT ${selector} FROM groningen_user_ids 
    INNER JOIN groningen_users ON groningen_users.osu_id = groningen_user_ids.id 
    LEFT OUTER JOIN (
      SELECT 
        user_id, 
        sum(pp) as total_pp, 
        count(*) as clears,
        count(case when rank = 'XH' then 1 end) as count_ssh,
        count(case when rank = 'X' then 1 end) as count_ss,
        count(case when rank = 'SH' then 1 end) as count_sh,
        count(case when rank = 'S' then 1 end) as count_s,
        count(case when rank = 'A' then 1 end) as count_a,
        count(case when rank = 'B' then 1 end) as count_b,
        count(case when rank = 'C' then 1 end) as count_c,
        count(case when rank = 'D' then 1 end) as count_d,
        MAX(created_at) as latest_activity
        FROM groningen_scores
        GROUP BY user_id
      ) AS scores ON scores.user_id = groningen_user_ids.id
    ${req.query.groningen_only === 'true' ? `WHERE is_groningen = 1` : ''}`);

  if (result.length > 0) {
    for await (let user of result) {
      let scores = await connection.awaitQuery(`
        SELECT pp FROM groningen_scores LEFT JOIN beatmap ON beatmap.beatmap_id = groningen_scores.beatmap_id WHERE user_id = ? AND (approved = 1 OR approved = 2) ORDER BY pp DESC LIMIT 1000
        `, [user.id]);
      let weighted_pp = 0;
      scores.forEach((score, index) => {
        weighted_pp += (score.pp * (0.95 ** index));
      });
      user.weighted_pp = weighted_pp + (416.6667 * (1 - Math.pow(0.9994, user.clears)));
    }
  }

  if (req.query.sorter !== undefined) {
    switch (req.query.sorter) {
      case 'city':
        result = result.sort((a, b) => {
          if (a.city === null) return 1;
          if (b.city === null) return -1;
          return ('' + b.city).localeCompare(a.city);
        });
        break;
      case 'pp':
        result = result.sort((a, b) => {
          return (b.pp===0 ? b.weighted_pp : b.pp) - (a.pp===0 ? a.weighted_pp : a.pp);
        });
        break;
      default:
        result = result.sort((a, b) => {
          return b[req.query.sorter] - a[req.query.sorter];
        });
        break;
    }
  }

  res.json(result);
  await connection.end();
});

module.exports = router;

router.get('/:id', async function (req, res, next) {
  const connection = mysql.createConnection(connConfig);
  connection.on('error', (err) => {
    res.json({
      message: 'Unable to connect to database',
      error: err,
    });
  });
  const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids WHERE id = ?`, [req.params.id]);
  let user = null;
  if (result.length > 0) {
    user = result[0];
    const builtQuery = buildQuery(req.query);
    const osu_user = await connection.awaitQuery(`SELECT * FROM groningen_users WHERE osu_id = ?`, [req.params.id]);
    user.profile = osu_user.length > 0 ? osu_user[0] : null;

    let statistics = null;
    if (user.profile !== null) {
      statistics = await getUserStats(connection, req.params.id, builtQuery);
    }
    user.statistics = statistics;
    user.ranking = await getUserRanking(connection, req.params.id, builtQuery, null, req.query.groningen_only);
  }
  res.json(user);
  await connection.end();
});

async function getUserRanking(connection, user_id, query, users = null, groningen_only = true) {
  if (users === null) {
    users = await connection.awaitQuery(`SELECT * FROM groningen_user_ids ${groningen_only ? `WHERE is_groningen = 1` : ''}`);
    for await (let user of users) {
      user.statistics = await getUserStats(connection, user.id, query);
    }
  }

  const ranking = {
    grade_total_ss: users.sort((a, b) => { return b.statistics.grade_total_ss - a.statistics.grade_total_ss }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_ssh: users.sort((a, b) => { return b.statistics.grade_ss - a.statistics.grade_ss }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_ss: users.sort((a, b) => { return b.statistics.grade_ssh - a.statistics.grade_ssh }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_total_s: users.sort((a, b) => { return b.statistics.grade_total_ss - a.statistics.grade_total_ss }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_sh: users.sort((a, b) => { return b.statistics.grade_s - a.statistics.grade_s }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_s: users.sort((a, b) => { return b.statistics.grade_sh - a.statistics.grade_sh }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_a: users.sort((a, b) => { return b.statistics.grade_a - a.statistics.grade_a }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_b: users.sort((a, b) => { return b.statistics.grade_b - a.statistics.grade_b }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_c: users.sort((a, b) => { return b.statistics.grade_c - a.statistics.grade_c }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_d: users.sort((a, b) => { return b.statistics.grade_d - a.statistics.grade_d }).findIndex((user) => { return user.id == user_id }) + 1,
    total_pp: users.sort((a, b) => { return b.statistics.total_pp - a.statistics.total_pp }).findIndex((user) => { return user.id == user_id }) + 1,
  }
  return ranking;
}

async function getUserStats(connection, user_id, query) {
  return {
    grade_total_ss: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'X' OR rank = 'XH') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_ss: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'X') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_ssh: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'XH') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_total_s: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'S' OR rank = 'SH') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_s: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'S') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_sh: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'SH') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_a: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'A') ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_b: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'B')${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_c: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'C')${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    grade_d: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? AND (rank = 'D')${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    clears: (await connection.awaitQuery(`SELECT count(*) FROM groningen_scores WHERE user_id = ? ${query[0]}`, [user_id, ...query[1]]))[0]['count(*)'],
    total_pp: (await connection.awaitQuery(`SELECT sum(pp) FROM groningen_scores WHERE user_id = ? ${query[0]}`, [user_id, ...query[1]]))[0]['sum(pp)'],
  };
}