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
  DISTINCT(groningen_user_ids.id) as id, groningen_users.username as username, added, note, is_fetched, city, is_groningen, color, is_restricted,
  osu_id, join_date, level, pp_rank, pp, ranked_score, hit_accuracy, play_count, play_time, total_score, total_hits, maximum_combo, replays_watched, is_ranked, country_rank,
  (count_ssh+count_ss+count_sh+count_s+count_a) as clears, (count_ssh+count_ss) as total_ss, (count_sh+count_sh) as total_s, count_ssh, count_ss, count_sh, count_s, count_a
  `;
  let result = await connection.awaitQuery(`
    SELECT ${selector} FROM groningen_user_ids 
    INNER JOIN groningen_users ON groningen_users.osu_id = groningen_user_ids.id WHERE id = id 
    ${req.query.groningen_only === 'true' ? `AND is_groningen = 1` : ''} ${req.query.show_restricted === 'false' || req.query.show_restricted === undefined ? `AND is_restricted = 0` : ''}`);

  if (req.query.sorter !== undefined) {
    switch (req.query.sorter) {
      case 'city':
        result = result.sort((a, b) => {
          if (a.city === null) return 1;
          if (b.city === null) return -1;
          return ('' + b.city).localeCompare(a.city);
        });
        break;
      default:
        result = result.sort((a, b) => {
          if(a[req.query.sorter] === null) return -1;
          if(b[req.query.sorter] === null) return 1;
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
    user.ranking = await getUserRanking(connection, req.params.id, builtQuery, null, req.query.groningen_only, req.query.show_restricted);
  }
  res.json(user);
  await connection.end();
});

async function getUserRanking(connection, user_id, query, users = null, groningen_only = true, show_restricted = false) {
  if (users === null) {
    users = await connection.awaitQuery(`SELECT * FROM groningen_user_ids INNER JOIN groningen_users ON groningen_users.osu_id = groningen_user_ids.id ${groningen_only ? `WHERE is_groningen = 1` : ''} ${req.query.show_restricted!=='true' ? `WHERE is_restricted = 0` : ''}`);
  }

  const ranking = {
    grade_total_ss: users.sort((a, b) => { return (b.count_ssh + b.count_ss) - (a.count_ssh + a.count_ss) }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_ssh: users.sort((a, b) => { return b.count_ssh - a.count_ssh }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_ss: users.sort((a, b) => { return b.count_ss - a.count_ss }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_total_s: users.sort((a, b) => { return (b.count_sh + b.count_s) - (a.count_sh + a.count_s) }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_sh: users.sort((a, b) => { return b.count_sh - a.count_sh }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_s: users.sort((a, b) => { return b.count_s - a.count_s }).findIndex((user) => { return user.id == user_id }) + 1,
    grade_a: users.sort((a, b) => { return b.count_a - a.count_a }).findIndex((user) => { return user.id == user_id }) + 1,
  }
  return ranking;
}