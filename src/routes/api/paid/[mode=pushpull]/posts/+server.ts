import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

interface Post {
    id: number;
    title: string;
    body: string;
    tags: string[];
    reactions: {
        likes: number;
        dislikes: number;
    };
    views: number;
    userId: number;
}

const DUMMY_JSON_URL = 'https://dummyjson.com/posts';

export const GET: RequestHandler = async ({ fetch }) => {
    const { posts }: { posts: Post[] } = await (await fetch(DUMMY_JSON_URL)).json();
    return json(posts);
};
