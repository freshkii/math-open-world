import { Map } from '../world/map.js'
import { Tileset } from '../world/tileset.js'
import { Player } from '../entities/player.js'
import { InputHandler } from './inputHandler.js'
import { Entity } from '../entities/entity.js'
import { Hitbox } from '../entities/hitbox.js'

export class Game {
	constructor() {
		// setup canvas & context
		this.canvas = document.getElementById('game')
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight

		this.ctx = this.canvas.getContext('2d')
		this.ctx.imageSmoothingEnabled = false

		document.addEventListener('resize', () => {
			this.canvas.width = window.innerWidth
			this.canvas.height = window.innerHeight

			this.ctx = this.canvas.getContext('2d')
			this.ctx.imageSmoothingEnabled = false
		})

		// initialize attributes
		this.hitboxes = []
		this.collision_hitboxes = []
		this.combat_hitboxes = []

		this.entities = []

		this.camera = { x: 100, y: 105.3 }
		this.TILE_SIZE = 128
	}

	async run() {
		// create class objects
		this.inputHandler = new InputHandler()
		const default_tileset = await Tileset.create(this, "images/map.png", 16)
		this.maps = [
			await Map.create(this, 'map.json', default_tileset),
			await Map.create(this, 'map copy.json', default_tileset)
		]
		this.current_map = 0 // "scene"
		this.map = this.maps[this.current_map]


		const player_tileset = await Tileset.create(this, 'images/spritesheet.png', 16)
		this.player = new Player(this, player_tileset)
		this.entities.push(new Entity(this, this.get_current_map(), player_tileset,
			new Hitbox(this, this.get_current_map(), 0, this.TILE_SIZE / 2, this.TILE_SIZE, this.TILE_SIZE /2, true, false ),
			new Hitbox(this, this.get_current_map(), 0, 0, this.TILE_SIZE, this.TILE_SIZE, false, false),
			this.TILE_SIZE /2, this.TILE_SIZE / 2, 200))
		
		// test hitbox for "command" parameter and for map switch
		new Hitbox(this, this.get_current_map(), 1000, 1000, this.TILE_SIZE, this.TILE_SIZE, false, false, function f(){this.game.set_map(1)})

		requestAnimationFrame(this.loop.bind(this))
	}

	update(current_time) {
		this.player.update(current_time)
		this.camera.x = this.player.worldX - this.canvas.width / 2
		this.camera.y = this.player.worldY - this.canvas.height / 2
	}

	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.map.render()
		this.entities[0].render()
		this.player.render()
		this.hitboxes.forEach(hitbox => {hitbox.render()})
	}

	loop(current_time) {
		this.update(current_time)
		this.render()
		requestAnimationFrame(this.loop.bind(this))
	}

	set_map(new_map_nb){
		this.current_map = new_map_nb
		this.map = this.maps[this.current_map]
		this.player.set_map(this.map)
	}

	get_current_map(){
		return this.maps[this.current_map]
	}
}
