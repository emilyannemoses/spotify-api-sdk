export const authEndpoint = "https://accounts.spotify.com/authorize";
export const clientId = "<YOUR CLIENTID>"; // In Spotify Developer Console
export const redirectUri = "http://localhost:3000/callback/"; // Set this in your Spotify Developer Console
export const scopes = [
    "user-read-private",
    "user-read-email",
    "streaming", 
    "user-read-birthdate"
];