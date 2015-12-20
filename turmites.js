//////////////////////////////////
//////////// TURMITES ////////////
//////////////////////////////////

var grid, msPerTick = 100, stepsPerTick = 1, sizeX = 10, sizeY = 5, ruleset = "{{{1, 2, 0}, {0, 8, 0}}}";
var canvas = document.getElementById("canvas");
var running = false;
var tickInterval;
var steps = 0;
var turmiteCount = 0;

// On every timestep, a turmite performs each of the following actions:
// 1. Turns by a multiple of 90 degrees
// 2. Changes the color of the square it is on (or maybe doesn't?)
// 3. Changes its current state (or doesn't)
// 4. Moves forward one square

// Example string notation: {{{1, 8, 1}, {1, 8, 1}}, {{1, 2, 1}, {0, 1, 0}}} generates a Fibonnaci spiral
// {newColor, turn, newState}
// Turn reference: 1=noturn, 2=right, 4=u-turn, 8=left

// {{{1, 2, 0}, {0, 8, 0}}} is Langton's ant

//var rulestring = "{{{1, 8, 1}, {1, 8, 1}}, {{1, 2, 1}, {0, 1, 0}}}";
//var rulestring = "{{{1, 2, 0}, {0, 8, 0}}}";
//var rulestring = "{{{1, 1, 1}, {1, 8, 0}}, {{1, 2, 1}, {0, 1, 0}}}";
//var rulestring = "{{{1, 2, 0}, {2, 2, 0}, {3, 8, 0}, {0, 8, 0}}}";

//var rulestring = "RRLLLRLLLRRR";

//var rulestring = "{{{1, 2, 0}, {1, 2, 1}}, {{0, 1, 0}, {0, 1, 1}}}";    

function parseRulestring(rulestring) {
    "use strict";
    rulestring = rulestring.replace(/\s+/g, '');
    if (rulestring.split("")[0] !== "{") {
        var n = 0, output = "", k, p;
        rulestring = rulestring.split("");
        for (n; n < rulestring.length; n += 1) {
            k = n + 1;
            if (k === rulestring.length) {k = 0; }
            if (rulestring[n] === "L") {
                p = 8;
            } else if (rulestring[n] === "R") {
                p = 2;
            } else {
                p = 1;
            }
            output += "{" + k + ", " + p  + ", 0}";
            if (k !== 0) {output += ", "; }
        }
        rulestring = "{{" + output + "}}";
    }
    return JSON.parse(rulestring.replace(/\{/g, "[").replace(/\}/g, "]"));
}

function Cell(grid, color, x, y, display) {
    //Constructs a cell that is part of a grid
    
    "use strict";
    this.grid = grid;
    this.color = color;
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.display = false;

    this.changeColor = function (color) {
        this.color = color;
        var borderColor = Math.round(this.color / (ruleset[0].length - 1) * 255), ourCell = document.getElementById(this.x + "_" + this.y), displayedColor = 255 - borderColor;
        
        if (ourCell !== null) {
            ourCell.style.backgroundColor = "rgb(" + displayedColor + "," + displayedColor + "," + displayedColor + ")";
            ourCell.style.border = "1px dotted rgb(" + borderColor + "," + borderColor + "," + borderColor + ")";
        }
    };
    
    //////////////////////// GRAPHICS ////////////////////////
    
    this.calibrateDisplay = function () {
        this.display = true;
        
        var cellDiv = document.getElementById(this.x + "_" + this.y), root = this;
        
        if (cellDiv === null) {
            cellDiv = document.createElement("div");
            cellDiv.className = "cell";
            cellDiv.id = this.x + "_" + this.y;
            cellDiv.style.position = "absolute";
            cellDiv.onclick = function () {
                root.grid.createTurmite(root.x, root.y);
            };
            
            canvas.appendChild(cellDiv);
        }
        
        cellDiv.style.left = (100 / (this.grid.posWidth - this.grid.negWidth)) * (this.x - this.grid.negWidth) + "%";
        cellDiv.style.top = (100 / (this.grid.posHeight - this.grid.negHeight)) * (this.y - this.grid.negHeight) + "%";
        cellDiv.style.width = (100 / (this.grid.posWidth - this.grid.negWidth)) + "%";
        cellDiv.style.height = (100 / (this.grid.posHeight - this.grid.negHeight)) + "%";
        
        this.changeColor(this.color);
    };
    
    if (display) {
        this.calibrateDisplay();
    }
    
    //////////////////////////////////////////////////////////
    
}

