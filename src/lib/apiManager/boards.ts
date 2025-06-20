export class Boards {
    static async getBoards() {
        const response = await fetch('/api/boards');
        return response.json();
    }
}

export default Boards;