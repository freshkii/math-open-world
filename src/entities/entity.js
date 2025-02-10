import { Game } from "../core/game.js"
import { Hitbox } from "./hitbox.js"
import { Map } from "../world/map.js"
import { Tileset } from "../world/tileset.js"

export class Entity {

  /**
   * @param {Game} game
   * @param {Map} map 
   * @param {Tileset} tileset
   * @param {Hitbox} collision_hitbox
   * @param {Hitbox} combat_hitbox
   * @param {Number} worldX
   * @param {Number} worldY
   * @param {Number} animation_duration    
   */
  constructor(game, map, tileset, collision_hitbox, combat_hitbox, worldX, worldY, animation_duration) {
    this.game = game
    this.map = map

    // World position at the center
    this.worldX = worldX
    this.worldY = worldY

    this.dx = 1
    this.dy = 1

    this.tileset = tileset
    this.collision_hitbox = collision_hitbox
    this.combat_hitbox = combat_hitbox

    this.animation_step = 0
    this.animation_duration = animation_duration
    this.direction = 0
    this.last_time = 0
  }

	  update(current_time) {
    // Split movement into X and Y components to handle collisions separately
    this.updatePositionX()
		this.updateCollisionHitbox()
    if (this.colliding()) {
      this.backPositionX()
    }
    
    this.updatePositionY()
		this.updateCollisionHitbox()
    if (this.colliding()) {
      this.backPositionY()
    }
    
    this.handleAnimation(current_time)
  }

  updatePositionX() {
    const halfHitboxWidth = this.combat_hitbox.width / 2
    this.worldX = this.clampPosition(
      this.worldX + this.dx,
      halfHitboxWidth,
      this.game.map.world.width - halfHitboxWidth
    )
  }

  updatePositionY() {
    const halfHitboxHeight = this.combat_hitbox.height / 2
    this.worldY = this.clampPosition(
      this.worldY + this.dy,
      halfHitboxHeight,
      this.game.map.world.height - halfHitboxHeight
    )
  }

	updateCollisionHitbox() {
		this.collision_hitbox.set(this.worldX - this.collision_hitbox.width / 2, this.worldY)
	}

  clampPosition(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  colliding() {
    for (let collision_hitbox of this.game.collision_hitboxes) {
      if (collision_hitbox === this.collision_hitbox) {
        continue
      }
      if (this.collision_hitbox.is_colliding(collision_hitbox)) {
        return true
      }
    }
    return false
  }

  backPositionX() {
    this.worldX -= this.dx
  }

  backPositionY() {
    this.worldY -= this.dy
  }

  handleAnimation(current_time) {
    if (current_time - this.last_time < this.animation_duration) return

    this.updateDirection()
    this.animation_step = (this.dx || this.dy) ? (this.animation_step + 1) % 4 : 0

    this.last_time = current_time
  }

  updateDirection() {
    if (this.dy > 0) this.direction = 0
    else if (this.dy < 0) this.direction = 1
    else if (this.dx > 0) this.direction = 2
    else if (this.dx < 0) this.direction = 3
  }

  render() {
    if(this.game.get_current_map() == this.map){
      if (this.isWithinCameraView()) {
        this.tileset.drawTile(
          4 * this.direction + (this.animation_step !== -1 ? this.animation_step : 0) + 1,
          this.worldX - this.game.camera.x - this.game.TILE_SIZE / 2,
          this.worldY - this.game.camera.y - this.game.TILE_SIZE / 2
        )
      }
    }
  }

  isWithinCameraView() {
    return (
      this.worldX + this.combat_hitbox.width / 2 >= this.game.camera.x &&
      this.worldX - this.combat_hitbox.width / 2<= this.game.camera.x + this.game.canvas.width &&
      this.worldY + this.combat_hitbox.height / 2>= this.game.camera.y &&
      this.worldY - this.combat_hitbox.height / 2<= this.game.camera.y + this.game.canvas.height
    )
  }
}
