import { Entity } from "./entity.js"
import { constants } from "../constants.js"
import { Resizeable } from "../utils.js"
import { Game } from "../core/game.js"
import { Map } from "../world/map.js"
import { Tileset } from "../world/tileset.js"
import { Hitbox } from "./hitbox.js"
import { Ai } from "./ai.js"

/**
 * @typedef {Object} MobAI
 * @property {string} state - The current AI state (STILL_AI_STATE, WANDERING_AI_STATE, CHASING_AI_STATE)
 * @property {Resizeable} [wandering_speed] - Movement speed when wandering
 * @property {Resizeable} [wandering_radius] - Max distance from center when wandering
 * @property {number} [wandering_direction_change_time] - Time between direction changes (ms)
 * @property {Resizeable} [chasing_range] - Detection range for chasing player
 * @property {Boolean} [follower] - Whether the entity follows the player forever or not
 * @property {number} [attack_cooldown] - Time between attacks (ms)
 * @property {Resizeable} [attack_range] - Range for attacking player
 * @property {boolean} [hostile] - Whether the mob attacks the player
 * @property {Resizeable} [chasing_speed] - Movement speed when chasing
 */


export class Mob extends Entity {
    /**
     * 
     * @param {Game} game 
     * @param {Map} map 
     * @param {Tileset} tileset 
     * @param {Hitbox} collision_hitbox 
     * @param {Hitbox} combat_hitbox 
     * @param {Number} worldX 
     * @param {Number} worldY 
     * @param {Number} animation_duration 
     * @param {Ai} ai 
     * @param {Number} life 
     * @param {{collision: {x: Number, y: Number}, combat: {x: Number, y: Number}}} hitboxes_offset 
     */
	constructor(game, map, tileset, collision_hitbox, combat_hitbox, worldX, worldY, animation_duration, ai, life=null, hitboxes_offset = {combat: {x: 0, y: 0}, collision: {x: 0, y: 0}}, bottom_y=null) {
        super(game, map, tileset, collision_hitbox, combat_hitbox, worldX, worldY, animation_duration, life, hitboxes_offset, bottom_y)
        
        this.ai = ai
        this.center_point = {
            x: new Resizeable(game, worldX),
            y: new Resizeable(game, worldY)
        }
        
        this.last_direction_change = 0
        this.last_attack_time = 0
        
        this.walkStartTime = 0
        this.walkDuration = 0
        this.pauseStartTime = 0
        this.pauseDuration = 0

        switch(this.ai.state) {
            case constants.WANDERING_AI_STATE:
                this.state = constants.WALK_STATE
                this.walkStartTime = 0
                this.walkDuration = 2000 + Math.random() * 3000
                break
            case constants.CHASING_AI_STATE:
                this.state = constants.WALK_STATE
                break
            case constants.STILL_AI_STATE:
                this.state = constants.IDLE_STATE
                break
        }
    }

    update(current_time) {
        if (this.life === 0) {
            this.destroy()
            return
        }

        switch (this.ai.state) {
            case constants.WANDERING_AI_STATE:
                this.updateWandering(current_time)
                break
            case constants.CHASING_AI_STATE:
                this.updateChasing(current_time)
                break
        }

        super.update(current_time)
    }

    changeWanderingDirection(current_time) {
        // Use 8-directional movement for more predictable wandering
        const directions = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 
                          5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4]
        const angle = directions[Math.floor(Math.random() * directions.length)]
        
        const speed = this.ai.wandering_speed.get()
        this.dx.set_value(Math.cos(angle) * speed)
        this.dy.set_value(Math.sin(angle) * speed)
        this.last_direction_change = current_time
    }

	updateWandering(current_time) {
        if (this.ai.hostile) {
            const d = Math.hypot(
                this.game.player.worldX.get() - this.worldX.get(), 
                this.game.player.worldY.get() - this.worldY.get()
            )
            if (d <= this.ai.chasing_range.get()) {
                this.ai.state = constants.CHASING_AI_STATE
                this.updateChasing(current_time)
                return
            }
        }

        if (this.state === constants.WALK_STATE) {
            if (current_time - this.walkStartTime >= this.walkDuration) {
                this.state = constants.IDLE_STATE
                this.pauseStartTime = current_time
                this.pauseDuration = 1500 + Math.random() * 5000
                this.dx.set_value(0)
                this.dy.set_value(0)
            } else {
                if (current_time - this.last_direction_change > this.ai.wandering_direction_change_time) {
                    this.changeWanderingDirection(current_time)
                }

                const dx = this.worldX.get() - this.center_point.x.get()
                const dy = this.worldY.get() - this.center_point.y.get()
                const distance = Math.hypot(dx, dy)

                if (distance > this.ai.wandering_radius.get() * 0.7) {
                    const Dx = dx / Math.max(1, distance)
                    const Dy = dy / Math.max(1, distance)
                    
                    this.dx.set_value(-Dx * this.ai.wandering_speed.get())
                    this.dy.set_value(-Dy * this.ai.wandering_speed.get())
                }
            }
        } else if (this.state === constants.IDLE_STATE) {
            if (current_time - this.pauseStartTime >= this.pauseDuration) {
                this.state = constants.WALK_STATE
                this.walkStartTime = current_time
                this.walkDuration = 2000 + Math.random() * 3000
                this.changeWanderingDirection(current_time)
            }
        }
    }

	    /**
     * Update chasing behavior
     * @param {number} current_time - Current game time
     */
    updateChasing(current_time) {
        const distance = Math.floor(Math.hypot(
            this.game.player.worldX.get() - this.worldX.get(),
            this.game.player.worldY.get() - this.worldY.get()
        ))

        if (!this.ai.follower && distance > this.ai.chasing_range.get()) {
            this.ai.state = constants.WANDERING_AI_STATE
            this.dx.set_value(0)
            this.dy.set_value(0)
			this.center_point.x = this.worldX
			this.center_point.y = this.worldY
            return
        }

		if (distance == 0) {
			this.dx.set_value(0)
			this.dy.set_value(0)
		}
		else if (distance <= this.ai.chasing_range.get()) {
			const dx = (this.game.player.worldX.get()-this.worldX.get())/distance * this.ai.chasing_speed.get()
			const dy = (this.game.player.worldY.get()-this.worldY.get()) / distance * this.ai.chasing_speed.get()
            this.dx.set_value(dx)
            this.dy.set_value(dy)
        }

        if (current_time - this.last_attack_time > this.ai.attack_cooldown) {
            this.attack(current_time)
            this.last_attack_time = current_time
        }
    }

    attack() {
        // To be implemented by specific mob types
    }
}
