import { Map } from '../world/map.js'
import { Tileset } from '../world/tileset.js'
import { Player } from '../entities/player.js'
import { InputHandler } from './inputHandler.js'
import { Entity } from '../entities/entity.js'
import { Hitbox } from '../entities/hitbox.js'
import { Problem } from '../ui/problem.js'
import { Attack } from '../entities/attack.js'
import { Ui } from '../ui/ui.js'
import { Button, Icon, Label, NumberArea, TextArea, Texture } from '../ui/widgets.js'
import { Talkable } from '../entities/talkable.js'
import { config, constants } from "../constants.js"
import { Transition, UnicoloreTransition } from '../ui/transition.js'

export class Game {
	constructor() {
		// setup canvas & context
		/** @type {HTMLCanvasElement} */
		this.canvas = document.getElementById('game')
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight

		/** @type {CanvasRenderingContext2D} */
		this.ctx = this.canvas.getContext('2d')
		this.ctx.imageSmoothingEnabled = false

		document.addEventListener('resize', () => {
			this.canvas.width = window.innerWidth
			this.canvas.height = window.innerHeight

			/** @type {CanvasRenderingContext2D} */
			this.ctx = this.canvas.getContext('2d')
			this.ctx.imageSmoothingEnabled = false
		})

		// prevent right-click (as it provokes bugs)
		document.addEventListener('contextmenu', (event) => {
			event.preventDefault()
		})

		// initialize attributes
		/** @type {Array<Hitbox>} */
		this.hitboxes = []
		/** @type {Array<Hitbox>} */
		this.collision_hitboxes = []
		/** @type {Array<Hitbox>} */
		this.combat_hitboxes = []

		/** @type {Array<Entity>} */
		this.entities = []
		/** @type {Array<Attack>} */
		this.attacks = []

		/** @type {Array<Talkable>} */
		this.talkables = []

		/** @type {Ui | Transition} */
		this.current_ui = null

		this.camera = { x: -1000, y: -1000 }
		this.TILE_SIZE = 128
	}

