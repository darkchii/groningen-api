var express = require('express');
var router = express.Router();
const mysql = require('mysql-await');
require('dotenv').config();
var os = require('os');

const connConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DB,
    password: process.env.MYSQL_PASS,
};

router.get('/', async function (req, res, next) {
    const connection = mysql.createConnection(connConfig);
    connection.on('error', (err) => {
        res.json({
            message: 'Unable to connect to database',
            error: err,
        });
    });

    res.json({
        cpu: os.cpus()[0].model,
        ram: {
            total: os.totalmem(),
            free: os.freemem(),
        },
        total_scores: (await connection.awaitQuery(`SELECT COUNT(*) AS total FROM groningen_scores`))[0].total,
        total_users: (await connection.awaitQuery(`SELECT COUNT(*) AS total FROM groningen_user_ids`))[0].total,
        database_size: (await connection.awaitQuery(`SELECT table_schema "osu", Round(Sum(data_length + index_length), 1) "Data Base Size in B" FROM information_schema.tables WHERE table_schema = ?`, [process.env.MYSQL_DB]))[0]['Data Base Size in B'],
        total_beatmaps: (await connection.awaitQuery(`SELECT COUNT(*) AS total FROM beatmap WHERE mode=0`))[0].total,
        ranked_beatmaps: (await connection.awaitQuery(`SELECT COUNT(*) AS total FROM beatmap WHERE mode=0 AND approved=1 OR approved=2`))[0].total,
        loved_beatmaps: (await connection.awaitQuery(`SELECT COUNT(*) AS total FROM beatmap WHERE mode=0 AND approved=4`))[0].total,
    });
    await connection.end();
});

module.exports = router;