import { config, constants } from "../constants.js"
import { Game } from "../core/game.js"
import { Resizeable, YResizeable } from "../utils.js"
import { Tileset } from "../world/tileset.js"
import { Ui } from "./ui.js"

export class Widget{
    /**
     * !!! One shouldn't create a widget by using this constructor, use subclass widgets instead
     * @param {Game} game - The current game
     * @param {String} id - The widget's ID
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {String} type - The widget's type
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} layer - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     */
    constructor(game, id, x, y, type, rendered, layer){
        this.game = game
        this.x = new Resizeable(game, x)
        if(y instanceof YResizeable)
            this.y = y
        else
            this.y = new Resizeable(game, y)
        this.type = type
        this.id = id
        this.layer = layer
        /** @type {Ui} */
        this.ui = null
        this.rendered = rendered
        this.is_clicked = false
        this.has_focus = false
        this.is_hovered = false
    }
    
    render(){}
    update_config(){}
    update(current_time){}

    destructor(){
        this.ui.remove_widget(this)
    }
}

export class Label extends Widget{
    /**
     * Simple text line
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {String} text - The text content of the label
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=0] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @param {Number} [fontsize=5] - Label's text's fontsize
     * @param {String} [textcolor="black"] - Label's text's color
     * @param {string} [font="arial"] - Label's text's font
     */
    constructor(game, id, x, y, text, rendered, layer=0, fontsize=15, textcolor="black", font="arial"){
        super(game, id, x, y, constants.LABEL_TYPE, rendered, layer)
        this.text = text
        this.fontsize = new Resizeable(game, fontsize)
        this.textcolor = textcolor
        this.font = font
    }

