import { Game } from "../core/game.js"
import { Tileset } from "./tileset.js"
import { Hitbox } from "../entities/hitbox.js"
import { collisions, constants, config } from "../constants.js"

export class Map {
	/**
	 * !!! One shouldn't use the constructor to make a map, use the static create method instead
	 * @param {Game} game - The current game
	 * @param {Tileset} tileset - The tileset used to render the map
	 * @param {String} background - The color of the tileless background
	 * @param {Object} player_pos - The position of the player on this specific map
	 */
	constructor(game, tileset, background, player_pos) {
		this.game = game
		this.tileset = tileset
		/** @type {Array<Array<Number>>} */
		this.layers = []
		/** @type {Array<Array<Number>>} */
		this.perpective_layers = []
		this.world = {}
		this.background = background
		this.player_pos = player_pos
	}

	/**
	 * A scenery on which are put other objects (entities, hitboxes, ...). This method is async and static
	 * @param {Game} game - The current game
	 * @param {String} src - The path to the json file used as a reference to layout the map
	 * @param {Tileset} tileset - The tileset used to render the map
	 * @param {String} background - The color of the tileless background
	 * @param {Object} player_pos - The position of the player on this specific map
	 * @returns {Map}
	 */
	static async create(game, src, tileset, background, player_pos) {
		const map = new Map(game, tileset, background, player_pos)
		try {
			await map.load(src)
		} catch (error) {
			console.error(`Failed to load map "${src}": ${error.message}`);
		}
		return map
	}

	/**
	 * 
	 * @param {String} src 
	 */
	async load(src) {
			// extract json
			const response = await fetch(config.MAP_DIR + src)
			if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`)
			}
			const body = await response.json()
			this.width = body.width
			this.height = body.height
			this.world.width = this.width * this.game.TILE_SIZE
			this.world.height = this.height * this.game.TILE_SIZE
			for (let layer of body.layers) {
				if (layer.type === "tilelayer") {

					if(layer.is_before_player)
						this.layers.push(layer.data)
					else
						this.perpective_layers.push(layer.data)

					// create hitboxes for blocks tiles
					if (layer.name === "Blocks") {
						for (let i = 0; i < layer.data.length; i++) {
							if (!layer.data[i])
								continue
							if ((! layer.data[i]) || constants.ACTIVE_TILES.includes(layer.data[i]))
								continue

							const tileX = (i % layer.width) * this.game.TILE_SIZE;
							const tileY = Math.floor(i / layer.width) * this.game.TILE_SIZE;

							var new_x = 0
							var new_y = 0
							var new_width = constants.TILE_SIZE
							var new_height = constants.TILE_SIZE

							if(src in collisions){
								if(layer.data[i] in collisions[src]){

									if(collisions[src][layer.data[i]].x)
										new_x = collisions[src][layer.data[i]].x

									if(collisions[src][layer.data[i]].y)
										new_y = collisions[src][layer.data[i]].y

									if(collisions[src][layer.data[i]].width)
										new_width = collisions[src][layer.data[i]].width

									if(new_x + new_width > 128)
										new_width = 128 - new_x

									if(collisions[src][layer.data[i]].height)
										new_height = collisions[src][layer.data[i]].height

									if(new_y + new_height > 128)
										new_height = 128 - new_y
								}
							}
							new Hitbox(this.game, this, tileX + new_x, tileY + new_y, new_width, new_height, true, false, null, (e, h, t) => {});
						}
					} else if (layer.name == "Ground") { // create hitboxes for void tiles
						for (let i = 0; i < layer.data.length; i++) {
							if (layer.data[i] != -1)
								continue

							const tileX = (i % layer.width) * this.game.TILE_SIZE;
							const tileY = Math.floor(i / layer.width) * this.game.TILE_SIZE;


							var new_x = 0
							var new_y = 0
							var new_width = constants.TILE_SIZE
							var new_height = constants.TILE_SIZE

							if(src in collisions){
								if(layer.data[i] in collisions[src]){
									if(collisions[src][layer.data[i]].x)
										new_x = collisions[src][layer.data[i]].x
									if(collisions[src][layer.data[i]].y)
										new_y = collisions[src][layer.data[i]].y
									if(collisions[src][layer.data[i]].width)
										new_width = collisions[src][layer.data[i]].width
									if(collisions[src][layer.data[i]].height)
										new_height = collisions[src][layer.data[i]].height
								}
							}
							new Hitbox(this.game, this, tileX + new_x, tileY + new_y, new_width, new_height, true, false, null, (e, h, t) => {});
						}
					}
				}
			}

		// create a border around the map to prevent glitches
		new Hitbox(this.game, this, 0, 0, this.world.width, this.world.height)
	}

	/**
	 * @param {Number} layer_i 
	 * @param {Number} x 
	 * @param {Number} y 
	 * @returns {Number}
	 */
	get_cell(layer_i, x, y) {
		return this.layers[layer_i][y * this.width + x]
	}

	/**
	 * 
	 * @param {Number} layer_i 
	 * @param {Number} x 
	 * @param {Number} y 
	 * @returns {Number}
	 */
	get_perspective_cell(layer_i, x, y){
		return this.perpective_layers[layer_i][y * this.width + x]
	}

	/**
	 * Renders only the background, the ground and the "Blocks"
	 */
	render_ground_blocks() {
		this.game.ctx.fillStyle = this.background
		this.game.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height)
		const startTileX = Math.max(0, Math.floor(this.game.camera.x / this.game.TILE_SIZE));
		const startTileY = Math.max(0, Math.floor(this.game.camera.y / this.game.TILE_SIZE));
		const endTileX = Math.min(this.width, Math.ceil((this.game.camera.x + this.game.canvas.width) / this.game.TILE_SIZE));
		const endTileY = Math.min(this.height, Math.ceil((this.game.camera.y + this.game.canvas.height) / this.game.TILE_SIZE));

		for (let y = startTileY; y < endTileY; y++) {
			for (let x = startTileX; x < endTileX; x++) {
				const screenX = x * this.game.TILE_SIZE - this.game.camera.x;
				const screenY = y * this.game.TILE_SIZE - this.game.camera.y;

				for (let i = 0; i < this.layers.length; i++) {
					const tile_num = this.get_cell(i, x, y);
					if (tile_num !== 0) // skips empty tiles 
						this.tileset.drawTile(tile_num, screenX, screenY);

				}
			}
		}
	}

	/*
	 * render perspective
	 */
	render_perspective() {
		const startTileX = Math.max(0, Math.floor(this.game.camera.x / constants.TILE_SIZE));
		const startTileY = Math.max(0, Math.floor(this.game.camera.y / constants.TILE_SIZE));
		const endTileX = Math.min(this.width, Math.ceil((this.game.camera.x + this.game.canvas.width) / this.game.TILE_SIZE));
		const endTileY = Math.min(this.height, Math.ceil((this.game.camera.y + this.game.canvas.height) / this.game.TILE_SIZE));

		for (let y = startTileY; y < endTileY; y++) {
			for (let x = startTileX; x < endTileX; x++) {
				const screenX = x * constants.TILE_SIZE - this.game.camera.x;
				const screenY = y * constants.TILE_SIZE - this.game.camera.y;

				for (let i = 0; i < this.perpective_layers.length; i++) {
					const tile_num = this.get_perspective_cell(i, x, y);
					if (tile_num !== 0) // skips empty tiles 
						this.tileset.drawTile(tile_num, screenX, screenY);
				}
			}
		}
	}

}
