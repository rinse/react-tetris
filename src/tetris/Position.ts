export type Position = {
    x: number,
    y: number,
};

export function positionOf(x: number, y: number): Position {
    return {x, y};
}

export function addPositions(a: Position, b: Position): Position {
    return positionOf(a.x + b.x, a.y + b.y);
}

// A right rotation of 90 degrees given by the rotation matrix.
export function rotatePosRight(p: Position): Position {
    return positionOf(-p.y, p.x);
}

export function rotatePosLeft(p: Position): Position {
    return positionOf(p.y, -p.x);
}

export function incrementPosXBy(position: Position, step: number): Position {
    return {x: position.x + step, y: position.y};
}

export function incrementPosY(position: Position): Position {
    return {x: position.x, y: position.y + 1};
}
