import { Game } from "../core/game.js";
import { Hitbox } from "../entities/hitbox.js";
import { Talkable } from "../entities/talkable.js";
import { TextArea, Widget } from "./widgets.js";

export class Ui {
    /**
     * !!! One shouldn't use the constructor to make an ui, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number} width - The Ui's width on the screen
     * @param {Number} height - The Ui's height on the screen
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(ui: Ui) => void} widgets_states_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     */
    constructor(game, width, height, widgets, widgets_states_handler){
        this.game = game
        this.width = width
        this.height = height
        this.source = null
        this.widgets = widgets
        this.ids = []
        this.widgets.forEach((widget) => {
            if(this.ids.includes(widget.id))
                console.error(`widget with id ${widget.id} already registered, this may cause widget traceabilty issues`)
            widget.ui = this
            this.ids.push(widget.id)
        })
        this.focused_widget = null
        this.is_finished = false
        /** @type {TextArea} */
        this.selected_textarea = null
        this.widgets_states_handler = widgets_states_handler
    }

    /**
     * Method used to build an ui. This method is async and static
     * @param {Game} game - The current game
     * @param {String} src - The path to the image used used as a background for the ui
     * @param {Number} width - The Ui's width on the screen
     * @param {Number} height - The Ui's height on the screen
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(ui: Ui) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     * @returns {Ui}
     */
    static async create(game, src, width, height, widgets, widgets_state_handler){
        const ui = new Ui(game, width, height, widgets, widgets_state_handler)
        try {
			await ui.load(src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return ui
    }

    /**
     * @param {String} src
     */
    async load(src){
        const img = new Image()
		img.src = src
		this.img = img
		await new Promise((resolve, reject) => { 
			img.onload = resolve
			img.onerror = reject
		})
    }

    /**
     * 
     * @param {Talkable | Hitbox} source 
     */
    set_source(source){
        this.source = source
    }

    render(){
        this.game.ctx.drawImage(
            this.img,
            (this.game.canvas.width - this.width) / 2,
            (this.game.canvas.height - this.height) / 2,
            this.width, this.height
        )
        for(let i = 0; i < this.widgets.length; i++){
            this.widgets[i].render()
        }
    }

    /**
     * 
     * @param {Number} current_time 
     */
    update(current_time){
        this.widgets_states_handler(this)
        this.widgets.forEach(widget => {
            widget.update(current_time)
        });
    }

    /**
     * 
     * @param {Widget} widget 
     */
    add_widget(widget){
        this.widgets.push(widget)
    }

    /**
     * 
     * @param {Widget} widget 
     */
    remove_widget(widget){
        if(widget in this.widgets){
            this.widgets.slice(this.widgets.indexOf(widget), this.widgets.indexOf(widget) + 1)
        } else {
            console.error("not such widget in ui's widgets:")
            console.log(this)
            console.log(widget)
        }
    }

    /**
     * 
     * @param {String} id 
     * @returns {Widget}
     */
    get_widget(id){
        var id_matching_widget = null
        this.widgets.forEach((widget) => {
            if (widget.id == id) {
                id_matching_widget = widget
            }
        })
        if(id_matching_widget) return id_matching_widget
        console.error(`no such widget ${id} in this ui`)
    }
}
