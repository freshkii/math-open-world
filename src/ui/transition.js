import { config } from "../constants.js"
import { Game } from "../core/game.js"
import { Tileset } from "../world/tileset.js"

export class Transition{
    /**
     * !!! One shouldn't create a transition by using this constructor, use subclass transtions instead
     * @param {Game} game - The current game
     * @param {Number} duration - The duration of the transition
     * @param {(transition: Transition) => void} on_end - The function executed when the transition is finished, allows for scripts or ui to follow
     */
    constructor(game, duration, on_end){
        this.game = game
        this.duration = duration
        this.on_end = on_end
        this.is_finished = false
    }

    /**
     * 
     * @param {Number} time 
     */
    start(time){
        this.start_time = time
        this.game.current_ui = this
    }

    trigger(){
        this.start_time = null
        this.game.current_ui = this
    }

    /**
     * 
     * @param {Number} current_time 
     */
    update(current_time){
        if(this.start_time + this.duration < current_time){
            this.is_finished = true
            this.on_end(this)
        }
    }

    render(){}
}

export class UnicoloreTransition extends Transition{

    /**
     * 
     * @param {Game} game - The current game
     * @param {Number} duration - The duration of the transition
     * @param {String} color - The color of the screen during the transition
     * @param {(transition: UnicoloreTransition) => void} [on_end = (t) => {}] - The function executed when the transition is finished, allows for scripts or ui to follow
     */
    constructor(game, duration, color, on_end=(t) => {}){
        super(game, duration, on_end)
        this.color = color
    }

    render(){
        this.game.ctx.fillStyle = this.color
        this.game.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height)
    }
}

export class ImageTransition extends Transition{
    /**
     * !!! One shouldn't use the constructor to make a ImageTransition, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number} duration - The duration of the transition
     * @param {String} color - The color of the screen during the transition
     * @param {(t: ImageTransition) => void} [on_end=(t) => {}] - The function executed when the transition is finished, allows for scripts or ui to follow
     */
    constructor(game, duration, on_end=(t) => {}){
        super(game, duration, on_end)
    }

    /**
     * 
     * @param {Game} game - The current game
     * @param {Number} duration - The duration of the transition
     * @param {String} src - The source of the transition's image
     * @param {String} color - The color of the screen during the transition
     * @param {(t: ImageTransition) => void} [on_end=(t) => {}] - The function executed when the transition is finished, allows for scripts or ui to follow
     * @returns {Promise<ImageTransition>}
     */
    static async create(game, duration, src, on_end=(t) => {}){
        var transition = new ImageTransition(game, duration, on_end)
        try{
            await transition.load(config.IMG_DIR + src)
        }catch (error){
            console.error(`Couldn't load file "${src}": ${error.message}`)
            throw new Error(`Failed to load tileset image: ${error.message}`)
        }
        return transition
    }

    async load(src){
        const img = new Image()
        img.src = src
        this.img = img

        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        })
    }

    render(){
        this.game.ctx.drawImage(this.img, 0, 0, this.game.canvas.width, this.game.canvas.height)
    }
}

export class AnimatedTransition extends Transition{
    /**
     * 
     * @param {Game} game - The current game
     * @param {Number} duration - The duration of the transition
     * @param {Tileset} tileset - The tileset utilized to animating the transition
     * @param {Number} framerate - The duration of one frame
     * @param {Array<Number>} frame_order - The order in which the frame will be rendered
     * @param {Transition} background - The transition used as a background for this one
     * @param {(t: AnimatedTransition) => void} [on_end=(t) => {}] - The function executed when the transition is finished, allows for scripts or ui to follow
     */
    constructor(game, duration, tileset, framerate, frame_order, background, on_end=(t) => {}){
        super(game, duration, on_end)
        this.tileset = tileset
        this.framerate = framerate
        this.frame_order = frame_order
        this.background = background
        this.last_frame = 0
        this.current_frame = 0
    }

    update(current_time){
        super.update(current_time)
        this.background.update(current_time)
        if(current_time - this.last_frame >= this.framerate){
			this.current_frame++
			this.last_frame_time = current_time
		}
    }

    render(){
        this.background.render()
        this.tileset.drawTile(this.frame_order[this.current_frame % this.frame_order.length],
            this.game.canvas.width / 2 - this.tileset.screen_tile_size.get() / 2,
            this.game.canvas.height / 2 - this.tileset.screen_tile_size.get() / 2,
        )
    }
}
