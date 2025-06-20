import type { Board } from '../types/board';

export class Boards {
    static getBoards(): Promise<Board[]>;
}

export default Boards; 