import {CELL_HEIGHT_BOARD, CELL_WIDTH_BOARD} from "./constants";
import {Mino, MINO_KIND_NULL, MinoKind} from "./MinoKind";
import {addPositions, Position} from "./Position";
import {repeat} from "./utilities";

export type Board = MinoKind[][];

export function createBoard(): Board {
    return repeat(CELL_HEIGHT_BOARD, () => {
        return repeat(CELL_WIDTH_BOARD, () => MINO_KIND_NULL)
    });
}

export function canPutMino(board: Board, mino: Mino, minoPos: Position): boolean {
    return mino.positions
        .map(cellPos => addPositions(minoPos, cellPos))
        .every(pos => {
            return (0 <= pos.x && pos.x < CELL_WIDTH_BOARD)
                && (0 <= pos.y && pos.y < CELL_HEIGHT_BOARD)
                && board[pos.y][pos.x] === MINO_KIND_NULL;
        });
}

export function putMino(board: Board, mino: Mino, minoPos: Position) {
    mino.positions
        .map(cellPos => addPositions(minoPos, cellPos))
        .forEach(pos => {
            board[pos.y][pos.x] = mino.kind;
        });
}
