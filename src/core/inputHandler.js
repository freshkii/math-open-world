import { constants } from "../constants.js"
import { Ui } from "../ui/ui.js"
import { Game } from "./game.js"

export class InputHandler {
    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.keys_down = {}
        this.keys_pressed = {}
        this.del_key_can_be_pressed = true
        /** @type {x: Number, y: Number} */
        this.mouse_pos = {x:null, y:null}

		this.mouse_buttons_down = {}
		this.mouse_buttons_pressed = {}

        document.addEventListener('keydown', (e) => {
            if (!this.keys_down[e.key.toLowerCase()]) {
                this.keys_pressed[e.key.toLowerCase()] = true
            }
            this.keys_down[e.key.toLowerCase()] = true
            if(e.key == "Backspace" && this.del_key_can_be_pressed){
                if(game.current_ui && game.current_ui.focused_widgets.length != 0){
                    game.current_ui.focused_widgets.forEach(widget => {
                        if(widget.type != constants.TEXTAREA_TYPE && widget.type != constants.NUMBERAREA_TYPE) return
                        if(!widget.usable) return
                        widget.content = widget.content.slice(0, -1)
                    })
                    this.del_key_can_be_pressed = false
                }
            }
        })

        document.addEventListener('keyup', (e) => {
            this.keys_down[e.key.toLowerCase()] = false
            this.keys_pressed[e.key.toLowerCase()] = false
            if(e.key == "Backspace") this.del_key_can_be_pressed = true
        })

        document.onmousemove = (e) => {
            this.mouse_pos = {
                    x: e.x - (game.canvas.width / 2), 
                    y: e.y - (game.canvas.height / 2)
                }
            if(game.current_ui && game.current_ui instanceof Ui){
                game.current_ui.widgets.forEach(widget => {
                    if(widget.type == constants.BUTTON_TYPE
                        || widget.type == constants.TEXTAREA_TYPE
                        || widget.type == constants.NUMBERAREA_TYPE){

                        if(widget.x.get() <= this.mouse_pos.x
                            && (widget.x.get() + widget.width.get()) >= this.mouse_pos.x
                            && widget.y.get() <= this.mouse_pos.y
                            && (widget.y.get() + widget.height.get()) >= this.mouse_pos.y){

                            widget.is_hovered = true
                        } else 
                            widget.is_hovered = false
                    }
                })
            }
        }

        document.addEventListener('click', (e) => {
            if(game.current_ui && game.current_ui instanceof Ui){
                var new_focused_widgets = []
                game.current_ui.widgets.forEach(widget => { 
                    if(!widget.rendered) return
                    if(widget.type == constants.BUTTON_TYPE
                        || widget.type == constants.TEXTAREA_TYPE
                        || widget.type == constants.NUMBERAREA_TYPE){
                        if(widget.x.get() <= this.mouse_pos.x
                            && (widget.x.get() + widget.width.get()) >= this.mouse_pos.x
                            && widget.y.get() <= this.mouse_pos.y
                            && (widget.y.get() + widget.height.get()) >= this.mouse_pos.y){
                            if(widget.type == constants.BUTTON_TYPE) {
                                widget.should_execute = true
                                new_focused_widgets.push(widget)
                            }
                            else if(widget.type == constants.TEXTAREA_TYPE || widget.type == constants.NUMBERAREA_TYPE){
                                new_focused_widgets.push(widget)
                            }
                        }
                    }
                })
                game.plan(() => {
                    if(!game.current_ui) return
                    if(new_focused_widgets.length == 0){
                    game.current_ui.focused_widgets.forEach(widget => {
                        widget.has_focus = false
                    })
                    game.current_ui.focused_widgets = []
                    } else {
                        if(game.current_ui.focused_widgets){
                            game.current_ui.focused_widgets.forEach(widget => {
                                widget.has_focus = false
                            })
                        }
                        game.current_ui.focused_widgets = []
                        new_focused_widgets.forEach(widget => {
                            game.current_ui.focused_widgets.push(widget)
                            widget.has_focus = true
                        })
                    }
                }, 100)
            }

        })

        document.addEventListener("keypress", (e) => {
            if(game.current_ui && game.current_ui instanceof Ui && game.current_ui.focused_widgets.length != 0 && e.key.length == 1){
                game.current_ui.focused_widgets.forEach(widget => {
                    if(widget.type != constants.TEXTAREA_TYPE && widget.type != constants.NUMBERAREA_TYPE) return
                    if(widget.content.length != widget.max_char_number){
                        if(widget.type == constants.NUMBERAREA_TYPE
                            && !(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key))) return
                        if(!widget.usable) return
                        widget.content += e.key
                    }
                })
            }
        })

        document.addEventListener("mousedown", (e) => {
			this.mouse_buttons_down[e.button] = true
			this.mouse_buttons_pressed[e.button] = true

            if(game.current_ui && game.current_ui instanceof Ui){
                game.current_ui.widgets.forEach(widget => {
                    if(widget.is_hovered){
                        widget.is_clicked = true
                    }
                })
            }
        })

        document.addEventListener("mouseup", (e) => {
			this.mouse_buttons_down[e.button] = false

            if(game.current_ui && game.current_ui instanceof Ui){
                game.current_ui.widgets.forEach((widget) => {
                    if(widget.type == constants.BUTTON_TYPE
                        || widget.type == constants.TEXTAREA_TYPE
                        || widget.type == constants.NUMBERAREA_TYPE){
                        widget.is_clicked = false
                    }
                })
            }
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
            this.keys_pressed[key] = false
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
			this.mouse_buttons_pressed[button] = false
			return true
		}
		return false
	}

}
