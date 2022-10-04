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

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const connection = mysql.createConnection(connConfig);
  connection.on('error', (err) => {
    res.json({
      message: 'Unable to connect to database',
      error: err,
    });
  });
  const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids`);
  res.json(result);
  await connection.end();
});

module.exports = router;

router.get('/:id', async function(req, res, next){
  const connection = mysql.createConnection(connConfig);
  connection.on('error', (err) => {
    res.json({
      message: 'Unable to connect to database',
      error: err,
    });
  });
  const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids a INNER JOIN groningen_users b ON a.id = b.osu_id WHERE id = ?`, [req.params.id]);
  res.json(result);
  await connection.end();
});
