import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    CELL_WIDTH_BOARD,
    CELL_HEIGHT_BOARD,
    PX_WIDTH_CANVAS,
    PX_HEIGHT_CANVAS,
    PX_WIDTH_CELL,
    PX_HEIGHT_CELL,
} from "./constants";
import {repeat, repeatShuffled} from "./utilities";
import {Board, canPutMino, createBoard, putMino} from "./Board";
import {
    BASIC_MINO_KINDS,
    MINO_COLOUR_GAME_OVER,
    MINO_KIND_GAME_OVER,
    MINO_KIND_NULL,
    MINO_KIND_WALL,
    Mino,
    MinoKind,
    minoOf, cloneMino, rotateMinoRight, rotateMinoLeft,
} from "./MinoKind";
import {addPositions, positionOf, Position, incrementPosY, incrementPosXBy} from "./Position";

const GAME_FPS = 24;
const MS_GAME_FPS = 1000 / GAME_FPS;

type TetrisState = {
    board: Board,
    frame: number,
    currentMino: Mino,
    minoPosition: Position,
    minoKinds: Generator<MinoKind, MinoKind, undefined>,
    keyInputBuffer: string[],
    isGameOver: boolean,
    deletedLinesCount: number,
    frameMinoCannotDrop: number,
    maxFrameMinoCannotDrop: number,
};

function emptyTetrisState(): TetrisState {
    return {
        board: createBoard(),
        frame: 0,
        currentMino: minoOf("Null"),
        minoPosition: positionOf(0, 0),
        minoKinds: repeatShuffled(BASIC_MINO_KINDS),
        keyInputBuffer: [],
        isGameOver: false,
        deletedLinesCount: 0,
        frameMinoCannotDrop: 0,
        maxFrameMinoCannotDrop: GAME_FPS / 2,   // 0.5 seconds
    };
}

function initTetrisState(state: TetrisState) {
    putMino(state.board, minoOf(MINO_KIND_WALL), positionOf(0, 0));
    initMinoState(state);
}

function initMinoState(state: TetrisState) {
    state.currentMino = minoOf(state.minoKinds.next().value);
    state.minoPosition = positionOf(CELL_WIDTH_BOARD / 2, 1);
    state.isGameOver = !canPutMino(state.board, state.currentMino, state.minoPosition);
}

function createTetrisState(): TetrisState {
    const state = emptyTetrisState();
    initTetrisState(state);
    return state;
}

export function Tetris() {
    const canvasRef: React.RefObject<HTMLCanvasElement> = useRef<HTMLCanvasElement>(null);
    const tetrisRef = useRef<TetrisState>(createTetrisState());
    const [frame, setFrame] = useState(tetrisRef.current.frame);
    const [frameMinoCannotDrop, setFrameMinoCannotDrop] = useState(tetrisRef.current.frameMinoCannotDrop);
    const [deletedLinesCount, setDeletedLinesCount] = useState(tetrisRef.current.deletedLinesCount);
    useEffect(() => {
        const eventType = "keydown" as const;
        const eventListener = createKeydownEventListener(tetrisRef.current);
        document.body.addEventListener(eventType, eventListener);
        return () => document.body.removeEventListener(eventType, eventListener);
    }, []);
    const mainLoop = useCallback(() => {
        const context = canvasRef.current?.getContext("2d");
        if (!context) {
            return;
        }
        const tetrisState = tetrisRef.current;
        // Update the state of tetris, then make React statuses follow it.
        if (!tetrisState.isGameOver) {
            updateTetrisState(tetrisState);
        }
        setFrame(tetrisState.frame);
        setDeletedLinesCount(tetrisState.deletedLinesCount);
        setFrameMinoCannotDrop(tetrisState.frameMinoCannotDrop);
        // Clear the game screen, then draw the game screen.
        context.clearRect(0, 0, PX_WIDTH_CANVAS, PX_HEIGHT_CANVAS);
        drawTetrisState(context, tetrisState);
    }, []);
    useInterval(mainLoop, MS_GAME_FPS);
    return (
        <>
            <canvas width={PX_WIDTH_CANVAS} height={PX_HEIGHT_CANVAS} ref={canvasRef}>
                Your browser does not seem to support Canvas.
            </canvas>
            <p>frame: {frame}</p>
            <p>frameMinoCannotDrop: {frameMinoCannotDrop}</p>
            <p>deleted lines: {deletedLinesCount}</p>
        </>
    );
}

