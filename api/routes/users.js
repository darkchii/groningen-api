var express = require('express');
var router = express.Router();
const mysql = require('mysql-await');
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
router.get('/', async function (req, res, next) {
  const connection = mysql.createConnection(connConfig);
  connection.on('error', (err) => {
    res.json({
      message: 'Unable to connect to database',
      error: err,
    });
  });
  const query = buildQuery(req.query);
  let result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids INNER JOIN groningen_users ON groningen_users.osu_id = groningen_user_ids.id ${req.query.groningen_only === 'true' ? `WHERE is_groningen = 1` : ''}`);

  if (req.query.sorter !== undefined) {
    switch (req.query.sorter) {
      case 'clears':
        result = result.sort((a, b) => {
          return (b.count_ssh + b.count_ss + b.count_sh + b.count_s + b.count_a) - (a.count_ssh + a.count_ss + a.count_sh + a.count_s + a.count_a);
        });
        break;
      case 'total_ss':
        result = result.sort((a, b) => {
          return (b.count_ssh + b.count_ss) - (a.count_ssh + a.count_ss);
        });
        break;
      case 'total_s':
        result = result.sort((a, b) => {
          return (b.count_sh + b.count_s) - (a.count_sh + a.count_s);
        });
        break;
      case 'city':
        result = result.sort((a, b) => {
          return ('' + b.city).localeCompare(a.city);
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