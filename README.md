# spotify-to-lavalink

A simple module to convert Spotify URLs into song titles for Lavalink to parse into track objects. No need to bother renewing your Spotify access token every time, because it will handle and renew your Spotify token for you.

### Prerequisites
- A Spotify app client. You can log in and create one in https://developer.spotify.com/dashboard
- Lavalink API https://github.com/Frederikam/Lavalink

### Simple Usage
```javascript
const { SpotifyParser } = require('spotify-to-lavalink');

const spotifyID = ''; // Your Spotify app client ID
const spotifySecret = ''; // Your Spotify app client secret
const node = {
	host: 'localhost',
	port: 1234,
	password: 'password'
};

const spotilink =  new SpotifyParser(node, spotifyID, spotifyID);

// Get a song title
const song = await spotilink.getTrack('1Cv1YLb4q0RzL6pybtaMLo'); // Surfaces - Sunday Best

// Get all songs from an album
const album = await spotilink.getAlbumTracks('7tcs1X9pzFvcLOPuhCstQJ'); // [ 'Kygo, Valerie Broussard - The Truth', 'OneRepublic, Kygo - Lose Somebody', ... ]

// Get all songs from a playlist
const playlist = await spotilink.getPlaylistTracks('37i9dQZEVXbMDoHDwVN2tF') // [ 'Da Baby, Roddy Rich - ROCKSTAR', 'The Weeknd - Blinding Lights', ... ]

// Fetch song from the Lavalink API
const track = await spotilink.fetchTrack(song) // { track: "", info: {} }
				.catch(() => console.log("No track found."));

// Fetch songs from playlists from the Lavalink API
const tracks = [];
await Promise.all(album.map(async (name) => tracks.push(await spotilink.fetchTrack(name))));
// 'tracks' will now contain Lavalink track objects.
// SpotifyParser#fetchTrack will only return the track object, giving you complete freedom and control on how you handle the Lavalink tracks. :)
```

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/TheFloppyBanana"><img src="https://avatars1.githubusercontent.com/u/35372554?v=4?s=100" width="100px;" alt=""/><br /><sub><b>TheFloppyBanana</b></sub></a><br /><a href="https://github.com/takomst/spotify-to-lavalink/commits?author=TheFloppyBanana" title="Code">💻</a> <a href="https://github.com/takomst/spotify-to-lavalink/commits?author=TheFloppyBanana" title="Documentation">📖</a> <a href="#example-TheFloppyBanana" title="Examples">💡</a> <a href="#ideas-TheFloppyBanana" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/Dwigoric"><img src="https://avatars2.githubusercontent.com/u/30539952?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dwigoric</b></sub></a><br /><a href="https://github.com/takomst/spotify-to-lavalink/commits?author=Dwigoric" title="Code">💻</a> <a href="#ideas-Dwigoric" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://xeval.dev/"><img src="https://avatars3.githubusercontent.com/u/40152105?v=4?s=100" width="100px;" alt=""/><br /><sub><b>X-49</b></sub></a><br /><a href="https://github.com/takomst/spotify-to-lavalink/issues?q=author%3ASaphirePI" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
