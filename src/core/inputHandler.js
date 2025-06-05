import { Game } from "./game.js"

export class InputHandler {
    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game
        this.keys_down = {}
        this.keys_pressed = {}
        this.del_key_can_be_pressed = true
        /** @type {x: Number, y: Number} */
        this.mouse_pos = {x:null, y:null}
        this.mass_check_pressed_keys = {}

		this.mouse_buttons_down = {}
		this.mouse_buttons_pressed = {}

        document.addEventListener('keydown', (e) => {
            if (!this.keys_down[e.key.toLowerCase()]) {
                this.keys_pressed[e.key.toLowerCase()] = true
                this.mass_check_pressed_keys[e.key.toLowerCase()] = true
            }
            this.keys_down[e.key.toLowerCase()] = true
        })

        document.addEventListener('keyup', (e) => {
            this.keys_down[e.key.toLowerCase()] = false
            this.keys_pressed[e.key.toLowerCase()] = false
            this.mass_check_pressed_keys[e.key.toLowerCase()] = false
        })

        document.onmousemove = (e) => {
            this.mouse_pos = {
                    x: e.x - (game.canvas.width / 2), 
                    y: e.y - (game.canvas.height / 2)
                }
        }

        document.addEventListener("mousedown", (e) => {
			this.mouse_buttons_down[e.button] = true
			this.mouse_buttons_pressed[e.button] = true
        })

        document.addEventListener("mouseup", (e) => {
			this.mouse_buttons_down[e.button] = false
        })
    }

    /**
	 * Check if a key is down
     * @param {String} key 
     * @returns {Boolean}
     */
    isKeyDown(key) { return this.keys_down[key] }

    /**
     * Check if a key is pressed (returns true only once per press)
     * @param {String} key 
     * @returns {Boolean}
     */
    isKeyPressed(key) {
        if (this.keys_pressed[key]) {
            this.game.schedule(() => this.keys_pressed[key] = false, 0)
            return true
        } else {
            return false
        }
    }

	/**
	 * Check if a mouse button is down
	 * @param {Number} button
	 * @returns {Boolean}
	 */
	isMouseDown(button) {
		return this.mouse_buttons_down[button] || false
	}

	/**
     * Check if a mouse button is pressed (returns true only once per press)
	 * @param {Number} button
	 * @returns {Boolean}
	 */
	isMousePressed(button) {
		if (this.mouse_buttons_pressed[button]) {
            this.game.schedule(() => this.mouse_buttons_pressed[button] = false, 0)
			return true
		}
		return false
	}

    /**
     * 
     * @returns {String}
     */
    get_down_keys(){
        for(let [key, value] of Object.entries(this.keys_down)){
            if(value){
                if(this.mass_check_pressed_keys[key]){
                    this.game.schedule(() => this.mass_check_pressed_keys[key] = false, 0)
                    return key
                }
            }
        }
        return null
    }
}
