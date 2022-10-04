const moment = require('moment/moment');
const mysql = require('mysql-await');
const { GetUser } = require('./osu');
require('dotenv').config();

const connConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DB,
    password: process.env.MYSQL_PASS,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function looper() {
    while (true) {
        // console.log('looping');
        const connection = mysql.createConnection(connConfig);
        const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids`);

        for await(const row of result){
            await updateUser(connection, row.id);
            await sleep(1000);
        }

        await connection.end();
        await sleep(process.env.USER_FETCH_INTERVAL);
    }
}
looper();

async function updateUser(connection, id){
    // console.log('updating user ' + id);
    const osu_user = await GetUser(id, 'osu', 'id');
    // console.log(osu_user);

    const query = `INSERT INTO groningen_users (
        osu_id,
        username,
        join_date,
        level,
        pp_rank,
        pp,
        ranked_score,
        hit_accuracy,
        play_count,
        play_time,
        total_score,
        total_hits,
        maximum_combo,
        replays_watched,
        is_ranked,
        count_ss,
        count_ssh,
        count_s,
        count_sh,
        count_a,
        country_rank
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        join_date = VALUES(join_date),
        level = VALUES(level),
        pp_rank = VALUES(pp_rank),
        pp = VALUES(pp),
        ranked_score = VALUES(ranked_score),
        hit_accuracy = VALUES(hit_accuracy),
        play_count = VALUES(play_count),
        play_time = VALUES(play_time),
        total_score = VALUES(total_score),
        total_hits = VALUES(total_hits),
        maximum_combo = VALUES(maximum_combo),
        replays_watched = VALUES(replays_watched),
        is_ranked = VALUES(is_ranked),
        count_ss = VALUES(count_ss),
        count_ssh = VALUES(count_ssh),
        count_s = VALUES(count_s),
        count_sh = VALUES(count_sh),
        count_a = VALUES(count_a),
        country_rank = VALUES(country_rank)`;

    const queryValues = [
        osu_user.id,
        osu_user.username,
        `${moment(osu_user.join_date).format('YYYY-MM-DD HH:mm:ss')}`,
        osu_user.statistics.level.current+(osu_user.statistics.level.progress*0.01),
        osu_user.statistics.global_rank,
        osu_user.statistics.pp,
        osu_user.statistics.ranked_score,
        osu_user.statistics.hit_accuracy,
        osu_user.statistics.play_count,
        osu_user.statistics.play_time,
        osu_user.statistics.total_score,
        osu_user.statistics.total_hits,
        osu_user.statistics.maximum_combo,
        osu_user.statistics.replays_watched_by_others,
        osu_user.statistics.is_ranked,
        osu_user.statistics.grade_counts.ss,
        osu_user.statistics.grade_counts.ssh,
        osu_user.statistics.grade_counts.s,
        osu_user.statistics.grade_counts.sh,
        osu_user.statistics.grade_counts.a,
        osu_user.statistics.country_rank
    ];

    const result = await connection.awaitQuery(query, queryValues);
    console.log(result);
}