function useInterval(f: () => void, msInterval: number) {
    useEffect(() => {
        const intervalId = setInterval(f, msInterval);
        return () => clearInterval(intervalId);
    }, [f, msInterval]);
}

// ==========================
// Defines how the game works
// ==========================

function createKeydownEventListener(state: TetrisState): (event: KeyboardEvent) => void {
    return event => state.keyInputBuffer.push(event.key);
}

const DROP_MINO_FRAME = GAME_FPS / 3;

function updateTetrisState(state: TetrisState) {
    // Mino moves by a keydown.
    const keyInput = takeKeyInput(state);
    if (keyInput !== undefined) {
        processKeyInput(state, keyInput);
    }
    // The current mino drops once a specific frame.
    if (state.frame % DROP_MINO_FRAME === 0) {
        if (tryMoveMino(state, incrementPosY(state.minoPosition))) {
            state.frameMinoCannotDrop = 0;
        }
    }
    // Mino is fixed after specific frames pass.
    if (canPutMino(state.board, state.currentMino, incrementPosY(state.minoPosition))) {
        state.frameMinoCannotDrop = 0;
    } else {
        state.frameMinoCannotDrop += 1;
    }
    if (state.frameMinoCannotDrop >= state.maxFrameMinoCannotDrop) {
        fixCurrentMino(state);
        deleteLines(state);
    }
    // Prepare for the game over screen if the game is over.
    if (state.isGameOver) {
        processGameOver(state);
    }
    // Frame increments.
    ++state.frame;
}

function processGameOver(state: TetrisState) {
    state.currentMino.colour = MINO_COLOUR_GAME_OVER;
    state.board = state.board.map(row =>
        row.map(minoKind => minoKind !== MINO_KIND_NULL ? MINO_KIND_GAME_OVER : MINO_KIND_NULL)
    );
}

function fixCurrentMino(state: TetrisState) {
    putMino(state.board, state.currentMino, state.minoPosition);
    initMinoState(state);
}

function deleteLines(state: TetrisState): number {
    const newBoard = state.board.filter(linesToRemain);
    const deletedLinesCount = CELL_HEIGHT_BOARD - newBoard.length;
    repeat(deletedLinesCount, () => newBoard.unshift(createEmptyLineWithWall()));
    state.board = newBoard;
    state.deletedLinesCount += deletedLinesCount;
    return deletedLinesCount;
}

function linesToRemain(line: MinoKind[]): boolean {
    return line.every(e => e === MINO_KIND_WALL) || line.some(e => e === MINO_KIND_NULL);
}

function createEmptyLineWithWall(): MinoKind[] {
    const line = repeat(CELL_WIDTH_BOARD, () => MINO_KIND_NULL);
    line[0] = line[CELL_WIDTH_BOARD - 1] = MINO_KIND_WALL;
    return line;
}

function processKeyInput(state: TetrisState, key: string) {
    switch (key) {
        case "h":
            tryMoveMino(state, incrementPosXBy(state.minoPosition, -1));
            state.frameMinoCannotDrop /= 1.2;
            break;
        case "l":
            tryMoveMino(state, incrementPosXBy(state.minoPosition, 1));
            state.frameMinoCannotDrop /= 1.2;
            break;
        case "j":
            tryMoveMino(state, incrementPosY(state.minoPosition));
            state.frameMinoCannotDrop /= 1.2;
            break;
        case "k":
            tryRotateRight(state);
            state.frameMinoCannotDrop /= 1.2;
            break;
        case "K":
            tryRotateLeft(state);
            state.frameMinoCannotDrop /= 1.2;
            break;
        case " ":
            hardDrop(state);
            state.frameMinoCannotDrop += state.maxFrameMinoCannotDrop;
            break;
    }
}

