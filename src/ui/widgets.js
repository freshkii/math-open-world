import { constants } from "../constants.js"
import { Game } from "../core/game.js"
import { Tileset } from "../world/tileset.js"
import { Ui } from "./ui.js"

export class Widget{
    /**
     * !!! One shouldn't create a widget by using this constructor, use subclass widgets instead
     * @param {Game} game - The current game
     * @param {String} id- The widget's ID
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {String} type - The widget's type
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     */
    constructor(game, id, x, y, type, rendered){
        this.game = game
        this.x = x
        this.y = y
        this.type = type
        this.id = id
        this.has_focus = false
        /** @type {Ui} */
        this.ui = null
        this.rendered = rendered
    }
    render(){}
    update_config(){}
    update(current_time){}
}

export class Label extends Widget{
    /**
     * Simple text line
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {String} text - The text content of the label
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [fontsize=5] - Label's text's fontsize
     * @param {String} [textcolor="black"] - Label's text's color
     * @param {string} [font="serif"] - Label's text's font
     */
    constructor(game, id, x, y, text, rendered, fontsize=15, textcolor="black", font="arial"){
        super(game, id, x, y, constants.LABEL_TYPE, rendered)
        this.text = text
        this.fontsize = fontsize
        this.textcolor = textcolor
        this.font = font
    }

