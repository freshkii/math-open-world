import { config, constants } from "../constants.js"
import { Game } from "../core/game.js"
import { Resizeable, slice, YResizeable } from "../utils.js"
import { Tileset } from "../world/tileset.js"
import { Ui } from "./ui.js"
import { Button, Icon, Label } from "./widgets.js"

export class Dialogue extends Ui{

    /**
     * !!! One shouldn't use the constructor to make an dialogue, use the static create method instead
     * @param {Game} game 
     * @param {String} text 
     * @param {Tileset} arrow_tileset 
     * @param {(d: Dialogue) => void} on_end 
     * @param {Number} fontsize 
     * @param {String} textcolor 
     * @param {string} font 
     */
    constructor(game, text, arrow_tileset, on_end, fontsize, textcolor, font){
        var widgets = [new Label(game, "dialogue-content",
            - game.canvas.width / 2.25, new YResizeable(game, game.canvas.height * 0.4), "",
            true, 0, fontsize, textcolor, font),
            new Button(game, "new-line-button",
                - game.canvas.width / 2, new YResizeable(game, - game.canvas.height / 2), game.canvas.width, new YResizeable(game, game.canvas.height),
                true, (button, t) => button.ui.next()),
            new Icon(game, "arrow-icon", game.canvas.width / 9 * 4, new YResizeable(game, game.canvas.height / 9 * 4),
                arrow_tileset, 1, false, 0)
        ]

        var widgets_states_handler = (dialogue, time) => {

        }

        super(game, game.canvas.width, new YResizeable(game, game.canvas.height), widgets, widgets_states_handler)

        this.text = text
        this.on_end = on_end
        this.last_time = 0
        
        this.sentences = slice(text, Math.round(1.75 * this.game.canvas.width / fontsize))
        this.sentence = 0
    }

