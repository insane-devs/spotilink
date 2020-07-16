import { LavalinkNode } from "lavacord";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

const BASE_URL = "https://api.spotify.com/v1";

export default class SpotifyParser {
	public nodes: LavalinkNode;
	public id: string;
	private secret: string;
	private authorization: string;
	private token: string;
	private options: { headers: { "Content-Type": string; Authorization: string; }; };

	/**
	 * A class to convert Spotify URLs into Lavalink track objects.
	 * @param LavalinkNode A lavalink node to expose the lavalink API
	 * @param clientID Your Spotify's client ID.
	 * @param clientSecret Your Spotify's client secret.
	 */
	constructor(LavalinkNode: LavalinkNode, clientID: string, clientSecret: string) {
		this.nodes = LavalinkNode;
		this.id = clientID;
		this.secret = clientSecret;
		this.authorization = Buffer.from(`${clientID}:${clientSecret}`).toString("base64");
		this.token = "";
		this.options = {
			headers: {
				"Content-Type": "application/json",
				Authorization: this.token
			}
		};

		this.init();
	}

	/**
	 * Fetch the tracks from the album and return its artists and track name.
	 * @param id The album ID.
	 */
	public async getAlbum(id: string): Promise<string[]> {
		const { items }: Album = (await (await fetch(`${BASE_URL}/albums/${id}/tracks`, this.options)).json());
		return items.map(song => `${song.artists.map(artist => artist.name).join(", ")} - ${song.name}`);
	}

	/**
	 * Fetch the tracks from the playlist and return its artists and track name.
	 * @param id The playlist ID.
	 */
	public async getPlaylistTracks(id: string): Promise<string[]> {
		const { items }: PlaylistItems = (await (await fetch(`${BASE_URL}/playlists/${id}/tracks`, this.options)).json());
		return items.map(item => `${item.track.artists.map(artist => artist.name).join(", ")} - ${item.track.name}`);
	}

	/**
	 * Fetch the track and return its artist and title
	 * @param id The song ID.
	 */
	public async getTrack(id: string): Promise<string> {
		const track: Track = (await (await fetch(`${BASE_URL}/tracks/${id}`, this.options)).json());
		const artists: string[] = track.artists.map(artist => artist.name);
		return `${artists.join(", ")} - ${track.name}`;
	}

	public async fetchTrack(track: string): Promise<LavalinkTrack> {
		const params = new URLSearchParams();
		params.append("identifier", `ytsearch: ${track}`);
		const { host, port, password } = this.nodes;
		const { tracks } = (await (await fetch(`http://${host}:${port}/loadtracks?${params}`, {
			headers: {
				Authorization: password
			}
		})).json());
		return tracks[0];
	}

	private async renewToken() {
		const { access_token }= await (await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: "grant_type=client_credentials",
			headers: {
				Authorization: `Basic ${this.authorization}`,
				"Content-Type": "application/x-www-form-urlencoded"
			}
		})).json();

		this.token = `Bearer ${access_token}`;
		this.options.headers.Authorization = this.token;
	}

	private async init() {
		await this.renewToken();
		setInterval(await this.renewToken, 1000 * 60 * 55);
	}

}

interface Album {
	items: [Track]
}

interface Artist {
	name: string;
}

interface LavalinkTrack {
	track: string;
	info: {
		identifier: string,
		isSeekable: boolean,
		author: string,
		length: number,
		isStream: boolean,
		position: number,
		title: string,
		uri: string
	}
}

interface PlaylistItems {
	items: [{
		track: Track
	}]
}

interface Track {
	artists: Artist[],
	name: string;
}
