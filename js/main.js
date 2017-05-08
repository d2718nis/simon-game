var model = {
	gameSequence: [],

	getGameSequence: function() {
		return this.gameSequence;
	},
	resetGameSequence: function() {
		this.gameSequence = [];
	},
	addOneStep: function() {
		this.gameSequence.push(Math.floor(Math.random() * 4));
	},
	checkUserSequence: function(userSequence) {
		for (var i = 0; i < userSequence.length; i++) {
			if (userSequence[i] !== this.gameSequence[i]) {
				return false;
			}
		}
		return true;
	},
};



var view = {
	colors: ['red', 'blue', 'yellow', 'green'],
	sequenceTimeouts: [],
	statusTimeout: null,

	activateButton: function(color) {
		view.darkenAllButtons();
		view.lightUpButton(color);
		view.playSound(color + '-sound', 0.3).then(function() {
			view.darkenButton(color);
		});
	},
	playSequence: function(sequence) {
		return new Promise(function(resolve) {
			var j = 0;
			for (var i = 0; i < sequence.length; i++) {
				view.sequenceTimeouts.push(setTimeout(function() {
					view.activateButton(view.colors[sequence[j]]);
					// Last element of sequence
					if (j === sequence.length-1) {
						// Resolve when half sound stops playing
						setTimeout(function() {
							resolve();
						}, document.getElementById(view.colors[sequence[j]] + '-sound').duration * 500);
					}
					j++;
				}, 1000 * (i+1.5)));
			}
		});
	},
	lightUpButton: function(color) {
		var elements = ['-image', '-button', '-border-inner', '-border-outer'];
		for (var i = 0; i < elements.length; i++) {
			document.getElementById(color + elements[i]).setAttribute('filter', 'url(#brightness-active)');
		}
	},
	darkenButton: function(color) {
		var elements = ['-image', '-button', '-border-inner', '-border-outer'];
		for (var i = 0; i < elements.length; i++) {
			document.getElementById(color + elements[i]).setAttribute('filter', '');
		}
	},
	darkenAllButtons: function() {
		for (var i = 0; i < view.colors.length; i++) {
			view.darkenButton(view.colors[i]);
		}
	},
	togglePowerSwitch: function() {
		if (document.getElementById('power-slider').getAttribute('x') === '-30') {
			document.getElementById('power-slider').setAttribute('x', '-20');
		} else {
			document.getElementById('power-slider').setAttribute('x', '-30');
		}
		view.playSound('switch', 0.2);
	},
	toggleStrictLight: function() {
		if (document.getElementById('strict-light').style.fill !== 'rgb(239, 239, 131)') {
			document.getElementById('strict-light').style.fill = '#efef83';
			document.getElementById('strict-light-blur').style.opacity = '0.2';
		} else {
			document.getElementById('strict-light').style.fill = '#444';
			document.getElementById('strict-light-blur').style.opacity = '0';
		}
	},
	powerOff: function() {
		// Turn off strict light
		document.getElementById('strict-light').style.fill = '#444';
		document.getElementById('display-background').style.display = 'none';
		this.darkenAllButtons();
		for (var i = 0; i < this.sequenceTimeouts.length; i++) {
			clearTimeout(this.sequenceTimeouts[i]);
		}
		this.sequenceTimeouts = [];
		clearTimeout(statusTimeout);
		document.getElementById('on-display').style.display = 'none';
		// Turn off sound
		document.getElementById('music').pause();
	},
	powerOn: function() {
		view.playSound('music', 0.01);
		document.getElementById('on-display').style.display = 'block';
	},
	turnOnDisplay: function() {
		document.getElementById('display-background').style.display = 'block';
	},
	playSound: function(elementId, startVolume, duration) {
		return new Promise(function(resolve) {
			var audio = document.getElementById(elementId);
			audio.volume = startVolume;
			audio.currentTime = 0;
			audio.play();
			setTimeout(function() {
				resolve();
			}, document.getElementById(elementId).duration * 1000);
		});
	},
	// Convert and show level to hearts
	showProgress: function(level) {
		for (var i = 0; i < 10; i++) {
			if (Math.floor(level/2) > i) {
				document.getElementById('heart-' + i).setAttribute('xlink:href',
					'img/path/Heart_Container_Small.svg#heart-container');
			} else if (level !== 0 && Math.floor(level/2) === i) {
				if (level%2 !== 0) {
					document.getElementById('heart-' + i).setAttribute('xlink:href',
						'img/path/Piece_of_Heart_Small.svg#piece-of-heart');
				}
			} else {
				document.getElementById('heart-' + i).setAttribute('xlink:href',
					'img/path/Heart_Container_Empty_Small.svg#heart-container-empty');
			}
		}
	},
	toggleEasterEgg: function() {
		if (document.getElementById('app-logo-bottom').innerHTML === 'a link to the past') {
			document.getElementById('app-logo-bottom').innerHTML = 'a code to the past';
			this.playSound('secret', 0.15);
		} else {
			document.getElementById('app-logo-bottom').innerHTML = 'a link to the past';
		}
	},
	showStatus: function(status) {
		return new Promise(function(resolve) {
			document.getElementById('status-text').innerHTML = status;
			document.getElementById('on-display').style.display = 'none';
			document.getElementById('status-text').style.display = 'block';
			statusTimeout = setTimeout(function() {
				document.getElementById('status-text').style.display = 'none';
				document.getElementById('on-display').style.display = 'block';
				resolve();
			}, 1000);
		});
	}
};



