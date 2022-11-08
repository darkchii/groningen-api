const moment = require('moment/moment');
const mysql = require('mysql-await');
const { GetUser } = require('./osu');
const OsuScore = require('./score');
require('dotenv').config();

const connConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DB,
    password: process.env.MYSQL_PASS,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

//updates user profile and recent plays
async function looper() {
    while (true) {
        // console.log('looping');
        const connection = mysql.createConnection(connConfig);
        const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids`);
        const restrict_check = (await GetUser('peppy', 'string', 'username')) !== null;

        for await (const row of result) {
            await updateUser(connection, row.id, restrict_check);
            await sleep(1000);
        }

        await connection.end();
        await sleep(process.env.USER_FETCH_INTERVAL);
    }
}

function main() {
    looper();
}
main();

let restrict_check_data = [];

async function updateUser(connection, id, restrict_check = false) {
    // console.log('updating user ' + id);
    const osu_user = await GetUser(id, 'osu', 'id');
    // console.log(osu_user);

    if (osu_user === null) {
        if(restrict_check){
            if(restrict_check_data[id] === undefined){
                restrict_check_data[id] = 0;
            }
            restrict_check_data[id]++;

            if(restrict_check_data[id] > 5){
                await connection.awaitQuery(`UPDATE groningen_user_ids SET is_restricted = 1 WHERE id = ${id}`);
                console.log(`user ${id} is restricted, updated accordingly`);
            }
        }
        return;
    }

    restrict_check_data[id] = 0;

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
        osu_user.statistics.level.current + (osu_user.statistics.level.progress * 0.01),
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

    const _query = `UPDATE groningen_user_ids SET username = '${osu_user.username}', is_restricted = 0 WHERE id = ${osu_user.id}`;

    const result = await connection.awaitQuery(query, queryValues);
    const _result = await connection.awaitQuery(_query);
    // console.log(result);
    console.log(`Inserted or updated user ${osu_user.username}`);
}
