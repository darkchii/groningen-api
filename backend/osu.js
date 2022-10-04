require('dotenv').config();
const axios = require('axios').default;

let stored_token = null;
let refetch_token = null;

async function Login(client_id, client_secret) {
    const data = {
        client_id,
        client_secret,
        grant_type: 'client_credentials',
        scope: 'public',
    };

    try {
        const res = await axios.post('https://osu.ppy.sh/oauth/token', data);
        return res.data.access_token;
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function AuthorizedApiCall(url, type = 'get', api_version = null) {
    if (stored_token === null || refetch_token === null || refetch_token < Date.now()) {
        stored_token = await Login(process.env.OSU_CLIENT_ID, process.env.OSU_CLIENT_SECRET);
        refetch_token = Date.now() + 3600000;
        console.log('new token');
    }

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${stored_token}`,
        // 'x-api-version': 20220704
    };
    if (api_version != null) {
        headers['x-api-version'] = api_version;
    }

    let res;

    switch (type) {
        case 'get':
            res = await axios.get(url, {
                headers
            });
            break;
        case 'post':
            res = await axios.post(url, {
                headers
            });
            break;
    }

    return res;
}

module.exports.GetUser = GetUser;
async function GetUser(username, mode = 'osu', key = 'username') {
    const res = await AuthorizedApiCall(`https://osu.ppy.sh/api/v2/users/${username}/${mode}?key=${key}`);
    try {
        return res.data;
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports.GetUserRecent = GetUserRecent;
async function GetUserRecent(user_id, mode = 'osu', include_fails = false, limit = 100) {
    const res = await AuthorizedApiCall(`https://osu.ppy.sh/api/v2/users/${user_id}/scores/recent?include_fails=${include_fails}&mode=${mode}&limit=${limit}`);
    try {
        return res.data;
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports.GetBeatmaps = GetBeatmaps;
async function GetBeatmaps() {
    const response = await axios.get("https://osu.respektive.pw/beatmaps");
    const beatmaps = response.data;
    return beatmaps.ranked.beatmaps.concat(beatmaps.loved.beatmaps);
}

const mods_enum = {
    "": 0,
    "NF": 1,
    "EZ": 2,
    "TD": 4,
    "HD": 8,
    "HR": 16,
    "SD": 32,
    "DT": 64,
    "RX": 128,
    "HT": 256,
    "NC": 512,
    "FL": 1024,
    "AT": 2048,
    "SO": 4096,
    "AP": 8192,
    "PF": 16384,
    "4K": 32768,
    "5K": 65536,
    "6K": 131072,
    "7K": 262144,
    "8K": 524288,
    "FI": 1048576,
    "RD": 2097152,
    "LM": 4194304,
    "9K": 16777216,
    "10K": 33554432,
    "1K": 67108864,
    "3K": 134217728,
    "2K": 268435456,
    "V2": 536870912
}

module.exports.getModsEnum = getModsEnum;
function getModsEnum(mods) {
    let n = 0;
    if (mods.includes("NC")) {
        mods.push("DT")
    }
    if (mods.includes("PF")) {
        mods.push("SD")
    }
    for (let i = 0; i < mods.length; i++) {
        n += mods_enum[mods[i]];
    }
    return n;
}