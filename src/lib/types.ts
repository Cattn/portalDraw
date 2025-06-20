export interface Board {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	strokes: [];
    preview: string;
};

export interface User {
    id: string;
    username: string;
    boards: Board[];
    admin: boolean;
}

export interface Stroke {
    id: number;
    boardId: number;
    points: string;
    color: string;
    width: number;
}