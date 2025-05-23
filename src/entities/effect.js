import { Entity } from "./entity.js"

export class Effect {
	/**
	 * @param {(entity: {e:Entity, origin:number, duration:number, last_update:number}) => void} effect
	 * @param {(entity: {e:Entity, origin:number, duration:number, last_update:number}) => void} start
	 * @param {(entity: {e:Entity, origin:number, duration:number, last_update:number}) => void} end
	 * @param {Number} update_cooldown - time between each update
	 */
	constructor(effect, start, end, update_cooldown) {
		this.effect = effect
		this.start = start
		this.end = end
		/** @type {Array<Entity>} */
		this.entities = []
		this.update_cooldown = update_cooldown
		// list of such objects
		// {
		//		entity: Entity,
		//		time_origin:
		//		duration:
		// }
	}

	/**
	 * @param {Number} current
	 * @param {Entity} entity
	 * @param {Number} duration
	 */
	apply(current, entity, duration) {
		const i = this.entities.indexOf(entity)
		if (i !== -1) {
			this.entities[i].origin = current
		}

		this.entities.push({
			e: entity,
			origin: current,
			duration: duration,
			last_update: current - this.update_cooldown
		})
		this.start(this.entities[this.entities.length-1])
	}

	update(current) {
		for (let i = 0; i < this.entities.length; i++) {
			const entity = this.entities[i]
			if (current - entity.last_update > this.update_cooldown) {
				this.effect(entity)
			}
			if (current - entity.origin >= entity.duration) {
				this.end(entity)
				this.entities.splice(i, 1)
			}
		}
	}
}