function takeKeyInput(state: TetrisState): string | undefined {
    const key = state.keyInputBuffer.shift();
    resetKeyInputBuffer(state);
    return key;
}

function resetKeyInputBuffer(state: TetrisState) {
    state.keyInputBuffer = [];
}

function tryMoveMino(state: TetrisState, destination: Position): boolean {
    return tryTransformCurrentMino(state, state.currentMino, destination);
}

function tryRotateRight(state: TetrisState): boolean {
    const newMino = rotateMinoRight(state.currentMino);
    return tryTransformCurrentMino(state, newMino, state.minoPosition)
        || tryTransformCurrentMino(state, newMino, incrementPosXBy(state.minoPosition, 1))
        || tryTransformCurrentMino(state, newMino, incrementPosXBy(state.minoPosition, -1));
}

function tryRotateLeft(state: TetrisState): boolean {
    const newMino = rotateMinoLeft(state.currentMino);
    return tryTransformCurrentMino(state, newMino, state.minoPosition)
        || tryTransformCurrentMino(state, newMino, incrementPosXBy(state.minoPosition, 1))
        || tryTransformCurrentMino(state, newMino, incrementPosXBy(state.minoPosition, -1));
}

function tryTransformCurrentMino(state: TetrisState, newMino: Mino, newMinoPosition: Position) {
    const r = canPutMino(state.board, newMino, newMinoPosition);
    if (r) {
        state.currentMino = newMino;
        state.minoPosition = newMinoPosition;
    }
    return r;
}

function positionGround(state: TetrisState): Position {
    let ret = state.minoPosition;
    while (canPutMino(state.board, state.currentMino, incrementPosY(ret))) {
        ret = incrementPosY(ret);
    }
    return ret;
}

function hardDrop(state: TetrisState) {
    state.minoPosition = positionGround(state);
}

// =========================
// Draw a tetris game screen
// =========================

const FRAME_COLOUR_NORMAL = "#000";
const FRAME_COLOUR_GHOST = "#CCC";

function drawTetrisState(context: CanvasRenderingContext2D, state: TetrisState) {
    context.strokeStyle = "#000";
    state.board.forEach((row, y) => {
        row.forEach((minoKind, x) => {
            if (minoKind !== MINO_KIND_NULL) {
                drawCell(context, positionOf(x, y), minoOf(minoKind).colour, FRAME_COLOUR_NORMAL);
            }
        });
    });
    drawGhost(context, state);
    drawMino(context, state.currentMino, state.minoPosition, FRAME_COLOUR_NORMAL);
}

// Transforms rgb(R, G, B) to rgba(R, G, B, A)
function ghostColour(colour: string): string {
    return colour.replace("rgb", "rgba").replace(")", ", 0.12)");
}

function drawGhost(context: CanvasRenderingContext2D, state: TetrisState) {
    const ghost = cloneMino(state.currentMino);
    ghost.colour = ghostColour(state.currentMino.colour);
    const minoPosition = positionGround(state);
    drawMino(context, ghost, minoPosition, FRAME_COLOUR_GHOST);
}

function drawMino(context: CanvasRenderingContext2D, mino: Mino, minoPos: Position, frameColour: string) {
    mino.positions.forEach(cellPos => {
        drawCell(context, addPositions(minoPos, cellPos), mino.colour, frameColour);
    });
}

function drawCell(context: CanvasRenderingContext2D, position: Position, fillColour: string, strokeColour: string) {
    withContextPath(context, () => {
        context.fillStyle = fillColour;
        context.strokeStyle = strokeColour;
        context.fillRect(position.x * PX_WIDTH_CELL, position.y * PX_HEIGHT_CELL, PX_WIDTH_CELL, PX_HEIGHT_CELL);
        context.strokeRect(position.x * PX_WIDTH_CELL, position.y * PX_HEIGHT_CELL, PX_WIDTH_CELL, PX_HEIGHT_CELL);
    });
}

function withContextPath<T>(context: CanvasRenderingContext2D, f: () => T): T {
    context.beginPath();
    try {
        return f();
    } finally {
        context.closePath();
    }
}
