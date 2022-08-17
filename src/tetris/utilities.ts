// Make an array of [begin .. end).
export function* range2(begin: number, end: number): Generator<number, void, void> {
    for (let i = begin; i !== end; ++i) {
        yield i;
    }
}

export function rangeA(begin: number, end: number): number[] {
    return Array.from(range2(begin, end));
}

export function repeat<T>(n: number, supply: () => T): T[] {
    return Array.from({length: n}, supply);
}

export function shuffle<T>(array: Iterable<T>): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

export function* repeatShuffled<T>(array: readonly T[]): Generator<T, T, undefined> {
    for (; ;) {
        yield* shuffle(array);
    }
}
