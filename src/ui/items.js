import { config } from "../constants.js"
import { Game } from "../core/game.js"
import { slice } from "../utils.js"

export class Item{
    /**
     * 
     * @param {Game} game 
     * @param {String} name 
     */
    constructor(game, name){
        this.game = game
        this.name = name
        this.game.items[name] = this
        /** @type {Array<String>} */
        this.tooltip = null
    }

    static async create(game, src, name){
        let item = new Item(game, name)
        try{
            item.load(config.IMG_DIR + src)
        } catch (error){
            console.error(`Couldn't load file "${src}": ${error.message}`);
        }
        return item
    }

    async load(src){
        const img = new Image();
        img.src = src;
        this.img = img;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        });
    }

    /**
     * 
     * @param {String} tooltip 
     * @returns {Item}
     */
    set_tooltip(tooltip){
        this.tooltip = slice(tooltip, 35)
        return this
    }
}

export class Consumable extends Item{
    /**
     * 
     * @param {Game} game 
     * @param {String} name 
     * @param {(consumable: Consumable, time: Number) => void} on_use 
     */
    constructor(game, name, on_use){
        super(game, name)
        this.on_use = on_use
    }

    /**
     * 
     * @param {Game} game 
     * @param {String} src 
     * @param {String} name 
     * @param {(consumable: Consumable, time: Number) => void} on_use 
     * @returns {Promise<Consumable>}
     */
    static async create(game, src, name, on_use){
        let consumable = new Consumable(game, name, on_use)
        try{
            consumable.load(config.IMG_DIR + src)
        } catch (error){
            console.error(`Couldn't load file "${src}": ${error.message}`);
        }
        return consumable
    }
}

export class Passive extends Item{
    /**
     * 
     * @param {Game} game 
     * @param {String} name 
     * @param {(passive: Passive, time: Number) => void} effect 
     */
    constructor(game, name, effect){
        super(game, name)
        this.effect = effect
    }

    /**
     * 
     * @param {Game} game 
     * @param {String} src 
     * @param {String} name 
     * @param {(passive: Passive, time: Number) => void} effect 
     * @returns {Promise<Passive>}
     */
    static async create(game, src, name, effect){
        let passive = new Passive(game, name, effect)
        try{
            passive.load(config.IMG_DIR + src)
        } catch (error){
            console.error(`Couldn't load file "${src}": ${error.message}`);
        }
        return passive
    }
}

export class ItemStack{

    /**
     * 
     * @param {Item} item 
     * @param {Number} count
     */
    constructor(item, count){
        this.game = item.game
        this.item = item
        this.count = count
        this.consumable = (item instanceof Consumable)
        this.passive = (item instanceof Passive)
    }

    /**
     * 
     * @param {Number} n 
     */
    add_count(n){
        if(this.count < -n) console.error("Negative item count")
        this.count += n
    }
}
