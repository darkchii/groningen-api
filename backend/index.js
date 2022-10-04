const moment = require('moment/moment');
const mysql = require('mysql-await');
const { GetUser, GetBeatmaps, GetUserRecent, getModsEnum, GetUserBeatmapScore, GetUserMostPlayed } = require('./osu');
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

        for await (const row of result) {
            await updateUser(connection, row.id);
            await updateScores(connection, row.id);
            await sleep(1000);
        }

        await connection.end();
        await sleep(process.env.USER_FETCH_INTERVAL);
    }
}

// adds EVERY score of a user to the database
async function fetcher() {
    while (true) {
        //const beatmaps = await GetBeatmaps();
        const connection = mysql.createConnection(connConfig);
        const result = await connection.awaitQuery(`SELECT * FROM groningen_user_ids`);

        for await (const row of result) {
            if (row.is_fetched === 1) {
                continue;
            }
            const beatmaps = [];
            let offset = 0;
            console.log(`Started fetching scores for ${row.id}`);
            while (true) {
                const _beatmaps = await GetUserMostPlayed(row.id, 'osu', 100, offset);
                if (_beatmaps.length === 0) {
                    break;
                }
                beatmaps.push(..._beatmaps);
                offset += 100;
                console.log(`Added beatmap range ${offset - 100} - ${offset} for user ${row.id}`);
            }
            console.log(`Checking ${beatmaps.length} beatmaps for ${row.id}`);
            await fetchUser(row.id, beatmaps);
            console.log(`Finished fetching scores for ${row.id}`);
            await connection.awaitQuery(`UPDATE groningen_user_ids SET is_fetched = 1 WHERE id = ${row.id}`);
        }
        await connection.end();
        await sleep(process.env.SCORE_FETCH_INTERVAL);
    }
}

async function fetchUser(id, beatmaps, reattempt = 0, counter = 0) {
    if (reattempt > 5) {
        console.log(`Failed to fetch scores for user ${id}`);
        return;
    }
    const failed = [];
    for await (const beatmap of beatmaps) {
        let score;
        try {
            const res = await GetUserBeatmapScore(id, beatmap);
            score = new OsuScore(res.score);
        } catch (e) {
            score = { "error": "null" }
        }
        if (score.error !== 'null') {
            try {
                const connection = mysql.createConnection(connConfig);
                insertScore(connection, score);
                await connection.end();
            } catch (e) {
                failed.push(beatmap);
                continue;
            }
        }
        counter++;
        console.log(`Score fetcher for ${id}: ${counter}/${beatmaps.length}`);
    }

    if (failed.length > 0) {
        await fetchUser(id, failed, reattempt + 1, counter);
    }
}

function main() {
    fetcher();
    //looper();
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
            insertScore(connection, score);
            // console.log(`${id}: Inserted or updated score ${score.id}`);
            // console.log(result);
        });
    }
}

async function insertScore(connection, score) {
    const score_query = score.getQuery();
    const result = await connection.awaitQuery(score_query.query, score_query.queryValues);
}