const moment = require('moment/moment');
const mysql = require('mysql-await');
const { GetUser, GetBeatmaps, GetUserRecent, getModsEnum } = require('./osu');
const OsuScore = require('./score');
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

        for await (const row of result) {
            await updateUser(connection, row.id);
            await updateScores(connection, row.id);
            await sleep(1000);
        }

        await connection.end();
        await sleep(process.env.USER_FETCH_INTERVAL);
    }
}

function main() {
    (async () => {
        console.log(await GetBeatmaps());
    })();
    looper();
}
main();

async function updateUser(connection, id) {
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

    const result = await connection.awaitQuery(query, queryValues);
    // console.log(result);
    console.log(`Inserted or updated user ${osu_user.username}`);
}

async function updateScores(connection, id) {
    const _scores = await GetUserRecent(id);
    const scores = _scores.map(score => {
        return new OsuScore(score);
    });

    if (scores.length > 0) {
        scores.filter(score => score.best_id === null);

        scores.forEach(async score => {
            const query = `INSERT INTO groningen_scores (
                id, user_id, beatmap_id, created_at, max_combo, mode, mods, pp, rank, score, count_300, count_100, count_50, count_miss, count_geki, count_katu, type
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
                id = VALUES(id),
                user_id = VALUES(user_id),
                beatmap_id = VALUES(beatmap_id),
                created_at = VALUES(created_at),
                max_combo = VALUES(max_combo),
                mode = VALUES(mode),
                mods = VALUES(mods),
                pp = VALUES(pp),
                rank = VALUES(rank),
                score = VALUES(score),
                count_300 = VALUES(count_300),
                count_100 = VALUES(count_100),
                count_50 = VALUES(count_50),
                count_miss = VALUES(count_miss),
                count_geki = VALUES(count_geki),
                count_katu = VALUES(count_katu),
                type = VALUES(type)`;

            const queryValues = [
                score.id,
                score.user_id,
                score.beatmap_id,
                `${moment(score.created_at).format('YYYY-MM-DD HH:mm:ss')}`,
                score.max_combo,
                score.mode,
                getModsEnum(score.mods),
                score.pp,
                score.rank,
                score.score,
                score.count_300,
                score.count_100,
                score.count_50,
                score.count_miss,
                score.count_geki,
                score.count_katu,
                score.type
            ];

            const result = await connection.awaitQuery(query, queryValues);
            // console.log(result);
        });
    }

}