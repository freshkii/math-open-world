export const config = {
	MAP_DIR: "./assets/maps/",
	IMG_DIR: "./assets/images/",
	AUDIO_DIR: "./assets/audio/"
}

export const constants = {
    GAME_TPS: 128,
    TILE_SIZE: 128,

    PLAYER_COLLISION_BOX_WIDTH: 2 * 128 / 3,
    PLAYER_COLLISION_BOX_HEIGHT: 128 / 2,
    PLAYER_COMBAT_BOX_WIDTH: 2 * 128 / 3,
    PLAYER_COMBAT_BOX_HEIGHT: 128,

    PLAYER_DASH_DURATION: 100,
    PLAYER_DASH_COOLDOWN: 3000,
    PLAYER_DASH_SPEED: 5,
    PLAYER_DASH_MAX_SPEED: 30,

    LABEL_TYPE: "label",
    BUTTON_TYPE: "button",
    TEXTAREA_TYPE: "textarea",
    NUMBERAREA_TYPE: "numberarea",
    ICON_TYPE: "icon",
    TEXTURE_TYPE: "texture",
    WINDOW_TYPE: "window",
    WIDGET_PRIORITIES: {
        "window": 3,
        "button": 2,
        "textarea": 2, "numberarea": 2,
        "label": 1,
        "texture": 0,
        "icon": 0
    },

    UP_KEY: "z",
    DOWN_KEY: "s",
    LEFT_KEY: "q",
    RIGHT_KEY: "d",
    INTERACTION_KEY: "e",
    DASH_KEY: " ",
	DRAG_KEY: "f",


	DOWN_DIRECTION: 0,
	UP_DIRECTION: 1,
	RIGHT_DIRECTION: 2,
	LEFT_DIRECTION: 3,


	MOUSE_LEFT_BUTTON: 0,
	MOUSE_MIDDLE_BUTTON: 1,
	MOUSE_RIGHT_BUTTON: 2,
	MOUSE_BACK_BUTTON: 3,
	MOUSE_FORWARD_BUTTON: 4,

    IDLE_STATE: 0,
	WALK_STATE: 1,
	ATTACK_STATE: 2,
	DRAG_STATE: 3,
    RUSHING_STATE: 4,

	WANDERING_AI_STATE: 0,
	STILL_AI_STATE: 1,
	CHASING_AI_STATE: 2,
    RUSH_AI_STATE: 3,
    Longrangeattacking_AI_STATE: 4,
    HEALTH_COLORS:['red', 'orange', 'green']
}

const mn = 0.4811320754716981

export const tilesets = [
	{ src:'map.png',																	img_tile_size: 16,		screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'cabane_tileset.png', 														img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'frog.png',																	img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 2	},
	{ src:'spider_tileset.png', 														img_tile_size: 100, 	screen_tile_size: (game, constants) => constants.TILE_SIZE * 4	},
	{ src:'book_ui_focus.png',															img_tile_size: 4,  		screen_tile_size: (game, constants) => game.canvas.width / 16	},
	{ src:'next_page_arrow_tileset.png',												img_tile_size: 24,  	screen_tile_size: (game, constants) => game.canvas.width / 20	},
	{ src:'Kanji.png',																	img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'Axe.png',																	img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'selection_cursor.png', 														img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 2	},
	{ src:'checkbox_tileset.png', 														img_tile_size: 32,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 2	},
	{ src:'arrow.png',																	img_tile_size: 15,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 8	},
	{ src:'inventory_tooltip_tileset.png',												img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 4	},
	{ src:'keys_tileset.png', 															img_tile_size: 20,  	screen_tile_size: (game, constants) => constants.TILE_SIZE / 4	},
	{ src:'digital_locks.png',															img_tile_size: 20,  	screen_tile_size: (game, constants) => constants.TILE_SIZE * mn	},
	{ src:'Game Boy Advance - The Legend of Zelda The Minish Cap - Lon Lon Ranch.png',	img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'Game Boy Advance - The Legend of Zelda The Minish Cap - Hyrule Town.png', 	img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'Game Boy Advance - The Legend of Zelda The Minish Cap - Royal Crypt.png',	img_tile_size: 16,		screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'LegendOfZelda-MinishCap-DarkHyruleCastle.png', 								img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src:'firefly.png', 																img_tile_size: 16,  	screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src: 'e1.png',																	img_tile_size: 16,		screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src: 'e2.png',																	img_tile_size: 16,		screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src: 'statues.png',																img_tile_size: 16,		screen_tile_size: (game, constants) => constants.TILE_SIZE		},
	{ src: 'bear.png',																	img_tile_size: 64,		screen_tile_size: (game, constants) => constants.TILE_SIZE * 4	},
]

export const maps = [
	{
		src: 'map.json',  bg_color: 'grey', spawn_cords: {x: 184.5, y: 94},
		collisions: {
			1394: {height: 80},
			1395: {height: 80},
			1399: {height: 80},
			1400: {height: 80},
			1446: {height: 72},
			1448: {height: 72},
			3076: {x: 24, y: 80, width: 80, height: 24},
			3910: {void: true},
			3950: {width: 48},
			4070: {width: 48},
			4030: {width: 48}
    	}, block_depth_order: [3076]
	},
	{
		src: 'house.json',  bg_color: 'black', spawn_cords: {x: 1.5, y: 3},
		collisions: {
			11: {y: -8, height: 96},
			55: {y: -8, height: 96}
		},
		block_depth_order: [11, 55]
	},
	{
		src: 'castle.json',  bg_color: '#C8F0D0', spawn_cords: {x: 12, y: 70},
		collisions: {
			45042: {void:true},
			45043: {void:true},
			45044: {void:true},
			45267: {void:true},
			45268: {void:true},
			45269: {void:true},
		},
		block_depth_order: []
	}
]

export const audios = {
	'menu': [
		{src: 'click.mp3', key: 'click'}
	],
	'game': [
		{src: 'slash.mp3', key: 'slash'}
	],
	'castle': [
		{src: 'wind.mp3', key: 'wind'},
		{src: 'bell.mp3', key: 'bell'},
		{src: 'lightning.mp3', key: 'lightning'},
		{src: 'heart beating.mp3', key: 'heart beating'}
	],
	'background': [
		{src: 'music1.mp3', key: 'music', loop: true},
		{src: 'step.mp3', key: 'step', loop: true}
	]
}
