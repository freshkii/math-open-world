import { Game } from "../core/game.js"
import { Map } from "../world/map.js"
import { Ui } from "../ui/ui.js"
import { Hitbox } from "./hitbox.js"
import { constants } from "../constants.js"
import { Entity } from "./entity.js"

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
        this.hitbox.set_owner(this)
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
				this.hitbox.x1.get() - this.game.camera.x.get(),
				this.hitbox.y1.get() - this.game.camera.y.get(),
				this.hitbox.width.get(),
				this.hitbox.height.get()
			)
		}
	}

    update(current_time){
        if(this.game.inputHandler.isKeyPressed(constants.INTERACTION_KEY) && this.game.player.raycast_hitbox.is_colliding(this.hitbox)) {
			this.on_interact()
			this.game.inputHandler.keys_pressed[constants.INTERACTION_KEY] = false
        }
        if(this.entity)
            this.hitbox.center_around(this.entity.worldX.get(), this.entity.worldY.get())
    }

    destructor(){
		this.hitbox.destroy()
        this.game.talkables.splice(this.game.talkables.indexOf(this), 1)
    }
}
