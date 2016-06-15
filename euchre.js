////////////////////////////
////////// Euchre //////////
////////////////////////////

var stickTheDealer = true;
var scoreToWin = 10;
var baseCall = 55;
var basePartnerCall = 60;
var goingAloneMalus = 15;
var aggroRange = 15;
var delay = 1000;
var instant = false;
var paused = false;
var curMessage = -1;
var curLine = 0;

// Fisher-Yates algorithm //

function shuffle(array) {
	"use strict";
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

////////////////////////////

function writeLine(text, bold, italic) {
	"use strict";
	var newElement = document.createElement("div"), thisLine;
	curLine += 1;
	if (curLine < 10) {
		thisLine = "000" + String(curLine);
	} else if (curLine < 100) {
		thisLine = "00" + String(curLine);
	} else if (curLine < 1000) {
		thisLine = "0" + String(curLine);
	} else {
		thisLine = String(curLine);
	}
	newElement.textContent = thisLine + ": " + text;
	newElement.style.display = "none";
	if (bold) {
		newElement.style.fontWeight = "bold";
	}
	if (italic) {
		newElement.style.fontStyle = "italic";
	}
	document.getElementById("messages").appendChild(newElement);
}

function showMessage(n, forceEnd) {
	"use strict";
	if (document.getElementById("messages").children[n] && curMessage > -1) {
		if (!paused) {
			document.getElementById("messages").children[n].style.display = "block";
			document.getElementById("messages").children[n].scrollIntoView();
			if (instant || forceEnd) {
				showMessage(n + 1, forceEnd);
			} else {
				setTimeout(function () {showMessage(n + 1); }, delay);
			}
		} else {
			curMessage = n;
		}
	} else {
		curMessage = -1;
	}
}

function Card(name, value, suit, color) {
	"use strict";
	this.name = name;
	this.value = value;
	this.suit = suit;
	this.color = color;
	this.abb = ((value > 1) ? name.slice(0, 1) : String(value + 9)) + "/" + suit.slice(0, 1);
	this.fullName = name + " of " + suit;
	this.getSuit = function (trump, trumpColor) {
		if (this.color === trumpColor && this.value === 2) {
			//Bower
			return trump;
		} else {
			return this.suit;
		}
	};
	this.getValue = function (lead, trump, trumpColor) {
		if (this.color === trumpColor && this.value === 2) {
			//Bower
			return this.value + 16 + (this.suit === trump ? 1 : 0);
		} else if (this.suit === trump) {
			return this.value + 12;
		} else if (this.suit === lead) {
			return this.value + 6;
		} else {
			return this.value;
		}
	};
}

//Create a deck

function createDeck() {
	"use strict";
	var deck = [], cards = ["Nine", "Ten", "Jack", "Queen", "King", "Ace"], i, suits = ["Spades", "Hearts", "Clubs", "Diamonds"], colors = ["Black, Red"], j;
	for (i = 0; i < cards.length; i += 1) {
		for (j = 0; j < suits.length; j += 1) {
			deck.push(new Card(cards[i], i, suits[j], colors[j % 2]));
		}
	}
	return deck;
}

function deal(players, deck, dealer) {
	"use strict";
	
	players[0].hand = [];
	players[1].hand = [];
	players[2].hand = [];
	players[3].hand = [];
	
	players[(dealer + 1) % 4].hand.push(deck.shift());
	players[(dealer + 1) % 4].hand.push(deck.shift());
	
	players[(dealer + 2) % 4].hand.push(deck.shift());
	players[(dealer + 2) % 4].hand.push(deck.shift());
	players[(dealer + 2) % 4].hand.push(deck.shift());
	
	players[(dealer + 3) % 4].hand.push(deck.shift());
	players[(dealer + 3) % 4].hand.push(deck.shift());
	
	players[dealer].hand.push(deck.shift());
	players[dealer].hand.push(deck.shift());
	players[dealer].hand.push(deck.shift());
	
	players[(dealer + 1) % 4].hand.push(deck.shift());
	players[(dealer + 1) % 4].hand.push(deck.shift());
	players[(dealer + 1) % 4].hand.push(deck.shift());
	
	players[(dealer + 2) % 4].hand.push(deck.shift());
	players[(dealer + 2) % 4].hand.push(deck.shift());
	
	players[(dealer + 3) % 4].hand.push(deck.shift());
	players[(dealer + 3) % 4].hand.push(deck.shift());
	players[(dealer + 3) % 4].hand.push(deck.shift());
	
	players[dealer].hand.push(deck.shift());
	players[dealer].hand.push(deck.shift());
}

function AI(name, aggressiveness) {
	"use strict";
	//Traits
	this.name = name;
	this.aggressiveness = aggressiveness || 0.5; //How likely the AI is to call trump
	this.position = -1;
	//Arrays
	this.hand = []; //What the AI has
	//Methods
	this.speak = function (text) {
		writeLine(this.name + ": " + text);
	};
	this.showHand = function () {
		var miniHand = "", i;
		for (i = 0; i < this.hand.length; i += 1) {
			miniHand += this.hand[i].abb + " ";
		}
		return miniHand;
	};
	this.weighDeal = function () {
		//Do not accept the deal if you have no face cards or a total of four 9s and 10s
		var aces = 0, faces = 0, farmers = 0, i;
		for (i = 0; i < this.hand.length; i += 1) {
			if (this.hand[i].value < 2) {
				farmers += 1;
			} else if (this.hand[i].value < 5) {
				faces += 1;
			} else {
				aces += 1;
			}
		}
		if (farmers > 3) {
			//Farmers hand
			this.speak("Farmer's hand.");
			return false;
		} else if (aces > 0 && faces < 1) {
			//Ace no face
			this.speak("Ace no face.");
			return false;
		} else {
			//Accepts deal
			return true;
		}
	};
	this.weighTopCard = function (topCard, dealer) {
		var suit = topCard.suit, color = topCard.color, value = topCard.getValue(null, suit, color), curValue, totalValue = 0, potentialValue = 0, lowestValue = 20, i, diff, partnerDiff = -1;
		for (i = 0; i < this.hand.length; i += 1) {
			curValue = this.hand[i].getValue(null, suit, color);
			if (curValue < lowestValue) {
				lowestValue = curValue;
			}
			totalValue += curValue;
		}
		potentialValue = totalValue - lowestValue + value;
		
		//Considering yourself
		if (this.position === dealer) {
			//You get the card
			diff = potentialValue - baseCall + (Math.random() * aggroRange * this.aggressiveness);
		} else {
			//You don't get the card
			diff = totalValue - baseCall + (Math.random() * aggroRange * this.aggressiveness);
		}
		//Considering your partner	
		if (this.position % 2 === dealer % 2 && this.position !== dealer) {
			//You are the dealer's partner
			partnerDiff = totalValue + value - basePartnerCall + (Math.random() * aggroRange * this.aggressiveness);
		}

		if (partnerDiff >= 0 && partnerDiff > diff) {
			//Do not go alone... you are doing this because your partner is the dealer
			this.speak("Pick it up.");
			return [true, false];
		} else if (diff >= goingAloneMalus) {
			//Go alone
			if (this.position === dealer) {
				this.speak("Going alone.");
			} else {
				this.speak("Pick it up, going alone.");
			}
			return [true, true];
		} else if (diff >= 0) {
			//Pick it up
			if (this.position !== dealer) {
				this.speak("Pick it up.");
			}
			return [true, false];
		} else {
			//Pass
			if (this.position !== dealer) {
				this.speak("Pass.");
			}
			return [false];
		}
	};
	this.discardCard = function (topCard) {
		var suit = topCard.suit, color = topCard.color, curValue, lowestValue = [20, -1], i, chosen;
		for (i = 0; i < this.hand.length; i += 1) {
			curValue = this.hand[i].getValue(null, suit, color);
			if (curValue < lowestValue[0]) {
				lowestValue = [curValue, i];
			}
		}
		chosen = this.hand[lowestValue[1]];
		this.hand.splice(lowestValue[1], 1);
		this.hand.push(topCard);
		return chosen;
	};
	this.weighTrump = function (dealer, noTrump) {
		var i, j, curValue, highest = [0, null], suits = ["Spades", "Hearts", "Clubs", "Diamonds"], colors = ["Black, Red"], diff;
		for (i = 0; i < suits.length; i += 1) {
			curValue = 0;
			for (j = 0; j < this.hand.length; j += 1) {
				curValue += this.hand[j].getValue(null, suits[i], colors[i % 2]);
			}
			if (curValue > highest[0] && suits[i] !== noTrump) {
				//You can't choose the suit of the previous top card as trump
				highest = [curValue, i];
			}
		}
		diff = highest[0] - baseCall + (Math.random() * aggroRange * this.aggressiveness);
		if (diff >= goingAloneMalus) {
			//Go alone
			this.speak(suits[highest[1]] + ", going alone.");
			return [true, [suits[highest[1]], colors[highest[1] % 2]], true];
		} else if (diff >= 0 || (this.position === dealer && stickTheDealer)) {
			//Call trump
			this.speak(suits[highest[1]] + ".");
			return [true, [suits[highest[1]], colors[highest[1] % 2]], false];
		} else {
			//Pass
			if (this.position !== dealer) {
				this.speak("Pass.");
			}
			return [false];
		}
	};
	this.lead = function (trump, trumpColor) {
		var i, curValue, highestNonTrump = [-1, -1], highest = [-1, -1], chosen;
		for (i = 0; i < this.hand.length; i += 1) {
			curValue = this.hand[i].getValue(null, trump, trumpColor);
			if (curValue < 12 && (curValue > highestNonTrump[0])) {
				highestNonTrump = [curValue, i];
			}
			if (curValue > highest[0]) {
				highest = [curValue, i];
			}
		}
		if (highestNonTrump[1] < 0) {
			//Cannot play non-trump
			chosen = this.hand[highest[1]];
			this.hand.splice(highest[1], 1);
			return chosen;
		} else {
			chosen = this.hand[highestNonTrump[1]];
			this.hand.splice(highestNonTrump[1], 1);
			return chosen;
		}
	};
	this.respond = function (lead, curWinner, trump, trumpColor) {
		var i, curValue, bestLeadCard = [-1, -1], bestCard = [-1, -1], chosen;
		if (curWinner[0] % 2 === this.position % 2) {
			//Our partner is already winning. Play the worst card possible.
			bestLeadCard = [20, -1];
			bestCard = [20, -1];
			for (i = 0; i < this.hand.length; i += 1) {
				curValue = this.hand[i].getValue(lead, trump, trumpColor);
				if (this.hand[i].getSuit(trump, trumpColor) === lead && curValue < bestLeadCard[0]) {
					bestLeadCard = [curValue, i];
				}
				if (curValue < bestCard[0]) {
					bestCard = [curValue, i];
				}
			}
		} else {
			//Try to win this trick
			bestLeadCard = [-1, -1];
			bestCard = [-1, -1];
			for (i = 0; i < this.hand.length; i += 1) {
				curValue = this.hand[i].getValue(lead, trump, trumpColor);
				if (this.hand[i].getSuit(trump, trumpColor) === lead && curValue > bestLeadCard[0] && curWinner[1] > bestLeadCard[0]) {
					bestLeadCard = [curValue, i];
				} else if (this.hand[i].getSuit(trump, trumpColor) === lead && curValue < bestLeadCard[0] && curValue > curWinner[1]) {
					//Win by as slim of a margin as possible
					bestLeadCard = [curValue, i];
				}
				if (curValue > bestCard[0] && curWinner[1] > bestCard[0]) {
					bestCard = [curValue, i];
				} else if (curValue < bestCard[0] && curValue > curWinner[1]) {
					//Win by as slim of a margin as possible
					bestCard = [curValue, i];
				}
			}
			if ((bestLeadCard[1] > -1 && (bestLeadCard[0] < curWinner[1])) || (bestCard[0] < curWinner[1])) {
				//Abandon all hope and play your worst card
				//this.speak("Abandoning hope.");
				bestLeadCard = [20, -1];
				bestCard = [20, -1];
				for (i = 0; i < this.hand.length; i += 1) {
					curValue = this.hand[i].getValue(lead, trump, trumpColor);
					if (this.hand[i].getSuit(trump, trumpColor) === lead && curValue < bestLeadCard[0]) {
						bestLeadCard = [curValue, i];
					}
					if (curValue < bestCard[0]) {
						bestCard = [curValue, i];
					}
				}
			}
		}
		if (bestLeadCard[1] < 0) {
			//Cannot follow suit
			chosen = this.hand[bestCard[1]];
			this.hand.splice(bestCard[1], 1);
			return chosen;
		} else {
			//Must follow suit
			chosen = this.hand[bestLeadCard[1]];
			this.hand.splice(bestLeadCard[1], 1);
			return chosen;
		}
	};
}

function game(players, dealer) {
	"use strict";
	//Variables
	var deck, score = [0, 0], dealAccepted, loner, trickScore, trickWinner, curWinner, i, response, pickedUp, topCard, trump, trumpColor, attacker, lead, roundWinner, winner = -1;
	
	//Shuffle the players?
	//shuffle(players);
	
	//Assign positions
	for (i = 0; i < 4; i += 1) {
		players[i].position = i;
	}
	
	curLine = 0;
	curMessage = 0;
	
	writeLine("Team 1: " + players[0].name + " and " + players[2].name + ".");
	writeLine("Team 2: " + players[1].name + " and " + players[3].name + ".");
	
	while (score[0] < scoreToWin && score[1] < scoreToWin) {
		trump = null;
		trumpColor = null;
		loner = -1;
		attacker = -1;
		roundWinner = -1;
		while (!trump) {
			//Get everything ready
			dealAccepted = 0;
			pickedUp = false;
			writeLine("Score: " + score[0] + " to " + score[1] + ".", true);
			
			while (dealAccepted < 4) {
				//Reset the deck
				deck = null;
				deck = createDeck();

				//Shuffle the deck
				shuffle(deck);

				//Deal to all players
				writeLine(players[dealer].name + "'s deal.", true);
				deal(players, deck, dealer);

				for (i = 1; i < 5; i += 1) {
					writeLine(players[(i + dealer) % 4].name + " has " + players[(i + dealer) % 4].showHand());
					response = players[(i + dealer) % 4].weighDeal();
					if (response) {
						dealAccepted += 1;
					}
				}
				if (dealAccepted < 4) {
					writeLine("Redealing...");
					dealAccepted = 0;
				}
			}
			writeLine("The cards in the kitty are: " + deck[0].abb + ", " + deck[1].abb + ", " + deck[2].abb + ", " + deck[3].abb + ".");
			//Flip top card of kitty
			topCard = deck[0];
			writeLine("The top card of the kitty is the " + topCard.fullName + ".");
			//Decide whether to pick it up or not
			for (i = 1; i < 5; i += 1) {
				response = players[(i + dealer) % 4].weighTopCard(topCard, dealer);
				if (response[0]) {
					pickedUp = true;
					trump = topCard.suit;
					trumpColor = topCard.color;
					if (response[1]) {
						loner = (i + dealer) % 4;
					}
					writeLine(players[dealer].name + " drops their " + players[dealer].discardCard(topCard).fullName + " for the " + topCard.fullName + ".");
					attacker = (i + dealer) % 2;
					writeLine("Team " + (attacker + 1) + " calls " + trump + " as trump. Team " + ((2 - attacker)) + " defends.", true);
					break;
				}
			}
			//If nobody picked it up, then choose individually.
			if (!pickedUp) {
				writeLine(players[dealer].name + " flips over the top card.");
				for (i = 1; i < 5; i += 1) {
					response = players[(i + dealer) % 4].weighTrump(dealer, topCard.suit);
					if (response[0]) {
						trump = response[1][0];
						trumpColor = response[1][1];
						if (response[2]) {
							loner = (i + dealer) % 4;
						}
						attacker = (i + dealer) % 2;
						writeLine("Team " + (attacker + 1) + " calls " + trump + " as trump. Team " + ((2 - attacker)) + " defends.", true);
						break;
					}
				}
			}
			if (!trump) {
				//Misdeal, deal moves to next player
				writeLine(players[dealer].name + " does not call trump.");
				writeLine("No trump is called. Misdeal; the deal moves to " + players[(dealer + 1) % 4].name + ".");
				dealer = (dealer + 1) % 4;
			}
		}
		trickScore = [0, 0];
		trickWinner = (dealer + 1) % 4;
		if (trickWinner === ((loner + 2) % 4)) {
			//Partners of the loner cannot lead
			trickWinner = (trickWinner + 1) % 4;
		}
		while (trickScore[0] + trickScore[1] < 5) {
			writeLine("Round score: " + trickScore[0] + " to " + trickScore[1] + ".");
			lead = players[trickWinner].lead(trump, trumpColor);
			writeLine(players[trickWinner].name + " leads with the " + lead.fullName + ".");
			curWinner = [trickWinner, lead.getValue(lead.getSuit(trump, trumpColor), trump, trumpColor)];
			for (i = 1; i < 4; i += 1) {
				if (loner < 0 || (((i + trickWinner) % 4) !== ((loner + 2) % 4))) {
					response = players[(i + trickWinner) % 4].respond(lead.getSuit(trump, trumpColor), curWinner, trump, trumpColor);
					writeLine(players[(i + trickWinner) % 4].name + " plays the " + response.fullName + ".");
					if (response.getValue(lead.getSuit(trump, trumpColor), trump, trumpColor) > curWinner[1]) {
						curWinner = [(i + trickWinner) % 4, response.getValue(lead.getSuit(trump, trumpColor), trump, trumpColor)];
					}
				}
			}
			trickWinner = curWinner[0];
			writeLine(players[trickWinner].name + " wins the trick for Team " + (trickWinner % 2 + 1) + ".", true);
			trickScore[trickWinner % 2] += 1;
		}
		//Time to score
		if (loner > -1) {
			if (trickScore[loner % 2] > 2) {
				if (trickScore[loner % 2] > 4) {
					//Sweep alone
					roundWinner = loner % 2;
					writeLine(players[loner].name + " takes the sweep alone for Team " + (roundWinner + 1) + ".", true, true);
					score[roundWinner] += 4;
				} else {
					//Win alone
					roundWinner = loner % 2;
					writeLine(players[loner].name + " wins alone for Team " + (loner % 2 + 1) + ", " + trickScore[roundWinner] + " to " + trickScore[(roundWinner + 1) % 2] + ".", true, true);
					score[roundWinner] += 1;
				}
			} else {
				//Lose alone (get euchred)
				roundWinner = (loner + 1) % 2;
				writeLine("Team " + (roundWinner + 1) + " euchres " + players[loner].name + ", " + trickScore[roundWinner] + " to " + trickScore[(roundWinner + 1) % 2] + ".", true, true);
				score[roundWinner] += 2;
			}
		} else {
			if (trickScore[0] > 2) {
				roundWinner = 0;
				if (0 !== attacker) {
					//Euchred
					writeLine("Team 1 euchres Team 2, " + trickScore[0] + " to " + trickScore[1] + ".", true, true);
					score[0] += 2;
				} else if (trickScore[0] === 5) {
					//Sweep
					writeLine("Team 1 sweeps Team 2.", true, true);
					score[0] += 2;
				} else {
					//Normal win
					writeLine("Team 1 wins against Team 2, " + trickScore[0] + " to " + trickScore[1] + ".", true, true);
					score[0] += 1;
				}
			} else {
				roundWinner = 1;
				if (1 !== attacker) {
					//Euchred
					writeLine("Team 2 euchres Team 1, " + trickScore[1] + " to " + trickScore[0] + ".", true, true);
					score[1] += 2;
				} else if (trickScore[1] === 5) {
					//Sweep
					writeLine("Team 2 sweeps Team 1.", true, true);
					score[1] += 2;
				} else {
					//Normal win
					writeLine("Team 2 wins against Team 1, " + trickScore[1] + " to " + trickScore[0] + ".", true, true);
					score[1] += 1;
				}
			}
		}
		dealer = (dealer + 1) % 4;
	}
	//Game is over
	if (score[0] >= scoreToWin) {
		winner = 0;
		if (score[1] === 0) {
			writeLine("Team 1 skunks Team 2! Congratulations to " + players[0].name + " and " + players[2].name + ".", true);
		} else {
			writeLine("Team 1 wins " + score[0] + " to " + score[1] + "! Congratulations to " + players[0].name + " and " + players[2].name + ".", true);
		}
		
	} else {
		winner = 1;
		if (score[0] === 0) {
			writeLine("Team 2 skunks Team 1! Congratulations to " + players[1].name + " and " + players[3].name + ".", true);
		} else {
			writeLine("Team 2 wins " + score[1] + " to " + score[0] + "! Congratulations to " + players[1].name + " and " + players[3].name + ".", true);
		}
	}
	showMessage(0);
}

document.getElementById("aiDebug").onchange = function () {
	"use strict";
	document.getElementById("debug").style.display = this.checked ? "block" : "none";
};

document.getElementById("instant").onchange = function () {
	"use strict";
	document.getElementById("delaySpan").style.display = this.checked ? "none" : "inline";
};

document.getElementById("start").onclick = function () {
	"use strict";
	var name00, name01, name10, name11, agg00, agg01, agg10, agg11, dealer = 0;
	
	stickTheDealer = document.getElementById("stickTheDealer").checked;
	scoreToWin = (document.getElementById("scoreToWin").value % 16) || 10;
	baseCall = document.getElementById("baseCall").value;
	basePartnerCall = document.getElementById("basePartnerCall").value;
	goingAloneMalus = document.getElementById("goingAloneMalus").value;
	aggroRange = document.getElementById("aggroRange").value;
	
	name00 = document.getElementById("name00").value || "Artour";
	agg00 = (document.getElementById("agg00").value % 101) / 100;
	
	name01 = document.getElementById("name01").value || "Clinton";
	agg01 = (document.getElementById("agg01").value % 101) / 100;
	
	name10 = document.getElementById("name10").value || "Clement";
	agg10 = (document.getElementById("agg10").value % 101) / 100;
	
	name11 = document.getElementById("name11").value || "Peter";
	agg11 = (document.getElementById("agg11").value % 101) / 100;
	
	if (document.getElementById("dealer0").checked) {
		dealer = 0;
	} else if (document.getElementById("dealer1").checked) {
		dealer = 1;
	} else if (document.getElementById("dealer2").checked) {
		dealer = 2;
	} else if (document.getElementById("dealer3").checked) {
		dealer = 3;
	}
	
	delay = document.getElementById("delay").value % 10000;
	instant = document.getElementById("instant").checked;
	
	document.getElementById("setup").style.display = "none";
	document.getElementById("game").style.display = "block";
	
	game([new AI(name00, agg00), new AI(name01, agg01), new AI(name10, agg10), new AI(name11, agg11)], dealer);
};

document.getElementById("reset").onclick = function () {
	"use strict";
	
	document.getElementById("setup").style.display = "block";
	document.getElementById("game").style.display = "none";
	
	paused = false;
	document.getElementById("pause").value = paused ? "Pause" : "Unpause";
	
	while (document.getElementById("messages").hasChildNodes()) {
		document.getElementById("messages").removeChild(document.getElementById("messages").firstChild);
	}
};

document.getElementById("pause").onclick = function () {
	"use strict";
	document.getElementById("pause").value = paused ? "Pause" : "Unpause";
	paused = !paused;
	if (!paused) {
		showMessage(curMessage);
	}
};

document.getElementById("end").onclick = function () {
	"use strict";
	showMessage(0, true);
};
