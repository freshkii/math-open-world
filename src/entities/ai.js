import { constants } from "../constants.js"
import { Game } from "../core/game.js"
import { Resizeable } from "../utils.js"

export class Ai{
    /**
     * 
     * @param {Game} game - The current Game
     */
    constructor(game){
        this.game = game

        this.state = constants.WANDERING_AI_STATE
        this.wandering_speed = undefined
        this.wandering_radius = undefined
        this.wandering_direction_change_time = undefined

        this.follower = false

        this.hostile = false
        this.chasing_speed = undefined
        this.vision_range = undefined

        this.attack_cooldown = undefined
        this.attack_range = undefined
        this.last_attack = undefined
        this.projectile_speed = undefined

        this.is_long_range = undefined
        this.distance_attack_range = undefined
        this.change_direction_distance_attack_cooldown = undefined

        this.is_rusher = false
        this.rush_cooldown = undefined
        this.nb_attack_during_rush = undefined

        this.rush_activation_range = undefined
    }

    /**
     * Sets the mob's behaviour when it's wandering
     * @param {Number} wandering_speed - The mob's speed when it's wandering 
     * @param {Number} wandering_radius - The radius within which the mob can wander, centered arround it's initial spawn point
     * @param {Number} wandering_direction_change_time - The duration between each direction changes, at most
     * @returns {Ai}
     */
    set_wandering(wandering_speed, wandering_radius, wandering_direction_change_time){
        this.wandering_speed = new Resizeable(this.game, wandering_speed)
        this.wandering_radius = new Resizeable(this.game, wandering_radius)
        this.wandering_direction_change_time = wandering_direction_change_time
        return this
    }

    /**
     * Makes the mob follows the player everywhere
     * @param {Number} chasing_speed - The speed at which the mob follows the player
     * @returns {Ai}
     */
    is_follower(chasing_speed){
        this.is_follower = true
        this.chasing_speed = new Resizeable(this.game, chasing_speed)
        return this
    }

    /**
     * Sets the mob's behaviour when it's attacking the player to middle ranged.
     * It tries to get close to the player, and randomly dash towards him
     * @param {Number} vision_range - The detection radius of the mob
     * @param {Number} chasing_speed - The mob's speed when it's attacking
     * @param {Number} rush_cooldown - The cooldown between each dash, at most
     * @param {Number} nb_attack_during_rush - The number of attacks the mob fire at the end of his dash
     * @returns {Ai}
     */
    set_rusher(vision_range, chasing_speed, rush_cooldown, nb_attack_during_rush){
        this.hostile = true
        this.is_rusher = false

        this.vision_range = new Resizeable(this.game, vision_range)
        this.chasing_speed = new Resizeable(this.game, chasing_speed)
        
        this.rush_cooldown = rush_cooldown
        this.nb_attack_during_rush = nb_attack_during_rush

        return this
    }

    /**
     * Sets the mob's behaviour when it's attacking the player to long ranged.
     * It runs around the player, attacking him from afar
     * @param {Number} vision_range - The detection radius of the mob
     * @param {Number} chasing_speed - The mob's speed when it's attacking
     * @param {Number} distance_attack_range - The distance the mob tries to keep between it and the player
     * @param {Number} change_direction_distance_attack_cooldown - The cooldown between each direction changes, at most
     * @returns {Ai}
     */
    set_long_ranged(vision_range, chasing_speed, distance_attack_range, change_direction_distance_attack_cooldown){
        this.hostile = true
        this.is_long_range = true
        
        this.vision_range = new Resizeable(this.game, vision_range)
        this.chasing_speed = new Resizeable(this.game, chasing_speed)

        this.distance_attack_range = new Resizeable(this.game, distance_attack_range)
        this.change_direction_distance_attack_cooldown = change_direction_distance_attack_cooldown
        
        return this
    }

    /**
     * Sets the mob's behaviour when it's attacking the player to middle ranged.
     * It runs around the player, but randomly dash towards him
     * @param {Number} vision_range - The detection radius of the mob
     * @param {Number} chasing_speed - The mob's speed when it's attacking
     * @param {Number} rush_cooldown - The cooldown between each dash, at most
     * @param {Number} nb_attack_during_rush - The number of attacks the mob fire at the end of his dash
     * @param {Number} rush_activation_range - The distance under which the dash's cooldown is halved on average
     * @param {Number} distance_attack_range - The distance the mob tries to keep between it and the player
     * @param {Number} change_direction_distance_attack_cooldown - The cooldown between each direction changes, at most
     * @returns {Ai}
     */
    set_middle_ranged(vision_range, chasing_speed, rush_cooldown, nb_attack_during_rush, rush_activation_range, distance_attack_range, change_direction_distance_attack_cooldown){
        this.hostile = true
        this.is_long_range = true
        this.is_rusher = true

        this.vision_range = new Resizeable(this.game, vision_range)
        this.chasing_speed = new Resizeable(this.game, chasing_speed)

        this.rush_cooldown = rush_cooldown
        this.nb_attack_during_rush = nb_attack_during_rush

        this.distance_attack_range = new Resizeable(this.game, distance_attack_range)
        this.change_direction_distance_attack_cooldown = change_direction_distance_attack_cooldown

        this.rush_activation_range = new Resizeable(this.game, rush_activation_range)

        return this
    }

    /**
     * Sets the mob's attack's characteristics
     * @param {Number} attack_cooldown - The cooldown between each attacks, at most
     * @param {Number} attack_range - The distance under which the mob will start fire its attacks
     * @param {Number} projectile_speed - The shooted attack's speed
     * @returns {Ai}
     */
    set_attack(attack_cooldown, attack_range, projectile_speed){
        this.attack_cooldown = attack_cooldown
        this.attack_range = new Resizeable(this.game, attack_range)
        this.projectile_speed = new Resizeable(this.game, projectile_speed)
        this.last_attack = 0
        
        return this
    }

    /**
     * Sets misc properties for the ai
     * @param {Object<String, any>} others - An object of the additional properties
     * @returns {Ai}
     */
    set_others(others){
        for(let [key, value] of Object.entries(others)){
            this[key] = value
        }
        return this
    }
}