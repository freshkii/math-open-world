import { Game } from "./core/game.js"

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
		else
			throw new Error(`value ${new_value} nan`)
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
		else
			throw new Error(`value ${new_value} nan`)
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