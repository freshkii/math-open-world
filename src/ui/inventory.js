import { config, constants } from "../constants.js";
import { Game } from "../core/game.js";
import { Resizeable } from "../utils.js";
import { Item, ItemStack } from "./items.js";
import { Ui } from "./ui.js";
import { Button, Label, Texture, Widget } from "./widgets.js";

export class Inventory extends Ui{
    /**
     * 
     * @param {Game} game 
     * @param {Array<Texture>} textures_array 
     * @param {Texture} hovered_texture 
     * @param {Number} slot_width 
     */
    constructor(game, textures_array, hovered_texture, slot_width){
        /**@type {Array<Widget>} */
        var widgets = []
        for(let i=0; i<9; i++){
            widgets.push(new Button(game, `inventory-button-${i}`,
                Inventory.get_slot_coordinates(i).x, Inventory.get_slot_coordinates(i).y,
                slot_width, slot_width, true,
                (b, time) => {
                    const itemstack = this.get_slot(i);       
                    if (itemstack && itemstack.consumable) {
                        itemstack.add_count(-1)
                        const countLabel = this.get_widget(`item-count-${i}`)
                        countLabel.text = `${itemstack.count}`
                        itemstack.item.on_use(itemstack.item, time)
                    }
                }
            ))
            widgets.push(new Label(game,`item-count-${i}`,Inventory.get_slot_coordinates(i).x + constants.TILE_SIZE*0.72,
                                    Inventory.get_slot_coordinates(i).y + constants.TILE_SIZE*0.80, '0',
                                    false, 1, constants.TILE_SIZE / 2, 'white', 'Impact', true))
        }
        textures_array.forEach(texture => {widgets.push(texture)})
        widgets.push(hovered_texture)
          
        /**@type {(inv: Inventory, t: Number) => void} */
        var widgets_states_handler = (inv, t)=>{
            var hovered_texture = inv.get_widget("hovered-texture")
            var has_hovered = false
            
            for(let i = 0; i < 9; i++){
                if(inv.get_widget(`inventory-button-${i}`).is_hovered){
                    hovered_texture.update_config(Inventory.get_slot_coordinates(i).x, Inventory.get_slot_coordinates(i).y, null, null, true)
                    has_hovered = true
                }
            }
            
            if(!has_hovered)
                hovered_texture.rendered = false
        }
        var inventory_side = new Resizeable(game, game.canvas.width / 2.6)
        super(game, inventory_side, inventory_side, widgets, widgets_states_handler)
        this.slot_width = slot_width
        /** @type {Array<Array<ItemStack>>} */
        this.itemstacks = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ]
    }

    /**
     * 
     * @param {Game} game 
     * @param {String} src 
     * @returns {Promise<Inventory>}
     */
    static async create(game, src){
        let slot_width = constants.TILE_SIZE * 1.05
        let hovered_texture = await Texture.create(game, "hovered-texture",
            "inventory_hovered_tileset.png", 0, 0, slot_width, slot_width, false)
        let textures_array = []
        for(let i=0; i<9; i++){
            textures_array.push(await Texture.create(game, `item-texture-${i}`,
                `hovered_inventory_icon.png`, Inventory.get_slot_coordinates(i).x, Inventory.get_slot_coordinates(i).y,
                slot_width, slot_width, false, 0))
        }
        var inventory = new Inventory(game, textures_array, hovered_texture, slot_width)
        try{
            await inventory.load(config.IMG_DIR + src)
        }catch (error){
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
        }
        return inventory
    }

    update(current_time) {    //update_config(x=null, y=null, width=null, height=null, rendered=null, command=null)
        super.update(current_time)
        if (this.game.inputHandler.isKeyPressed("e")) {
            if (this.game.current_ui === this) {
                this.game.current_ui = null;
            } else if (!this.game.current_ui) {
                this.game.current_ui = this;
            }
        }
        for(let i = 0; i < 9; i++){
            if(this.get_slot(i)){
                if(this.get_slot(i).count == 0){
                    this.get_widget(`item-texture-${i}`).rendered = false
                    this.get_widget(`item-count-${i}`).rendered = false
                    this.set_slot(i, null)
                    this.shift_items(i);
                }else{
                    this.get_widget(`item-count-${i}`).update_config(null, null, this.get_slot(i).count)
                }
            }
        }
    }

    /**
     * 
     * @param {Item} item 
     * @returns {Number}
     */
    get_next_empty_slot(item){
        for(let i = 0; i < 9; i++){
            if(this.get_slot(i) != null && this.get_slot(i).item == item) return i
        }
        for(let i = 0; i < 9; i++){
            if(this.get_slot(i) == null) return i
        }
    }

    /**
     * 
     * @param {Number} n 
     * @returns {ItemStack}
     */
    get_slot(n){
        return this.itemstacks[Math.floor(n / 3)][n % 3]
    }

    /**
     * 
     * @param {Number} n 
     * @param {ItemStack} itemstack 
     */
    set_slot(n, itemstack){
        this.itemstacks[Math.floor(n / 3)][n % 3] = itemstack
    }

    /**
     * 
     * @param {Number} n 
     * @returns {{x: Number; y: Number}}
     */
    static get_slot_coordinates(n){
        let gap = constants.TILE_SIZE / 16
        let width = constants.TILE_SIZE * 1.05
        return {
			x: (n % 3) * (width + gap) - 1.5 * width - gap,
            y: (Math.floor(n / 3)) * (width + gap) - 1.5 * width - gap
		}
    }

    /**
     * 
     * @param {Array<ItemStack>} itemstacks 
     */
    add_items(itemstacks){
        for(let n = 0; n < itemstacks.length; n++){
            let itemstack = itemstacks[n]
            var slot = this.get_next_empty_slot(itemstack.item)
            this.get_widget(`item-texture-${slot}`).img = this.game.items[itemstack.item.name].img
            this.get_widget(`item-texture-${slot}`).rendered = true
            if(this.get_slot(n) != null && this.get_slot(n).item == itemstack.item){
                this.get_slot(n).add_count(itemstack.count)
            }else{
                this.set_slot(slot, itemstack)
            }
            let countLabel = this.get_widget(`item-count-${slot}`);
            countLabel.text = itemstack.count.toString();
            if (itemstack.consumable && itemstack.count >= 1) {
                countLabel.rendered = true;
            }
            else {
                countLabel.rendered = false;
            }
        }
    }

    shift_items(startIndex) {
    for (let i = startIndex; i < 8; i++) { 
        let nextSlot = this.get_slot(i + 1);
        if (nextSlot) {
            this.set_slot(i, nextSlot);
            this.get_widget(`item-texture-${i}`).img = this.get_widget(`item-texture-${i + 1}`).img;
            this.get_widget(`item-texture-${i}`).rendered = true;
            this.get_widget(`item-count-${i}`).text = this.get_widget(`item-count-${i+1}`).text;
            this.set_slot(i + 1, null);
            this.get_widget(`item-texture-${i + 1}`).rendered = false;
            this.get_widget(`item-count-${i+1}`).rendered=false
            if (!this.get_slot(i).consumable) {
                this.get_widget(`item-count-${i}`).rendered = false;
            }
            else {
                this.get_widget(`item-count-${i}`).rendered = true
            }
        } else {
            break;
        }
    }}
}
