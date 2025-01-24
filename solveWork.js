onmessage = function (e) {
  class PuzzleState {
    constructor(board, zeroIndex, moves = 0, previous = null, hValue = null, movedNum = null, oldPos = null, newPos = null) {
      this.board = board.slice(); // 一维数组浅拷贝
      this.zeroIndex = zeroIndex;
      this.moves = moves;
      this.previous = previous;
      this.sizeVal = Math.sqrt(board.length);

      if (previous && previous.hValue !== null && movedNum !== null) {
        // 增量计算启发值
        const targetIndex = movedNum - 1;
        const oldDistance = this.manhattan(oldPos, targetIndex);
        const newDistance = this.manhattan(newPos, targetIndex);
        this.hValue = previous.hValue - oldDistance + newDistance;
      } else {
        this.hValue = this.calculateHeuristic();
      }

      this.cost = this.moves + this.hValue;
    }

    manhattan(pos, target) {
      const size = this.sizeVal;
      const row = Math.floor(pos / size);
      const col = pos % size;
      const tRow = Math.floor(target / size);
      const tCol = target % size;
      return Math.abs(row - tRow) + Math.abs(col - tCol);
    }

    calculateHeuristic() {
      let distance = 0;
      for (let i = 0; i < this.board.length; i++) {
        const num = this.board[i];
        if (num !== 0) distance += this.manhattan(i, num - 1);
      }
      return distance;
    }

    generateChildren() {
      const children = [];
      const directions = [
        { dx: 1, dy: 0 }, // 下
        { dx: -1, dy: 0 }, // 上
        { dx: 0, dy: 1 }, // 右
        { dx: 0, dy: -1 }, // 左
      ];
      const zeroRow = Math.floor(this.zeroIndex / this.sizeVal);
      const zeroCol = this.zeroIndex % this.sizeVal;

      for (const dir of directions) {
        const newRow = zeroRow + dir.dx;
        const newCol = zeroCol + dir.dy;

        if (newRow >= 0 && newRow < this.sizeVal && newCol >= 0 && newCol < this.sizeVal) {
          const newIndex = newRow * this.sizeVal + newCol;
          const newBoard = this.board.slice();
          [newBoard[this.zeroIndex], newBoard[newIndex]] = [newBoard[newIndex], newBoard[this.zeroIndex]];
          const movedNum = this.board[newIndex];

          const child = new PuzzleState(
            newBoard,
            newIndex,
            this.moves + 1,
            this,
            null, // hValue由构造函数计算
            movedNum,
            newIndex, // 旧位置
            this.zeroIndex // 新位置
          );
          children.push(child);
        }
      }
      return children;
    }
  }

  class PriorityQueue {
    constructor() {
      this.heap = [];
    }

    push(element) {
      this.heap.push(element);
      this.bubbleUp(this.heap.length - 1);
    }

    pop() {
      const min = this.heap[0];
      const end = this.heap.pop();
      if (this.heap.length) {
        this.heap[0] = end;
        this.sinkDown(0);
      }
      return min;
    }

    bubbleUp(index) {
      const element = this.heap[index];
      while (index > 0) {
        const parentIdx = Math.floor((index - 1) / 2);
        if (this.heap[parentIdx].cost <= element.cost) break;
        [this.heap[parentIdx], this.heap[index]] = [element, this.heap[parentIdx]];
        index = parentIdx;
      }
    }

    sinkDown(index) {
      const length = this.heap.length;
      const element = this.heap[index];
      while (true) {
        let leftIdx = 2 * index + 1;
        let rightIdx = 2 * index + 2;
        let swapIdx = null;

        if (leftIdx < length && this.heap[leftIdx].cost < element.cost) {
          swapIdx = leftIdx;
        }
        if (rightIdx < length && (swapIdx === null || this.heap[rightIdx].cost < this.heap[leftIdx].cost)) {
          swapIdx = rightIdx;
        }
        if (!swapIdx) break;
        [this.heap[index], this.heap[swapIdx]] = [this.heap[swapIdx], element];
        index = swapIdx;
      }
    }

    isEmpty() {
      return this.heap.length === 0;
    }
  }

  const startBoard = e.data[0];
  const goalBoard = e.data[1];
  var result = aStarSearch(startBoard, goalBoard);
  postMessage(result);

  function aStarSearch(startBoard2D, goalBoard2D) {
    const startBoard = startBoard2D.flat();
    const goalBoard = goalBoard2D.flat();
    const zeroIndex = startBoard.indexOf(0);
    const startState = new PuzzleState(startBoard, zeroIndex);

    const openSet = new PriorityQueue();
    openSet.push({ cost: startState.cost, state: startState });
    const closedSet = new Set();
    let current = null;
    while (!openSet.isEmpty()) {
      current = openSet.pop().state;

      if (JSON.stringify(current.board) === JSON.stringify(goalBoard)) {
        return current;
      }

      closedSet.add(current.board.join(''));

      for (const child of current.generateChildren()) {
        if (closedSet.has(child.board.join(''))) continue;
        openSet.push({ cost: child.cost, state: child });
      }
    }
    return null;
  }

}