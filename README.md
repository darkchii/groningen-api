# groningen-api
A database for groningen players with their scores with an express-based API endpoint

# Getting started

Running the entire thing has a bit of a complex start due to the configuration required to be done.

## Cloning project

Clone this project into a dedicated folder.

For every directory, run `npm i` to install the dependencies.

### API
The following happens in the ./api/ directory.

- Create a .env file with the following content:
```
NODE_ENV=development
MYSQL_USER="user"
MYSQL_PASS="password"
MYSQL_HOST="host"
MYSQL_DB="db"
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=""
PORT=3727
```

### Backend
The following happens in the ./backend/ directory.

- Create a .env file with the following content:
```
NODE_ENV=development
MYSQL_USER=""
MYSQL_PASS=""
MYSQL_HOST=""
MYSQL_DB=""
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=""
USER_FETCH_INTERVAL=1200000
```

`USER_FETCH_INTERVAL` is in milliseconds

### Frontend
The following happens in the ./frontend/ directory.

Open ./src/helpers.js, and correct the API url to whatever you use.

## SQL

### Tables

- groningen_scores
- - These are automatically populated with every single top score from tracked players
- groningen_user_ids
- - This contains the tracked users. You only need to enter the ID, the rest is optional. The username and added columns are automatically filled in.
- - `'10153735', 'boob enjoyer', '2022-10-04 08:40:20', 'Developer, Femboy', '1', 'Muntendam', '1', 'FF66AA'`
- groningen_users
- - This stores current osu user data, this is done automatically by the backend module

### Import

```
CREATE TABLE `groningen_scores` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `beatmap_id` bigint(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `max_combo` bigint(20) DEFAULT NULL,
  `mode` varchar(45) DEFAULT NULL,
  `mods` varchar(45) DEFAULT NULL,
  `pp` float DEFAULT NULL,
  `rank` varchar(45) DEFAULT NULL,
  `score` bigint(20) DEFAULT NULL,
  `count_300` bigint(20) DEFAULT NULL,
  `count_100` bigint(20) DEFAULT NULL,
  `count_50` bigint(20) DEFAULT NULL,
  `count_miss` bigint(20) DEFAULT NULL,
  `count_geki` bigint(20) DEFAULT NULL,
  `count_katu` bigint(20) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

```
CREATE TABLE `groningen_user_ids` (
  `id` int(11) NOT NULL,
  `username` varchar(45) DEFAULT NULL,
  `added` datetime DEFAULT current_timestamp(),
  `note` varchar(45) DEFAULT NULL,
  `is_fetched` tinyint(4) DEFAULT 0,
  `city` varchar(45) DEFAULT NULL,
  `is_groningen` tinyint(4) DEFAULT 1,
  `color` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

```
CREATE TABLE `groningen_users` (
  `osu_id` bigint(20) NOT NULL,
  `username` varchar(45) DEFAULT NULL,
  `join_date` datetime DEFAULT NULL,
  `level` float DEFAULT NULL,
  `pp_rank` bigint(20) DEFAULT NULL,
  `pp` float DEFAULT NULL,
  `ranked_score` bigint(20) DEFAULT NULL,
  `hit_accuracy` float DEFAULT NULL,
  `play_count` int(11) DEFAULT NULL,
  `play_time` bigint(20) DEFAULT NULL,
  `total_score` bigint(20) DEFAULT NULL,
  `total_hits` bigint(20) DEFAULT NULL,
  `maximum_combo` bigint(20) DEFAULT NULL,
  `replays_watched` bigint(20) DEFAULT NULL,
  `is_ranked` tinyint(4) DEFAULT NULL,
  `count_ss` bigint(20) DEFAULT NULL,
  `count_ssh` bigint(20) DEFAULT NULL,
  `count_s` bigint(20) DEFAULT NULL,
  `count_sh` bigint(20) DEFAULT NULL,
  `count_a` bigint(20) DEFAULT NULL,
  `country_rank` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`osu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

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

- [x] Fix `null` pp scores from recent played
- [ ] Add endpoint or something to register new players
