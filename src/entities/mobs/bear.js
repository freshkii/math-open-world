import { constants } from "../../constants.js"
import { Game } from "../../core/game.js"
import { Map } from "../../world/map.js"
import { Mob } from "../mob.js"
import { Hitbox } from "../hitbox.js"
import { Ai } from "../ai.js"

export class Bear extends Mob {
    /**
     * 
     * @param {Game} game 
     * @param {Map} map 
     * @param {Number} worldX 
     * @param {Number} worldY 
     */
    constructor(game, map, worldX, worldY){
		super(game, map, game.tilesets["bear"],
            new Hitbox(game, map, 0, 0, constants.TILE_SIZE * 2.5, constants.TILE_SIZE * 2.5, true, false),
            new Hitbox(game, map, 0, 0, constants.TILE_SIZE * 3, constants.TILE_SIZE * 3, false, false),
            worldX, worldY, 200,
            new Ai(game).set_wandering(constants.TILE_SIZE / 35, constants.TILE_SIZE * 2, 3000), 100,
            {combat: {x: 0, y: 0},
            collision: {x: 0, y: 0}}, null, "Bear"
		)
        this.framesPerState = [4, 4]
    }
}