var controller = {
	powerIsOn: false,
	strictModeIsOn: false,
	buttonsBlocked: true,
	userSequence: [],

	startNewGame: function() {
		this.userSequence = [];
		model.resetGameSequence();
		this.incrementGameSequence();
		view.playSequence(model.getGameSequence()).then(function() {
			controller.buttonsBlocked = false;
		});
	},
	togglePowerSwitch: function() {
		// Animate switch
		view.togglePowerSwitch();
		this.powerIsOn = !this.powerIsOn;
		if (this.powerIsOn) {
			view.turnOnDisplay();
			view.showStatus('Loading').then(function() {
				view.powerOn();
				controller.startNewGame();
			});
		} else {
			view.powerOff();
			this.buttonsBlocked = true;
			this.strictModeIsOn = false;
		}
	},
	toggleStrictMode: function() {
		if (this.powerIsOn) {
			view.toggleStrictLight();
			this.strictModeIsOn = !this.strictModeIsOn;
		}
	},
	incrementGameSequence: function() {
		model.addOneStep();
		view.showProgress(model.getGameSequence().length-1);
	},
	pressButton: function(color) {
		if (!this.buttonsBlocked) {
			view.activateButton(color);
			controller.userSequence.push({'red': 0, 'blue': 1, 'yellow': 2, 'green': 3}[color]);
			// Pressed right button
			if (model.checkUserSequence(controller.userSequence)) {
				// User entered all sequence
				if (controller.userSequence.length === model.getGameSequence().length) {
					controller.buttonsBlocked = true;
					// All 20 levels done
					if (model.getGameSequence().length === 20) {
						setTimeout(function() {
							// Display all 10 hearts full
							view.showProgress(model.getGameSequence().length);
							view.playSound('victory', 0.2);
							view.showStatus('You win!').then(function() {
								controller.startNewGame();
							});
						}, 200);
					// Well done! Next sequence
					} else {
						controller.userSequence = [];
						controller.incrementGameSequence();
						view.playSequence(model.getGameSequence()).then(function() {
							controller.buttonsBlocked = false;
						});
					}
				}
			// Pressed wrong button
			} else {
				// Block buttons
				controller.userSequence = [];
				controller.buttonsBlocked = true;
				view.playSound('error', 0.4);
				view.showStatus('Wrong!').then(function() {
					if (controller.strictModeIsOn) {
						model.resetGameSequence();
						controller.incrementGameSequence();
					}
					view.playSequence(model.getGameSequence()).then(function() {
						controller.buttonsBlocked = false;
					});
				});
			}
		}
	},
	// ========== Click handlers ==========
	handleClick: function(target) {
		switch(target.id) {
			case 'red-image':
			case 'red-button':
			case 'red-border-inner':
			case 'red-border-outer':
				this.pressButton('red');
				break;
			case 'blue-image':
			case 'blue-button':
			case 'blue-border-inner':
			case 'blue-border-outer':
				this.pressButton('blue');
				break;
			case 'yellow-image':
			case 'yellow-button':
			case 'yellow-border-inner':
			case 'yellow-border-outer':
				this.pressButton('yellow');
				break;
			case 'green-image':
			case 'green-button':
			case 'green-border-inner':
			case 'green-border-outer':
				this.pressButton('green');
				break;
			case 'power-slide':
			case 'power-slider':
				this.togglePowerSwitch();
				break;
			case 'strict-button':
				this.toggleStrictMode();
				break;
			case 'app-logo-top':
			case 'app-logo':
			case 'app-logo-bottom':
				view.toggleEasterEgg();
				break;
			default:
				break;
		}
	},
};



(function() {
	var app = {
		init: function() {
			this.main();
			this.control();
			this.event();
		},
		main: function() {
		},
		control: function() {
		},
		event: function() {
			var clickTargets = ['red-image', 'red-button', 'red-border-inner', 'red-border-outer',
				'blue-image', 'blue-button', 'blue-border-inner', 'blue-border-outer',
				'yellow-image', 'yellow-button', 'yellow-border-inner', 'yellow-border-outer',
				'green-image', 'green-button', 'green-border-inner', 'green-border-outer',
				'power-slide', 'power-slider', 'strict-button',
				'app-logo-top', 'app-logo', 'app-logo-bottom'];
			for (var i = 0; i < clickTargets.length; i++) {
				// Click events
				document.getElementById(clickTargets[i]).addEventListener('mousedown', function(e) {
					controller.handleClick(e.target);
				});
			}
		}
	}

	app.init();

}());
