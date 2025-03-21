import { Game } from "../core/game.js";
import { Ui } from "./ui.js";

export class Problem extends Ui{

    /**
     * !!! One shouldn't use the constructor to make a problem, use the static create method instead
     * @param {Game} game - The current game
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {String} answer - The right answer that the player should answer to solve the problem
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     */
    constructor(game, width, height, answer, widgets, widgets_state_handler){
        super(game, width, height, widgets, widgets_state_handler)
        this.answer = answer
    }

    /**
     * Problems are uis which can take input and have a correct answer. The create method is async and static
     * @param {Game} game - The current game
     * @param {String} src - The path to the image used as a background for the ui
     * @param {Number} width - The Problem's width on the screen
     * @param {Number} height - The Problem's height on the screen
     * @param {String} answer - The right answer that the player should answer to solve the problem
     * @param {Array<Widget>} widgets - The list of widgets that shows up on the ui
     * @param {(problem: Problem) => void} widgets_state_handler - method made to handle widgets states (like widgets being 'cliked' on 'focused-on'), executed at each update
     * @returns {Problem}
     */
    static async create(game, src, width, height, answer, widgets, widgets_state_handler){
        const problem = new Problem(game, width, height, answer, widgets, widgets_state_handler)
        try {
			await problem.load(src)
		} catch (error) {
			console.error(`couldn't load file "${src}" : ${error.message}`)
			return
		}
		return problem
    }
}
