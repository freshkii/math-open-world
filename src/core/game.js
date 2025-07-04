import { constants } from '../constants.js'
import { AudioManager } from './audioManager.js'
import { InputHandler } from './inputHandler.js'
import { Player } from '../entities/player.js'
import { Entity } from '../entities/entity.js'
import { Hitbox } from '../entities/hitbox.js'
import { Attack } from '../entities/attack.js'
import { Talkable } from '../entities/talkable.js'
import { Effect } from '../entities/effect.js'
import { Frog } from '../entities/mobs/frog.js'
import { Spider } from '../entities/mobs/spider.js'
import { Bear } from '../entities/mobs/bear.js'
import { Problem, TimedProblem } from '../ui/problem.js'
import { Ui } from '../ui/ui.js'
import { Button, NumberArea, Icon, Label, TextArea, Texture } from '../ui/widgets.js'
import { Transition, UnicoloreTransition } from '../ui/transition.js'
import { Dialogue, QuestionDialogue } from '../ui/dialogue.js'
import { Resizeable, YResizeable, createSwitchHitboxes, createTpHitboxes } from '../utils.js'
import { OptionsMenu } from '../ui/options.js'
import { Inventory } from '../ui/inventory.js'
import { Consumable, Item, ItemStack, Passive} from '../ui/items.js'
import { Map } from '../world/map.js'
import { Tileset } from '../world/tileset.js'


