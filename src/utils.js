import { constants } from "./constants.js"
import { Game } from "./core/game.js"
import { Hitbox } from "./entities/hitbox.js"
import { Map } from "./world/map.js"
import { Transition } from "./ui/transition.js"

/**
 * @param {Number} x 
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Number}
*/
export const clamp = (x, min, max) => {
	if (x < min) return min
	if (x > max) return max
	return x
}

/**
 * 
 * @param {String} str 
 * @param {Number} lenght 
 * @returns {Array<String>}
 */
export const slice = (str, lenght) => {
	var array = []
	var sentence = ""
	str.split(" ").forEach(word => {
		if(sentence.length + word.length + 1 <= lenght){
			sentence += " "+word
		} else {
			array.push(sentence)
			sentence = word
		}
	})
	array.push(sentence)
	array[0] = array[0].slice(1)
	return array
}

export class Resizeable{
	/**
	 * @param {Game} game 
	 * @param {Number} value 
	 * @param {(resizeable: Resizeable) => void} [resize=null] 
	 */
	constructor(game, value, resize=null){
		this.game = game
		this.value = value / this.game.canvas.width
		if(resize) {
			this.resize = resize
			this.game.resizeables.push(this)
		}
	}

	set_value(new_value){
		if(!isNaN(new_value / this.game.canvas.width))
			this.value = new_value / this.game.canvas.width
		else {
			throw new Error(`value ${new_value} nan`)
		}
	}

	get() {
		return this.value * this.game.canvas.width
	}

	resize(){
		this.resize(this)
	}
}

export class YResizeable{
	/**
	 * 
	 * @param {Game} game 
	 * @param {Number} value 
	 * @param {(resizeable: YResizeable) => void} [resize=null] 
	 */
	constructor(game, value, resize=null){
		this.game = game
		this.value = value / this.game.canvas.height
		if(resize){
			this.resize = resize
			this.game.resizeables.push(this)
		}
	}

	set_value(new_value){
		if(!isNaN(new_value / this.game.canvas.width))
			this.value = new_value / this.game.canvas.height
		else {
			console.log(this.game)
			throw new Error(`value ${new_value} nan`)
		}
	}

	get(){
		return this.value * this.game.canvas.height
	}
}

/**
 * 
 * @param {any} a 
 * @param {any} b 
 * @returns {boolean}
 */
export const equality_test = (a, b) => {
	const funct = (a, b) => {
		if(a instanceof Array){
			if(a.length == b.lenght) return false
			for(let i = 0; i < a.length; i++){
				if(!funct(a[i], b[i])) return false
			}
			return true
		} else {
			return a === b
		}
	}
	return funct(a, b)
}

/**
 * @param {Game} game
 * @param {String} mapName1
 * @param {String} mapName2
 * @param {Object} rtMap1
 * @param {Object} rtMap2
 * @param {Object} tpMap1
 * @param {Object} tpMap2
 * @param {Number} dirMap1
 * @param {Number} dirMap2
 * @param {Transition} transition
 * @param {Number} currentTime
 */
export const createSwitchHitboxes = (game, mapName1, mapName2, boxMap1, tpMap1, boxMap2, tpMap2, dirMap1, dirMap2, transition=null, addingCode1 = (() => {}), addingCode2 = (() => {})) => {
	new Hitbox(game, game.maps[mapName1], boxMap1.x * constants.TILE_SIZE, boxMap1.y * constants.TILE_SIZE, boxMap1.width * constants.TILE_SIZE, boxMap1.height * constants.TILE_SIZE, false, false, null, (h, c_h, t) => {
		if(!c_h.player) return
		game.maps[mapName1].set_player_pos({x: tpMap1.x * constants.TILE_SIZE, y: tpMap1.y * constants.TILE_SIZE})
		game.set_map(mapName2)
		game.player.set_map(game.maps[mapName2])
		game.player.direction = dirMap2 

		// reset dash
		if (game.player.dashing)
			game.player.dash_reset = true
		else
			game.player.last_dash = -constants.PLAYER_DASH_COOLDOWN


		// transition
		if (transition)
			transition.start(t)

		addingCode1(game)
	}) // h1
	new Hitbox(game, game.maps[mapName2], boxMap2.x * constants.TILE_SIZE, boxMap2.y * constants.TILE_SIZE, boxMap2.width * constants.TILE_SIZE, boxMap2.height * constants.TILE_SIZE, false, false, null, (h, c_h, t) => {
		if(!c_h.player) return
		game.maps[mapName2].set_player_pos({x: tpMap2.x * constants.TILE_SIZE, y: tpMap2.y * constants.TILE_SIZE})
		game.set_map(mapName1)
		game.player.set_map(game.maps[mapName1])
		game.player.direction = dirMap1

		// reset dash
		if (game.player.dashing)
			game.player.dash_reset = true
		else
			game.player.last_dash = -constants.PLAYER_DASH_COOLDOWN

		addingCode2(game)

		// transition
		if (transition)
			transition.start(t)
	}) // h2
}

export const createTpHitboxes = (game, mapName, box1, tp1, box2, tp2, dir1, dir2, transition = null) => {
	new Hitbox(game,
		game.maps[mapName],
		box1.x * constants.TILE_SIZE, box1.y * constants.TILE_SIZE,
		box1.width * constants.TILE_SIZE, box1.height * constants.TILE_SIZE,
		false, false, null,
		(h, c_h, t) => {
			if (!c_h.player) return
			c_h.owner.set_pos(tp2.x * constants.TILE_SIZE, tp2.y * constants.TILE_SIZE)
			c_h.owner.direction = dir2
			if (transition)
				transition.start(t)
		}
	)
	new Hitbox(game,
		game.maps[mapName],
		box2.x * constants.TILE_SIZE, box2.y * constants.TILE_SIZE,
		box2.width * constants.TILE_SIZE, box2.height * constants.TILE_SIZE,
		false, false, null,
		(h, c_h, t) => {
			if (!c_h.player) return
			c_h.owner.set_pos(tp1.x * constants.TILE_SIZE, tp1.y * constants.TILE_SIZE)
			c_h.owner.direction = dir1
			if (transition)
				transition.start(t)
		}
	)
}
