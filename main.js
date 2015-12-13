///////////////////// User edited variables ///////////////////// 

var tickTime = 10;

var sizeX = 50;
var sizeY = 30;

var birthRule = {
    min: 3,
    max: 3
};

var deathRule = {
    min: 4, //If min is greater than max, we take the complement
    max: 1
};

var wrapping = true;

/////////////////////////////////////////////////////////////////

var grid;
var canvas = document.getElementById("canvas");
var canvasWidth = Number(canvas.style.width.slice(0, -2));
var canvasHeight = Number(canvas.style.height.slice(0, -2));
var running = false;
var tickInterval;
var ticks = 0;

function Cell(grid, x, y) {
    //Constructs a cell that is part of a grid
    "use strict";
    
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.state = 0;
    this.preparedState = 0;
    
    this.getNeighbors = function () {
        //A cell has eight neighbors in a Moore neighborhood
        var neighbors = [];
        
        neighbors.push(this.grid.getCell(this.x - 1, this.y + 1));
        neighbors.push(this.grid.getCell(this.x, this.y + 1));
        neighbors.push(this.grid.getCell(this.x + 1, this.y + 1));
        
        neighbors.push(this.grid.getCell(this.x - 1, this.y));
        //We are not a neighbor of ourselves!
        //neighbors.push(this.grid.getCell(this.x, this.y))
        neighbors.push(this.grid.getCell(this.x + 1, this.y));
        
        neighbors.push(this.grid.getCell(this.x - 1, this.y - 1));
        neighbors.push(this.grid.getCell(this.x, this.y - 1));
        neighbors.push(this.grid.getCell(this.x + 1, this.y - 1));

        return neighbors;
    };
    
    this.prepareUpdate = function () {
        var neighbors = this.getNeighbors(), alive = 0, i;
        
        for (i = 0; i < neighbors.length; i += 1) {
            if (neighbors[i] !== null) {
                if (neighbors[i].state) {
                    alive += 1;
                }
            }
        }
        
        if (this.state) {
            //We are currently alive. Check to see if we meet the death requirements.
            this.preparedState = 1;
            if (deathRule.min > deathRule.max) {
                if (alive >= deathRule.min) {
                    this.preparedState = 0;
                } else if (alive <= deathRule.max) {
                    this.preparedState = 0;
                }
            } else {
                if (alive >= deathRule.min && alive <= deathRule.max) {
                    this.preparedState = 0;
                }
            }
        } else {
            //We are currently dead. Check to see if we meet the birth requirements.
            this.preparedState = 0;
            if (birthRule.min > birthRule.max) {
                if (alive >= birthRule.min) {
                    this.preparedState = 1;
                } else if (alive <= birthRule.max) {
                    this.preparedState = 1;
                }
            } else {
                if (alive >= birthRule.min && alive <= birthRule.max) {
                    this.preparedState = 1;
                }
            }
        }
    };
    
    this.updateCell = function () {
        this.state = this.preparedState;
        var ourCell = document.getElementById(this.x + "|" + this.y);
        if (this.state) {
            ourCell.className = "onCell";
        } else {
            ourCell.className = "offCell";
        }
    };
    
    var cellDiv = document.createElement("div"), root = this;
    cellDiv.style.position = "absolute";
    cellDiv.style.left = (canvasWidth / this.grid.X) * x + "px";
    cellDiv.style.top = -(canvasHeight / this.grid.Y) * (y + 1) + canvasHeight + "px";
    cellDiv.style.width = canvasWidth / this.grid.X + "px";
    cellDiv.style.height = canvasHeight / this.grid.Y + "px";
    cellDiv.className = "offCell";
    cellDiv.id = this.x + "|" + this.y;
    canvas.appendChild(cellDiv);
    
    this.changeState = function () {
        if (this.state) {
            this.preparedState = 0;
        } else {
            this.preparedState = 1;
        }
        this.updateCell();
    };
    
    cellDiv.onclick = function () {
        root.changeState();
    };
}

function Grid(X, Y) {
    //Generates a grid with X * Y cells
    "use strict";
    this.cells = [];
    this.X = X;
    this.Y = Y;
    var x, y, yCells, cell;
    for (x = 0; x < this.X; x += 1) {
        yCells = [];
        for (y = 0; y < this.Y; y += 1) {
            cell = new Cell(this, x, y);
            yCells.push(cell);
        }
        this.cells.push(yCells);
    }
    this.getCell = function (x, y) {
        if (x < 0 || y < 0) {
            if (wrapping) {
                return this.cells[x - Math.floor(x / this.X) * this.X][y - Math.floor(y / this.Y) * this.Y];
            } else {
                return null;
            }
        } else if (x >= this.X || y >= this.Y) {
            if (wrapping) {
                return this.cells[x - Math.floor(x / this.X) * this.X][y - Math.floor(y / this.Y) * this.Y];
            } else {
                return null;
            }
        } else {
            return this.cells[x][y];
        }
    };
    
    this.update = function () {
        var x1, y1, foundCell;
        ticks += 1;
        document.getElementById("tickCounter").textContent = "Tick count: " + ticks;
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                foundCell = this.getCell(x1, y1);
                foundCell.prepareUpdate();
            }
        }
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                foundCell = this.getCell(x1, y1);
                foundCell.updateCell();
            }
        }
    };
    
    this.reset = function () {
        var x1, y1, foundCell;
        ticks = 0;
        document.getElementById("tickCounter").textContent = "Tick count: " + ticks;
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                foundCell = this.getCell(x1, y1);
                foundCell.preparedState = 0;
            }
        }
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                foundCell = this.getCell(x1, y1);
                foundCell.updateCell();
            }
        }
    };
}


function run() {
    "use strict";
    grid = new Grid(sizeX, sizeY);
    
}

function toggle() {
    "use strict";
    if (running) {
        document.getElementById("myBtn").value = "Run";
        clearInterval(tickInterval);
        running = false;
    } else {
        document.getElementById("myBtn").value = "Pause";
        tickInterval = setInterval(function () {grid.update(); }, tickTime);
        running = true;
    }
}

function reset() {
    "use strict";
    grid.reset();
    if (running) {toggle(); }
}

function setup() {
    "use strict";
    
    canvas.style.width = document.getElementById("dispwidth").value + "px";
    canvas.style.height = document.getElementById("dispheight").value + "px";
    
    sizeX = document.getElementById("gridwidth").value;
    sizeY = document.getElementById("gridheight").value;
    
    tickTime = 1000 / document.getElementById("ticks").value;

    birthRule = {
        min: document.getElementById("lowerbirth").value,
        max: document.getElementById("upperbirth").value
    };

    deathRule = {
        min: document.getElementById("lowerdeath").value, //If min is greater than max, we take the complement
        max: document.getElementById("upperdeath").value
    };
    
    wrapping = document.getElementById("wrapping").checked;
    
    canvasWidth = Number(document.getElementById("dispwidth").value);
    canvasHeight = Number(document.getElementById("dispheight").value);
    
    document.getElementById("setup").style.display = "none";
    document.getElementById("postSetup").style.display = "block";
    
    run();
}
