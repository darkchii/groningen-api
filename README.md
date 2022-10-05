# groningen-api
A database for groningen players with their scores with an express-based API endpoint

# Endpoint

API returns list (or a single) of users.
This user structure is the following at the moment:

```json
{
  "id": 10153735,
  "added": "2022-10-04T06:40:20.000Z",
  "note": "Developer",
  "is_fetched": 1,
  "city": "Veendam",
  "is_groningen": 1,
  "profile": { // osu profile data from their API endpoint, updated roughly every 20 minutes, unless configured different
    "osu_id": 10153735,
    "username": "boob enjoyer",
    "join_date": "2017-05-04T21:05:02.000Z",
    "level": 100.42,
    "pp_rank": 120130,
    "pp": 3678.81,
    "ranked_score": 40785019782,
    "hit_accuracy": 98.8662,
    "play_count": 65859,
    "play_time": 3554116,
    "total_score": 69551047633,
    "total_hits": 8684664,
    "maximum_combo": 5186,
    "replays_watched": 54,
    "is_ranked": 1,
    "count_ss": 10515,
    "count_ssh": 1000,
    "count_s": 2690,
    "count_sh": 500,
    "count_a": 742,
    "country_rank": 1386
  },
  "statistics": { // these are based on the ENTIRE list of scores, not profile data
    "grade_total_ss": 11527,
    "grade_ss": 10527,
    "grade_ssh": 1000,
    "grade_total_s": 3204,
    "grade_s": 2704,
    "grade_sh": 500,
    "grade_a": 751,
    "grade_b": 514,
    "grade_c": 179,
    "grade_d": 24,
    "clears": 16199,
    "total_pp": 601855.0872112021
  },
  "ranking": { // ranking position of the user
    "grade_total_ss": 1,
    "grade_ssh": 1,
    "grade_ss": 1,
    "grade_total_s": 1,
    "grade_sh": 1,
    "grade_s": 1,
    "grade_a": 2,
    "grade_b": 2,
    "grade_c": 2,
    "grade_d": 2,
    "total_pp": 2
  }
}
```

`/api/users/{id}`
Returns the above object with the specific user data. (https://darkchii.nl/groningen/api/users/10153735)

`/api/users`
Returns a list of all players, each using the structure above. (https://darkchii.nl/groningen/api/users)

*Add `groningen_only=true` query parameter to the url to filter groningen-only players.*


The `statistics` and `ranking` objects are based on every single **top** score on beatmaps. At first they are all fetched from their most played beatmaps list, then it's based on recent plays checked every 20 minutes (or whatever is configured).

The first part of the score fetching can take up to 5 hours, depending on the amount of maps this players has played.

Unlike osu!alternative, this does not run concurrently, due to the use of a single oauth token, instead of each user using their own. So every new user added is another ~5 hours added to the fetcher.


Todo list:

- [ ] Fix `null` pp scores from recent played
- [ ] Add endpoint or something to register new players
