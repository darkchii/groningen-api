const moment = require('moment/moment');
const { getModsEnum } = require("./osu");

class OsuScore {
    constructor(score) {
        this.beatmap_id = score.beatmap.id;
        this.user_id = score.user_id;
        this.id = score.id;
        this.created_at = score.created_at;
        this.max_combo = score.max_combo;
        this.best_id = score.best_id;
        this.mode = score.mode;
        this.mods = score.mods;
        this.pp = score.pp;
        this.rank = score.rank;
        this.score = score.score;
        this.count_100 = score.statistics.count_100;
        this.count_300 = score.statistics.count_300;
        this.count_50 = score.statistics.count_50;
        this.count_miss = score.statistics.count_miss;
        this.count_geki = score.statistics.count_geki;
        this.count_katu = score.statistics.count_katu;
        this.count_miss = score.statistics.count_miss;
        this.type = score.type;
    }

    getQuery() {
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
            `${this.user_id}-${this.beatmap_id}`,
            this.user_id,
            this.beatmap_id,
            `${moment(this.created_at).format('YYYY-MM-DD HH:mm:ss')}`,
            this.max_combo,
            this.mode,
            getModsEnum(this.mods),
            this.pp,
            this.rank,
            this.score,
            this.count_300,
            this.count_100,
            this.count_50,
            this.count_miss,
            this.count_geki,
            this.count_katu,
            this.type
        ];

        return { query: query, queryValues: queryValues };
    }
}

module.exports = OsuScore;