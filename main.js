/////////////////////////////////////////////////////////////
/////////// LIFE LIKE CELLULAR AUTOMATA SIMULATOR ///////////
/////////////////////////////////////////////////////////////
var grid, tickTime, sizeX, sizeY, survive = [], birth = [], wrapping = false;
var canvas = document.getElementById("canvas");
var running = false;
var tickInterval;
var ticks = 0;

function Cell(grid, x, y) {
    //Constructs a cell that is part of a grid
    "use strict";
    //Define our basic properties
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.state = 0;
    this.preparedState = 0;
    this.neighbors = [];
    //Preloads neighbors so that we don't have to calculate them later
    this.preloadNeighbors = function () {
        this.neighbors = [this.grid.getCell(this.x - 1, this.y + 1),
            this.grid.getCell(this.x - 1, this.y),
            this.grid.getCell(this.x - 1, this.y - 1),
            this.grid.getCell(this.x, this.y + 1),
            this.grid.getCell(this.x, this.y - 1),
            this.grid.getCell(this.x + 1, this.y + 1),
            this.grid.getCell(this.x + 1, this.y),
            this.grid.getCell(this.x + 1, this.y - 1)];
    };
    //Finds what the cell's state should be after the next tick rolls around
    this.prepareUpdate = function () {
        var alive = 0, i;

        for (i = 0; i < this.neighbors.length; i += 1) {
            if (this.neighbors[i]) {
                if (this.neighbors[i].state) {
                    alive += 1;
                }
            }
        }

        if (this.state) {
            //We are currently alive. Check to see if we meet the survival requirements.
            this.preparedState = 0;
            if (survive.indexOf(String(alive)) !== -1) {
                this.preparedState = 1;
            }
        } else {
            //We are currently dead. Check to see if we meet the birth requirements.
            this.preparedState = 0;
            if (birth.indexOf(String(alive)) !== -1) {
                this.preparedState = 1;
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
    cellDiv.style.left = (100 / this.grid.X) * x + "%";
    cellDiv.style.top = (100 / this.grid.Y) * y + "%";
    cellDiv.style.width = (100 / this.grid.X) + "%";
    cellDiv.style.height = (100 / this.grid.Y) + "%";
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
    //Constructs a grid with X * Y cells
    "use strict";
    //Define our basic properties
    this.cells = [];
    this.X = X;
    this.Y = Y;
    var x, y, yCells, cell;
    //Create all of the cells
    for (x = 0; x < this.X; x += 1) {
        yCells = [];
        for (y = 0; y < this.Y; y += 1) {
            cell = new Cell(this, x, y);
            yCells.push(cell);
        }
        this.cells.push(yCells);
    }
    //This function will allow our cells to locate their neighbors
    this.getCell = function (x, y) {
        if ((x < 0 || y < 0) || (x >= this.X || y >= this.Y)) {
            if (wrapping) {
                return this.cells[x - Math.floor(x / this.X) * this.X][y - Math.floor(y / this.Y) * this.Y];
            } else {
                return null;
            }
        } else {
            return this.cells[x][y];
        }
    };
    //Preload all neighbors to prevent future stress with finding them
    for (x = 0; x < this.X; x += 1) {
        for (y = 0; y < this.Y; y += 1) {
            this.cells[x][y].preloadNeighbors();
        }
    }
    //In an update, cells first calculate what their next state should be, then actually change to that state
    //This prevents current updates from influencing other updates
    this.update = function () {
        var x1, y1;
        ticks += 1;
        document.getElementById("tickCounter").textContent = "Tick count: " + ticks;
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                this.cells[x1][y1].prepareUpdate();
            }
        }
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                this.cells[x1][y1].updateCell();
            }
        }
    };
    //Add a way to reset the grid if we so desire
    this.reset = function () {
        var x1, y1;
        ticks = 0;
        document.getElementById("tickCounter").textContent = "Tick count: " + ticks;
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                this.cells[x1][y1].preparedState = 0;
                this.cells[x1][y1].updateCell();
            }
        }
    };
    this.save = function () {
        var x1, y1, str = "";
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                str += String(this.cells[x1][y1].state);
            }
        }
        return window.btoa(str);
    };
    this.load = function (code) {
        var x1, y1, chain = window.atob(code).split(""), i = 0;
        for (x1 = 0; x1 < this.X; x1 += 1) {
            for (y1 = 0; y1 < this.Y; y1 += 1) {
                this.cells[x1][y1].preparedState = Number(chain[i]);
                this.cells[x1][y1].updateCell();
                i += 1;
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
        tickInterval = setInterval(function () {
            grid.update();
        }, tickTime);
        running = true;
    }
}

function reset() {
    "use strict";
    document.getElementById("saveBox").value = "";
    grid.reset();
    if (running) {
        toggle();
    }
}

function save() {
    "use strict";
    document.getElementById("saveBox").value = grid.save();
}

function load() {
    "use strict";
    grid.load(document.getElementById("saveBox").value);
}

function loadSave() {
    "use strict";
    
    if (document.getElementById("saveBox").value.length > 0) {
        document.getElementById("saveLoadBtn").value = "Load";
    } else {
        document.getElementById("saveLoadBtn").value = "Save";
    }
}

function setup() {
    "use strict";

    sizeX = document.getElementById("gridwidth").value;
    sizeY = document.getElementById("gridheight").value;

    tickTime = 1000 / document.getElementById("ticks").value;

    survive = document.getElementById("rulestring").value.split("/")[0].replace(/\D/g, '').split("");
    birth = document.getElementById("rulestring").value.split("/")[1].replace(/\D/g, '').split("");

    wrapping = document.getElementById("wrapping").checked;

    document.getElementById("setup").style.display = "none";
    document.getElementById("postSetup").style.display = "block";

    run();
}
