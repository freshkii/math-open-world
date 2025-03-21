import { Game } from "../core/game.js";
import { Map } from "../world/map.js";
import { Ui } from "../ui/ui.js";
import { Hitbox } from "./hitbox.js";
import { constants } from "../constants.js";
import { Entity } from "./entity.js";

export class Talkable{
    /**
     * 
     * @param {Game} game - The current game
     * @param {Map} map - The map in which the talkable shows up
     * @param {Hitbox} hitbox - the hitbox used for detecting when the player is facing the talkable
     * @param {Ui} ui - The ui activated by this talkable
     * @param {Entity} [entity=null] - The entity which the talkable should follow, left empty to make the talkable motionless
     */
    constructor(game, map, hitbox, ui, entity=null){
        this.game = game
        this.map = map
        this.hitbox = hitbox
        this.ui = ui
        this.entity = entity
        this.is_talkable = true

        this.game.talkables.push(this)
    }

    on_interact(){
        this.game.current_ui = this.ui
    }

    render() {
		if(this.game.get_current_map() == this.map){
			this.game.ctx.strokeStyle = "green"
			this.game.ctx.strokeRect(
				this.hitbox.x1 - this.game.camera.x,
				this.hitbox.y1 - this.game.camera.y,
				this.hitbox.width,
				this.hitbox.height
			)
		}
	}

    update(){
        if(this.game.inputHandler.keys_down[constants.INTERACTION_KEY]){
            if(this.game.player.raycast_hitbox.is_colliding(this.hitbox)){
                if(this.is_talkable)
                    this.on_interact()
            }
        }
        if(this.entity)
            this.hitbox.center_around(this.entity.worldX, this.entity.worldY)
    }

    destructor(){
        this.game.talkables.slice(this.game.talkables.indexOf(this), 1)
    }
}
