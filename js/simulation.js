import { GridNode, Grid } from "./classes.js";
import { indicesFromCoordinates } from "./canvas_helpers.js";
import { GRID_ROWS_COLS_LENGTH, GRID_SIZE, CELL_SIZE, VISUALIZATION_FPS, WALL_COLOR, START_NODE_COLOR, END_NODE_COLOR, RESULT_PATH_NODE_COLOR, VISITED_NODE_COLOR, EMPTY_NODE_COLOR } from "./constants.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.addEventListener("alpine:init", () => {
  Alpine.data("simulation", () => ({
    isDrawingWalls: false,
    shouldVisualize: true,
    /**
     * @type {GridNode?}
     */
    startNode: null,
    /**
     * @type {GridNode?}
     */

    endNode: null,
    /**
     * @type {Grid}
     */
    grid: [],

    initialize() {
      this.grid = Grid.initialize(GRID_ROWS_COLS_LENGTH);
      this.grid.drawInitial(ctx, GRID_SIZE, CELL_SIZE);
    },

    /**
     * Reset the canvas/grid without resetting visualization setting
     */
    reset() {
      (this.startNode = null), (this.endNode = null);
      this.grid = Grid.initialize(GRID_ROWS_COLS_LENGTH);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.grid.drawInitial(ctx, GRID_SIZE, CELL_SIZE);
    },

    /**
     * Tries to start the dijkstra-algorithm
     *
     * Flashes a warning if `startNode` or `endNode` hasn't been selected
     */
    tryStartDijkstra() {
      if (!this.startNode || !this.endNode) {
        alert("You must select start and end nodes before starting!");
        return;
      }

      if (this.shouldVisualize) {
        this.dijkstras_visualization();
      } else {
        this.dijkstras();
      }
    },

    /**
     * @param {MouseEvent} event
     */
    handleCanvasDrawWall(event) {
      if (!this.startNode || !this.endNode || !this.isDrawingWalls) return;
      const [row, col] = indicesFromCoordinates(event.clientX, event.clientY);
      const node = this.grid.getNode(row, col);
      node.isWall = true;
      node.draw(ctx, WALL_COLOR);
    },

    /**
     * Called when the canvas is clicked at any position
     *
     * Picks the start and end nodes by changing the click X/Y to rows and cols
     * @param {MouseEvent} event
     */
    handleCanvasClick(event) {
      const [row, col] = indicesFromCoordinates(event.clientX, event.clientY);

      if (!this.startNode) {
        this.startNode = new GridNode(col, row);
        this.startNode.draw(ctx, START_NODE_COLOR);
        return;
      }

      if (!this.endNode) {
        this.endNode = new GridNode(col, row);
        this.endNode.draw(ctx, END_NODE_COLOR);
        return;
      }

      // Wall was clicked
      const node = this.grid.getNode(row, col);
      if (node.isWall) {
        node.isWall = false;
        node.draw(ctx, EMPTY_NODE_COLOR);
      } else {
        node.isWall = true;
        node.draw(ctx, WALL_COLOR);
      }
    },

    dijkstras() {
      let foundValidPath = false;
      this.startNode.visited = true;
      const unvisited = [this.startNode];

      while (unvisited.length > 0) {
        const currentNode = unvisited.shift();
        currentNode.visited = true;

        // Found ending
        if (
          currentNode.x === this.endNode.x &&
          currentNode.y === this.endNode.y
        ) {
          foundValidPath = true;
          let temp = currentNode;
          temp.draw(ctx, END_NODE_COLOR);
          temp = temp.prev;
          while (temp.prev) {
            temp.draw(ctx, RESULT_PATH_NODE_COLOR);
            temp = temp.prev;
          }
          break;
        }

        const currentNodeNeighbors = this.grid.getNeighbors(
          currentNode.y,
          currentNode.x
        );
        for (const neighborNode of currentNodeNeighbors) {
          if (neighborNode.isWall || neighborNode.visited) continue;
          neighborNode.visited = true;
          neighborNode.prev = currentNode;
          unvisited.push(neighborNode);
        }
      }

      if (!foundValidPath) {
        alert("No valid path was found!");
      }
    },

    dijkstras_visualization() {
      let foundValidPath = false;

      this.startNode.visited = true;
      const unvisited = [this.startNode];

      let animationFrameId = null;

      const update = () => {
        const currentNode = unvisited.shift();
        currentNode.visited = true;

        if (!currentNode.isEqual(this.startNode)) {
          currentNode.draw(ctx, VISITED_NODE_COLOR);
        }

        if (currentNode.isEqual(this.endNode)) {
          foundValidPath = true;
          let temp = currentNode;
          while (temp.prev) {
            temp.draw(ctx, RESULT_PATH_NODE_COLOR);
            temp = temp.prev;
          }
          cancelAnimationFrame(animationFrameId);
        }

        const currentNodeNeighbors = this.grid.getNeighbors(
          currentNode.y,
          currentNode.x
        );
        for (const neighborNode of currentNodeNeighbors) {
          if (neighborNode.isWall || neighborNode.visited) continue;
          neighborNode.visited = true;
          neighborNode.prev = currentNode;
          unvisited.push(neighborNode);
        }

        if (foundValidPath) {
          cancelAnimationFrame(animationFrameId);
        } else if (!unvisited.length) {
          alert("No valid path was found!");
          cancelAnimationFrame(animationFrameId);
        } else {
          animationFrameId = requestAnimationFrame(update);
        }
      };
      requestAnimationFrame(update);
    },
  }));
});