    render(){
        if(this.rendered){
            this.game.ctx.font = `${Math.round(this.fontsize.get())}px ${this.font}`
            this.game.ctx.fillStyle = this.textcolor
            this.game.ctx.fillText(
                this.text,
                this.game.canvas.width / 2 + this.x.get(),
                this.game.canvas.height / 2 + this.y.get() + this.fontsize.get() / 3)
            
            if(this.game.options_menu.debug){
                this.game.ctx.beginPath()
                this.game.ctx.arc(this.game.canvas.width / 2 + this.x.get(),
                    this.game.canvas.height / 2 + this.y.get(),
                    3, 0, Math.PI * 2)
                this.game.ctx.fillStyle = "blue"
                this.game.ctx.fill()
                
                this.game.ctx.strokeStyle = "blue"
                this.game.ctx.strokeRect(
                    this.game.canvas.width / 2 + this.x.get(),
                    this.game.canvas.height / 2 + this.y.get() - this.fontsize.get() / 2,
                    this.text.length * this.fontsize.get() / 2,
                    this.fontsize.get()
                )
            }
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} [x=null] - the x coordinates of the top-left corner of the widget
     * @param {Number} [y=null] - the y coordinates of the top-left corner of the widget
     * @param {String} [text = null] - The text content of the label
     * @param {Boolean} [rendered=null] - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=null] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @param {Number} [fontsize = null] - Label's text's fontsize
     * @param {String} [textcolor = null] - Label's text's color
     * @param {String} [font = null] - Label's text's font
     */
    update_config(x=null, y=null, text=null, rendered=null, layer=null, fontsize=null, textcolor=null, font=null){
        if(x != null) this.x.set_value(x)
        if(y != null) this.y.set_value(y)
        if(text != null) this.text = text
        if(rendered != null) this.rendered = rendered
        if(layer != null) this.layer = layer
        if(fontsize != null) this.fontsize.set_value(fontsize)
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
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The button's width
     * @param {Number | YResizeable} height - The button's height
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {(button: Button, time: Number) => void} command - Command executed when the button is being cliked, the 'button' parameter refers to the actual object, which is being clicked
     */
    constructor(game, id, x, y, width, height, rendered, command){
        super(game, id, x, y, constants.BUTTON_TYPE, rendered, null)
        this.width = new Resizeable(game, width)
        if(height instanceof YResizeable)
            this.height = height
        else
            this.height = new Resizeable(game, height)
        this.command = command
        this.should_execute = false
    }

    center_arround(x, y){
        this.x.set_value(x - this.width.get() / 2)
        this.y.set_value(y - this.height.get() / 2)
        return this
    }

    update(current_time){
        if(this.should_execute){
            this.command(this, current_time)
            this.should_execute = false
        }
    }

    render(){
        if(this.rendered && this.game.options_menu.debug){
            this.game.ctx.strokeStyle = "blue"
            this.game.ctx.strokeRect(
                this.game.canvas.width / 2 + this.x.get(),
                this.game.canvas.height / 2 + this.y.get(),
                this.width.get(), this.height.get()
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
     * @param {(button: Button, time: Number) => void} [command = null] - Command executed when the button is being cliked, the 'button' parameter refers to the actual object, which is being clicked
     */
    update_config(x=null, y=null, width=null, height=null, rendered=null, command=null){
        if(x != null) this.x.set_value(x)
        if(y != null) this.y.set_value(y)
        if(width != null) this.width.set_value(width)
        if(height != null) this.height.set_value(height)
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
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The textarea's width
     * @param {Number | YResizeable} height - The textarea's height
     * @param {Number} max_char_number - The maximum of character you can type in
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=0] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @param {Number} [fontsize=5] - The textarea's text fontsize
     * @param {String} [textcolor="black"] - The textarea's text color
     * @param {String} [font="arial"] - The textarea's text font
     * @param {String} [blink_bar="I"] - The blinking bar when the textarea is selected
     */
    constructor(game, id, x, y, width, height, max_char_number, rendered, layer, fontsize=15, textcolor="black", font="arial", blink_bar="|"){
        super(game, id, x, y, constants.TEXTAREA_TYPE, rendered, layer)
        this.width = new Resizeable(game, width)
        if(height instanceof YResizeable)
            this.height = height
        else
            this.height = new Resizeable(game, height)
        this.content = ""
        this.max_char_number = max_char_number
        this.fontsize = new Resizeable(game, fontsize)
        this.textcolor = textcolor
        this.font = font
        this.last_blink = 0
        this.has_bar = false
        this.blink_bar = blink_bar
        this.usable = true
    }

    center_arround(x, y){
        this.x.set_value(x - this.width.get() / 2)
        this.y.set_value(y - this.height.get() / 2)
        return this
    }

    render(){
        if(this.rendered){
            if(this.game.options_menu.debug){
                this.game.ctx.strokeStyle = "blue"
                this.game.ctx.strokeRect(
                    this.game.canvas.width / 2 + this.x.get(),
                    this.game.canvas.height / 2 + this.y.get(),
                    this.width.get(), this.height.get()
                )
            }
            this.game.ctx.fillStyle = this.textcolor
            this.game.ctx.font = `${Math.round(this.fontsize.get())}px ${this.font}`
            this.game.ctx.fillText(
                this.content + (this.has_bar ? this.blink_bar: ""),
                this.game.canvas.width / 2 + this.x.get(),
                this.y.get() + ((this.game.canvas.height + this.height.get()) / 2) + (this.fontsize.get() / 3)
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
     * @param {Number} [layer=null] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @param {Number} [fontsize = null] - The textarea's text fontsize
     * @param {String} [textcolor = null] - The textarea's text color
     * @param {String} [font = null] - The textarea's text font
     * @param {String} [blink_bar=null] - The blinking bar when the textarea is selected
     * @param {Boolean} [usable=null] - Boolean making the textarea unwritteable if false
     */
    update_config(x=null, y=null, width=null, height=null, content=null, max_char_number=null, rendered=null, layer=null, fontsize=null, textcolor=null, font=null, blink_bar=null, usable=null){
        if(x != null) this.x.set_value(x)
        if(y != null) this.y.set_value(y)
        if(width != null) this.width.set_value(width)
        if(height != null) this.height.set_value(height)
        if(max_char_number != null) this.max_char_number = max_char_number
        if(rendered != null) this.rendered = rendered
        if(content != null) this.content = content.slice(0, this.max_char_number)
        if(layer != null) this.layer = layer
        if(fontsize != null) this.fontsize.set_value(fontsize)
        if(textcolor != null) this.textcolor = textcolor
        if(font != null) this.font = font
        if(blink_bar != null) this.blink_bar = blink_bar
        if(usable != null) this.usable = usable
    }
}

export class NumberArea extends TextArea{
    /**
     * Input in which you can type only digits
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The numberarea's width
     * @param {Number | YResizeable} height - The numberarea's height
     * @param {Number} max_char_number - The maximum of character you can type in
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=0] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @param {Number} [fontsize=5] - The numberarea's text fontsize
     * @param {String} [textcolor="black"] - The numberarea's text color
     * @param {String} [font="arial"] - The numberarea's text font
     * @param {String} [blink_bar="I"] - The blinking bar when the numberarea is selected
     */
    constructor(game, id, x, y, width, height, max_char_number, rendered, layer=0, fontsize=15, textcolor="black", font="arial", blink_bar="I"){
        super(game, id, x, y, width, height, max_char_number, rendered, layer, fontsize, textcolor, font, blink_bar)
        this.type = constants.NUMBERAREA_TYPE
    }
}

export class Icon extends Widget{
    /**
     * Image widget which uses a tileset as reference
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Tileset} tileset - The tileset from which the icon's image will be rendered
     * @param {Number} tile_nb - The image's index in the tileset
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=0] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     */
    constructor(game, id, x, y, tileset, tile_nb, rendered, layer=0){
        super(game, id, x, y, constants.ICON_TYPE, rendered, layer)
        this.tileset = tileset
        this.tile_nb = tile_nb
    }

    center_arround(x, y){
        this.x.set_value(x - this.tileset.screen_tile_size.get() / 2)
        this.y.set_value(y - this.tileset.screen_tile_size.get() / 2)
        return this
    }

    render(){
        if(this.rendered){
            this.tileset.drawTile(
                this.tile_nb,
                this.game.canvas.width / 2 + this.x.get(),
                this.game.canvas.height / 2 + this.y.get())
            if(this.game.options_menu.debug){
                this.game.ctx.strokeStyle = "blue"
                this.game.ctx.strokeRect(
                    this.game.canvas.width / 2 + this.x.get(),
                    this.game.canvas.height / 2 + this.y.get(),
                    this.tileset.screen_tile_size.get(),
                    this.tileset.screen_tile_size.get()
                )
            }
        }
    }

    /**
     * Method used to change the widget's fields, left 'null' in order to not change the corresponding field
     * @param {Number} [x=null] - the x coordinates of the top-left corner of the widget
     * @param {Number} [y=null] - the y coordinates of the top-left corner of the widget
     * @param {Tileset} [tileset=null] - The tileset from which the icon's image will be rendered
     * @param {Number} [tile_nb=null] - The image's index in the tileset
     * @param {Boolean} [rendered=null] - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=null] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     */
    update_config(x=null, y=null, tileset=null, tile_nb=null, rendered=null, layer=null){
        if(x != null) this.x.set_value(x)
        if(y != null) this.y.set_value(y)
        if(tileset != null) this.tileset = tileset
        if(tile_nb != null) this.tile_nb = tile_nb
        if(rendered != null) this.rendered = rendered
        if(layer != null) this.layer = layer
    }
}

export class Texture extends Widget{
    /**
     * !!! One shouldn't use the constructor to make a texture widget, use the static create method instead
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The texture's width on the screen
     * @param {Number | YResizeable} height - The texture's height on the screen
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} layer - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     */
    constructor(game, id, x, y, width, height, rendered, layer){
        super(game, id, x, y, constants.TEXTURE_TYPE, rendered, layer)
        this.width = new Resizeable(game, width)
        if(height instanceof YResizeable)
            this.height = height
        else
            this.height = new Resizeable(game, height)
    }

    /**
     * Image widget. Unlike the Icon, it doesn't use a tileset but directly a file instead. The create method is asyn and static
     * @param {Game} game - The current game
     * @param {String} id - The widget's Id
     * @param {String} src - The path to the image file used by the widget
     * @param {Number} x - the x coordinates of the top-left corner of the widget
     * @param {Number | YResizeable} y - the y coordinates of the top-left corner of the widget
     * @param {Number} width - The texture's width on the screen
     * @param {Number | YResizeable} height - The texture's height on the screen
     * @param {Boolean} rendered - Boolean refearing to if this widget should be rendered
     * @param {Number} [layer=0] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     * @returns {Promise<Texture>}
     */
    static async create(game, id, src, x, y, width, height, rendered, layer=0){
        var texture = new Texture(game, id, x, y, width, height, rendered, layer)
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
        var img = null
        if(src!=null){
            img = new Image()
		    img.src = config.IMG_DIR + src
    		await new Promise((resolve, reject) => { 
	    		img.onload = resolve
		    	img.onerror = reject
		    })
        }
		this.img = img
    }

    center_arround(x, y){
        this.x.set_value(x - this.width.get() / 2)
        this.y.set_value(y - this.height.get() / 2)
        return this
    }

    render(){
        if(this.rendered && this.img != null){
            this.game.ctx.drawImage(
                this.img,
                this.game.canvas.width / 2 + this.x.get(),
                this.game.canvas.height / 2 + this.y.get(),
                this.width.get(), this.height.get()
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
     * @param {Number} [layer=null] - The layer on which the widget will be rendered, higher numbers means that the widget will be rendered on top
     */
    update_config(x=null, y=null, width=null, height=null, rendered=null, layer=null){
        if(x != null) this.x.set_value(x)
        if(y != null) this.y.set_value(y)
        if(width != null) this.width.set_value(width)
        if(height != null) this.height.set_value(height)
        if(rendered != null) this.rendered = rendered
        if(layer != null) this.layer = layer
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