function Turmite(grid, state, direction, x, y) {
    //Constructs a turmite
    "use strict";
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.state = state;
    this.direction = direction; //0 = facing east, 1 = north, 2 = west, 3 = south
    this.id = turmiteCount;
    this.preparedAction = [];
    turmiteCount += 1;
    
    //////////////////////// GRAPHICS ////////////////////////
    
    this.calibrateDisplay = function () {
        var turmiteDiv = document.getElementById("Turmite_" + this.id), cellDiv = document.getElementById(this.x + "_" + this.y), root = this;
        
        if (turmiteDiv === null) {
            turmiteDiv = document.createElement("div");
            turmiteDiv.style.position = "absolute";
            turmiteDiv.className = "turmite";
            turmiteDiv.id = "Turmite_" + this.id;
            turmiteDiv.style.zIndex = 10;
            turmiteDiv.oncontextmenu = function () {
                root.grid.removeTurmite(root.id);
            };
            turmiteDiv.onclick = function () {
                root.turn(2);
            };
            
            canvas.appendChild(turmiteDiv);
        }
        
        if (cellDiv !== null) {
            turmiteDiv.style.left = cellDiv.style.left;
            turmiteDiv.style.top = cellDiv.style.top;
            turmiteDiv.style.width = cellDiv.style.width;
            turmiteDiv.style.height = cellDiv.style.height;
            turmiteDiv.style.transform = "rotate(" + (180 - this.direction * 90) + "deg)";
        }

    };
    
    this.calibrateDisplay();

    //////////////////////////////////////////////////////////
    
    this.turn = function (turn) {
        this.direction -= Math.round(Math.log(turn) / Math.LN2);
        
        var ourTurmite = document.getElementById("Turmite_" + this.id);
        
        ourTurmite.style.transform = "rotate(" + (180 - this.direction * 90) + "deg)";
    };
    
    this.move = function () {
        this.x += Math.round(Math.cos(this.direction * Math.PI * 0.5));
        this.y -= Math.round(Math.sin(this.direction * Math.PI * 0.5));
        
        var cell = this.grid.getCell(this.x, this.y), ourTurmite = document.getElementById("Turmite_" + this.id), display = cell.display ? "initial" : "none", thisCell = document.getElementById(this.x + "_" + this.y);
        
        ourTurmite.style.display = display;
        
        if (display !== "none") {
            ourTurmite.style.left = thisCell.style.left;
            ourTurmite.style.top = thisCell.style.top;
        }
    };
    
    //Prepare an action that will be carried out independently of other Turmite's interactions
    this.prepareAction = function () {
        var cell = this.grid.getCell(this.x, this.y);
        
        //preparedAction[0] = new color of the current cell
        //preparedAction[1] = the type of turn the turmite must take
        //preparedAction[2] = the new state that the turmite will have after completing the move
        
        this.preparedAction = ruleset[this.state][cell.color];
    };
    
    //Carry out the prepared action
    this.step = function () {
        var cell = this.grid.getCell(this.x, this.y);

        //Turn based on the color of the new cell
        this.turn(this.preparedAction[1]);
        
        //Move forwards
        this.move();
        
        //Change the color of the old cell
        cell.changeColor(this.preparedAction[0]);

        //Change state based on the color of the old cell
        this.state = this.preparedAction[2];
    };
}

