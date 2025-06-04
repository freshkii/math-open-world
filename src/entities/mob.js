import { Entity } from "./entity.js"
import { constants } from "../constants.js"
import { clamp, Resizeable } from "../utils.js"
import { Game } from "../core/game.js"
import { Map } from "../world/map.js"
import { Tileset } from "../world/tileset.js"
import { Hitbox } from "./hitbox.js"
import { Ai } from "./ai.js"


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
	  constructor(game, map, tileset, collision_hitbox, combat_hitbox, worldX, worldY, animation_duration, ai, life=null, hitboxes_offset = {combat: {x: 0, y: 0}, collision: {x: 0, y: 0}}, bottom_y=null, type="Mob") {
        super(game, map, tileset, collision_hitbox, combat_hitbox, worldX, worldY, animation_duration, life, hitboxes_offset, bottom_y, type=type)
        
        this.ai = ai
        this.center_point = {
            x: new Resizeable(game, worldX),
            y: new Resizeable(game, worldY)
        }
        
        this.last_direction_change = 0
           
        this.walkStartTime = 0  
        this.walkDuration = 0
        this.pauseStartTime = 0
        this.pauseDuration = 0

        if (this.ai.hostile){
            this.last_attack_time = 0
            if (this.ai.is_rusher){
                this.last_rush_time = 0
                this.rush_pause_duration = this.ai.rush_cooldown * Math.random()
                this.nb_rush_attack_done= 0 

                this.dash_duration= 1000
                this.DASH_SPEED = new Resizeable(game, 12)
                this.DASH_MAX_SPEED = 30
            }
            if (this.ai.is_long_range){
                this.long_range_attack_direction = 1
                this.long_range_last_direction_change = 0
                this.attack_pause = this.ai.attack_cooldown*2*Math.random()
                this.long_range_change_direction_pause = this.ai.change_direction_distance_attack_cooldown * Math.random()
            }

        }   
        
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
            case constants.RUSH_AI_STATE:
                this.state = constants.RUSHING_STATE
                break
        }
    }

    update(current_time) {
        // console.log(this.ai.state)
        if (this.life === 0) {
            this.destroy()
            return
        }
        this.manage_states_update(current_time)
        // switch (this.ai.state) {
        //     case constants.WANDERING_AI_STATE:
        //         console.log(this.ai.state, "jusqu'ici tout va bien")
        //         this.updateWandering(current_time)
        //         break
        //     case constants.STILL_AI_STATE:
        //         console.log(this.ai.state, "jusqu'ici tout va bien")
        //         this.updateWandering(current_time)
        //         break
        //     case constants.CHASING_AI_STATE:
        //         console.log(this.ai.state, "jusqu'ici tout va bien")
        //         this.updateChasing(current_time)
        //         break
        //     case constants.RUSH_AI_STATE:
        //         console.log(this.ai.state, "jusqu'ici tout va bien")
        //         this.updateRushing(current_time)
        //         break
            
        // }

        super.update(current_time)
    }

    manage_states_update(current_time){
        //console.log()
        if (this.ai.follower){
            this.updateChasing(current_time)
            return
        }
        if (this.ai.hostile) {
            //console.log('je suis un méchant garçon')
            const d = Math.hypot(
                    this.game.player.worldX.get() - this.worldX.get(), 
                    this.game.player.worldY.get() - this.worldY.get()
                )
            if (d>this.ai.vision_range.get()){
                // il va direct au bout pr wandering
                // console.log("je m'en vais alors")
            } else if (this.ai.is_long_range && this.ai.is_rusher){
                this.state = constants.WALK_STATE
                // console.log('je suis 2')
                if (this.ai.state === constants.RUSH_AI_STATE){
                    // console.log("test")
                    this.updateRushing(current_time)
                    return
                }
                if (d <= this.ai.vision_range.get()) {
                    if ((current_time - this.last_rush_time >=  this.rush_pause_duration) || (d<=this.ai.rush_activation_range.get() && current_time - this.last_rush_time >=  this.rush_pause_duration/2)) {
                        //console.log("je rush")
                        this.ai_state = constants.RUSH_AI_STATE
                        this.last_dash = current_time
                        this.updateRushing(current_time)
                        return
                    }
                    this.ai.state = constants.Longrangeattacking_AI_STATE
                    this.updateLongrangeattacking(current_time)
                    return
                }
                //faudra peut être faire en sorte que parfois il rush, qnd le mec est trop près par exemple 
                //donc avec une chasing range et par exemple il dash direct
            } else if (this.ai.is_rusher){
                this.state = constants.WALK_STATE
                // console.log('je viens à toi, hihi')
                if (this.ai.state === constants.RUSH_AI_STATE){
                    this.updateRushing(current_time)
                    return
                }
                if (d <= this.ai.vision_range.get()) {
                    if (current_time - this.last_rush_time >=  this.rush_pause_duration) {
                        //console.log("je rush")
                        this.ai_state = constants.RUSH_AI_STATE
                        this.last_dash = current_time
                        this.updateRushing(current_time)
                        return
                    }
                    this.ai.state = constants.CHASING_AI_STATE
                    this.updateChasing(current_time)
                    return
                }
            } else if (this.ai.is_long_range){
                this.state = constants.WALK_STATE
                // changer le AI state
                // console.log("je vais danser")
                this.ai.state = constants.Longrangeattacking_AI_STATE
                this.updateLongrangeattacking(current_time)
                return
            }
        }
        if (this.ai.state !== constants.WANDERING_AI_STATE){
            this.ai.state = constants.WANDERING_AI_STATE
            this.dx.set_value(0)
            this.dy.set_value(0)
			this.center_point.x = this.worldX
			this.center_point.y = this.worldY
        }
        //console.log("où suis-je?")
        this.updateWandering(current_time)
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
        // console.log(this.state)
        if (this.state === constants.WALK_STATE) {
            if (current_time - this.walkStartTime >= this.walkDuration) {
                this.state = constants.IDLE_STATE
                this.pauseStartTime = current_time
                this.pauseDuration = 1500 + Math.random() * 5000
                this.dx.set_value(0)
                this.dy.set_value(0)
            } else {
                if (current_time - this.last_direction_change > this.ai.wandering_direction_change_time) {
                    // console.log("test")
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
                // console.log("teeeeest")
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
    
    updateLongrangeattacking(current_time){
        //calcule la distance au joueur, le vecteur qui va vers le joueur et celui normal. après on les additionne avec 
        //des coef puis on arrange pr que ce soit la bonne norme. si le temps de changement de direction est écoulé on le vecteur normal opposité
        const distance = Math.hypot(
                this.game.player.worldX.get() - this.worldX.get(),
                this.game.player.worldY.get() - this.worldY.get()
            )
        const dx_to_player = (this.game.player.worldX.get()-this.worldX.get())/distance * this.ai.chasing_speed.get()
		const dy_to_player = (this.game.player.worldY.get()-this.worldY.get()) / distance * this.ai.chasing_speed.get()
        const dx_normal_player = dy_to_player * this.long_range_attack_direction
        const dy_normal_player = dx_to_player * this.long_range_attack_direction * (-1)
        let coef = clamp((distance - this.ai.distance_attack_range.get())/this.ai.distance_attack_range.get(), -1, 1)
        const dx_fuire_player = dx_to_player*coef
        const dy_fuire_player = dy_to_player*coef
        const dx = dx_fuire_player + dx_normal_player*(1-Math.abs(coef))
        const dy = dy_fuire_player + dy_normal_player*(1-Math.abs(coef))
        //console.log(this.game.player.dx.get(), this.game.player.dy.get())
        this.dx.set_value(dx)
        this.dy.set_value(dy)
        //console.log(current_time - this.long_range_last_direction_change > this.long_range_change_direction_pause)
        if (current_time - this.long_range_last_direction_change > this.long_range_change_direction_pause){
            //console.log('changement de sens')
            this.long_range_attack_direction = -1*this.long_range_attack_direction
            this.long_range_last_direction_change = current_time
            this.long_range_change_direction_pause = this.ai.change_direction_distance_attack_cooldown * Math.random()
        }
            
        if (current_time - this.last_attack_time > this.attack_pause) {
            this.attack(current_time)
            this.attack_pause = this.ai.attack_cooldown*2*Math.random()
            this.last_attack_time = current_time
        }
    }

    updateRushing(current_time) {
         const distance = Math.hypot(
                this.game.player.worldX.get() - this.worldX.get(),
                this.game.player.worldY.get() - this.worldY.get()
            )
        if (distance<Math.max(this.collision_hitbox.width.get()/2, this.collision_hitbox.height.get()/2)+1){this.last_dash = 0}
        if (current_time - this.last_dash <= this.dash_duration) {
            const dx = ((this.game.player.worldX.get()-this.worldX.get())/distance) * this.DASH_SPEED.get()
			const dy = ((this.game.player.worldY.get()-this.worldY.get()) / distance) * this.DASH_SPEED.get()
            this.dx.set_value(dx)
            this.dy.set_value(dy)
            this.ai.state = constants.RUSH_AI_STATE
            return
        }
        if (current_time - this.last_dash > this.dash_duration) {
            // console.log("ca c pas normal")
            this.state = constants.IDLE_STATE
            this.dx.set_value(0)
            this.dy.set_value(0)
            // tirer sur le joueur si le temps d'attaque est inférieur à 2 fois moins que de base, baisser le nb_rush_attack 
            // s'il vaut 0: changer le state pr chasing, changer le last rush time, changer le cooldown du rush. 
            if (this.nb_rush_attack_done == this.ai.nb_attack_during_rush){
            //console.log("dashfini, attaque fini")
            this.last_rush_time= current_time
            this.nb_rush_attack_done = 0
            this.rush_pause_duration = this.ai.rush_cooldown * Math.random()
            this.ai.state = constants.CHASING_AI_STATE
            this.updateChasing(current_time)
            return  
           }
           if (current_time - this.last_attack_time > this.ai.attack_cooldown/6) {
            // console.log("dashfini, attaque")
            this.attack(current_time)
            this.nb_rush_attack_done ++
            this.last_attack_time = current_time
        }
        return
        }

        
    }

    updateChasing(current_time) {
        const distance = Math.floor(Math.hypot(
            this.game.player.worldX.get() - this.worldX.get(),
            this.game.player.worldY.get() - this.worldY.get()
        ))

		if (distance < Math.max(this.collision_hitbox.width.get()/2, this.collision_hitbox.height.get()/2)+1) {
			this.dx.set_value(0)
			this.dy.set_value(0)
		}
        
		else {
            //console.log("je change de direction")
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