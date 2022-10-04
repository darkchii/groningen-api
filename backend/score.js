class OsuScore {
    constructor(score){
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
}

module.exports = OsuScore;