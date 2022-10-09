# groningen-api
A database for groningen players with their scores with an express-based API endpoint

# Endpoint

API returns list (or a single) of users.
This user structure is the following at the moment:

```json
{
  "id": 13674823,
  "username": "Lionz",
  "added": "2022-10-04T07:30:45.000Z",
  "note": null,
  "is_fetched": 1,
  "city": null,
  "is_groningen": 1,
  "color": null,
  "osu_id": 13674823,
  "join_date": "2018-12-30T15:59:28.000Z",
  "level": 100.08,
  "pp_rank": 1963,
  "pp": 10222.7,
  "ranked_score": 10132502711,
  "hit_accuracy": 98.5477,
  "play_count": 43779,
  "play_time": 1762324,
  "total_score": 35269997951,
  "total_hits": 6082804,
  "maximum_combo": 3548,
  "replays_watched": 65,
  "is_ranked": 1,
  "count_ss": 47,
  "count_ssh": 6,
  "count_s": 369,
  "count_sh": 66,
  "count_a": 366,
  "country_rank": 32
},
```

`/api/users/{id}`
Returns the above object with the specific user data. (https://darkchii.nl/groningen/api/users/10153735)

`/api/users`
Returns a list of all players, each using the structure above. (https://darkchii.nl/groningen/api/users)

**Parameters**
- `groningen_only=true` - Filter to output only users from the province of Groningen, this is `true` by default
- `sorter=pp` - Sort by a certain column, works on all numeric values and city column
- Example: `https://darkchii.nl/groningen/api/users?sorter=pp`



The `statistics` and `ranking` objects are based on every single **top** score on beatmaps. At first they are all fetched from their most played beatmaps list, then it's based on recent plays checked every 20 minutes (or whatever is configured).

The first part of the score fetching can take up to 5 hours, depending on the amount of maps this players has played.

Unlike osu!alternative, this does not run concurrently, due to the use of a single oauth token, instead of each user using their own. So every new user added is another ~5 hours added to the fetcher.


Todo list:

- [ ] Fix `null` pp scores from recent played
- [ ] Add endpoint or something to register new players
