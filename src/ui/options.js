import { constants, config } from "../constants.js";
import { Game } from "../core/game.js";
import { clamp } from "../utils.js";
import { Ui } from "./ui.js";
import { Label, Button, Icon } from "./widgets.js"

export class OptionsMenu extends Ui{
    /**
     * 
     * @param {Game} game 
     */
    constructor(game){
        super(game, constants.TILE_SIZE * 6 * 0.8, constants.TILE_SIZE * 5 * 0.8, [
            new Label(game, "debug-option-label", - constants.TILE_SIZE * 1.5, - constants.TILE_SIZE,
                "Debug:", true, 1, constants.TILE_SIZE / 3),
            new Button(game, "debug-option-button", 0, 0,
                constants.TILE_SIZE / 2, constants.TILE_SIZE / 2, true,
                (button, t) => {
					button.ui.game.audioManager.playSound('menu', 'click')
                    this.debug = !this.debug
                    let checkbox = button.ui.get_widget("debug-option-checkbox-icon")
                    if(this.debug) checkbox.tile_nb = 2
                    else checkbox.tile_nb = 1
                }).center_arround(constants.TILE_SIZE, - constants.TILE_SIZE),
            new Icon(game, "debug-option-checkbox-icon", 0, 0,
                game.tilesets["checkbox_tileset"], 1, true)
                .center_arround(constants.TILE_SIZE, - constants.TILE_SIZE),

            new Label(game, "music-volume-label", -constants.TILE_SIZE * 2, -constants.TILE_SIZE / 2.5,
                "Music Volume", true, 0, constants.TILE_SIZE / 3),
            new Button(game, "music-volume-button", 0, 0,
                constants.TILE_SIZE / 2, constants.TILE_SIZE / 2, true, (b, t) => {
					b.ui.game.audioManager.playSound('menu', 'click')
				})
                .center_arround(constants.TILE_SIZE * 1.5, 0),
            new Icon(game, "music-volume-cursor-icon", 0, 0,
                game.tilesets["selection_cursor"], 1, true, 1)
                .center_arround(constants.TILE_SIZE * 1.5, 0),
            new Label(game, "sound-effect-volume-label", -constants.TILE_SIZE * 2, constants.TILE_SIZE / 1.5,
                "Sound Effects Volume", true, 0, constants.TILE_SIZE / 3),
            new Button(game, "sound-effects-volume-button", 0, 0,
                constants.TILE_SIZE / 2, constants.TILE_SIZE / 2, true, (b, t) => {
					b.ui.game.audioManager.playSound('menu', 'click')
				})
                .center_arround(constants.TILE_SIZE * 1.5, constants.TILE_SIZE),
            new Icon(game, "sound-effects-volume-cursor-icon", 0, 0,
                game.tilesets["selection_cursor"], 1, true, 1)
                .center_arround(constants.TILE_SIZE * 1.5, constants.TILE_SIZE)
        ], (ui, t) => {
            let music_volume_button = ui.get_widget("music-volume-button")
            let sound_effects_volume_button = ui.get_widget("sound-effects-volume-button")
            if(music_volume_button.is_hovered || music_volume_button.is_clicked)
                ui.get_widget("music-volume-cursor-icon").tile_nb = 2
            else
                ui.get_widget("music-volume-cursor-icon").tile_nb = 1

            if(sound_effects_volume_button.is_hovered || sound_effects_volume_button.is_clicked)
                ui.get_widget("sound-effects-volume-cursor-icon").tile_nb = 2
            else
                ui.get_widget("sound-effects-volume-cursor-icon").tile_nb = 1

            if(music_volume_button.is_clicked){
                music_volume_button.center_arround(clamp(ui.game.inputHandler.mouse_pos.x,
                    - constants.TILE_SIZE * 1.5, constants.TILE_SIZE * 1.5), 0)

                ui.get_widget("music-volume-cursor-icon").x.set_value(music_volume_button.x.get())
                this.music_volume = Math.abs(Math.round((music_volume_button.x.get() +
                                        music_volume_button.width.get() / 2 +
                                        constants.TILE_SIZE * 1.5) / (constants.TILE_SIZE * 3) * 100))
				this.game.audioManager.setMusicVolume(this.music_volume)
            }
            if(sound_effects_volume_button.is_clicked){
                sound_effects_volume_button.center_arround(clamp(ui.game.inputHandler.mouse_pos.x,
                    - constants.TILE_SIZE * 1.5, constants.TILE_SIZE * 1.5), constants.TILE_SIZE)
                    
                ui.get_widget("sound-effects-volume-cursor-icon").x.set_value(sound_effects_volume_button.x.get())
                this.sound_effects_volume = Math.abs(Math.round((sound_effects_volume_button.x.get() +
                                                sound_effects_volume_button.width.get() / 2 +
                                                constants.TILE_SIZE * 1.5) / (constants.TILE_SIZE * 3) * 100))
				this.game.audioManager.setSoundVolume(this.sound_effects_volume)
            }
            game.audioManager.setMusicVolume(this.music_volume / 100)
            game.audioManager.setSoundVolume(this.sound_effects_volume / 100)
            if(this.game.inputHandler.isKeyPressed("escape")) this.is_finished = true
        })
        this.debug = true 
        this.music_volume = 100
        this.sound_effects_volume = 100
    }

    /**
     * 
     * @param {Game} game 
     * @returns {Promise<OptionsMenu>}
     */
    static async create(game){
        var options = new OptionsMenu(game)
        let src = "options_menu.png"
        try {
            await options.load(config.IMG_DIR + src)
        } catch (error) {
            console.error(`couldn't load file "${src}" : ${error.message}`)
            return
        }
        return options
    }
}
