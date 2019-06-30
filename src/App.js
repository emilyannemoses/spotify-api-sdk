import React, { Component } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./access/config";
import hash from "./access/hash";
import logo from "./logo.svg";
import "./App.css";
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: [],
      token: '',
      deviceId: "",
      loggedIn: false,
      error: "",
      trackName: "Track Name",
      artistName: "Artist Name",
      albumName: "Album Name",
      playing: false,
      position: 0,
      duration: 1,
    };
    this.playerCheckInterval = null;
  }
  componentDidMount() {
    let _token = hash.access_token
    if (_token) {
      this.setState({
        token: _token
      });
      this.getUserInfo(_token);
    }
  }
  getUserInfo = (token) => {
    axios.get('https://api.spotify.com/v1/me/', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then( (response) => {
      this.setState({
        user: {
          name: `${response.data.display_name}`,
          username: `${response.data.id}`,
          email: `${response.data.email}`,
          location: `${response.data.country}`
        },
        token: token,
      })
      this.handleLogin()
    })
    .catch( (error) => {
      console.log(error);
    })
    .then( () => {
    })
  }
  handleLogin() {
    if (this.state.token !== "") {
      this.setState({ loggedIn: true });
      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
    }
  }
  onStateChanged(state) {
    if (state !== null) {
      const {
        current_track: currentTrack,
        position,
        duration,
      } = state.track_window;
      const trackName = currentTrack.name;
      const albumName = currentTrack.album.name;
      const artistName = currentTrack.artists
        .map(artist => artist.name)
        .join(", ");
      const playing = !state.paused;
      this.setState({
        position,
        duration,
        trackName,
        albumName,
        artistName,
        playing
      });
    } else {
      this.setState({ error: "Looks like you might have swapped to another device?" });
    }
  }
  createEventHandlers() {
    this.player.on('initialization_error', e => { console.error(e); });
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    this.player.on('account_error', e => { console.error(e); });
    this.player.on('playback_error', e => { console.error(e); });
    this.player.on('player_state_changed', state => this.onStateChanged(state));
    this.player.on('ready', async data => {
      let { device_id } = data;
      await this.setState({ deviceId: device_id });
      this.transferPlaybackHere();
    });
  }

  checkForPlayer() {
    const { token } = this.state;
    if (window.Spotify !== null) {
      clearInterval(this.playerCheckInterval);
      this.player = new window.Spotify.Player({
        name: "Emily's Spotify Player",
        getOAuthToken: cb => { cb(token); },
      });
      this.createEventHandlers();
      this.player.connect();
    }
  }
  
  onPrevClick() {
    this.player.previousTrack();
  }
  
  onPlayClick() {
    this.player.togglePlay();
  }
  
  onNextClick() {
    this.player.nextTrack();
  }
  
  transferPlaybackHere() {
    const { deviceId, token } = this.state;
    fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "device_ids": [ deviceId ],
        "play": true,
      }),
    });
  }

  render() {
    const {
      user,
      token,
      trackName,
      artistName,
      albumName,
      error,
      playing
    } = this.state;
    const {username, name, email, location} = user;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          { error && <p>Error: { error }</p>}
          { token ? (
            <div className="user-details">
              User's name:{name} <br></br>
              Spotify username:{username}<br></br>
              Email:{email}<br></br>
              Location:{location}<br></br>
              Playing: {playing}
              <div>      
              <p>Artist: {artistName}</p>
              <p>Track: {trackName}</p>
              <p>Album: {albumName}</p>
              <p>
                <button onClick={() => this.onPrevClick()}>Previous</button>
                <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
                <button onClick={() => this.onNextClick()}>Next</button>
              </p>
            </div>
            </div>
          ) : (
            <a
              className="btn btn--loginApp-link"
              href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
            >
              Log in
            </a>
            )
          }
        </header>
      </div>
    );
  }
}
export default App;
