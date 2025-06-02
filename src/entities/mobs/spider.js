import { Mob } from "../mob.js"
import { Hitbox } from "../hitbox.js"
import { constants } from "../../constants.js"
import { Resizeable } from "../../utils.js"
import { ProjectileAttack } from "../attack.js"

/**
 * Spider enemy that chases player and periodically shoots projectiles
 * @extends Mob
 */
export class Spider extends Mob {
    /**
     * Create a Spider instance
     * @param {Game} game - Game instance
     * @param {Map} map - Current map
     * @param {number} worldX - Initial X position
     * @param {number} worldY - Initial Y position
     * @param {number} [life=10] - Initial health
     */

    constructor(game, map, worldX, worldY, life = 10) {
        const spiderAI = {
            state: constants.WANDERING_AI_STATE,
            chasing_range: new Resizeable(game, constants.TILE_SIZE * 5),
			chasing_speed: new Resizeable(game, 10),
            attack_cooldown: 2000,
            last_attack: 0,
            attack_range: new Resizeable(game, constants.TILE_SIZE * 8),
            projectile_speed: new Resizeable(game, 30),
			hostile: true,
			wandering_direction_change_time: 1000,
			wandering_radius: new Resizeable(game, 2),
			wandering_speed: new Resizeable(game, 5)
        }
        
        const verticalOffset = -0.15625 * constants.TILE_SIZE
        
        super(
            game,
            map,
            game.tilesets["spider_tileset"],
            new Hitbox(game, map, worldX, worldY, constants.TILE_SIZE * 2, constants.TILE_SIZE * 2.5, true, false),
            new Hitbox(game, map, worldX, worldY, constants.TILE_SIZE * 2, constants.TILE_SIZE * 2.5, false, false),
            worldX,
            worldY,
            150,
            spiderAI,
            life,
            {
                combat: {x: 0, y: verticalOffset},
                collision: {x: 0, y: verticalOffset}
            },
			25
        )
    }

    /**
     * Update spider behavior
     * @param {number} current_time - Current game time
     */
    update(current_time) {
        super.update(current_time)
    }

    /**
     * Spider attack behavior - shoots projectiles toward player
     * @param {number} current_time - Current game time
     */
    attack(current_time) {
        if (!this.game.player) return

        const distance = Math.hypot(
            this.game.player.worldX.get() - this.worldX.get(),
            this.game.player.worldY.get() - this.worldY.get()
        )

        if (distance <= this.ai.attack_range.get()) {
            const [dirX, dirY] = this.getShootingDirections()
            this.shoot(dirX, dirY, current_time)
            this.ai.last_attack = current_time
        }
    }

    /**
     * Calculate shooting direction vector
     * @returns {[number, number]}
     */
    getShootingDirections() {
        const dx = this.game.player.worldX.get() - this.worldX.get()
        const dy = this.game.player.worldY.get() - this.worldY.get()
        const distance = Math.max(1, Math.hypot(dx, dy))
        
        const speed = this.ai.projectile_speed.get()
        return [
            dx / distance * speed,
            dy / distance * speed
        ]
    }

    /**
     * Create and launch a projectile
     * @param {number} velX - X velocity component
     * @param {number} velY - Y velocity component
     * @param {number} current_time - Current game time
     */
    shoot(velX, velY, current_time) {
        const projectileSize = constants.TILE_SIZE / 2
        const hb = new Hitbox(
            this.game, 
            this.game.get_current_map(), 
            this.worldX.get(), 
            this.worldY.get(), 
            projectileSize, 
            projectileSize, 
            false, 
            false
        )
        
        new ProjectileAttack(
            this.game, 
            this, 
            this.game.get_current_map(), 
            current_time, 
            2000,
            [hb], 
            velX, 
            velY, 
            (entity) => { entity.life -= 2 },
            false,
            this.game.tilesets["Axe"], 
            50,
            { 
                x: this.worldX.get() - hb.width.get() / 2, 
                y: this.worldY.get() - hb.height.get() / 2 
            }
        )
    }
}
