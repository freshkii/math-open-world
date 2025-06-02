import { Entity } from "./entity.js"

export class Effect {
	/**
	 * @param {(instance: {entity:Entity, origin:number, duration:number, last_update:number}) => void} effect
	 * @param {(instance: {entity:Entity, origin:number, duration:number, last_update:number}) => void} start
	 * @param {(instance: {entity:Entity, origin:number, duration:number, last_update:number}) => void} end
	 * @param {Number} update_cooldown - time between each update
	 */
	constructor(effect, start, end, update_cooldown) {
		this.effect = effect
		this.start = start
		this.end = end
		/** @type {Array<{entity: Entity, origin: Number, duration: Number, last_update: Number}>} */
		this.effect_instances = []
		/** @type {Array<Entity>} */
		this.entities = []
		this.update_cooldown = update_cooldown
	}

	/**
	 * @param {Number} current
	 * @param {Entity} entity
	 * @param {Number} duration
	 */
	apply(current, entity, duration) {
		const i = this.entities.indexOf(entity)
		if (i !== -1) {
			this.effect_instances[i].origin = current
			return
			// So that applying an effect twice only prolongate the effect's duration
		}

		this.effect_instances.push({
			entity: entity,
			origin: current,
			duration: duration,
			last_update: current - this.update_cooldown,
		})
		this.entities.push(entity)
		this.start(this.effect_instances[this.effect_instances.length-1])
	}

	update(current) {
		for (let i = 0; i < this.effect_instances.length; i++) {
			let effect_instance = this.effect_instances[i]
			if (current - effect_instance.last_update > this.update_cooldown) {
				this.effect(effect_instance)
			}
			if (current - effect_instance.origin >= effect_instance.duration) {
				this.end(effect_instance)
				this.effect_instances.splice(i, 1)
				this.entities.splice(i, 1)
			}
		}
	}
}
