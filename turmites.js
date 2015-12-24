//////////////////////////////////
//////////// TURMITES ////////////
//////////////////////////////////

/*global $, jQuery, alert*/

var grid, cursor, msPerTick = 1, stepsPerTick = 1, sizeX = 42, sizeY, rulestring = "RL", ruleset, loadMargin = 4, loadPadding = 1, xAxis, yAxis;
var canvas = document.getElementById("canvas");
var running = false;
var tickInterval;
var steps = 0;
var aliveCells = 0;
var turmiteCount = 0;
var offColor = [255, 255, 255];
var onColor = [0, 0, 0];
var axisColor = [0, 0, 255];
var borders = false;

canvas.style.backgroundColor = "rgb(" + offColor[0] + "," + offColor[1] + "," + offColor[2] + ")";
document.body.style.color = "rgb(" + offColor[0] + "," + offColor[1] + "," + offColor[2] + ")";
document.body.style.backgroundColor = "rgb(" + onColor[0] + "," + onColor[1] + "," + onColor[2] + ")";

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

function gradient(color1, color2, pos, len) {
    "use strict";
    var output = [[0, 0, 0], [1, 1, 1]], ratio = pos / len;
    
    if (isNaN(ratio)) {ratio = 1; }
    
    output[0][0] = Math.round(color2[0] * ratio + color1[0] * (1 - ratio));
    output[0][1] = Math.round(color2[1] * ratio + color1[1] * (1 - ratio));
    output[0][2] = Math.round(color2[2] * ratio + color1[1] * (1 - ratio));
    
    output[1][0] = Math.round(color1[0] * ratio + color2[0] * (1 - ratio));
    output[1][1] = Math.round(color1[1] * ratio + color2[1] * (1 - ratio));
    output[1][2] = Math.round(color1[2] * ratio + color2[1] * (1 - ratio));
    
    return output;
}

function aspectRatio() {
    "use strict";
    return (canvas.clientWidth / canvas.clientHeight);
}

function hexToRGB(hex) {
    "use strict";
    hex = hex.slice(1);
    return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
}

