import { constants } from "../constants.js"
import { Game } from "../core/game.js"
import { Resizeable } from "../utils.js"

export class Ai{
    /**
     * 
     * @param {Game} game 
     */
    constructor(game){
        this.game = game

        this.state = constants.WANDERING_AI_STATE
        this.wandering_speed = null
        this.wandering_radius = null
        this.wandering_direction_change_time = null

        this.follower = false

        this.hostile = false
        this.chasing_speed = null
        this.chasing_range = null

        this.attack_cooldown = null
        this.attack_range = null
        this.last_attack = null

        this.others = null
    }

    /**
     * 
     * @param {Number} wandering_speed 
     * @param {Number} wandering_radius 
     * @param {Number} wandering_direction_change_time 
     * @returns {Ai}
     */
    set_wandering(wandering_speed, wandering_radius, wandering_direction_change_time){
        this.wandering_speed = new Resizeable(this.game, wandering_speed)
        this.wandering_radius = new Resizeable(this.game, wandering_radius)
        this.wandering_direction_change_time = wandering_direction_change_time
        return this
    }

    /**
     * 
     * @returns {Ai}
     */
    is_follower(){
        this.is_follower = true
        return this
    }

    /**
     * 
     * @param {Number} chasing_speed 
     * @param {Number} chasing_range 
     * @param {Number} [attack_range=null]
     * @param {Number} [attack_cooldown=null]
     * @returns {Ai}
     */
    set_hostility(chasing_speed, chasing_range, attack_range=null, attack_cooldown=null){
        this.hostile = true
        this.chasing_speed = new Resizeable(this.game, chasing_speed)
        this.chasing_range = new Resizeable(this.game, chasing_range)
        if(attack_range!=null && attack_cooldown!=null){
            this.attack_range = new Resizeable(this.game, attack_range)
            this.attack_cooldown = attack_cooldown
            this.last_attack = 0
        }
        return this
    }

    /**
     * 
     * @param {Object} others 
     * @returns {Ai}
     */
    set_others(others){
        this.others = others
        return this
    }
}