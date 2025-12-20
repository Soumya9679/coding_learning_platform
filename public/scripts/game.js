let puzzle = [1, 2, 3, 4, 5, 6, 7, 8, ""];

const puzzleDiv = document.getElementById("puzzle");
const message = document.getElementById("message");

function renderPuzzle() {
    puzzleDiv.innerHTML = "";
    puzzle.forEach((value, index) => {
        const tile = document.createElement("div");
        tile.className = value === "" ? "tile empty" : "tile";
        tile.innerText = value;
        tile.onclick = () => moveTile(index);
        puzzleDiv.appendChild(tile);
    });
}

function moveTile(index) {
    const emptyIndex = puzzle.indexOf("");
    const validMoves = [
        emptyIndex - 1,
        emptyIndex + 1,
        emptyIndex - 3,
        emptyIndex + 3
    ];

    if (validMoves.includes(index)) {
        [puzzle[index], puzzle[emptyIndex]] = [puzzle[emptyIndex], puzzle[index]];
        renderPuzzle();
        checkWin();
    }
}

function shufflePuzzle() {
    puzzle.sort(() => Math.random() - 0.5);
    message.innerText = "";
    renderPuzzle();
}

function checkWin() {
    const winState = [1, 2, 3, 4, 5, 6, 7, 8, ""];
    if (JSON.stringify(puzzle) === JSON.stringify(winState)) {
        message.innerText = "🎉 Congratulations! You solved the puzzle!";
    }
}

renderPuzzle();
