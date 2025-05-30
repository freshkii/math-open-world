import { config, constants } from "../constants.js";
import { Game } from "../core/game.js";
import { Resizeable } from "../utils.js";
import { Item, ItemStack } from "./items.js";
import { Ui } from "./ui.js";
import { Button, Icon, Label, Texture, Widget } from "./widgets.js";

export class Inventory extends Ui{
    /**
     * 
     * @param {Game} game 
     * @param {Array<Widget>} widgets_array 
     * @param {Number} slot_width 
     */
    constructor(game, widgets_array, slot_width){
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
        widgets_array.forEach(texture => {widgets.push(texture)})
          
        /**@type {(inv: Inventory, t: Number) => void} */
        var widgets_states_handler = (inv, t)=>{
            var hovered_texture = inv.get_widget("hovered-texture")
            var has_hovered = false
            
            for(let i = 0; i < 9; i++){
                if(inv.get_widget(`inventory-button-${i}`).is_hovered){
                    hovered_texture.update_config(
                        Inventory.get_slot_coordinates(i).x,
                        Inventory.get_slot_coordinates(i).y,
                        null, null, true
                    )
                    has_hovered = true

                    if(inv.get_slot(i)){
                        let item = inv.get_slot(i).item
                        inv.get_widget("tooltip-title-label").update_config(
                            inv.game.inputHandler.mouse_pos.x + constants.TILE_SIZE * 0.25,
                            inv.game.inputHandler.mouse_pos.y,
                            item.name, true
                        )
                        if(item.tooltip){
                            if(!inv.ids.includes("tooltip-description-0-label")){
                                for(let i=0; i< item.tooltip.length; i++){
                                    let line = item.tooltip[i]
                                    inv.add_widget(new Label(inv.game, `tooltip-description-${i}-label`,
                                        inv.game.inputHandler.mouse_pos.x + constants.TILE_SIZE * 0.25,
                                        inv.game.inputHandler.mouse_pos.y + constants.TILE_SIZE * (0.5 + i * 0.3),
                                        line, true, 4, constants.TILE_SIZE * 0.2, "white"
                                    ))
                                }
                            } else {
                                let hovered_changed = false
                                /** @type {Array<Label>} */
                                let tooltip_descriptions_label = inv.widgets.filter(
                                    widget => widget.id.endsWith("-label") && widget.id.includes("tooltip-description-")
                                )
                                for(let i=0; i< tooltip_descriptions_label.length; i++){
                                    if(tooltip_descriptions_label[i].text != item.tooltip[i])
                                        hovered_changed = true
                                }
                                if(hovered_changed){
                                    inv.erase_tooltip_description()
                                    return
                                }
                                for(let i=0; i < item.tooltip.length; i++){
                                    inv.get_widget(`tooltip-description-${i}-label`).update_config(
                                        inv.game.inputHandler.mouse_pos.x + constants.TILE_SIZE * 0.25,
                                        inv.game.inputHandler.mouse_pos.y + constants.TILE_SIZE * (0.5 + i * 0.3)
                                    )
                                }
                            }
                        } else inv.erase_tooltip_description()

                        if(!inv.ids.includes("tooltip-box-0-0-icon")){
                            let widths = [item.name.length * inv.get_widget("tooltip-title-label").fontsize.get() / 2]
                            inv.widgets.filter(
                                widget => widget.id.endsWith("-label") && widget.id.includes("tooltip-description-")
                            ).forEach(widget => {
                                widths.push(widget.text.length * widget.fontsize.get() / 2)
                            })

                            let width_nb = Math.ceil(
                                (
                                    Math.max(...widths) + constants.TILE_SIZE * 0.25
                                ) / inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get()
                            )
                            if(width_nb * inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() == Math.max(...widths) + constants.TILE_SIZE * 0.25){
                                width_nb++
                            }

                            let tooltip_height = (
                                                    item.tooltip? item.tooltip.length * (
                                                        inv.get_widget("tooltip-description-0-label").fontsize.get() + constants.TILE_SIZE * 0.3
                                                    ) - constants.TILE_SIZE * 0.3: 0
                                                ) + inv.get_widget("tooltip-title-label").fontsize.get() * 1.5
                            let height_nb = Math.ceil(
                                tooltip_height / inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get()
                            )
                            if(height_nb * inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() == tooltip_height)
                                height_nb++

                            for(let x=0; x<width_nb; x++){
                                for(let y=0; y<height_nb; y++){
                                    inv.add_widget(new Icon(
                                        inv.game, `tooltip-box-${x}-${y}-icon`,
                                        inv.game.inputHandler.mouse_pos.x + inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() * x,
                                        inv.game.inputHandler.mouse_pos.y + inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() * y,
                                        inv.game.tilesets["inventory_tooltip_tileset"],
                                        (x==0? 1: x==width_nb-1? 3: 2) + 3 * (y==0? 0: y==height_nb-1? 2: 1), true, 3
                                    ))
                                }
                            }
                        } else {
                            let widths = [item.name.length * inv.get_widget("tooltip-title-label").fontsize.get() / 2]
                            inv.widgets.filter(
                                widget => widget.id.endsWith("-label") && widget.id.includes("tooltip-description-")
                            ).forEach(widget => {
                                widths.push(widget.text.length * widget.fontsize.get() / 2)
                            })
                            
                            let width_nb = Math.ceil(
                                (
                                    Math.max(...widths) + constants.TILE_SIZE * 0.25
                                ) / inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get()
                            )
                            if(width_nb * inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() == Math.max(...widths) + constants.TILE_SIZE * 0.25){
                                width_nb++
                            }

                            let tooltip_height = (
                                                    item.tooltip? item.tooltip.length * (
                                                        inv.get_widget("tooltip-description-0-label").fontsize.get() + constants.TILE_SIZE * 0.3
                                                    ) - constants.TILE_SIZE * 0.3: 0
                                                ) + inv.get_widget("tooltip-title-label").fontsize.get() * 1.5
                            let height_nb = Math.ceil(
                                tooltip_height / inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get()
                            )
                            if(height_nb * inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() == tooltip_height)
                                height_nb++
                            
                            if(inv.ids.filter(id => id.endsWith("-icon") && id.includes("tooltip-box-")).length != width_nb * height_nb){
                                inv.erase_tooltip_box()
                                return
                            }
                            for(let x=0; x<width_nb; x++){
                                for(let y=0; y<height_nb; y++){
                                    inv.get_widget(`tooltip-box-${x}-${y}-icon`).update_config(
                                        inv.game.inputHandler.mouse_pos.x + inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() * x,
                                        inv.game.inputHandler.mouse_pos.y + inv.game.tilesets["inventory_tooltip_tileset"].screen_tile_size.get() * y - inv.get_widget("tooltip-title-label").fontsize.get() / 1.5,
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            if(!has_hovered){
                hovered_texture.rendered = false
                inv.get_widget("tooltip-title-label").rendered = false
                inv.erase_tooltip_description()
                inv.erase_tooltip_box()
            }
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
        let widgets_array = [
            await Texture.create(game, "hovered-texture",
                "inventory_hovered_tileset.png", 0, 0, slot_width, slot_width, false, 2),
            new Label(game, "tooltip-title-label", 0, 0, "", false, 4, constants.TILE_SIZE * 0.5, "white")
        ]
        for(let i=0; i<9; i++){
            widgets_array.push(await Texture.create(game, `item-texture-${i}`,
                `hovered_inventory_icon.png`, Inventory.get_slot_coordinates(i).x, Inventory.get_slot_coordinates(i).y,
                slot_width, slot_width, false, 0))
        }
        var inventory = new Inventory(game, widgets_array, slot_width)
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
        if (this.game.inputHandler.isKeyPressed("e") && this.game.inventory_unlocked) {
            if (this.game.current_ui === this) {
                this.game.current_ui = null;
            } else if (!this.game.current_ui) {
                this.game.current_ui = this;
            }
        }
        for(let i = 0; i < 9; i++){
            let slot = this.get_slot(i)
            if(slot){
                if(slot.count == 0){
                    this.get_widget(`item-texture-${i}`).rendered = false
                    this.get_widget(`item-count-${i}`).rendered = false
                    this.set_slot(i, null)
                    this.shift_items(i);
                }else{
                    this.get_widget(`item-count-${i}`).update_config(null, null, slot.count)
                    if(slot.passive){
                        slot.item.effect(slot.item, current_time)
                    }
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
            if(this.get_slot(i)?.item == item) return i
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
     * @param {ItemStack} itemstack 
     */
    add_items(itemstack){
        var slot = this.get_next_empty_slot(itemstack.item)
        this.get_widget(`item-texture-${slot}`).img = this.game.items[itemstack.item.name].img
        this.get_widget(`item-texture-${slot}`).rendered = true
        if(this.get_slot(slot) != null && this.get_slot(slot).item == itemstack.item){
            this.get_slot(slot).add_count(itemstack.count)
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

    erase_tooltip_description(){
        this.widgets = this.widgets.filter(widget => !(widget.id.endsWith("-label") && widget.id.includes("tooltip-description-")))
        this.ids = this.ids.filter(id => !(id.endsWith("-label") && id.includes("tooltip-description-")))
    }

    erase_tooltip_box(){
        this.widgets = this.widgets.filter(widget => !(widget.id.endsWith("-icon") && widget.id.includes("tooltip-box-")))
        this.ids = this.ids.filter(id => !(id.endsWith("-icon") && id.includes("tooltip-box-")))
    }
}
