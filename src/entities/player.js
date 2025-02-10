import { Game } from '../core/game.js'
import { Entity } from './entity.js'
import { Hitbox } from './hitbox.js'

export class Player extends Entity {
	/**
	 * @param {Game} game 
	 * @param {TileSet} player_tileset 
	 */
	constructor(game, player_tileset) {
		super(
			game, game.get_current_map(), player_tileset,
			new Hitbox(game, game.get_current_map(), 400, 400 + game.TILE_SIZE / 2, game.TILE_SIZE, game.TILE_SIZE / 2, true, true),
			new Hitbox(game, game.get_current_map(), 400, 400, game.TILE_SIZE, game.TILE_SIZE, false, true),
			600, 600, 175
		)

		this.player = true

		this.inputHandler = game.inputHandler

		this.fullSpeed = 10
		this.acceleration = 4
		this.dash_cooldown = 3000
		this.last_dash = -this.dash_cooldown
		this.dash_duration = 150
	}

	update(current_time) {
		// Handle player movement
		if (this.inputHandler.isKeyPressed(' ') && current_time - this.last_dash >= this.dash_cooldown) {
			this.acceleration = 10
			this.fullSpeed = 30
			this.last_dash = current_time
			setTimeout(() => {
				this.fullSpeed = 10
				this.acceleration = 4
			}, this.dash_duration)
		}
		if (this.inputHandler.isKeyPressed('z')) this.dy -= this.acceleration
		if (this.inputHandler.isKeyPressed('s')) this.dy += this.acceleration
		if (this.inputHandler.isKeyPressed('q')) this.dx -= this.acceleration
		if (this.inputHandler.isKeyPressed('d')) this.dx += this.acceleration

		// Handle deceleration
		if (!this.inputHandler.isKeyPressed('z') && !this.inputHandler.isKeyPressed('s'))
			this.dy = Math.sign(this.dy) * Math.max(Math.abs(this.dy) - this.acceleration, 0)
		if (!this.inputHandler.isKeyPressed('q') && !this.inputHandler.isKeyPressed('d'))
			this.dx = Math.sign(this.dx) * Math.max(Math.abs(this.dx) - this.acceleration, 0)

		// Apply diagonal speed limitation
		if (this.dx && this.dy) {
			this.dy = Math.sign(this.dy) * Math.min(this.fullSpeed / Math.SQRT2, Math.abs(this.dy))
			this.dx = Math.sign(this.dx) * Math.min(this.fullSpeed / Math.SQRT2, Math.abs(this.dx))
		} else {
			this.dy = Math.sign(this.dy) * Math.min(this.fullSpeed, Math.abs(this.dy))
			this.dx = Math.sign(this.dx) * Math.min(this.fullSpeed, Math.abs(this.dx))
		}

		super.update(current_time)

		this.collision_hitbox.get_colliding_hitboxes(true, false).forEach(hitbox => {
			hitbox.command()
		})

		this.combat_hitbox.get_colliding_hitboxes(false, true).forEach(hitbox => {
			hitbox.command()
		})

		this.collision_hitbox.get_colliding_hitboxes(false, false).forEach(hitbox => {
			hitbox.command()
		})

		this.collision_hitbox.set(this.worldX - this.game.TILE_SIZE / 2, this.worldY)
		this.combat_hitbox.set(this.worldX - this.game.TILE_SIZE / 2, this.worldY - this.game.TILE_SIZE / 2)
	}

	set_map(new_map){
		this.map = new_map
		this.collision_hitbox.set_map(new_map)
		this.combat_hitbox.set_map(new_map)
	}
}
