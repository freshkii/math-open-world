import { config } from "../constants.js"
import { Game } from "../core/game.js"
import { Hitbox } from "../entities/hitbox.js"
import { Talkable } from "../entities/talkable.js"
import { Resizeable, YResizeable } from "../utils.js"
import { Widget } from "./widgets.js"

export class Ui {
    /**
     * !!! One shouldn't use the constructor to make an ui, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number | Resizeable | YResizeable} width - The Ui's width on the screen
     * @param {Number | Resizeable | YResizeable} height - The Ui's height on the screen
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(ui: Ui, time: Number) => void} widgets_states_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     */
    constructor(game, width, height, widgets, widgets_states_handler){
        this.game = game
        if(width instanceof YResizeable || width instanceof Resizeable)
            this.width = width
        else
            this.width = new Resizeable(game, width)
        if(height instanceof YResizeable || height instanceof Resizeable)
            this.height = height
        else
            this.height = new Resizeable(game, height)
        this.source = null
        /** @type {Array<Widget>} */
        this.widgets = widgets
        this.sort_widgets()
        /** @type {Array<String>} */
        this.ids = []
        this.widgets.forEach((widget) => {
            if(this.ids.includes(widget.id))
                console.error(`widget with id ${widget.id} already registered, this may cause widget traceabilty issues`)
            widget.ui = this
            this.ids.push(widget.id)
        })
        /** @type {Array<Widget>} */
        this.focused_widgets = []
        this.is_finished = false
        this.widgets_states_handler = widgets_states_handler
    }

    /**
     * Method used to build an ui. This method is async and static
     * @param {Game} game - The current game
     * @param {String} src - The path to the image used used as a background for the ui
     * @param {Number} width - The Ui's width on the screen
     * @param {Number} height - The Ui's height on the screen
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(ui: Ui, time: Number) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     * @returns {Promise<Ui>}
     */
    static async create(game, src, width, height, widgets, widgets_state_handler){
        const ui = new Ui(game, width, height, widgets, widgets_state_handler)
        try {
			await ui.load(config.IMG_DIR + src)
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
            (this.game.canvas.width - this.width.get()) / 2,
            (this.game.canvas.height - this.height.get()) / 2,
            this.width.get(), this.height.get()
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
        this.widgets_states_handler(this, current_time)
        this.widgets.forEach(widget => {
            widget.update(current_time)
        })
    }

    /**
     * 
     * @param {Widget} widget 
     */
    add_widget(widget){
        if(this.ids.includes(widget.id)){
            console.error(`widget with id ${widget.id} already registered, this may cause widget traceabilty issues`)
        }else{
            this.ids.push(widget.id)
            this.widgets.push(widget)
            widget.ui = this
            this.sort_widgets()
        }
    }

    /**
     * 
     * @param {Widget} widget 
     */
    remove_widget(widget){
        if(this.ids.includes(widget.id)){
            this.widgets.splice(this.widgets.indexOf(widget), 1)
            this.ids.splice(this.ids.indexOf(widget.id), 1)
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
        var matching_widget = null
        if(this.ids.includes(id)){
            this.widgets.forEach(widget => {
                if (widget.id == id)
                    matching_widget = widget
            })
            return matching_widget
        }
        else
            console.error(`no such widget ${id} in this ui`)
    }

    sort_widgets(){
        this.widgets.sort((a, b) => {
            if(a.layer == null){
                if(b.layer == null)
                    return 0
                else
                    return 1
            } else if(b.layer == null) return -1
            else {
                return a.layer - b.layer
            }
        })
    }

    /**
     * 
     * @param {(widget: Widget) => boolean} condition 
     */
    unfocus(condition=null){
        if(condition == null)
            condition = (w) => true

        let removed_widgets = []
        this.focused_widgets.forEach(widget => {
            if(condition(widget))
                removed_widgets.push(widget)
        })
        removed_widgets.forEach(widget => {
            this.focused_widgets.splice(this.focused_widgets.indexOf(widget), 1)
            widget.has_focus = false
        })
    }
}