export class Game {
	constructor() {
		this.last_update = -1000/constants.GAME_TPS

		// setup canvas & context
		/** @type {HTMLCanvasElement} */
		this.canvas = document.getElementById('game')
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight

		constants.TILE_SIZE = this.canvas.width / 10

		/** @type {CanvasRenderingContext2D} */
		this.ctx = this.canvas.getContext('2d')
		this.ctx.imageSmoothingEnabled = false

		this.next_hitbox_id = 0
		this.next_attack_id = 0
		this.next_entity_id = 0
		
		/**@type {Array} */
		this.resizeables = []

		window.addEventListener('resize', () => {
			this.canvas.width = window.innerWidth
			this.canvas.height = window.innerHeight

			/** @type {CanvasRenderingContext2D} */
			this.ctx = this.canvas.getContext('2d')
			this.ctx.imageSmoothingEnabled = false

			constants.TILE_SIZE = this.canvas.width / 10

			this.resizeables.forEach(resizeable => {
				resizeable.resize(resizeable)
			})
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

		/** @type {Item} */
		this.items = {}

		/** @type {Ui | Transition} */
		this.current_ui = null

		/** @type {{String: Map}} */
		this.maps = {}

		/** @type {{String: Tileset}} */
		this.tilesets = {}

		this.camera = { x: new Resizeable(this, -1000), y: new Resizeable(this, -1000)}

		/**@type {OptionsMenu} */
		this.options_menu = null
		
		this.effects = {
			MOTIONLESS: new Effect(instance => {
				instance.entity.fullSpeed = instance.new_fullSpeed
				instance.entity.direction = instance.direction
			}, instance => {
				instance.direction = instance.entity.direction
				instance.fullSpeed = instance.entity.fullSpeed
				if(instance.entity.dashing)
					instance.fullSpeed.set_value(constants.TILE_SIZE / 12)
				instance.new_fullSpeed = new Resizeable(this, 0)

				instance.entity.fullSpeed = instance.new_fullSpeed
				instance.entity.direction = instance.direction
			}, instance => {
				instance.entity.fullSpeed = instance.fullSpeed
				instance.entity.direction = instance.direction
			}, 0),
			ATTACK: new Effect(instance => {}, instance => {
				instance.state = instance.entity.state
				instance.entity.state = constants.ATTACK_STATE
			}, instance => {
				instance.entity.state = instance.state
			}, 1000),
			BLINK: new Effect(instance => {}, instance => {
				instance.map = instance.entity.map
				instance.entity.map = null
			}, instance => {
				instance.entity.map = instance.map
			}, 0),
			SPEED1: new Effect(instance => {
				instance.entity.fullSpeed.set_value(constants.TILE_SIZE / 6)
			}, instance => {
				instance.speed_before = instance.entity.fullSpeed.get()
			}, instance => {
				instance.entity.fullSpeed.set_value(instance.speed_before)
			}, 0),
			SPEED2: new Effect(instance => {
				instance.entity.fullSpeed.set_value(constants.TILE_SIZE / 4)
			}, instance => {
				instance.speed_before = instance.entity.fullSpeed.get()
			}, instance => {
				instance.entity.fullSpeed.set_value(instance.speed_before)
			}, 0),
			// Just so you know, that's just a joke/test huh
			BIG_HITBOX: new Effect(instance => {},
				instance => {
					instance.entity.collision_hitbox.width.set_value(instance.entity.collision_hitbox.width.get() * 1.49)
					instance.entity.collision_hitbox.height.set_value(instance.entity.collision_hitbox.height.get() * 1.49)
				}, instance => {
					instance.entity.collision_hitbox.width.set_value(instance.entity.collision_hitbox.width.get() / 1.49)
					instance.entity.collision_hitbox.height.set_value(instance.entity.collision_hitbox.height.get() / 1.49)
				}
			)
		}

		/**@type {Array<{command: () => void, delay: Number, activation_time: Number}>} */
		this.scheduled = []
	}

	async run() {
		// create class objects
		this.inputHandler = new InputHandler(this)
		this.audioManager = new AudioManager(1)


		// load assets
		await this.audioManager.loadAudios()
		await Tileset.loadTilesets(this)
		await Map.loadMaps(this, 'house') // loads maps and sets 'house' to current map


		//this.audioManager.playMusic('background', 'music')

		// setup menu
		this.options_menu = await OptionsMenu.create(this)

		// setup inventory
		const inventory = await Inventory.create(this, 'inventory.png')
		this.inventory_unlocked = false

		// create player
		this.player = new Player(this, this.tilesets['Kanji'], inventory)

		this.audioManager.playSound('background', 'music')

		const black_transition = new UnicoloreTransition(this, 500, 'black')


		const colors_problem_finishing_ui = await Ui.create(this, 'opened_book_ui.png', this.canvas.width * 0.6875, this.canvas.width * 0.453125, [
			new Button(this, 'button',
				- this.canvas.width / 2, - this.canvas.height / 2, this.canvas.width, this.canvas.height,
				true, (button) => {
					button.ui.is_finished = true
				})
			], (ui) => {}
		)

		
		const test_consumable = await Consumable.create(this, 'Item_71.png', 'Feather',
			(c, time) => {this.effects.SPEED2.apply(time, this.player, 10000)}
		)

		new Bear(this, this.maps["map"], 195 * constants.TILE_SIZE, 98 * constants.TILE_SIZE)
    
		const test_consumable_stack = new ItemStack(test_consumable, 1)
		inventory.add_items(test_consumable_stack)

		const on_colors_problem_solve =  () => {
			colors_problem_shelf.destructor()
			// house - map
			createSwitchHitboxes(this, 'house', 'map', {x: 3, y: 8.75, width: 1, height: 0.25}, {x: 3.5, y:8}, {x: 184, y: 93, width: 1, height: 0.25}, {x: 184.5, y: 94}, constants.UP_DIRECTION, constants.DOWN_DIRECTION, black_transition)
		}
		
		const test_item = (await Passive.create(this, 'Item_51.png', 'Ring', (p, time) => {
			// Totally temporary
			// this.effects.BIG_HITBOX.apply(time, this.player, 100) it's very annoying so i'll turn that off for a bit
		})).set_tooltip('This ring make a barrier arround you that allows you to touch or be touched from further away')
		const test_item_stack = new ItemStack(test_item, 1)
		inventory.add_items(test_item_stack)

		const test_consumable2 = (await Consumable.create(this, 'Item_Black3.png', 'Speed Potion',
			(c, time) => {this.effects.SPEED1.apply(time, this.player, 10000)}
		)).set_tooltip('Drinking this potion makes you faster for a certain period')
		const test_consumable_stack2 = new ItemStack(test_consumable2, 5)
		inventory.add_items(test_consumable_stack2)

		const colors_problem = await Problem.create(
			this, 'book_ui.png', this.canvas.width * 0.34375, this.canvas.width * 0.453125, ['3', '4', '4'], (problem) => {
				let numberarea_pink = problem.get_widget('numberarea-pink')
				let numberarea_blue = problem.get_widget('numberarea-blue')
				let numberarea_red = problem.get_widget('numberarea-red')
				return [numberarea_pink.content, numberarea_blue.content, numberarea_red.content]
			}, [
				new Icon(this, 'focus-icon', -100, -110, this.tilesets['book_ui_focus'], 1, false, 0),
				new NumberArea(this, 'numberarea-pink', -this.canvas.width * 0.078125, -this.canvas.width * 0.0859375,
					this.canvas.width * 0.046875, this.canvas.width / 16,
					1, true, 1, this.canvas.width / 16, 'black', 'Times New Roman', ''),
				new NumberArea(this, 'numberarea-blue', -this.canvas.width * 0.015625, -this.canvas.width * 0.0859375,
					this.canvas.width * 0.046875, this.canvas.width / 16,
					1, true, 1, this.canvas.width / 16, 'black', 'Times New Roman', ''),
				new NumberArea(this, 'numberarea-red', this.canvas.width * 0.046875, -this.canvas.width * 0.0859375,
					this.canvas.width * 0.046875, this.canvas.width / 16,
					1, true, 1, this.canvas.width / 16, 'black', 'Times New Roman', ''),
				new Button(this, 'button-undo-1', this.canvas.width * 0.15625, new YResizeable(this, -(this.canvas.height / 2)),
					this.canvas.width / 2 - this.canvas.width * 0.15625, new YResizeable(this, this.canvas.height), true, (button, t)=>{
						button.ui.is_finished=true
						if (button.ui.solved()) {
						}
					}
				),
				new Button(this, 'button-undo-2', -(this.canvas.width / 2), new YResizeable(this, -(this.canvas.height / 2)),
					this.canvas.width / 2 - this.canvas.width * 0.15625, new YResizeable(this, this.canvas.height), true, (button, t)=>{
						button.ui.is_finished=true
						if (button.ui.solved())
							on_colors_problem_solve()
							
					}
				),
				new Button(this, 'button-undo-3', -this.canvas.width * 0.15625, this.canvas.width * 0.1796875,
					this.canvas.width * 0.3125, new YResizeable(this, this.canvas.height / 2 - this.canvas.width * 0.1796875, (resizeable) => {
						resizeable.set_value(this.canvas.height / 2 - this.canvas.width * 0.1796875)
					}), true, (button, t)=>{
						button.ui.is_finished=true
						if (button.ui.solved())
							on_colors_problem_solve()
					}
				),
				new Button(this, 'button-undo-4', -this.canvas.width * 0.15625, new YResizeable(this, -(this.canvas.height / 2)),
					this.canvas.width * 0.3125, new YResizeable(this, this.canvas.height / 2 - this.canvas.width * 0.2109375, (resizeable) => {
						resizeable.set_value(this.canvas.height / 2 - this.canvas.width * 0.2109375)
					}), true, (button, t)=>{
						button.ui.is_finished=true
						if (button.ui.solved())
							on_colors_problem_solve()
					}
				),
				new Button(this, 'open-button', this.canvas.width / 16, this.canvas.height / 16,
					this.tilesets['next_page_arrow_tileset'].screen_tile_size.get(), this.tilesets['next_page_arrow_tileset'].screen_tile_size.get(), false, (button, t)=>{
						button.game.current_ui = colors_problem_finishing_ui
						if (button.ui.solved())
							on_colors_problem_solve()
					}
				),
				new Icon(this, 'open-icon', this.canvas.width / 16, this.canvas.height / 16, this.tilesets['next_page_arrow_tileset'], 1, false)
			],
			(problem, t) => {
				var numberarea_pink = problem.get_widget('numberarea-pink')
				var numberarea_blue = problem.get_widget('numberarea-blue')
				var numberarea_red = problem.get_widget('numberarea-red')
				var focus_icon = problem.get_widget('focus-icon')
				if(!problem.get_widget('open-button').rendered){
					if(numberarea_pink.has_focus){
						focus_icon.update_config(-this.canvas.width * 0.078125, -this.canvas.width * 0.0859375, null, 1, true)
					}else if(numberarea_blue.has_focus){
						focus_icon.update_config(-this.canvas.width * 0.015625, -this.canvas.width * 0.0859375, null, 2, true)
					}else if(numberarea_red.has_focus){
						focus_icon.update_config(this.canvas.width * 0.046875, -this.canvas.width * 0.0859375, null, 3, true)
					} else if(numberarea_pink.is_hovered) {
						focus_icon.update_config(-this.canvas.width * 0.078125, -this.canvas.width * 0.0859375, null, 1, true)
					} else if(numberarea_blue.is_hovered) {
						focus_icon.update_config(-this.canvas.width * 0.015625, -this.canvas.width * 0.0859375, null, 2, true)
					} else if(numberarea_red.is_hovered) {
						focus_icon.update_config(this.canvas.width * 0.046875, -this.canvas.width * 0.0859375, null, 3, true)
					} else {
						focus_icon.rendered = false
					}
				} else {
					focus_icon.rendered = false
				}
				if(problem.get_widget('open-button').is_hovered)
					problem.get_widget('open-icon').tile_nb = 2
				else
					problem.get_widget('open-icon').tile_nb = 1
				if (problem.solved()) {
					problem.source.is_talkable = false
					problem.get_widget('open-button').rendered = true
					problem.get_widget('open-icon').rendered = true
					numberarea_pink.usable = false
					numberarea_blue.usable = false
					numberarea_red.usable = false
					this.inventory_unlocked = true
					problem.unfocus()
				}	
			}
		)
		const colors_problem_shelf = new Talkable(this, this.get_current_map(),
			new Hitbox(this, this.get_current_map(), constants.TILE_SIZE * 3, constants.TILE_SIZE * 3, constants.TILE_SIZE, constants.TILE_SIZE, false, false, null, (h, c_h, t) => {}),
			colors_problem, null
		)
		colors_problem.set_source(colors_problem_shelf)


		// test dialogue and its hitbox
		var threats_dialogue = await Dialogue.create(this, 'dialogue_box.png',
			'Go and die !!!', (dialogue) => {}, constants.TILE_SIZE / 3
		)

		var mqc_dialogue = await QuestionDialogue.create(this, 'dialogue_box.png',
			'Press \'Space\' to dash, dash has a 10 seconds cooldown. You can also press \'E\' when facing an object to interact with it.',
			['Ok', 'No'], // anything can be added here and the box will be automatically generated
			this.canvas.width / 4, this.canvas.height / 4, this.canvas.width / 8, this.canvas.height / 16,
			'anwser_box.png', (dialogue, anwser) => {
				if (anwser === 'No'){
					dialogue.game.current_ui = threats_dialogue
				}
				dialogue.source.destroy()
			}, constants.TILE_SIZE / 5, 'black', 'arial'
		)
		var dialogue_test = new Hitbox(this, this.get_current_map(), 0, 4 * constants.TILE_SIZE, constants.TILE_SIZE, constants.TILE_SIZE, false, false, null, (h, c_h, t) => {
			if(!c_h.player) return
			this.current_ui = mqc_dialogue
		})
		mqc_dialogue.set_source(dialogue_test)


		// PROBLEMS
		
		// castle0
		this.brokenLights = true
		let lost_lights_widgets = [
			await Texture.create(this, 'hovered-texture', 'hovered_lost_light_texture.png', 0, 0,
				constants.TILE_SIZE * 0.8, constants.TILE_SIZE * 0.8, false, 1)
		]
		for (let x=0; x < 5; x++){
			for(let y=0; y<5; y++){
				lost_lights_widgets.push(new Button(this, `button-${x}-${y}`,
					(x - 2.5) * constants.TILE_SIZE * 0.8, (y - 2.5) * constants.TILE_SIZE * 0.8,
					constants.TILE_SIZE * 0.8, constants.TILE_SIZE * 0.8, true, (button) => {
						let current_texture = button.ui.get_widget(`texture-${x}-${y}`)
						current_texture.rendered = !current_texture.rendered
						if(x > 0){
							let left_texture = button.ui.get_widget(`texture-${x - 1}-${y}`)
							left_texture.rendered = !left_texture.rendered
						}
						if(x < 4){
							let right_texture = button.ui.get_widget(`texture-${x + 1}-${y}`)
							right_texture.rendered = !right_texture.rendered
						}
						if(y > 0){
							let top_texture = button.ui.get_widget(`texture-${x}-${y - 1}`)
							top_texture.rendered = !top_texture.rendered
						}
						if(y < 4){
							let bottom_texture = button.ui.get_widget(`texture-${x}-${y + 1}`)
							bottom_texture.rendered = !bottom_texture.rendered
						}
					}))
				lost_lights_widgets.push(await Texture.create(this, `texture-${x}-${y}`,
					'lost_light_texture.png', (x - 2.5) * constants.TILE_SIZE * 0.8,
					(y - 2.5) * constants.TILE_SIZE * 0.8, constants.TILE_SIZE * 0.8,
					constants.TILE_SIZE * 0.8, true, 0))
			}			
		}

		this.lost_lights_problem = await Problem.create(this, 'lost_light.png',
			constants.TILE_SIZE * 5 * 0.8, constants.TILE_SIZE * 5 * 0.8,
			[false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
			(problem) => {
				let list = []
				for(let x=0; x < 5; x++){
					for(let y=0; y<5; y++){
						list.push(problem.get_widget(`texture-${x}-${y}`).rendered)
					}
				}
				return list
			},
			lost_lights_widgets, (problem) => {
				let hovered = false
				for(let x=0; x < 5; x++){
					for(let y=0; y<5; y++){
						if(problem.get_widget(`button-${x}-${y}`).is_hovered){
							problem.get_widget('hovered-texture').update_config((x - 2.5) * constants.TILE_SIZE * 0.8, (y - 2.5) * constants.TILE_SIZE * 0.8, null, null, true)
							hovered = true
						}
					}
				}
				if(!hovered) problem.get_widget('hovered-texture').rendered = false

				if(problem.solved()){
					problem.is_finished = true
					this.brokenLights = false
				}
			})


		// castle problem 1
		let castleAnswer1 = 0

		const castle1CongratsDialogue = await Dialogue.create(this, 'dialogue_box.png', 'Oh! un fragment de clé s\'est dévoilé...', () => {}, constants.TILE_SIZE / 4)

		const castle1DialogueFlame = await Dialogue.create(this, 'dialogue_box.png', 'À l’aube, quand le jour peine à s’allumer.', () => {
			castleAnswer1 = 1
			this.maps["castle"].replaceTileAt(13, 41, 10, [0,1,0])
		}, constants.TILE_SIZE / 4)
		const castle1TalkableFlame = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 9, constants.TILE_SIZE * 43, constants.TILE_SIZE, constants.TILE_SIZE * 2), castle1DialogueFlame)

		const castle1DialogueApple = await Dialogue.create(this, 'dialogue_box.png', 'Au zénith, quand l’ombre disparaît', () => {
			castleAnswer1 = castleAnswer1 === 1 ? 2 : 0
			this.maps["castle"].replaceTileAt(13, 41, 11, [0,1,0])
		}, constants.TILE_SIZE / 4)
		const castle1TalkableApple = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 9, constants.TILE_SIZE * 39, constants.TILE_SIZE, constants.TILE_SIZE * 2), castle1DialogueApple)

