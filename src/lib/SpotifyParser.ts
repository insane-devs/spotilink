import fetch from "node-fetch";
import { URLSearchParams } from "url";

const BASE_URL = "https://api.spotify.com/v1";

export interface Node {
	host: string;
	port: string;
	password: string;
}

export interface Album {
	songs: SpotifyTrack[];
}

export interface Artist {
	name: string;
}

export interface LavalinkTrack {
	track: string;
	info: {
		identifier: string;
		isSeekable: boolean;
		author: string;
		length: number;
		isStream: boolean;
		position: number;
		title: string;
		uri: string;
	}
}

export interface LavalinkSearchResult {
	tracks: LavalinkTrack[];
}

export interface PlaylistItems {
	items: [{
		track: SpotifyTrack;
	}];
}

export interface SpotifyTrack {
	artists: Artist[];
	name: string;
}


export class SpotifyParser {
	public nodes: Node;
	public id: string;
	private secret: string;
	private authorization: string;
	private token: string;
	private options: { headers: { "Content-Type": string; Authorization: string; }; };

	/**
	 * A class to convert Spotify URLs into Lavalink track objects.
	 * @param Node A lavalink node to expose the lavalink API
	 * @param clientID Your Spotify's client ID.
	 * @param clientSecret Your Spotify's client secret.
	 */
	constructor(LavalinkNode: Node, clientID: string, clientSecret: string) {
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

		this.renew();
	}

	/**
	 * Fetch the tracks from the album and return its artists and track name.
	 * @param id The album ID.
	 * @param convert Whether to return results as Lavalink tracks instead of track names.
	 */
	public async getAlbumTracks(id: string): Promise<LavalinkTrack[]> {
		const { songs }: Album = (await (await fetch(`${BASE_URL}/albums/${id}/tracks`, this.options)).json());

		return Promise.all(songs.map(async (song) => await this.fetchTrack(song)) as unknown as LavalinkTrack[]);
	}

	/**
	 * Fetch the tracks from the playlist and return its artists and track name.
	 * @param id The playlist ID.
	 * @param convert Whether to return results as Lavalink tracks instead of track names.
	 */
	public async getPlaylistTracks(id: string): Promise<LavalinkTrack[]> {
		const { items }: PlaylistItems = (await (await fetch(`${BASE_URL}/playlists/${id}/tracks`, this.options)).json());

		return Promise.all(items.map(async (item) => await this.fetchTrack(item.track)) as unknown as LavalinkTrack[]);
	}

	/**
	 * Fetch the track and return its artist and title
	 * @param id The song ID.
	 * @param convert Whether to return results as Lavalink tracks instead of track name.
	 */
	public async getTrack(id: string): Promise<LavalinkTrack> {
		const track: SpotifyTrack = (await (await fetch(`${BASE_URL}/tracks/${id}`, this.options)).json());

		return this.fetchTrack(track) as unknown as LavalinkTrack;
	}

	/**
	 * Return a LavalinkTrack object from the track title.
	 * @param track The track title to be taken from the Lavalink API
	 */
	public async fetchTrack(track: SpotifyTrack): Promise<LavalinkTrack|null> {
		const title = `${track.artists.map(artist => artist.name).join(", ")} - ${track.name}`;

		const params = new URLSearchParams();
		params.append("identifier", encodeURIComponent(`ytsearch: ${title}`));

		const { host, port, password } = this.nodes;
		const { tracks } = await (await fetch(`http://${host}:${port}/loadtracks?${params}`, {
			headers: {
				Authorization: password
			}
		})).json() as LavalinkSearchResult;

		if (!tracks.length) return null;

		return tracks
			// prioritize music videos first (lowest priority)
			.sort((a) => /(official)? ?(music)? ?video/i.test(a.info.title) ? -1 : 1)
			// prioritize lyric videos first
			.sort((a) => /(official)? ?lyrics? ?(video)?/i.test(a.info.title) ? -1 : 1)
			// prioritize official audios first
			.sort((a) => /(official)? ?audio/i.test(a.info.title) ? -1 : 1)
			// prioritize channel name
			.sort((a) => [track.artists[0].name, `${track.artists[0].name} - Topic`].includes(a.info.author) ? -1 : 1)
			// prioritize if the video title is the same as the song title (highest priority)
			.sort((a) => new RegExp(`^${track.name}$`, "i").test(a.info.title) ? -1 : 1)[0];
	}

	private async renewToken(): Promise<number> {
		const { access_token, expires_in } = await (await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: "grant_type=client_credentials",
			headers: {
				Authorization: `Basic ${this.authorization}`,
				"Content-Type": "application/x-www-form-urlencoded"
			}
		})).json();

		this.token = `Bearer ${access_token}`;
		this.options.headers.Authorization = this.token;

		// Convert expires_in into ms
		return expires_in * 1000;
	}

	private async renew(): Promise<void> {
		setTimeout(this.renew.bind(this), await this.renewToken());
	}

}