    /**
     * Method used to build an dialogue. This method is async and static
     * @param {Game} game - The dialogue's game
     * @param {String} src - The dialogue's background's path
     * @param {String} text - The content of the dialogue
     * @param {(d: Dialogue) => void} [on_end = (d: Dialogue) => {}] - The command executed at the end of the dialogue
     * @param {Number} fontsize - Dialogue's text's font size
     * @param {String} [textcolor="black"] - Dialogue's text's color
     * @param {string} [font="arial"] - Dialogue's text's font
     * @returns {Promise<Dialogue>}
     */
    static async create(game, src, text, on_end=(d) => {}, fontsize=15, textcolor="black", font="arial"){
        const dialogue = new Dialogue(game, text, game.tilesets["arrow"], on_end, fontsize, textcolor, font)
        try {
			await dialogue.load(config.IMG_DIR + src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return dialogue
    }

    update(current_time){
        super.update(current_time)
        if(current_time - this.last_time < 80) return
        this.last_time = current_time
        if(this.game.inputHandler.isKeyPressed("enter"))
            this.next()
        /** @type {Label} */
        var label = this.get_widget("dialogue-content")
        if(label.text == this.sentences[this.sentence]) return
        label.text = label.text+this.sentences[this.sentence].at(label.text.length)

        if(label.text == this.sentences[this.sentence])
            this.get_widget("arrow-icon").rendered = true
        else
            this.get_widget("arrow-icon").rendered = false
    }

    next(){
        /** @type {Label} */
        var label = this.get_widget("dialogue-content")
        if(label.text != this.sentences[this.sentence]){
            label.text = this.sentences[this.sentence]
            this.get_widget("arrow-icon").rendered = true
            return
        }
        if(this.sentence + 1 == this.sentences.length){
            this.is_finished = true
            this.sentence = 0
            label.text = ""
            this.on_end(this)
            return
        }
        this.sentence += 1
        label.text = ""
    }
}

export class QuestionDialogue extends Ui {
    /**
     * !!! One shouldn't use the constructor to make an dialogue, use the static create method instead
     * @param {Game} game 
     * @param {String} text 
     * @param {Tileset} arrow_tileset 
     * @param {Array<String>} anwsers 
     * @param {Number} anwsers_x 
     * @param {Number} anwsers_y 
     * @param {Number} anwsers_width 
     * @param {Number} anwsers_height 
     * @param {Tileset} anwser_box_tileset 
     * @param {(d: Dialogue, a: String) => void} on_end 
     * @param {Number} fontsize 
     * @param {String} textcolor 
     * @param {string} font 
     */
    constructor(game, text, arrow_tileset, anwsers, anwsers_x, anwsers_y, anwsers_width, anwsers_height, anwser_box_tileset, on_end, fontsize, textcolor, font){
        var widgets = [new Label(game, "dialogue-content",
            - game.canvas.width / 2.25, new YResizeable(game, game.canvas.height * 0.4), "",
            true, 0, fontsize, textcolor, font),
            new Button(game, "new-line-button",
                - game.canvas.width / 2, new YResizeable(game, - game.canvas.height / 2), game.canvas.width, new YResizeable(game, game.canvas.height),
                true, (button, t) => button.ui.next()),
            new Icon(game, "arrow-icon", game.canvas.width / 9 * 4, new YResizeable(game, game.canvas.height / 9 * 4),
                arrow_tileset, 1, false, 0)
        ]

        for(let i = 0; i < anwsers.length; i++){

            for(let j = 0; j < anwsers_width/anwsers_height; j++){
                let tile_nb = i == 0? 7: i + 1 == anwsers.length? 1: 4
                tile_nb += j == 0? 0: j + 1 >= anwsers_width/anwsers_height? 2: 1
                widgets.push(new Icon(game, `anwsers-box-icon-${i}-${j}`,
                    anwsers_x + j * anwsers_height, new YResizeable(game, anwsers_y - ((i + 1) * anwsers_height)), anwser_box_tileset, tile_nb, false, 0))
            }

            widgets.push(
				new Button(game, "anwser-button-"+i.toString(),
					anwsers_x, new YResizeable(game, anwsers_y - ((i + 1) * anwsers_height)), anwsers_width, new YResizeable(game, anwsers_height), false,
					(button, t) => {
						if(!button.has_focus) return
						if(button.ui.sentence + 1 != button.ui.sentences.length || button.ui.get_widget("dialogue-content").text != button.ui.sentences[button.ui.sentence]) return
						let anwser_number = parseInt(button.id.split("-").at(-1))
						button.ui.is_finished = true
						button.ui.on_end(button.ui, button.ui.anwsers[anwser_number])
					}
				)
			)

            widgets.push(new Label(game, "anwser-label-"+i.toString(),
                anwsers_x * 1.05, new YResizeable(game, anwsers_y - ((i + 0.5) * anwsers_height)), anwsers[i], false, 1, fontsize, textcolor, font
            ))

            widgets.push(new Icon(game, "anwser-arrow-"+i.toString(),
            anwsers_x + anwsers_width - arrow_tileset.screen_tile_size.get(), new YResizeable(game, anwsers_y - ((i + 0.75) * anwsers_height)), arrow_tileset, 4, false, 1))
        }

        var widgets_states_handler = (dialogue, time) => {
            for(let i = 0; i < anwsers.length; i++){
                if(dialogue.get_widget("anwser-button-"+i.toString()).has_focus){
                    dialogue.get_widget("anwser-arrow-"+i.toString()).rendered = true
                } else {
                    dialogue.get_widget("anwser-arrow-"+i.toString()).rendered = false
                }
            }
        }

        super(game, game.canvas.width, new YResizeable(game, game.canvas.height), widgets, widgets_states_handler)

        this.text = text
        this.anwsers = anwsers
        this.on_end = on_end
        this.last_time = 0

        this.anwser_box_ratio = anwsers_width/anwsers_height
        
        this.sentences = slice(text, Math.round(1.75 * this.game.canvas.width / fontsize))
        this.sentence = 0

        game.resizeables.push(this)
    }

    /**
     * Method used to build an dialogue. This method is async and static
     * @param {Game} game - The dialogue's game
     * @param {String} src - The dialogue's background's path
     * @param {String} text - The content of the dialogue
     * @param {Array<String>} anwsers - The possible anwsers to the question
     * @param {Number} anwsers_x - The anwsers' box's bottom left corner's x coordinate
     * @param {Number} anwsers_y - The anwsers' box's bottom left corner's y coordinate
     * @param {Number} anwsers_width - The width of the anwsers' box
     * @param {Number} anwsers_height - The height of one anwser in the anwsers' box
     * @param {String} anwser_box_tileset_src - The box drawing tileset's path
     * @param {(d: Dialogue, anwser: String) => void} [on_end = (d: Dialogue, a: String) => {}] - The command executed at the end of the dialogue, 'anwser' refers to the anwser that have been chosen by the player
     * @param {number} [fontsize=15] - Dialogue's text's font size
     * @param {String} [textcolor="black"] - Dialogue's text's color
     * @param {string} [font="arial"] - Dialogue's text's font
     * @returns {Promise<Dialogue>}
     */
    static async create(game, src, text, anwsers, anwsers_x, anwsers_y, anwsers_width, anwsers_height, anwser_box_tileset_src, on_end=(d, a) => {}, fontsize=15, textcolor="black", font="arial"){
        anwsers_width = Math.round(anwsers_width)
        anwsers_height = Math.round(anwsers_height)
        let anwser_box_tileset = await Tileset.create(game, anwser_box_tileset_src, 16, 0, 0)
        anwser_box_tileset.screen_tile_size = new YResizeable(game, anwsers_height)
        const dialogue = new QuestionDialogue(game, text, game.tilesets["arrow"], anwsers, anwsers_x, anwsers_y, anwsers_width, anwsers_height, anwser_box_tileset, on_end, fontsize, textcolor, font)
        try {
			await dialogue.load(config.IMG_DIR + src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return dialogue
    }

    update(current_time){
        super.update(current_time)

        if(current_time - this.last_time < 80) return
        this.last_time = current_time

        if(this.game.inputHandler.isKeyPressed("enter")){
            this.next()
            if(this.focused_widgets.length > 1){
                let selected_awnser = this.focused_widgets.filter(widget => widget != this.get_widget("new-line-button"))[0]
                selected_awnser.command(selected_awnser, current_time)
            }
        }
        /** @type {Label} */
        var label = this.get_widget("dialogue-content")
        
        if(label.text == this.sentences[this.sentence]) return
        label.text = label.text+this.sentences[this.sentence].at(label.text.length)

        if(label.text == this.sentences[this.sentence]){

            this.get_widget("arrow-icon").rendered = true
        
            if(this.sentence + 1 == this.sentences.length){
                
                this.get_widget("arrow-icon").rendered = false

                for(let i = 0; i < this.anwsers.length; i++){
                    this.get_widget("anwser-button-"+i.toString()).rendered = true
                    this.get_widget("anwser-label-"+i.toString()).rendered = true
                    for(let j = 0; j < this.anwser_box_ratio; j++){
                        this.get_widget(`anwsers-box-icon-${i}-${j}`).rendered = true
                    }
                }
            }
        } else {
            this.get_widget("arrow-icon").rendered = false
        }
    }

    next(){
        /** @type {Label} */
        var label = this.get_widget("dialogue-content")
        if(label.text != this.sentences[this.sentence]){
            label.text = this.sentences[this.sentence]

            this.get_widget("arrow-icon").rendered = true

            if(this.sentence + 1 == this.sentences.length){

                this.get_widget("arrow-icon").rendered = false

                for(let i = 0; i < this.anwsers.length; i++){
                    this.get_widget("anwser-button-"+i.toString()).rendered = true
                    this.get_widget("anwser-label-"+i.toString()).rendered = true
                    for(let j = 0; j < this.anwser_box_ratio; j++){
                        this.get_widget(`anwsers-box-icon-${i}-${j}`).rendered = true
                    }
                }
            }

            return
        }
        if(this.sentence + 1 == this.sentences.length) return
        this.sentence += 1
        label.text = ""
    }

    resize(d){
        var anwsers_width = this.get_widget("anwser-button-0").width.get()
        var anwsers_height = this.get_widget("anwser-button-0").height.get()
        var anwsers_x = this.get_widget("anwser-button-0").x.get()
        var anwsers_y = this.get_widget("anwser-button-0").y.get() + anwsers_height
        var anwser_box_tileset = this.get_widget("anwsers-box-icon-0-0").tileset
        var anwser_box_rendering = this.sentence + 1 == this.sentences.length && this.get_widget("dialogue-content").text == this.sentences[this.sentence]
    
        /** @type {Array<Widget>} */
        let icon_widgets = []
        this.widgets.forEach(widget => {
            if(widget.id.startsWith("anwsers-box-icon-"))
                icon_widgets.push(widget)
        })
        icon_widgets.forEach(widget => {
            widget.destructor()
        })


        for(let i = 0; i < this.anwsers.length; i++){
            for(let j = 0; j < anwsers_width/anwsers_height; j++){
                let tile_nb = i == 0? 7: i + 1 == this.anwsers.length? 1: 4
                tile_nb += j == 0? 0: j + 1 >= anwsers_width/anwsers_height? 2: 1
                this.add_widget(new Icon(this.game, `anwsers-box-icon-${i}-${j}`,
                    anwsers_x + j * anwsers_height, new YResizeable(this.game, anwsers_y - ((i + 1) * anwsers_height)), anwser_box_tileset, tile_nb, anwser_box_rendering, 0))
            }
        }
    }
}
