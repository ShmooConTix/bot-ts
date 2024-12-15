export type WebsocketMessage = {
    type: 'initalize';
    data: {
        baseURL: string;
        landingURL: string;
        users: User[];
    };
} | {
    type: 'formLink';
    data: string;
} | {
    type: 'riddleAnswer';
    data: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    proxy?: string;
    client: "ts" | "go" | "rs";
    created_at: string;
  };