import { constants } from "../../constants.js"
import { Game } from "../../core/game.js"
import { Map } from "../../world/map.js"
import { Mob } from "../mob.js"
import { Hitbox } from "../hitbox.js"
import { Resizeable } from "../../utils.js"

export class Frog extends Mob {
    /**
     * 
     * @param {Game} game 
     * @param {Map} map 
     * @param {Number} worldX 
     * @param {Number} worldY 
     */
    constructor(game, map, worldX, worldY){
		const ai = {
			state: constants.WANDERING_AI_STATE,
			hostile: false,
			wandering_direction_change_time: 3000,
			wandering_radius: new Resizeable(game, constants.TILE_SIZE * 2),
			wandering_speed: new Resizeable(game, 5)
		}

		super(game, map, game.tilesets["frog"],
            new Hitbox(game, map, 0, 0, constants.TILE_SIZE * 0.40625, constants.TILE_SIZE * 0.25, true, false),
            new Hitbox(game, map, 0, 0, constants.TILE_SIZE * 0.40625, constants.TILE_SIZE * 0.25, false, false),
            worldX, worldY, 200, ai, 5,
            {combat: {x: constants.TILE_SIZE * 0.015625, y: constants.TILE_SIZE * 0.0625},
            collision: {x: constants.TILE_SIZE * 0.015625, y: constants.TILE_SIZE * 0.0625}}
		)

        this.framesPerState = [5, 3]
    }
}