function parseRulestring(rulestring, noJSON) {
    "use strict";
    if (rulestring.split("")[0] !== "{") {
        rulestring = rulestring.replace(/\s+/g, '');
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
    if (noJSON) {
        return rulestring;
    } else {
        return JSON.parse(rulestring.replace(/\{/g, "[").replace(/\}/g, "]"));
    }
}

function Cell(grid, color, x, y) {
    //Constructs a cell that is part of a grid
    
    "use strict";
    this.grid = grid;
    this.color = color;
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.tock = false;

    this.changeColor = function (color) {
        var garbage = this.color && !color, colorGradient = gradient(offColor, onColor, color, (ruleset[0].length - 1)), ourCell = document.getElementById(this.x + "_" + this.y);
        
        this.color = color;
 
        if (ourCell !== null) {
            ourCell.className = this.color ? "onCell" : "offCell";
            ourCell.style.backgroundColor = "rgb(" + colorGradient[0][0] + "," + colorGradient[0][1] + "," + colorGradient[0][2] + ")";
            if (borders) {
                ourCell.style.border = "1px dotted rgb(" + colorGradient[1][0] + "," + colorGradient[1][1] + "," + colorGradient[1][2] + ")";
            }
        } else {
            if (this.color) {
                this.calibrateDisplay();
            }
        }
        
        if (garbage) {
            this.grid.removeCell(this.x, this.y);
        }
    };
    
    //////////////////////// GRAPHICS ////////////////////////
    
    this.calibrateDisplay = function () {
        var cellDiv = document.getElementById(this.x + "_" + this.y), root = this;

        if (cellDiv === null) {
            cellDiv = document.createElement("div");
            cellDiv.className = this.color ? "onCell" : "offCell";
            cellDiv.id = this.x + "_" + this.y;
            cellDiv.style.position = "absolute";

            canvas.appendChild(cellDiv);
        }

        cellDiv.style.left = (100 / this.grid.width()) * (this.x - this.grid.dNegWidth) + "%";
        cellDiv.style.top = (100 / this.grid.height()) * (-this.y + (this.grid.dPosHeight - 1)) + "%";
        cellDiv.style.width = (100 / this.grid.width()) + "%";
        cellDiv.style.height = (100 / this.grid.height()) + "%";
        
        this.changeColor(this.color);
    };
    
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
            turmiteDiv.ondblclick = function () {
                root.grid.removeTurmite(root.id);
            };
            turmiteDiv.onclick = function () {
                root.direction -= 1;
                this.style.transform = "rotate(" + (180 - root.direction * 90) + "deg)";
            };
            
            canvas.appendChild(turmiteDiv);
        }
        
        turmiteDiv.style.left = (100 / this.grid.width()) * (this.x - this.grid.dNegWidth) + "%";
        turmiteDiv.style.top = (100 / this.grid.height()) * (-this.y + (this.grid.dPosHeight - 1)) + "%";
        turmiteDiv.style.width = (100 / this.grid.width()) + "%";
        turmiteDiv.style.height = (100 / this.grid.height()) + "%";
        turmiteDiv.style.transform = "rotate(" + (180 - this.direction * 90) + "deg)";
    };
    
    this.calibrateDisplay();

    //////////////////////////////////////////////////////////
    
    this.changeState = function (newState) {
        this.state = newState;
        var ourTurmite = document.getElementById("Turmite_" + this.id), ratio = (this.state / (ruleset.length - 1));
        
        /*if (isNaN(ratio)) {ratio = 0; }
        ourTurmite.style.filter = "hue-rotate(" + (ratio * 240) + "deg)";*/
    };
    
    this.turnMove = function (turn) {
        var bin = (turn).toString(2).split("").reverse(), ourTurmite = document.getElementById("Turmite_" + this.id), n, turned = false, origDir = this.direction, origX = this.x, origY = this.y, origState = this.state;
        
        for (n = 0; n < bin.length; n += 1) {
            if (!turned) {
                if (bin[n] === "1") {
                    this.direction -= n;
                    this.x += Math.round(Math.cos(this.direction * Math.PI * 0.5));
                    this.y += Math.round(Math.sin(this.direction * Math.PI * 0.5));
                    
                    turned = true;
                } else if (bin[n] === "E") {
                    this.direction = 0;
                    this.x += 1;
                    
                    turned = true;
                } else if (bin[n] === "N") {
                    this.direction = 1;
                    this.y += 1;
                    
                    turned = true;
                } else if (bin[n] === "W") {
                    this.direction = 2;
                    this.x += -1;
                    
                    turned = true;
                } else if (bin[n] === "S") {
                    this.direction = 3;
                    this.y += -1;
                    
                    turned = true;
                }
            } else {
                if (bin[n] === "1") {
                    this.grid.createTurmite(origX + Math.round(Math.cos((origDir - n) * Math.PI * 0.5)), origY + Math.round(Math.sin((origDir - n) * Math.PI * 0.5)), origState, origDir - n);
                } else if (bin[n] === "E") {
                    this.grid.createTurmite(origX + 1, origY, origState, 0);
                } else if (bin[n] === "N") {
                    this.grid.createTurmite(origX, origY + 1, origState, 1);
                } else if (bin[n] === "W") {
                    this.grid.createTurmite(origX - 1, origY, origState, 2);
                } else if (bin[n] === "S") {
                    this.grid.createTurmite(origX, origY - 1, origState, 3);
                }
            }
        }
        
        ourTurmite.style.transform = "rotate(" + (180 - this.direction * 90) + "deg)";
        ourTurmite.style.left = (100 / this.grid.width()) * (this.x - this.grid.dNegWidth) + "%";
        ourTurmite.style.top = (100 / this.grid.height()) * (-this.y + (this.grid.dPosHeight - 1)) + "%";
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

        //Turn based on the color of the new cell and move
        this.turnMove(this.preparedAction[1]);
        
        //Change the color of the old cell
        cell.changeColor(this.preparedAction[0]);

        //Change state based on the color of the old cell
        this.changeState(this.preparedAction[2]);
    };
}

