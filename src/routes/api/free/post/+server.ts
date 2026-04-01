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

export const GET: RequestHandler = async ({ fetch }) => {
    const id = Math.floor(Math.random() * 251) + 1;
    const post: Post = await (await fetch(`https://dummyjson.com/posts/${id}`)).json();
    return json(post);
};
