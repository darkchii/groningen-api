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
  const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids ${req.query.groningen_only ? `WHERE is_groningen = 1` : ''}`);
  for await(let user of result){
    user.statistics = await getUserStats(connection, user.id, query);
  };
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
  }
  res.json(user);
  await connection.end();
});

async function getUserStats(connection, user_id, query){
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