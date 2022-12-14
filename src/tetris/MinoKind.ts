import {Position, positionOf, rotatePosRight} from "./Position";
import {CELL_HEIGHT_BOARD, CELL_WIDTH_BOARD} from "./constants";
import {applyNTimes, rangeA} from "./utilities";

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
const minoDefinitions: { readonly [kind in MinoKind]: MinoDefinition } = {
    I: {
        colour: "rgb(0, 255, 255)",
        positions: [], // The I mino has no origin (0, 0). See ICellPositionsForEachPosture.
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

// Each kind of mino has at most 4 postures.
type MinoPosture = 0 | 1 | 2 | 3

function rotateMinoPostureRight(posture: MinoPosture): MinoPosture {
    return (posture + 1) % 4 as MinoPosture;
}

function rotateMinoPostureLeft(posture: MinoPosture): MinoPosture {
    return applyNTimes(3, rotateMinoPostureRight, posture);
}

const ICellPositionsForEachPosture: { readonly [kind in MinoPosture]: Position[] } = {
    0: [positionOf(-1, 0), positionOf(0, 0), positionOf(1, 0), positionOf(2, 0)],
    1: [positionOf(1, -1), positionOf(1, 0), positionOf(1, 1), positionOf(1, 2)],
    2: [positionOf(-1, -1), positionOf(0, -1), positionOf(1, -1), positionOf(2, -1)],
    3: [positionOf(0, -1), positionOf(0, 0), positionOf(0, 1), positionOf(0, 2)],
};

export type Mino = {
    kind: MinoKind,
    posture: MinoPosture,
    colour: string,
};

export function minoOf(kind: MinoKind): Mino {
    return {
        kind: kind,
        posture: 0,
        colour: minoDefinitions[kind].colour,
    };
}

export function cloneMino(mino: Mino): Mino {
    return {
        kind: mino.kind,
        posture: mino.posture,
        colour: mino.colour,
    };
}

// Get positions of each cell based on a mino kind and its posture.
export function getMinoCellPositions(mino: Mino): Position[] {
    if (mino.kind === "O") {
        // The O mino has no posture.
        return minoDefinitions["O"].positions;
    }
    if (mino.kind === "I") {
        return ICellPositionsForEachPosture[mino.posture];
    }
    return minoDefinitions[mino.kind].positions
        .map(position => applyNTimes(mino.posture, rotatePosRight, position));
}

export function rotateMinoRight(mino: Mino): Mino {
    return {
        kind: mino.kind,
        posture: rotateMinoPostureRight(mino.posture),
        colour: mino.colour,
    };
}

export function rotateMinoLeft(mino: Mino): Mino {
    return {
        kind: mino.kind,
        posture: rotateMinoPostureLeft(mino.posture),
        colour: mino.colour,
    };
}

export function originPositionsSuperRotateRight(kind: MinoKind, posture: MinoPosture): Position[] {
    if (kind === "T") {
        return originPositionsSuperRotateRightT(posture);
    }
    if (kind === "I") {
        return originPositionsSuperRotateRightI(posture);
    }
    switch (posture) {
        case 0:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, -1), positionOf(0, 2), positionOf(-1, 2)];
        case 1:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, 1), positionOf(0, -2), positionOf(-1, -2)];
        case 2:
            return [positionOf(0, 0), positionOf(1, 0), positionOf(1, -1), positionOf(0, 2), positionOf(1, 2)];
        case 3:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, 1), positionOf(0, -2), positionOf(-1, -2)];
    }
}

export function originPositionsSuperRotateLeft(kind: MinoKind, posture: MinoPosture): Position[] {
    if (kind === "T") {
        return originPositionsSuperRotateLeftT(posture);
    }
    if (kind === "I") {
        return originPositionsSuperRotateLeftI(posture);
    }
    switch (posture) {
        case 0:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, -1), positionOf(0, 2), positionOf(-1, 2)];
        case 1:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(1, 1), positionOf(0, -2), positionOf(1, -2)];
        case 2:
            return [positionOf(0, 0), positionOf(1, 0), positionOf(1, -1), positionOf(0, 2), positionOf(1, 2)];
        case 3:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(1, 1), positionOf(0, -2), positionOf(1, -2)];
    }
}

const originPositionsSuperRotateRightT0: Position[] =
    [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, -1), positionOf(0, 2), positionOf(-1, 2)];

const originPositionsSuperRotateRightT1: Position[] = originPositionsSuperRotateRightT0.map(pos => positionOf(-pos.x, -pos.y));

const originPositionsSuperRotateRightT2: Position[] = originPositionsSuperRotateRightT0.map(pos => positionOf(pos.x, -pos.y));

const originPositionsSuperRotateRightT3: Position[] =
    [positionOf(0, 0), positionOf(-1, 0), positionOf(-1, 1), positionOf(0, -2), positionOf(-1, -2)];

const originPositionsSuperRotateLeftT0: Position[] = originPositionsSuperRotateRightT0.map(pos => positionOf(-pos.x, pos.y));

const originPositionsSuperRotateLeftT1: Position[] = originPositionsSuperRotateRightT1;
// originPositionsSuperRotateRightT0.map(pos => positionOf(-pos.x, -pos.y));

const originPositionsSuperRotateLeftT2: Position[] = originPositionsSuperRotateRightT0;

const originPositionsSuperRotateLeftT3: Position[] = originPositionsSuperRotateRightT2;

// originPositionsSuperRotateRightT0.map(pos => positionOf(pos.x, -pos.y));

function originPositionsSuperRotateRightT(posture: MinoPosture): Position[] {
    switch (posture) {
        case 0:
            return originPositionsSuperRotateRightT0;
        case 1:
            return originPositionsSuperRotateRightT1;
        case 2:
            return originPositionsSuperRotateRightT2;
        case 3:
            return originPositionsSuperRotateRightT3;
    }
}

function originPositionsSuperRotateLeftT(posture: MinoPosture): Position[] {
    switch (posture) {
        case 0:
            return originPositionsSuperRotateLeftT0;
        case 1:
            return originPositionsSuperRotateLeftT1;
        case 2:
            return originPositionsSuperRotateLeftT2;
        case 3:
            return originPositionsSuperRotateLeftT3;
    }
}

function originPositionsSuperRotateRightI(posture: MinoPosture): Position[] {
    switch (posture) {
        case 0:
            return [positionOf(0, 0), positionOf(-2, 0), positionOf(1, 0), positionOf(-2, 1), positionOf(1, -2)];
        case 1:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(2, 0), positionOf(-1, -2), positionOf(2, 2)];
        case 2:
            return [positionOf(0, 0), positionOf(2, 0), positionOf(-1, 0), positionOf(2, -1), positionOf(-1, 2)];
        case 3:
            return [positionOf(0, 0), positionOf(-2, 0), positionOf(1, 0), positionOf(1, 2), positionOf(-2, -1)];
    }
}

function originPositionsSuperRotateLeftI(posture: MinoPosture): Position[] {
    switch (posture) {
        case 0:
            return [positionOf(0, 0), positionOf(-1, 0), positionOf(2, 0), positionOf(-1, -2), positionOf(2, 1)];
        case 1:
            return [positionOf(0, 0), positionOf(2, 0), positionOf(-1, 0), positionOf(2, -1), positionOf(-1, 2)];
        case 2:
            return [positionOf(0, 0), positionOf(1, 0), positionOf(-2, 0), positionOf(1, 2), positionOf(-2, -1)];
        case 3:
            return [positionOf(0, 0), positionOf(1, 0), positionOf(-2, 0), positionOf(-2, 1), positionOf(1, -2)];
    }
}