function Grid(X) {
    //Constructs a grid with a specified width
    "use strict";
    
    this.dPosWidth = Math.ceil(X / 2);
    this.dNegWidth = Math.ceil(-X / 2);

    this.dPosHeight = Math.ceil(Math.round(X / aspectRatio()) / 2);
    this.dNegHeight = Math.ceil(-Math.round(X / aspectRatio()) / 2);
    
    this.posWidth = 0;
    this.posHeight = 0;
    this.negWidth = 0;
    this.negHeight = 0;
    
    this.turmites = [];
    this.cells = [];
    this.refs = [];
    
    var x, y, cell;
    
    document.getElementById("dimensionTracker").textContent = "Bounding box: " + (this.posWidth - this.negWidth) + " x " + (this.posHeight - this.negHeight);
    
    this.width = function () {
        return this.dPosWidth - this.dNegWidth;
    };
    
    this.height = function () {
        return this.dPosHeight - this.dNegHeight;
    };
    
    xAxis = document.createElement("div");
    yAxis = document.createElement("div");
    
    xAxis.style.left = "0%";
    xAxis.style.top = (100 / this.height()) * (this.dPosHeight - 1) + "%";
    xAxis.style.width = "100%";
    xAxis.style.height = (100 / this.height()) + "%";
    xAxis.className = "axis";
    xAxis.id = "xAxis";
    xAxis.style.position = "absolute";
    xAxis.style.backgroundColor = "rgb(" + axisColor[0] + "," + axisColor[1] + "," + axisColor[2] + ")";
    canvas.appendChild(xAxis);
    
    yAxis.style.left = (100 / this.width()) * (-this.dNegWidth) + "%";
    yAxis.style.top = "0%";
    yAxis.style.width = (100 / this.width()) + "%";
    yAxis.style.height = "100%";
    yAxis.className = "axis";
    yAxis.id = "yAxis";
    yAxis.style.position = "absolute";
    yAxis.style.backgroundColor = "rgb(" + axisColor[0] + "," + axisColor[1] + "," + axisColor[2] + ")";
    canvas.appendChild(yAxis);
        
    //This function will allow a turmite to enter the world
    this.createTurmite = function (x, y, state, dir) {
        var turmite = new Turmite(this, state, dir, x, y);
        this.turmites.push(turmite);
        document.getElementById("turmiteTracker").textContent = "Turmites: " + this.turmites.length;
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
    
    this.removeCell = function (x1, y1) {
        var index = this.refs.indexOf(x1 + "_" + y1);
        
        if (index > -1) {
            this.cells.splice(index, 1);
            this.refs.splice(index, 1);
            document.getElementById("cellTracker").textContent = "Cells: " + this.refs.length;
            
            /*if (diffs[0] === -loadPadding) {this.negWidth += (margin - diffs[0] - loadPadding); recalibrate = true; }
            if (diffs[1] === loadPadding - 1) {this.posWidth -= (margin + diffs[1] + 1 - loadPadding); recalibrate = true; }
            if (diffs[2] === -loadPadding) {this.negHeight += (margin - diffs[2] - loadPadding); recalibrate = true; }
            if (diffs[3] ===  loadPadding - 1) {this.posHeight -= (margin + diffs[3] + 1 - loadPadding); recalibrate = true; }
            if (recalibrate && loadMargin) {this.recalibrateDisplay(); }*/
        }
    };
    
    //This function will always return a valid cell, even if it doesn't currently exist.
    this.getCell = function (x1, y1) {
        if (this.refs.indexOf(x1 + "_" + y1) < 0) {
            this.cells.push(new Cell(this, 0, x1, y1));
            this.refs.push(x1 + "_" + y1);
            document.getElementById("cellTracker").textContent = "Cells: " + this.refs.length;
        }
        
        if (this.posWidth - this.negWidth === 0) {this.negWidth = x1; this.posWidth = x1 + 1; }
        if (this.posHeight - this.negHeight === 0) {this.negHeight = y1; this.posHeight = y1 + 1; }
        
        if (x1 - this.negWidth < 0) {this.negWidth += (x1 - this.negWidth); }
        if (x1 - this.posWidth > -1) {this.posWidth += (x1 - this.posWidth + 1); }
        if (y1 - this.negHeight < 0) {this.negHeight += (y1 - this.negHeight); }
        if (y1 - this.posHeight > -1) {this.posHeight += (y1 - this.posHeight + 1); }
        
        if ((this.posWidth + loadPadding > this.dPosWidth || this.negWidth - loadPadding < this.dNegWidth || this.posHeight + loadPadding > this.dPosHeight || this.negHeight - loadPadding < this.dNegHeight) && this.tock && loadMargin) {
            this.recalibrateDisplay();
        }
        
        document.getElementById("dimensionTracker").textContent = "Bounding box: " + (this.posWidth - this.negWidth) + " x " + (this.posHeight - this.negHeight);
        
        return this.cells[this.refs.indexOf(x1 + "_" + y1)];
    };
    
    //This function will recalibrate the display with the correct dimensions.
    
    this.recalibrateDisplay = function () {
        var x1, y1, n, remainder;
        
        this.dPosWidth = (this.posWidth + (loadMargin - 1) + loadPadding  > Math.ceil(X / 2)) ? this.posWidth + (loadMargin - 1) + loadPadding : Math.ceil(X / 2);
        this.dNegWidth = (this.negWidth - (loadMargin - 1) - loadPadding  < Math.ceil(-X / 2)) ? this.negWidth - (loadMargin - 1) - loadPadding : Math.ceil(-X / 2);
        this.dPosHeight = (this.posHeight + (loadMargin - 1) + loadPadding  > Math.ceil(Math.round(X / aspectRatio()) / 2)) ? this.posHeight + (loadMargin - 1) + loadPadding  : Math.ceil(Math.round(X / aspectRatio()) / 2);
        this.dNegHeight = (this.negHeight - (loadMargin - 1) - loadPadding  < Math.ceil(Math.round(-X / aspectRatio()) / 2)) ? this.negHeight - (loadMargin - 1) - loadPadding  : Math.ceil(Math.round(-X / aspectRatio()) / 2);
        
        remainder = (this.dPosWidth - this.dNegWidth) - (this.dPosHeight - this.dNegHeight) * aspectRatio();
        
        if (remainder > 0) {
            //The display is too wide
            
            this.dPosHeight += Math.floor(remainder / 2);
            this.dNegHeight -= Math.floor(remainder / 2);
        } else if (remainder < 0) {
            //The display is too narrow
            remainder = (this.dPosHeight - this.dNegHeight) * aspectRatio() - (this.dPosWidth - this.dNegWidth);
            
            this.dPosWidth += Math.floor(remainder / 2);
            this.dNegWidth -= Math.floor(remainder / 2);
        }
        
        xAxis.style.top = (100 / this.height()) * (this.dPosHeight - 1) + "%";
        xAxis.style.height = (100 / this.height()) + "%";
        yAxis.style.left = (100 / this.width()) * (-this.dNegWidth) + "%";
        yAxis.style.width = (100 / this.width()) + "%";
        
        for (n = 0; n < this.cells.length; n += 1) {
            this.cells[n].calibrateDisplay();
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
        
        $(".offCell").remove();
    };
    
    //In a tick, the grid processes so many steps at a time
    this.tick = function () {
        var i;
        for (i = 0; i < stepsPerTick; i += 1) {
            this.tock = (i === stepsPerTick - 1);
            this.step();
        }
    };
    //Add a way to reset the grid if we so desire
    this.reset = function () {
        steps = 0;
        aliveCells = 0;
        
        document.getElementById("tickCounter").textContent = "Step count: " + steps;
        
        $(".offCell").remove();
        $(".onCell").remove();
        $(".turmite").remove();

        this.posWidth = 0;
        this.posHeight = 0;
        this.negWidth = 0;
        this.negHeight = 0;
        
        this.turmites = [];
        this.cells = [];
        this.refs = [];
        
        this.recalibrateDisplay();
        
        document.getElementById("dimensionTracker").textContent = "Bounding box: " + (this.posWidth - this.negWidth) + " x " + (this.posHeight - this.negHeight);
        document.getElementById("cellTracker").textContent = "Cells: " + this.refs.length;
        document.getElementById("turmiteTracker").textContent = "Turmites: " + this.turmites.length;
    };
}

function toggle() {
    "use strict";
    if (running) {
        document.getElementById("runBtn").value = "Run";
        clearInterval(tickInterval);
        running = false;
    } else {
        document.getElementById("runBtn").value = "Pause";
        tickInterval = setInterval(function () {
            grid.tick();
        }, msPerTick);
        running = true;
    }
}

function stepp() {
    "use strict";
    grid.tock = true;
    grid.step();
    grid.tock = false;
}

function tick() {
    "use strict";
    grid.tick();
}

function reset() {
    "use strict";
    
    if (running) {
        toggle();
    }
    
    grid.reset();
}

$(window).resize(function () {
    "use strict";
    if (grid) {
        grid.recalibrateDisplay();
    }
});

function updateParams() {
    "use strict";
    stepsPerTick = document.getElementById("stepsPerTick").value;
    if (running) {
        toggle();
        msPerTick = document.getElementById("msPerTick").value;
        toggle();
    } else {
        msPerTick = document.getElementById("msPerTick").value;
    }
    
}

function calcCursor(e) {
    "use strict";
    
    if (grid) {
        var x, y, offset = $("#canvas").offset();
        
        x = Math.floor((((e.pageX - offset.left) / (canvas.clientWidth)) * grid.width()) + (grid.dNegWidth));
        y = -Math.floor((((e.pageY - offset.top) / (canvas.clientHeight)) * grid.height()) - (grid.dPosHeight - 1));
        
        document.getElementById("coordinate").textContent = "Coordinate: (" + x + ", " + y + ")";
        
        if (!cursor) {
            cursor = document.createElement("div");
            cursor.className = "cursor";
            cursor.id = "cursor";
            cursor.style.opacity = 0.5;
            cursor.style.position = "absolute";
            cursor.onclick = function (ev) {
                x = Math.floor((((ev.pageX - offset.left) / (canvas.clientWidth)) * grid.width()) + (grid.dNegWidth));
                y = -Math.floor((((ev.pageY - offset.top) / (canvas.clientHeight)) * grid.height()) - (grid.dPosHeight - 1));
                
                grid.createTurmite(x, y, 0, 2);
            };

            canvas.appendChild(cursor);
        }

        cursor.style.display = "initial";
        cursor.style.left = (100 / grid.width()) * (x - grid.dNegWidth) + "%";
        cursor.style.top = (100 / grid.height()) * (-y + (grid.dPosHeight - 1)) + "%";
        cursor.style.width = (100 / grid.width()) + "%";
        cursor.style.height = (100 / grid.height()) + "%";
        cursor.style.zIndex = 9;
    }
}

function endCursor() {
    "use strict";
    document.getElementById("coordinate").textContent = "Coordinate: None";
    if (cursor) {
        cursor.style.display = "none";
    }
}

function run(starter) {
    "use strict";
    updateParams();
    ruleset = parseRulestring(rulestring);
    document.getElementById("rulestring").textContent = "Rulestring: " + rulestring;
    grid = new Grid(sizeX);
    if (starter) {
        grid.createTurmite(0, 0, 0, 2);
    }
}

function preset() {
    "use strict";
    document.getElementById("setRulestring").value = document.getElementById("presets").value;
}

function resetPreset() {
    "use strict";
    document.getElementById("presets").value = document.getElementById("setRulestring").value;
    if (document.getElementById("presets").value !== document.getElementById("setRulestring").value) {
        document.getElementById("presets").value = "";
    }
}

function parse() {
    "use strict";
    document.getElementById("setRulestring").value = parseRulestring(document.getElementById("setRulestring").value, true);
    resetPreset();
}

function setup() {
    "use strict";
    rulestring = document.getElementById("setRulestring").value;
    sizeX = document.getElementById("gridwidth").value;
    loadMargin = Number(document.getElementById("loadmargin").value);
    loadPadding = Number(document.getElementById("loadpadding").value);
    offColor = hexToRGB(document.getElementById("offcolor").value);
    onColor = hexToRGB(document.getElementById("oncolor").value);
    axisColor = hexToRGB(document.getElementById("axiscolor").value);
    borders = document.getElementById("borders").checked;
    
    canvas.style.backgroundColor = "rgb(" + offColor[0] + "," + offColor[1] + "," + offColor[2] + ")";
    document.body.style.color = "rgb(" + offColor[0] + "," + offColor[1] + "," + offColor[2] + ")";
    document.body.style.backgroundColor = "rgb(" + onColor[0] + "," + onColor[1] + "," + onColor[2] + ")";
    
    document.getElementById("setup").style.display = "none";
    document.getElementById("postSetup").style.display = "initial";
    
    run(document.getElementById("startTurmite").checked);
}