		const castle1DialogueShovel = await Dialogue.create(this, 'dialogue_box.png', 'Au crépuscule, avant que la nuit ne tombe', () => {
			castleAnswer1 = castleAnswer1 === 2 ? 3 : 0
			this.maps["castle"].replaceTileAt(13, 41, 23, [0,1,0])
		}, constants.TILE_SIZE / 4)
		const castle1TalkableShovel = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 17, constants.TILE_SIZE * 43, constants.TILE_SIZE, constants.TILE_SIZE * 2), castle1DialogueShovel)

		const castle1DialogueHourglass = await Dialogue.create(this, 'dialogue_box.png', 'Quand tout recommence, au cœur de la nuit', () => {
			this.maps["castle"].replaceTileAt(13, 41, 21, [0,1,0])
			if (castleAnswer1 !== 3) {
				castleAnswer1 = 0
				return
			}
			this.current_ui = castle1CongratsDialogue
			castle1TalkableFlame.destructor()
			castle1TalkableApple.destructor()
			castle1TalkableShovel.destructor()
			castle1TalkableHourglass.destructor()
		}, constants.TILE_SIZE / 4)
		const castle1TalkableHourglass = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 17, constants.TILE_SIZE * 39, constants.TILE_SIZE, constants.TILE_SIZE * 2), castle1DialogueHourglass)


		// castle problem 2
		// orientation: 0 (up right), 1 (down right), 2 (down left), 3 (up left)
		let mirror_orientations = [3, 0]
		const e2_offset = 54683
		const statues_offset = 54783
		let castle2AngelState = [false, false, false, false]
		let castle2AngelResult = 0
		let castle2HardMirrorSolved = false

		const on_castle2_solve = () => {
			createTpHitboxes(this, 'castle', {x:13, y:35, width: 1, height: 0.25}, {x: 13.5, y:37}, {x: 13, y:30.75, width: 1, height: 0.25}, {x: 13.5, y: 28}, constants.DOWN_DIRECTION, constants.UP_DIRECTION, black_transition)
			// give key
		}

		const cleanLightPath = () => {
			for (let i = 0; i < 5; i++) {
				this.maps["castle"].replaceTileAt(28 + i, 32, 28+e2_offset, [0, 0, 1])
			}
			for (let i = 0; i < 3; i++) {
				this.maps["castle"].replaceTileAt(33, 34 + i, 28+e2_offset,[0, 0, 1])
				this.maps["castle"].replaceTileAt(34, 34 + i, 28+e2_offset,[0, 0, 1])
			}
			for (let i = 0; i < 4; i++) {
				this.maps["castle"].replaceTileAt(33, 39+i, 28+e2_offset, [0, 0, 1])
				this.maps["castle"].replaceTileAt(34, 39+i, 28+e2_offset, [0, 0, 1])
			}
			for (let i = 0; i < 2; i++) {
				this.maps["castle"].replaceTileAt(35+i, 32, 28+e2_offset, [0, 0, 1])
			}
			for (let i = 0; i < 3; i++) {
				this.maps["castle"].replaceTileAt(37,29+i, 28+e2_offset, [0, 0, 1])
				this.maps["castle"].replaceTileAt(38,29+i, 28+e2_offset, [0, 0, 1])
			}
			let tmp = mirror_orientations[0] === 0 ? 2 : mirror_orientations[0] === 1 ? 4 : mirror_orientations[0] === 2 ? 6 : 0
			this.maps["castle"].replaceTileRectAt(33, 37, 2, 2, tmp + e2_offset, [0, 1, 0])
			tmp = mirror_orientations[1] === 0 ? 2 : mirror_orientations[1] === 1 ? 4 : mirror_orientations[1] === 2 ? 6 : 0
			this.maps["castle"].replaceTileRectAt(33, 32, 2, 2, tmp + e2_offset, [0, 1, 0])
			this.maps["castle"].replaceTileRectAt(37, 32, 2, 2, 68 + e2_offset, [0, 1, 0])
		}

		const makeLightPath = () => {
			cleanLightPath()
			// make cristal bright first
			this.maps["castle"].replaceTileRectAt(28, 37, 2, 2, 54765, [0, 1, 0])
			//this.maps["castle"].replaceTileAt(28, 37, 54765, [0, 1, 0])
			//this.maps["castle"].replaceTileAt(29, 37, 54766, [0, 1, 0])
			//this.maps["castle"].replaceTileAt(28, 38, 54775, [0, 1, 0])
			//this.maps["castle"].replaceTileAt(29, 38, 54776, [0, 1, 0])
			
			// draw the first light line 
			for (let i = 0; i < 3; i++) {
				this.maps["castle"].replaceTileAt(30+i, 37, (Math.random() < 0.5 ? 94 : 95) + e2_offset, [0, 0, 1])
			}
			let tmp = mirror_orientations[0] === 0 ? 60 : mirror_orientations[0] === 1 ? 44 : mirror_orientations[0] === 2 ? 26 : 20
			this.maps["castle"].replaceTileRectAt(33, 37, 2, 2, tmp + e2_offset, [0, 1, 0])
			
			if (mirror_orientations[0] < 2) return
			if (mirror_orientations[0] === 2) {
				// draw light line
				for (let i = 0; i < 4; i++) {
					tmp = Math.random() > 0.5 ? 84 : 58
					this.maps["castle"].replaceTileRectAt(33, 39 + i, 2, 1, tmp + e2_offset, [0, 0, 1])
				}
				return
			}
			// draw light line
			for (let i = 0; i < 3; i++) {
				tmp = Math.random() > 0.5 ? 84 : 58
				this.maps["castle"].replaceTileRectAt(33, 34 + i, 2, 1, tmp + e2_offset, [0, 0, 1])
			}
			tmp = mirror_orientations[1] === 0 ? 42 : mirror_orientations[1] === 1 ? 24 : mirror_orientations[1] === 2 ? 26 : 40
			this.maps["castle"].replaceTileRectAt(33, 32, 2, 2, tmp + e2_offset, [0, 1, 0])

			if (mirror_orientations[1] === 0 || mirror_orientations[1] === 3) return

			if (mirror_orientations[1] === 2) {
				for (let i = 0; i < 5; i++) {
					tmp = Math.random() > 0.5 ? 94 : 95
					this.maps["castle"].replaceTileAt(28 + i, 32, tmp + e2_offset, [0, 0, 1])
				}
				return
			}

			// draw light line
			for (let i = 0; i < 2; i++) {
				tmp = Math.random() > 0.5 ? 94 : 95
				this.maps["castle"].replaceTileAt(35 + i, 32, tmp + e2_offset, [0, 0, 1])
			}

			if (!castle2HardMirrorSolved) return
			this.maps["castle"].replaceTileRectAt(37, 32, 2, 2, 88 + e2_offset, [0, 1, 0])

			for (let i = 0; i < 3; i++) {
				tmp = Math.random() > 0.5 ? 84 : 58
				this.maps["castle"].replaceTileRectAt(37, 29+ i, 2, 1, tmp + e2_offset, [0, 0, 1])
			}

			this.maps["castle"].replaceTileRectAt(37, 27, 2, 2, 8 + e2_offset, [0, 1, 0])
		}




		const castle2WindAngelAudioArea = new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 29, constants.TILE_SIZE * 27, constants.TILE_SIZE * 5, constants.TILE_SIZE * 4, false, false, null, (h, c_h, t) => {
			if (!c_h.player) return
			if (!this.audioManager.isSoundPlaying('castle', 'wind')) {
				this.audioManager.playSoundForDuration('castle', 'wind', 5000)
			}
		})
		const castle2WindAngelTrigger = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 30, constants.TILE_SIZE * 27, 3 * constants.TILE_SIZE, 3 * constants.TILE_SIZE), null)
		castle2WindAngelTrigger.on_interact = () => { // unauthorized & uncensored stuff
			castle2AngelState[0] = !castle2AngelState[0]
			this.maps["castle"].replaceTileAt(30, 29, (castle2AngelState[0] ? 6 : 45) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(31, 29, (castle2AngelState[0] ? 7 : 46) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(32, 29, (castle2AngelState[0] ? 8 : 47) + statues_offset, [0, 1, 0])
			castle2AngelResult = castle2AngelState[0] ? 1 : 0
		}


		const castle2BellAngelAudioArea = new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 40, constants.TILE_SIZE * 38, constants.TILE_SIZE * 5, constants.TILE_SIZE * 5, false, false, null, (h, c_h, t) => {
			if (!c_h.player) return
			if (!this.audioManager.isSoundPlaying('castle', 'bell')) {
				this.audioManager.playSoundForDuration('castle', 'bell', 5000)
			}
		})
		const castle2BellAngelTrigger = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 42, constants.TILE_SIZE * 40, 3 * constants.TILE_SIZE, 3 * constants.TILE_SIZE), null)
		castle2BellAngelTrigger.on_interact = () => { // unauthorized & uncensored stuff
			castle2AngelState[1] = !castle2AngelState[1]
			this.maps["castle"].replaceTileAt(42, 42, (castle2AngelState[1] ? 15 : 48) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(43, 42, (castle2AngelState[1] ? 16 : 49) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(44, 42, (castle2AngelState[1] ? 17 : 50) + statues_offset, [0, 1, 0])
			if (castle2AngelResult !== 1) {
				castle2AngelResult = 0
				return
			}
			castle2AngelResult = castle2AngelState[1] ? 2 : 1
		}

		const castle2LightningAngelAudioArea = new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 41, constants.TILE_SIZE * 27, constants.TILE_SIZE * 4, constants.TILE_SIZE * 4, false, false, null, (h, c_h, t) => {
			if (!c_h.player) return
			if (!this.audioManager.isSoundPlaying('castle', 'lightning')) {
				this.audioManager.playSoundForDuration('castle', 'lightning', 5000)
			}
		})
		const castle2LightningAngelTrigger = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 43, constants.TILE_SIZE * 27, 2 * constants.TILE_SIZE, 3 * constants.TILE_SIZE), null)
		castle2LightningAngelTrigger.on_interact = () => { // unauthorized & uncensored stuff
			castle2AngelState[2] = !castle2AngelState[2]
			this.maps["castle"].replaceTileAt(43, 29, (castle2AngelState[2] ? 4 : 18) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(44, 29, (castle2AngelState[2] ? 5 : 19) + statues_offset, [0, 1, 0])
			if (castle2AngelResult !== 2) {
				castle2AngelResult = 0
				return
			}
			castle2AngelResult = castle2AngelState[2] ? 3 : 2
		}

		const castle2HeartAngelAudioArea = new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 30, constants.TILE_SIZE * 39, constants.TILE_SIZE * 4, constants.TILE_SIZE * 4, false, false, null, (h, c_h, t) => {
			if (!c_h.player) return
			if (!this.audioManager.isSoundPlaying('castle', 'heart beating')) {
				this.audioManager.playSoundForDuration('castle', 'heart beating', 5000)
			}
		})
		const castle2HeartAngelTrigger = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 31, constants.TILE_SIZE * 40, 2 * constants.TILE_SIZE, 3 * constants.TILE_SIZE), null)
		castle2HeartAngelTrigger.on_interact = () => { // unauthorized & uncensored stuff
			castle2AngelState[3] = !castle2AngelState[3]
			this.maps["castle"].replaceTileAt(31, 42, (castle2AngelState[3] ? 13 : 20) + statues_offset, [0, 1, 0])
			this.maps["castle"].replaceTileAt(32, 42, (castle2AngelState[3] ? 14 : 21) + statues_offset, [0, 1, 0])
			if (castle2AngelResult !== 3) {
				castle2AngelResult = 0
				return
			}
			if (castle2AngelState[3]) {
				// DESTRUCTION
				// audio areas
				castle2WindAngelAudioArea.destroy()
				castle2HeartAngelAudioArea.destroy()
				castle2BellAngelAudioArea.destroy()
				castle2LightningAngelAudioArea.destroy()
				// trigers
				castle2WindAngelTrigger.destructor()
				castle2BellAngelTrigger.destructor()
				castle2LightningAngelTrigger.destructor()
				castle2HeartAngelTrigger.destructor()
				castle2CristalTalkable.destructor()

				const castle2MirrorTrigger1 = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 33, constants.TILE_SIZE * 37, constants.TILE_SIZE *2, constants.TILE_SIZE * 2), null)
				castle2MirrorTrigger1.on_interact = () => {
					mirror_orientations[0] += 1
					mirror_orientations[0] %= 4
					if (makeLightPath()) {
						on_castle2_solve()
					}
				}

				const castle2MirrorTrigger2 = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], constants.TILE_SIZE * 33, constants.TILE_SIZE * 32, constants.TILE_SIZE * 2, constants.TILE_SIZE * 2), null)
				castle2MirrorTrigger2.on_interact = () => {
					mirror_orientations[1] += 1
					mirror_orientations[1] %= 4
					if (makeLightPath()) {
						on_castle2_solve()
					}
				}

				const castle2HardMirrorTalkable = new Talkable(this, this.maps["castle"], new Hitbox(this, this.maps["castle"], 37 * constants.TILE_SIZE, 32 * constants.TILE_SIZE, 2 * constants.TILE_SIZE, 2 * constants.TILE_SIZE), castle2HardMirrorProblem)

				if (makeLightPath()) {
					on_castle2_solve()
				}
			}
		}



		const cell_size = 0.4811320754716981 * constants.TILE_SIZE
		const half_gap = 0.14150943396226415 * constants.TILE_SIZE
		const total_cell_with_gap = cell_size + 2 * half_gap

		let castle2HardMirrorWidgets = []
		for (let i = 0; i < 4; i++) {
			const xPos = (i - 1.80) * total_cell_with_gap
			castle2HardMirrorWidgets.push(
				new Button(this, `button-${i}`, xPos, 0.17 * constants.TILE_SIZE, cell_size, cell_size, true,
					(button, time) => {
						if (button.value === undefined)
							button.value = 0;
						else
							button.value = (button.value + 1) % 4
						for (let j = 1; j < 5; j++) {
							button.ui.get_widget(`icon-${i}-${j}`).rendered = false
						}
						button.ui.get_widget(`icon-${i}-${button.value+1}`).rendered = true
					}
				)
			);
			
			for (let j = 1; j < 5; j++) {
				castle2HardMirrorWidgets.push(
					new Icon(this, `icon-${i}-${j}`, xPos, 0.17 * constants.TILE_SIZE, this.tilesets['digital_locks'], j)
				)
			}
		}

		//castle2HardMirrorWidgets.push(
		//	new Button())

		const castle2HardMirrorProblem = await Problem.create(this, 'digital_locks_background.png', 
			constants.TILE_SIZE * 6, constants.TILE_SIZE * 5, 3102, (problem) => {
				let result = 0
				for (let i = 0; i < 4; i++)
					result += problem.get_widget(`button-${i}`).value * Math.pow(10, i)
				return result
			}, castle2HardMirrorWidgets, (problem, time) => {
				if (problem.solved()) {
					castle2HardMirrorSolved = true
					problem.is_finished = true
					if (makeLightPath()) {
						on_castle2_solve()
					}
				}
		})


		const castle2CristalMessage = await Ui.create(this, 'castle2message.png', constants.TILE_SIZE * 6, constants.TILE_SIZE * 6, [
			new Button(this, 'button',
				- this.canvas.width / 2, - this.canvas.height / 2, this.canvas.width, this.canvas.height,
				true, (button) => {
					button.ui.is_finished = true
				})
		], (ui) => {})
		const castle2CristalTalkable = new Talkable(this, this.maps['castle'], new Hitbox(this, this.maps['castle'], constants.TILE_SIZE * 28, constants.TILE_SIZE * 37, constants.TILE_SIZE * 2, constants.TILE_SIZE * 2), castle2CristalMessage)


		// SWITCHES

		// map - castle
		createSwitchHitboxes(this, 'map', 'castle', {x: 105, y: 40, width: 2, height: 1}, {x: 106, y: 42}, {x: 12, y: 71.75, width: 1, height: 0.25}, {x: 12, y: 70}, constants.DOWN_DIRECTION, constants.UP_DIRECTION, black_transition, (game) => {
			if (game.brokenLights)
				game.current_ui = game.lost_lights_problem
		})

		// TPS
		// castle
		createTpHitboxes(this, 'castle', {x: 12, y: 53, width: 1, height: 0.25}, {x: 12, y: 54}, {x: 12, y: 47.75, width: 1, height: 0.25}, {x: 12, y: 46}, constants.UP_DIRECTION, constants.DOWN_DIRECTION, black_transition)
		createTpHitboxes(this, 'castle', {x: 22.75, y: 41, width: 0.25, height: 1}, {x: 21, y: 41}, {x: 27, y: 41, width: 0.25, height: 1}, {x: 28, y: 41.5}, constants.LEFT_DIRECTION, constants.RIGHT_DIRECTION, black_transition)


		
		requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 
	 * @param {Number} current_time 
	 * @returns 
	 */
	update(current_time) {
		this.scheduled.forEach(command => {
			if(command.delay == 0){
				command.command()
				this.scheduled.splice(this.scheduled.indexOf(command), 1)
			}
		})
		this.scheduled.forEach(command => command.delay--)
		this.collision_hitboxes = this.collision_hitboxes.filter(h => h.active)
		this.combat_hitboxes = this.combat_hitboxes.filter(h => h.active)
		this.hitboxes = this.hitboxes.filter(h => h.active)
		this.entities = this.entities.filter(entity => entity.active)

		if(this.current_ui) {
			if(this.current_ui.is_finished){
				this.current_ui.is_finished = false
				this.current_ui = null
			} else {
				if(
					(
						this.current_ui instanceof Transition
						|| this.current_ui instanceof TimedProblem
					) && !this.current_ui.start_time
				) this.current_ui.start_time = current_time
				this.current_ui.update(current_time)
				return
			}
		}else if(this.inputHandler.isKeyPressed('escape')){
			this.current_ui = this.options_menu
		}

		this.get_current_map().update(current_time)

		this.entities.forEach(entity => entity.update(current_time))

		this.camera.x.set_value(this.player.worldX.get() - this.canvas.width / 2)
		this.camera.y.set_value(this.player.worldY.get() - this.canvas.height / 2)

		if (this.get_current_map().world.width.get() <= this.canvas.width) {
			this.camera.x.set_value((this.get_current_map().world.width.get() - this.canvas.width) / 2)
		} else {
			this.camera.x.set_value(Math.max(0, Math.min(this.camera.x.get(), this.get_current_map().world.width.get() - this.canvas.width)))
		}

		if (this.get_current_map().world.height.get() <= this.canvas.height) {
			this.camera.y.set_value((this.get_current_map().world.height.get() - this.canvas.height) / 2)
		} else {
			this.camera.y.set_value(Math.max(0, Math.min(this.camera.y.get(), this.get_current_map().world.height.get() - this.canvas.height)))
		}

		this.attacks.forEach(attack => attack.update(current_time))

		Object.values(this.effects).forEach(effect => effect.update(current_time))

		this.talkables.forEach(talkable => talkable.update(current_time))
		// talkables before inventory
		if (this.inputHandler.isKeyPressed(constants.INTERACTION_KEY) && this.inventory_unlocked) {
            if (!this.current_ui) {
                this.current_ui = this.player.inventory
            }
        }
	}

	render() {
		this.get_current_map().render()

		if(this.options_menu.debug) {
			this.hitboxes.forEach(hitbox => {hitbox.render()})
			this.talkables.forEach(talkable => {talkable.render()})
			this.get_current_map().renderGrid()
			this.ctx.fillStyle = 'black'
			this.ctx.font = (Math.round(constants.TILE_SIZE / 2)).toString() +'px'
			this.ctx.fillText(`x: ${Math.round(this.player.worldX.get())} y: ${Math.round(this.player.worldY.get())}`, 50, 50)
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
		if(current_time - this.last_update >= 1000/constants.GAME_TPS){
			this.update(current_time)
			this.last_update = current_time
		}
		this.render()
		requestAnimationFrame(this.loop.bind(this))
	}

	/**
	 * 
	 * @param {String} new_map_name 
	 */
	set_map(new_map_name){
		this.current_map = new_map_name
		this.map = this.maps[this.current_map]
	}

	/**
	 *
	 * @returns {Map}
	 */
	get_current_map(){
		return this.maps[this.current_map]
	}

	/**
	 * Allows to schedule command to be executed after a certain amount of updates,
	 * ⚠ make sure that the values that you use in the command still exist after that amount of update
	 * @param {() => void} command 
	 * @param {number} delay 
	 */
	schedule(command, delay){
		this.scheduled.push({command: command, delay: delay})
	}
}
