// initialize grid

const size = 3;
const grid = document.getElementById('grid');
const solve = document.getElementById('solve');
const iterPer = document.getElementById('iterPer');
const msPer = document.getElementById('msPer');
const instant = document.getElementById('instant');

const squares = [];

const init = () => {
  for (let w = 0; w < size; w += 1) {
    for (let x = 0; x < size; x += 1) {
      for (let y = 0; y < size; y += 1) {
        for (let z = 0; z < size; z += 1) {
          const newSquare = document.createElement('input');
          newSquare.type = 'text';
          newSquare.classList.add('square');
          const col = z + (3 * y);
          const row = x + (3 * w);
          const square = (3 * Math.floor(row / size)) + Math.floor(col / size);
          squares.push({
            col,
            row,
            square,
            value: 0,
            impossible: [],
            elem: newSquare,
          });
          grid.appendChild(newSquare);
        }
        const filler = document.createElement('div');
        filler.classList.add('filler');
        grid.appendChild(filler);
      }
      grid.appendChild(document.createElement('BR'));
    }
    const newLine = document.createElement('div');
    newLine.classList.add('newLine');
    grid.appendChild(newLine);
  }

  /* for (let i = 0; i < squares.length; i++) {
    const square = squares[i];
    square.elem.value = square.square;
  } */

  // Set it up like DDRJake's game

  squares[0].elem.value = 7;
  squares[4].elem.value = 2;
  squares[5].elem.value = 1;
  squares[8].elem.value = 9;

  squares[18].elem.value = 6;
  squares[21].elem.value = 8;
  squares[22].elem.value = 9;
  squares[24].elem.value = 1;
  squares[25].elem.value = 4;
  squares[26].elem.value = 5;

  squares[27].elem.value = 8;
  squares[29].elem.value = 5;
  squares[31].elem.value = 3;

  squares[37].elem.value = 2;
  squares[40].elem.value = 7;
  squares[43].elem.value = 5;

  squares[49].elem.value = 5;
  squares[51].elem.value = 6;
  squares[53].elem.value = 1;

  squares[54].elem.value = 1;
  squares[55].elem.value = 5;
  squares[56].elem.value = 7;
  squares[58].elem.value = 4;
  squares[59].elem.value = 3;
  squares[62].elem.value = 2;

  squares[72].elem.value = 4;
  squares[75].elem.value = 2;
  squares[76].elem.value = 1;
  squares[80].elem.value = 6;
};

solve.addEventListener('click', () => {
  // Set the squares to their set values
  // alert('Starting');
  let iterationsPerTick = Math.round(Number(iterPer.value));
  if (!(iterationsPerTick > 0)) iterationsPerTick = 20;
  if (!instant.checked) iterPer.value = iterationsPerTick;
  let msPerTick = Math.round(Number(msPer.value));
  if (!(msPerTick > 0)) msPerTick = 1;
  if (!instant.checked) msPer.value = msPerTick;

  for (let i = 0; i < squares.length; i += 1) {
    const square = squares[i];
    square.elem.classList.remove('preset');
    square.elem.classList.remove('selected');
    square.impossible = [];
    if (square.elem.value !== '') {
      square.value = Number(square.elem.value);
      square.elem.classList.add('preset');
    } else {
      square.value = 0;
    }
  }

  // Algorithm:
  // Make initial commit
  // Iterate through squares
  // If has value skip
  // Otherwise calculate what values are impossible
  //
  // -->At least one possibility
  // Make a "commit" that points to the last commit with note of the current
  // square and continue. Or, if there is already a commit at the current
  // location, we must have backtracked, so just change our choice.
  // Out of the possible choices, choose the smallest. Note this choice on the
  // commit
  //
  // -->No possibilities
  // We have messed up. Return to the last commit and add the last choice to
  // "impossible" on that commit
  // If there is no last commit, the puzzle is impossible! Give up

  // Make initial commit
  const initial = {
    index: -1,
    choice: -1,
    last: null,
  };

  let commit = initial;
  let i = 0;
  let iterations = 0;
  let retries = 0;

  // Iterate through the squares

  const iterate = () => {
    iterations += 1;
    squares[i].elem.classList.add('selected');
    const square = squares[i];
    // If has value skip
    if (square.value) {
      squares[i].elem.classList.remove('selected');
      i = (i + 1) % squares.length;
    } else {
      // Calculate what values are impossible for the current square
      for (let j = 0; j < squares.length; j += 1) {
        const testSquare = squares[j];
        const val = testSquare.value;
        // If has NO value skip
        if (val && ((square.row === testSquare.row) ||
            (square.col === testSquare.col) ||
            (square.square === testSquare.square))) {
          // If a value is in our same row or column or square, we can never
          // have it!
          if (square.impossible.indexOf(val) < 0) square.impossible.push(val);
        }
      }
      // Find the possibilities
      if (square.impossible.length === size * size) {
        // We're stuck. Check to see if we're sitting on a commit
        if (commit.index === i) {
          // We must backtrack since this commit is hopeless
          // alert(`Revert commit: Current index${i}, next index ${
          //  commit.last.index}`);
          commit = commit.last;
        }
        if (commit && commit.last) {
          retries += 1;
          // We have a commit to return to
          // Reset our current square's impossibilities
          // alert(`Reseting possibilities for square ${i}`);
          squares[i].impossible = [];
          // Set the index to the square in the last commit
          i = commit.index;
          // alert(`Backtrack to commit index ${i}`);
          // Reset that square and add our last choice to the impossibilities
          squares[i].value = 0;
          squares[i].elem.value = '';
          squares[i].impossible.push(commit.choice);
          // Adjust for the auto +1
        } else {
          // We have no commit to return to
          // We declare the puzzle unsolvable.
          i = -1;
          alert(`Could not solve. Iterations: ${iterations}. Retries: ${
            retries}.`);
        }
      } else {
        for (let j = 1; j <= size * size; j += 1) {
          if (square.impossible.indexOf(j) < 0) {
            // alert(`Current index:${i} Trying:${j}`);
            // We've found a possibility!
            // Edit the square
            squares[i].value = j;
            squares[i].elem.value = j;
            // Only make a new commit if we moved
            if (i === commit.index) {
              commit.choice = j;
            } else {
              commit = {
                index: i,
                choice: j,
                last: commit,
              };
            }
            squares[i].elem.classList.remove('selected');
            i = (i + 1) % squares.length;
            break;
          }
        }
      }
    }
    // Check if we solved it yet
    let solved = 1;
    for (let j = 0; j < squares.length; j += 1) {
      const testSquare = squares[j];
      const val = testSquare.value;
      if (!val) {
        solved = 0;
        break;
      }
    }
    if (solved) {
      i = -1;
      alert(`Solved. Iterations: ${iterations}. Retries: ${retries}.`);
    }
    if (i > -1) {
      if ((instant.checked && iterations % 18001 === 18000) ||
        (!instant.checked && iterations % iterationsPerTick === 0)) {
        setTimeout(iterate, msPerTick);
      } else iterate();
    }
  };

  iterate();
});

init();