function Grid(X, Y) {
    //Constructs a grid with X * Y cells
    "use strict";
    
    this.posWidth = X;
    this.posHeight = Y;
    this.negWidth = 0;
    this.negHeight = 0;
    this.turmites = [];
    this.cells = [];
    var x, y, cell;
    
    //Create all of the original cells
    for (x = this.negWidth; x < this.posWidth; x += 1) {
        this.cells[x] = [];
        for (y = this.negHeight; y < this.posHeight; y += 1) {
            this.cells[x][y] = new Cell(this, 0, x, y, true);
        }
    }
    
    //This function will allow a turmite to enter the world
    this.createTurmite = function (x, y) {
        var turmite = new Turmite(this, 0, 2, x, y);
        this.turmites.push(turmite);
    };

    //This function will allow a turmite to leave the world
    this.removeTurmite = function (id) {
        var n;
        for (n = 0; n < this.turmites.length; n += 1) {
            if (this.turmites[n].id === id) {
                this.turmites.splice(n, 1);
                document.getElementById("Turmite_" + id).style.display = "none";
            }
        }
    };
    
    //This function will always return a valid cell, even if it doesn't currently exist.
    this.getCell = function (x1, y1) {
        if (this.cells[x1] === undefined) {
            this.cells[x1] = [];
            if (x1 < this.negWidth) {this.negWidth = x1; }
            if (x1 >= this.posWidth) {this.posWidth = x1 + 1; }
        }
        if (this.cells[x1][y1] === undefined) {
            this.cells[x1][y1] = new Cell(this.grid, 0, x1, y1);
            if (y1 < this.negHeight) {this.negHeight = y1; }
            if (y1 >= this.posHeight) {this.posHeight = y1 + 1; }
        }
        return this.cells[x1][y1];
    };
    
    //This function will recalibrate the display with the correct dimensions.
    this.recalibrateDisplay = function () {
        var x1, y1, n;
        
        for (x1 = this.negWidth; x1 < this.posWidth; x1 += 1) {
            if (this.cells[x1] === undefined) {this.cells[x1] = []; }
            for (y1 = this.negHeight; y1 < this.posHeight; y1 += 1) {
                if (this.cells[x1][y1] === undefined) {this.cells[x1][y1] = new Cell(this, 0, x1, y1); }
                this.cells[x1][y1].grid = this;
                this.cells[x1][y1].calibrateDisplay();
            }
        }
        for (n = 0; n < this.turmites.length; n += 1) {
            this.turmites[n].grid = this;
            this.turmites[n].calibrateDisplay();
        }
    };
    
    //In a step, a turmite makes its move
    this.step = function () {
        var i;
        steps += 1;
        document.getElementById("tickCounter").textContent = "Step count: " + steps;
        for (i = 0; i < this.turmites.length; i += 1) {
            this.turmites[i].prepareAction();
        }
        for (i = 0; i < this.turmites.length; i += 1) {
            this.turmites[i].step();
        }
    };
    
    
    //In a tick, the grid processes so many steps at a time
    this.tick = function () {
        var i;
        for (i = 0; i < stepsPerTick; i += 1) {
            this.step();
        }
    };
    //Add a way to reset the grid if we so desire
    this.reset = function () {
        var x1, y1, n, newCell;
        steps = 0;
        document.getElementById("tickCounter").textContent = "Step count: " + steps;
        
        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }
        
        this.posWidth = X;
        this.posHeight = Y;
        this.negWidth = 0;
        this.negHeight = 0;
        this.turmites = [];
        this.cells = [];
        
        for (x1 = this.negWidth; x1 < this.posWidth; x1 += 1) {
            this.cells[x1] = [];
            for (y1 = this.negHeight; y1 < this.posHeight; y1 += 1) {
                this.cells[x1][y1] = new Cell(this, 0, x1, y1, true);
            }
        }
    };
}


function toggle() {
    "use strict";
    if (running) {
        document.getElementById("myBtn").value = "Run";
        clearInterval(tickInterval);
        running = false;
    } else {
        document.getElementById("myBtn").value = "Pause";
        tickInterval = setInterval(function () {
            grid.tick();
        }, msPerTick);
        running = true;
    }
}

function stepp() {
    "use strict";
    grid.step();
}

function tick() {
    "use strict";
    grid.tick();
}

function reset() {
    "use strict";
    grid.reset();
    if (running) {
        toggle();
    }
}

function calibrate() {
    "use strict";
    
    grid.recalibrateDisplay();
}

function updateParams() {
    "use strict";
    stepsPerTick = document.getElementById("stepsPerTick").value;
    ruleset = parseRulestring(document.getElementById("rulestring").value);
    if (running) {
        toggle();
        msPerTick = document.getElementById("msPerTick").value;
        toggle();
    } else {
        msPerTick = document.getElementById("msPerTick").value;
    }
    
}

function run() {
    "use strict";
    updateParams();
    grid = new Grid(sizeX, sizeY);
}

run();