	async run() {
		// create class objects
		this.inputHandler = new InputHandler(this)
		const default_tileset = await Tileset.create(this, config.IMG_DIR + "map.png", 16, this.TILE_SIZE, 0)
		const pretty_face_tileset = await Tileset.create(this, config.IMG_DIR + "pretty_face_tileset.png", 16, this.TILE_SIZE, 1)
		this.maps = [
			await Map.create(this, 'house.json', pretty_face_tileset, "black", {x: 4 * constants.TILE_SIZE, y: 2.5 * constants.TILE_SIZE}),
			await Map.create(this, 'map.json', default_tileset, "grey", {x: 15.5 * constants.TILE_SIZE, y: 14.01 * constants.TILE_SIZE})

		]
		this.current_map = 0 // "scene"
		this.map = this.maps[this.current_map]


		const player_tileset = await Tileset.create(this, config.IMG_DIR + 'spritesheet.png', 16, this.TILE_SIZE, 0)
		this.player = new Player(this, player_tileset)
		this.player.set_map(this.get_current_map())
		
		// used to place the player correctly
		this.update()

		const black_transition = new UnicoloreTransition(this, 500, "black")

		const colors_problem = await Problem.create(
			this, config.IMG_DIR + "book_ui.png", 440, 580, "colors",
			[
				new NumberArea(this, "numberarea-red", -100, -110, 60, 80, 1, true, (answer, numberarea) => {}, 80, "black", "Times New Roman", ""),

				new NumberArea(this, "numberarea-green", -20, -110, 60, 80, 1, true, (answer, numberarea) => {}, 80, "black", "Times New Roman", ""),

				new NumberArea(this, "numberarea-yellow", 60, -110, 60, 80, 1, true, (answer, numberarea) => {}, 80, "black", "Times New Roman", ""),

				// No more needed but I leave it there in case
				// new Button(this, "button-submit", -50, 155, 100, 50, true, (button) => {
					
				// }),
				new Button(this, "button-undo-1", 200, -(this.canvas.height / 2), this.canvas.width / 2 - 200, this.canvas.height, true,(button)=>{
					button.ui.is_finished=true
				}),
				new Button(this, "button-undo-2", -(this.canvas.width / 2), -(this.canvas.height / 2), this.canvas.width / 2 - 200, this.canvas.height, true, (button)=>{
					button.ui.is_finished=true
				}),
				new Button(this, "button-undo-3", -200, 230, 400, this.canvas.height / 2 - 230, true, (button)=>{
					button.ui.is_finished=true
				}),
				new Button(this, "button-undo-4", -200, -(this.canvas.height / 2), 400, this.canvas.height / 2 - 270, true, (button)=>{
					button.ui.is_finished=true
				})
			],
			(problem) => {
				if(problem.get_widget("number-area-red").has_focus){

				} else {
					
				}

				const numberarea_red = problem.get_widget("numberarea-red");
				const numberarea_green = problem.get_widget("numberarea-green");
				const numberarea_yellow = problem.get_widget("numberarea-yellow");

				if (numberarea_red.content === "3" && numberarea_green.content === "2" && numberarea_yellow.content === "3") {
					problem.is_finished = true;
					problem.source.is_talkable = false
					console.log("bonnes réponses");
				}	
			}
		)
		const colors_problem_shelf = new Talkable(this, this.get_current_map(),
			new Hitbox(this, this.get_current_map(), 0, constants.TILE_SIZE * 2, this.TILE_SIZE, this.TILE_SIZE, true, false, null, (e, h, t) => {}),
			colors_problem, null
		)
		colors_problem.set_source(colors_problem_shelf)

		// SWITCH MAP HITBOXES
		// -- from the house (manual)
		new Hitbox(this, this.get_current_map(), 3 * constants.TILE_SIZE, 5 * constants.TILE_SIZE, 2 * constants.TILE_SIZE, constants.TILE_SIZE, false, false, null, (e, h, time) => {
			if (!this.inputHandler.isKeyPressed(constants.INTERACTION_KEY)) return // one must press INTERACTION_KEY to switch map
			this.maps[0].player_pos = {x: 4 * constants.TILE_SIZE, y: 5 * constants.TILE_SIZE}
			this.set_map(1)

			this.player.set_map(this.maps[1])
			this.player.direction = 0

			// reset dash
			if (this.player.dashing)
				this.player.dash_reset = true
			else
				this.player.last_dash = -constants.PLAYER_DASH_COOLDOWN


			black_transition.start(time)
		})
		// -- from the house (auto)
		new Hitbox(this, this.get_current_map(), 3 * constants.TILE_SIZE, 5.75 * constants.TILE_SIZE, 2 * constants.TILE_SIZE, constants.TILE_SIZE / 4, false, false, null, (e, h, time) => {
			this.maps[0].player_pos = {x: 4 * constants.TILE_SIZE, y: 5 * constants.TILE_SIZE}
			this.set_map(1)

			this.player.set_map(this.maps[1])
			this.player.direction = 0

			// reset dash
			if (this.player.dashing)
				this.player.dash_reset = true
			else
				this.player.last_dash = -constants.PLAYER_DASH_COOLDOWN

			black_transition.start(time)
		})

		// -- from the outside (manually activated)
		new Hitbox(this,
			this.maps[1],
			15 * constants.TILE_SIZE,
			13.5 * constants.TILE_SIZE,
			constants.TILE_SIZE,
			constants.TILE_SIZE / 2 - 18,
			false,
			false,
			null,
			(e, h, time) => {
				if (!this.inputHandler.isKeyPressed(constants.INTERACTION_KEY)) return
				this.maps[1].player_pos = {x: 15.5 * constants.TILE_SIZE, y: 14.01 * constants.TILE_SIZE}

				this.set_map(0)

				this.player.set_map(this.maps[0])
				this.player.direction = 1

				this.player.reset_dash_cooldown()

				black_transition.start(time)
			}
		)
		// -- from the outside (automatic)
		new Hitbox(this,
			this.maps[1],
			15 * constants.TILE_SIZE,
			13 * constants.TILE_SIZE,
			constants.TILE_SIZE,
			constants.TILE_SIZE / 4, 
			false, 
			false, 
			null, 
			(e, h, time) => {
				this.maps[1].player_pos = {x: 15.5 * constants.TILE_SIZE, y: 14.01 * constants.TILE_SIZE}

				this.set_map(0)

				this.player.set_map(this.maps[0])
				this.player.direction = 1

				this.player.reset_dash_cooldown()

				black_transition.start(time)
			}
		)

		requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 
	 * @param {Number} current_time 
	 * @returns 
	 */
	update(current_time) {
		if(this.current_ui){
			if(this.current_ui.is_finished){
				this.current_ui.is_finished = false
				this.current_ui = null
			} else{
				this.current_ui.update(current_time)
				return
			}
		}

		this.player.update(current_time)
		this.camera.x = this.player.worldX - this.canvas.width / 2
		this.camera.y = this.player.worldY - this.canvas.height / 2

		if (this.get_current_map().world.width <= this.canvas.width) {
			this.camera.x = (this.get_current_map().world.width - this.canvas.width) / 2;
		} else {
			this.camera.x = Math.max(0, Math.min(this.camera.x, this.get_current_map().world.width - this.canvas.width));
		}

		if (this.get_current_map().world.height <= this.canvas.height) {
			this.camera.y = (this.get_current_map().world.height - this.canvas.height) / 2;
		} else {
			this.camera.y = Math.max(0, Math.min(this.camera.y, this.get_current_map().world.height - this.canvas.height));
		}


		this.attacks.forEach(attack => {
			if (current_time - attack.time_origin > attack.duration) {
				attack.destroy()
				this.attacks.pop(attack)
			}
		})

		this.talkables.forEach(talkable => {talkable.update()})
	}

	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.get_current_map().render_ground_blocks()

		this.entities.forEach(entity => {entity.render()})

		this.player.render()

		this.get_current_map().render_perspective()
		
		if(constants.DEBUG){
			this.hitboxes.forEach(hitbox => {hitbox.render()})
			this.talkables.forEach(talkable => {talkable.render()})
		}

		if(this.current_ui){
			this.current_ui.render()
		}
	}

	/**
	 * 
	 * @param {Number} current_time 
	 */
	loop(current_time) {
		this.update(current_time)
		this.render()
		requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 
	 * @param {Number} new_map_nb 
	 */
	set_map(new_map_nb){
		this.current_map = new_map_nb
		this.map = this.maps[this.current_map]
	}

	get_current_map(){
		return this.maps[this.current_map]
	}
}


