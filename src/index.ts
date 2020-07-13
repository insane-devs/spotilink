import fetch, { RequestInit } from "node-fetch";
import { Manager } from "lavacord";

const BASE_URL = "https://api.spotify.com/v1";

export default class SpotifyParser {

	private token: string;
	private options: RequestInit

	/**
	 * Class to convert Spotify tracks and playlists into Lavalink track objects. 
	 * @param LavacordClient The Lavacord client to convert parsed tracks into a Lavalink track object. 
	 * @param token The Spotify API token
	 */
	constructor(LavacordClient: Manager,token: string) {
		/**
		 * The Spotify API bearer token.
		 * @type {string}
		 */
		this.token = token;
		/**
		 * Default options for fetching the API.
		 * @type {Object}
		 */
		this.options = {
			headers: {
				"Content-Type": "application/json",
				"Authorization": this.token
			}
		};
	}

	/**
	 * Parse items from the playlist into a readable "Artists - Track" format.
	 * @param id Spotify playlist ID.
	 * @returns {Array} The parsed track names.
	 */
	public async getPlaylistTracks(id: string): Promise<string[]> {
		const playlist: PlaylistItems[] = (await (await fetch(`${BASE_URL}/playlists/${id}/tracks`, this.options)).json()).items;
		const tracks: string[] = playlist.map(item => `${item.track.artists.map(artist => artist.name).join(", ")} - ${item.track.name}`);
		return tracks;
	}
	
}

interface PlaylistItems {
	track: {
		artists: Artists[],
		name: string
	} 
}

interface Artists {
	name: string;
}

module.exports = SpotifyParser;