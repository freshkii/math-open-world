import { config } from "../constants.js"
import { Game } from "../core/game.js"
import { equality_test } from "../utils.js"
import { Ui } from "./ui.js"

export class Problem extends Ui{

    /**
     * !!! One shouldn't use the constructor to make a problem, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {any} answer - The right answer that the player should answer to solve the problem
     * @param {(problem: Problem) => any} answer_provider - A function that should return the awnser if the problem is completed
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem, time: Number) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     */
    constructor(game, width, height, answer, answer_provider, widgets, widgets_state_handler){
        super(game, width, height, widgets, widgets_state_handler)
        this.answer = answer
        this.answer_provider = answer_provider
    }

    /**
     * Problems are uis which can take input and have a correct answer. The create method is async and static
     * @param {Game} game - The current game
     * @param {String} src - The path to the image used as a background for the ui
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {any} answer - The right answer that the player should answer to solve the problem
     * @param {(problem: Problem) => any} answer_provider - A function that should return the awnser if the problem is completed
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem, time: Number) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     * @returns {Promise<Problem>}
     */
    static async create(game, src, width, height, answer, answer_provider, widgets, widgets_state_handler){
        const problem = new Problem(game, width, height, answer, answer_provider, widgets, widgets_state_handler)
        try {
			await problem.load(config.IMG_DIR + src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return problem
    }

    /**
     * 
     * @returns {boolean}
     */
    solved(){
        return equality_test(this.answer, this.answer_provider(this))
    }
}


// Haven't tested it and surely won't do it anytime soon so be careful
export class TimedProblem extends Problem{
    /**
     * !!! One shouldn't use the constructor to make a problem, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {any} answer - The right answer that the player should answer to solve the problem
     * @param {(problem: Problem) => any} answer_provider - A function that should return the awnser if the problem is completed
     * @param {Number} time_limit - The amount of time you have until the problem is over
     * @param {(problem: TimedProblem) => void} on_fail - Function called when exceeding the time limit for the problem
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem, time: Number) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     */
    constructor(game, width, height, answer, answer_provider, time_limit, on_fail, widgets, widgets_state_handler){
        super(game, width, height, answer, answer_provider, widgets, widgets_state_handler)
        this.start_time = null
        this.time_limit = time_limit
        this.on_fail = on_fail
    }

    /**
     * !!! One shouldn't use the constructor to make a problem, use the static create method instead
     * @param {Game} game - The current game
     * @param {String} src - The path to the image used as a background for the ui
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {any} answer - The right answer that the player should answer to solve the problem
     * @param {(problem: Problem) => any} answer_provider - A function that should return the awnser if the problem is completed
     * @param {Number} time_limit - The amount of time you have until the problem is over
     * @param {(problem: TimedProblem) => void} [on_fail=(problem)=>{}] - Function called when exceeding the time limit for the problem
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem, time: Number) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     * @returns {Promise<TimedProblem>}
     */
    static async create(game, src, width, height, answer, answer_provider, time_limit, on_fail=(problem)=>{}, widgets, widgets_state_handler){
        const problem = new TimedProblem(game, width, height, answer, answer_provider, time_limit, on_fail, widgets, widgets_state_handler)
        try {
			await problem.load(config.IMG_DIR + src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return problem
    }

    get_time_left(current_time, raw_time=true){
        let time_left = this.start_time + this.time_limit - current_time
        if(raw_time)
            return time_left
        else
        return {sec: (Math.floor(time_left / 1000)) % 60,
                min: (Math.floor(Math.floor(time_left / 1000) / 60)) % 60,
                h: (Math.floor(Math.floor(time_left / 1000) / 3600))}
    }

    /**
     * 
     * @param {Number} time 
     */
    start(time){
        this.start_time = time
        this.game.current_ui = this
    }

    trigger(){
        this.start_time = null
        this.game.current_ui = this
    }

    update(current_time){
        super.update(current_time)
        if(current_time - this.start_time >= this.time_limit){
            this.on_fail(this)
        }
    }
}