    render(){
        if(this.rendered){
            this.game.ctx.font = `${this.fontsize}px ${this.font}`
            this.game.ctx.fillStyle = this.textcolor
            this.game.ctx.fillText(
                this.text,
                this.game.canvas.width / 2 + this.x,
                this.game.canvas.height / 2 + this.y)
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {null} [x=null] - the x coordinates of the top-left corner of the widget
     * @param {null} [y=null] - the y coordinates of the top-left corner of the widget
     * @param {String} [text = null] - The text content of the label
     * @param {null} [rendered=null] - Boolean refearing to if this widget should be rendered
     * @param {Number} [fontsize = null] - Label's text's fontsize
     * @param {String} [textcolor = null] - Label's text's color
     * @param {String} [font = null] - Label's text's font
     */
    update_config(x=null, y=null, text=null, rendered=null, fontsize=null, textcolor=null, font=null){
        if(x != null) this.x = x
        if(y != null) this.y = y
        if(text != null) this.text = text
        if(rendered != null) this.rendered = rendered
        if(fontsize != null) this.fontsize = fontsize
        if(textcolor != null) this.textcolor = textcolor
        if(font != null) this.font = font
    }
}

export class Button extends Widget{
    /**
     * An area which detects when it's being cliked on
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The button's width
     * @param {Number} height - The button's height
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {(button: Button) => void} command - Command executed when the button is being cliked, the 'button' parameter refers to the actual object, which is being clicked
     */
    constructor(game, id, x, y, width, height, rendered, command){
        super(game, id, x, y, constants.BUTTON_TYPE, rendered)
        this.width = width
        this.height = height
        this.command = command
        this.is_clicked = false
    }

    render(){
        if(this.rendered && constants.DEBUG){
            this.game.ctx.strokeStyle = "blue"
            this.game.ctx.strokeRect(
                this.game.canvas.width / 2 + this.x,
                this.game.canvas.height / 2 + this.y,
                this.width, this.height
            )
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} [x = null] - the x coordinates of the top-left corner of the widget
     * @param {Number} [y = null] - the y coordinates of the top-left corner of the widget
     * @param {Number} [width = null] - The button's width
     * @param {Number} [height = null] - The button's height
     * @param {Boolean} [rendered = null] - Boolean refearing to if this widget should be rendered
     * @param {(button: Button) => void} [command = null] - Command executed when the button is being cliked, the 'button' parameter refers to the actual object, which is being clicked
     */
    update_config(x=null, y=null, width=null, height=null, rendered=null, command=null){
        if(x != null) this.x = x
        if(y != null) this.y = y
        if(width != null) this.width = width
        if(height != null) this.height = height
        if(rendered != null) this.rendered = rendered
        if(command != null) this.command = command
    }
}

export class TextArea extends Widget{
    
    /**
     * A text input in which you can type text
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The textarea's width
     * @param {Number} height - The textarea's height
     * @param {Number} max_char_number - The maximum of character you can type in
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {(answer: String, textarea: TextArea) => void} command - Command executed when the submit method is called, 'answer' refers to what has been typed in the textarea, 'textarea' refers to the textarea itself
     * @param {Number} [fontsize=5] - The textarea's text fontsize
     * @param {String} [textcolor="black"] - The textarea's text color
     * @param {String} [font="arial"] - The textarea's text font
     * @param {String} [blink_bar="I"] - The blinking bar when the textarea is selected
     */
    constructor(game, id, x, y, width, height, max_char_number, rendered, command, fontsize=15, textcolor="black", font="arial", blink_bar="|"){
        super(game, id, x, y, constants.TEXTAREA_TYPE, rendered)
        this.width = width
        this.height = height
        this.content = ""
        this.max_char_number = max_char_number
        this.selected = false
        this.command = command
        this.fontsize = fontsize
        this.textcolor = textcolor
        this.font = font
        this.last_blink = 0
        this.has_bar = false
        this.blink_bar = blink_bar
    }

    submit(){
        this.command(this.content, this)
    }

    render(){
        if(this.rendered){
            if(constants.DEBUG){
                this.game.ctx.strokeStyle = "blue"
                this.game.ctx.strokeRect(
                    this.game.canvas.width / 2 + this.x,
                    this.game.canvas.height / 2 + this.y,
                    this.width, this.height
                )
            }
            this.game.ctx.fillStyle = this.textcolor
            this.game.ctx.font = `${this.fontsize}px ${this.font}`
            this.game.ctx.fillText(
                this.content + (this.has_bar ? this.blink_bar: ""),
                this.game.canvas.width / 2 + this.x,
                this.y + ((this.game.canvas.height + this.height) / 2) + (this.fontsize / 4)
            )
        }
    }

    update(current_time){
        if(this.has_focus){
            if(this.last_blink + 500 < current_time){
                if(this.has_bar) this.has_bar = false
                else this.has_bar = true
                this.last_blink = current_time
            }
        } else this.has_bar = false
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} [x = null] - the x coordinates of the top-left corner of the widget
     * @param {Number} [y = null] - the y coordinates of the top-left corner of the widget
     * @param {Number} [width = null] - The textarea's width
     * @param {Number} [height = null] - The textarea's height
     * @param {String} [content = null] - The textarea's content, what has been typed in it
     * @param {Number} [max_char_number = null] - The maximum of character you can type in
     * @param {Boolean} [rendered=null] - Boolean refearing to if this widget should be rendered
     * @param {(answer: String, textarea: TextArea) => void} [command = null] - Command executed when the submit method is called, 'answer' refers to what has been typed in the textarea, 'textarea' refers to the textarea itself
     * @param {Number} [fontsize = null] - The textarea's text fontsize
     * @param {String} [textcolor = null] - The textarea's text color
     * @param {String} [font = null] - The textarea's text font
     * @param {String} [blink_bar=null] - The blinking bar when the textarea is selected
     */
    update_config(x=null, y=null, width=null, height=null, content=null, max_char_number=null, rendered=null, command=null, fontsize=null, textcolor=null, font=null, blink_bar=null){
        if(x != null) this.x = x
        if(y != null) this.y = y
        if(width != null) this.width = width
        if(height != null) this.height = height
        if(max_char_number != null) this.max_char_number = max_char_number
        if(rendered != null) this.rendered = rendered
        if(content != null) this.content = content.slice(0, this.max_char_number)
        if(command != null) this.command = command
        if(fontsize != null) this.fontsize = fontsize
        if(textcolor != null) this.textcolor = textcolor
        if(font != null) this.font = font
        if(blink_bar != null) this.blink_bar = blink_bar
    }
}

export class NumberArea extends TextArea{
    /**
     * Input in which you can type only digits
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The numberarea's width
     * @param {Number} height - The numberarea's height
     * @param {Number} max_char_number - The maximum of character you can type in
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {(answer: String, numberarea: NumberArea) => void} command - Command executed when the submit method is called, 'answer' refers to what has been typed in the numberarea, 'numberarea' refers to the numberarea itself
     * @param {Number} [fontsize=5] - The numberarea's text fontsize
     * @param {String} [textcolor="black"] - The numberarea's text color
     * @param {String} [font="serif"] - The numberarea's text font
     * @param {String} [blink_bar="I"] - The blinking bar when the numberarea is selected
     */
    constructor(game, id, x, y, width, height, max_char_number, rendered, command, fontsize=15, textcolor="black", font="arial", blink_bar="I"){
        super(game, id, x, y, width, height, max_char_number, rendered, command, fontsize, textcolor, font, blink_bar)
        this.type = constants.NUMBERAREA_TYPE
    }
}

export class Icon extends Widget{
    /**
     * Image widget which uses a tileset as reference
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Tileset} tileset - The tileset from which the icon's image will be rendered
     * @param {Number} tile_nb - The image's index in the tileset
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     */
    constructor(game, id, x, y, tileset, tile_nb, rendered){
        super(game, id, x, y, constants.ICON_TYPE, rendered)
        this.tileset = tileset
        this.tile_nb = tile_nb
    }

    render(){
        if(this.rendered){
            this.tileset.drawTile(
                this.tile_nb,
                this.game.canvas.width / 2 + this.x,
                this.game.canvas.height / 2 + this.y)
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Tileset} tileset - The tileset from which the icon's image will be rendered
     * @param {Number} tile_nb - The image's index in the tileset
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     */
    update_config(x=null, y=null, tileset=null, tile_nb=null, rendered=null){
        if(x != null) this.x = x
        if(y != null) this.y = y
        if(tileset != null) this.tileset = tileset
        if(tile_nb != null) this.tile_nb = tile_nb
        if(rendered != null) this.rendered = rendered
    }
}

export class Texture extends Widget{
    /**
     * !!! One shouldn't use the constructor to make a texture widget, use the static create method instead
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The texture's width on the screen
     * @param {Number} height - The texture's height on the screen
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     */
    constructor(game, id, x, y, width, height, rendered){
        super(game, id, x, y, constants.TEXTURE_TYPE, rendered)
        this.width = width
        this.height = height
    }

    /**
     * Image widget. Unlike the Icon, it doesn't use a tileset but directly a file instead. The create method is asyn and static
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {String} src - The path to the image file used by the widget
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The texture's width on the screen
     * @param {Number} height - The texture's height on the screen
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @returns {Texture}
     */
    static async create(game, id, src, x, y, width, height, rendered){
        var texture = new Texture(game, id, x, y, width, height, rendered)
        try {
			await texture.load(src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
        return texture
    }

    /**
     * 
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

    render(){
        if(this.rendered){
            this.game.ctx.drawImage(
                this.img,
                this.game.canvas.width / 2 + this.x,
                this.game.canvas.height / 2 + this.y,
                this.width, this.height
            )
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} [x = null] - the x coordinates of the top-left corner of the widget
     * @param {Number} [y = null] - the y coordinates of the top-left corner of the widget
     * @param {Number} [width = null] - The texture's width on the screen
     * @param {Number} [height = null] - The texture's height on the screen
     * @param {Boolean} [rendered = null] - Boolean refearing to if this widget should be rendered
     */
    update_config(x=null, y=null, width=null, height=null, rendered=null){
        if(x != null) this.x = x
        if(y != null) this.y = y
        if(width != null) this.width = width
        if(height != null) this.height = height
        if(rendered != null) this.rendered = rendered
    }

    /**
     * Changes the image of the texture to an new one
     * @param {String} src - The path to the new image file
     * @returns 
     */
    async change_image(src){
        try {
			await this.load(src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
    }
}
