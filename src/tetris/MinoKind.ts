import {Position, positionOf, rotatePosLeft, rotatePosRight} from "./Position";
import {CELL_HEIGHT_BOARD, CELL_WIDTH_BOARD} from "./constants";
import {rangeA} from "./utilities";

export type MinoKind = "I" | "O" | "S" | "Z" | "J" | "L" | "T" | "Wall" | "Null" | "GameOver";

export const MINO_KIND_NULL: MinoKind = "Null";
export const MINO_KIND_WALL: MinoKind = "Wall";
export const MINO_KIND_GAME_OVER: MinoKind = "GameOver";

export const BASIC_MINO_KINDS: readonly MinoKind[] = ["I", "O", "S", "Z", "J", "L", "T"] as const;

export const MINO_COLOUR_GAME_OVER = "rgb(128, 128, 128)";

type MinoDefinition = {
    colour: string,
    positions: Position[],
};

// Defines a colour and an arrangement of cells for each mino kind.
const MINO_DEFINITIONS: { readonly [kind in MinoKind]: MinoDefinition } = {
    I: {
        colour: "rgb(0, 255, 255)",
        positions: [positionOf(-1, 0), positionOf(0, 0), positionOf(1, 0), positionOf(2, 0)],
    },
    O: {
        colour: "rgb(255, 255, 0)",
        positions: [positionOf(0, 0), positionOf(1, 0), positionOf(0, 1), positionOf(1, 1)],
    },
    S: {
        colour: "rgb(0, 255, 0)",
        positions: [positionOf(0, 0), positionOf(-1, 0), positionOf(0, -1), positionOf(1, -1)],
    },
    Z: {
        colour: "rgb(255, 0, 0)",
        positions: [positionOf(0, 0), positionOf(1, 0), positionOf(0, -1), positionOf(-1, -1)],
    },
    J: {
        colour: "rgb(0, 0, 255)",
        positions: [positionOf(0, 0), positionOf(0, -1), positionOf(1, 0), positionOf(2, 0)],
    },
    L: {
        colour: "rgb(255, 128, 0)",
        positions: [positionOf(0, 0), positionOf(0, -1), positionOf(-1, 0), positionOf(-2, 0)],
    },
    T: {
        colour: "rgb(255, 0, 255)",
        positions: [positionOf(0, 0), positionOf(0, -1), positionOf(-1, 0), positionOf(1, 0)],
    },
    Wall: {
        colour: "rgb(128, 128, 128)",
        positions: [
            rangeA(0, CELL_WIDTH_BOARD).map(x => positionOf(x, CELL_HEIGHT_BOARD - 1)), // A floor of the board.
            rangeA(0, CELL_HEIGHT_BOARD).map(y => positionOf(0, y)),                    // A left wall of the board.
            rangeA(0, CELL_HEIGHT_BOARD).map(y => positionOf(CELL_WIDTH_BOARD - 1, y)), // A right wall of the board.
        ].flat(),
    },
    Null: {
        colour: "rgb(255, 255, 255)",
        positions: [],
    },
    GameOver: {
        colour: MINO_COLOUR_GAME_OVER,
        positions: [],
    },
};

export type Mino = {
    kind: MinoKind,
    positions: Position[],
    colour: string,
};

export function minoOf(kind: MinoKind, positions?: Position[]): Mino {
    return {
        kind: kind,
        positions: positions ?? MINO_DEFINITIONS[kind].positions,
        colour: MINO_DEFINITIONS[kind].colour,
    };
}

export function cloneMino(mino: Mino): Mino {
    return {
        kind: mino.kind,
        positions: mino.positions,
        colour: mino.colour,
    };
}

export function rotateMinoRight(mino: Mino): Mino {
    const newCellPositions = mino.positions.map(rotatePosRight);
    return minoOf(mino.kind, newCellPositions);
}

export function rotateMinoLeft(mino: Mino): Mino {
    const newCellPositions = mino.positions.map(rotatePosLeft);
    return minoOf(mino.kind, newCellPositions);
}
