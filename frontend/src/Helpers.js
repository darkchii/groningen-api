import axios from "axios";

export function getApiUrl(){
    return (!process.env.NODE_ENV || process.env.NODE_ENV==='development' ? 'http://localhost:3727/' : 'https://darkchii.nl/groningen/api/');
}

export async function getUsers(sorter, groningen_only = true, show_restricted = false){
    let users = [];
    try{
        const res = await axios.get(`${getApiUrl()}users?groningen_only=${groningen_only}&show_restricted=${show_restricted}&sorter=${sorter}`, { headers: { "Access-Control-Allow-Origin": "*" } });
        users = res.data;
        users = users.filter(user => user.username !== undefined);
    }catch(e){
        users = [];
    }
    return users;
}