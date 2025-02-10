import { Game } from "../core/game.js"
import { Map } from "../world/map.js"

export class Hitbox {
	/**
	 * @param {Game} game - game object reference
	 * @param {Map} map - the hitbox's map
	 * @param {Number} x - left x
	 * @param {Number} y - top y
	 * @param {Number} width - hitbox width
	 * @param {Number} height - hitbox height
	 * @param {boolean} collision - is the hitbox a collision hitbox
	 * @param {boolean} [player=false] - is the hitbox a player's hitbox
	 * @param {() => void} [command=function f(){}] - function executed when colliding with the player
	 */
	constructor(game, map, x, y, width, height, collision=false, player=false, command=function f(){}){
		this.game = game
		this.map = map

		this.x1 = x
		this.x2 = x + width
		this.y1 = y
		this.y2 = y + height

		this.width = width
		this.height = height

		if (collision) game.collision_hitboxes.push(this)
		else game.combat_hitboxes.push(this)
		this.game.hitboxes.push(this)
		
		this.player = player

		this.command = command
	}


	/**
	 * @param {Number} i - index (0, 1, 2 or 3)
	 */
	get_corner(i) {
		switch(i) {
			case 0: return {x: this.x1, y: this.y1}
			case 1: return {x: this.x2, y: this.y1}
			case 2: return {x: this.x1, y: this.y2}
			case 3: return {x: this.x2, y: this.y2}
		}
	}

	render() {
		if(this.game.get_current_map() == this.map){
			this.game.ctx.strokeStyle = this.player ? "blue" : "red"
			this.game.ctx.strokeRect(
				this.x1 - this.game.camera.x,
				this.y1 - this.game.camera.y,
				this.width,
				this.height
			)
		}
	}


	/**
	 * @param {Hitbox} hitbox
	 * @return {Boolean}
	 */
	is_colliding(hitbox) {
		if (this == hitbox) return false
		if (this.map != hitbox.map) return false
		return !(this.x1 > hitbox.x2 || hitbox.x1 > this.x2 || this.y1 > hitbox.y2 || hitbox.y1 > this.y2)
	}

	/**
	 * @param {boolean} [collision=true]
	 * @param {boolean} [combat=true]
	 * @returns {Array<Hitbox>}
	 */
	get_colliding_hitboxes(collision=true, combat=true) {
		const colliding_hitboxes = []
		if (collision) {
			for (let i = 0; i < this.game.combat_hitboxes.length; i++) {
				if (this.is_colliding(this.game.combat_hitboxes[i]))
					colliding_hitboxes.push(this.game.combat_hitboxes[i])
			}
		}

		if (combat) {
			for (let i = 0; i < this.game.collision_hitboxes.length; i++) {
				if (this.is_colliding(this.game.collision_hitboxes[i]))
					colliding_hitboxes.push(this.game.collision_hitboxes[i])
			}
		}

		if(!(combat || collision)){
			for (let i = 0; i < this.game.hitboxes.length; i++){
				if((! this.game.hitboxes[i] in colliding_hitboxes) && (!this.game.hitboxes[i] in this.game.collision_hitboxes) && (! this.game.hitboxes[i] in this.game.combat_hitboxes)){
					if (this.is_colliding(this.game.hitboxes[i]))
						colliding_hitboxes.push(this.game.collision_hitboxes[i])
				}
			}
		}

		return colliding_hitboxes
	}

	center_around(x, y) {
		this.x1 = x - this.width / 2
		this.x2 = x + this.width / 2
		this.y1 = y - this.height / 2
		this.y2 = y + this.height / 2
	}

	set(x, y) {
		this.x1 = x
		this.y1 = y
		this.x2 = x + this.width
		this.y2 = y + this.height
	}

	set_map(new_map){
		this.map = new_map
	}

	destructor() {
		this.game.collision_hitboxes.splice(collision_hitboxes.indexOf(this), 1)
	}
}
