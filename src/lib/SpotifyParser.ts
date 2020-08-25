import fetch from "node-fetch";
import { URLSearchParams } from "url";

const BASE_URL = "https://api.spotify.com/v1";

export interface Node {
	host: string;
	port: string;
	password: string;
}

export interface Album {
	items: [Track];
}

export interface Artist {
	name: string;
}

export interface LavalinkTrack {
	track?: string;
	info?: {
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

export interface PlaylistItems {
	items: [{
		track: Track;
	}];
}

export interface Track {
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
	public async getAlbumTracks(id: string, convert = false): Promise<string[]|LavalinkTrack[]> {
		if (!id) throw new ReferenceError("The album ID was not provided");
		if (typeof id !== "string") throw new TypeError(`The album ID must be a string, received type ${typeof id}`);

		const { items }: Album = (await (await fetch(`${BASE_URL}/albums/${id}/tracks`, this.options)).json());
		const tracks = items.map(song => `${song.artists.map(artist => artist.name).join(", ")} - ${song.name}`);

		if (convert) {
			return Promise.all(tracks.map(async (title) => await this.fetchTrack(title)) as LavalinkTrack[]);
		}

		return tracks;

	}

	/**
	 * Fetch the tracks from the playlist and return its artists and track name.
	 * @param id The playlist ID.
	 * @param convert Whether to return results as Lavalink tracks instead of track names.
	 */
	public async getPlaylistTracks(id: string, convert = false): Promise<string[]|LavalinkTrack[]> {
		if (!id) throw new ReferenceError("The playlist ID was not provided");
		if (typeof id !== "string") throw new TypeError(`The playlist ID must be a string, received type ${typeof id}`);

		const { items }: PlaylistItems = (await (await fetch(`${BASE_URL}/playlists/${id}/tracks`, this.options)).json());
		const tracks: string[] = items.map(item => `${item.track.artists.map(artist => artist.name).join(", ")} - ${item.track.name}`);

		if (convert) {
			return Promise.all(tracks.map(async (title) => await this.fetchTrack(title)) as LavalinkTrack[]);
		}

		return tracks;
	}

	/**
	 * Fetch the track and return its artist and title
	 * @param id The song ID.
	 * @param convert Whether to return results as Lavalink tracks instead of track name.
	 */
	public async getTrack(id: string, convert = false): Promise<string|LavalinkTrack> {
		if (!id) throw new ReferenceError("The track ID was not provided");
		if (typeof id !== "string") throw new TypeError(`The track ID must be a string, received type ${typeof id}`);

		const track: Track = (await (await fetch(`${BASE_URL}/tracks/${id}`, this.options)).json());
		const artists: string[] = track.artists.map(artist => artist.name);
		const title = `${artists.join(", ")} - ${track.name}`;

		if (convert) {
			return this.fetchTrack(title) as LavalinkTrack;
		}

		return title;
	}

	/**
	 * Return a LavalinkTrack object from the track title.
	 * @param track The track title to be taken from the Lavalink API
	 */
	public async fetchTrack(track: string): Promise<LavalinkTrack|null> {
		if (!track) throw new ReferenceError("The track title was not provided");
		if (typeof track !== "string") throw new TypeError(`The track title must be a string, received type ${typeof track}`);

		const params = new URLSearchParams();
		params.append("identifier", `ytsearch: ${track}`);
		const { host, port, password } = this.nodes;
		const { tracks } = (await (await fetch(`http://${host}:${port}/loadtracks?${params}`, {
			headers: {
				Authorization: password
			}
		})).json());
		if (!tracks.length) return null;
		return tracks[0];
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

		if (!access_token) throw Error("Invalid Spotify client.");

		this.token = `Bearer ${access_token}`;
		this.options.headers.Authorization = this.token;

		// Convert expires_in into ms
		return expires_in * 1000;
	}

	private async renew(): Promise<void> {
		setTimeout(this.renew.bind(this), await this.renewToken());
	}

}
