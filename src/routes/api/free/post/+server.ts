import type { RequestHandler } from './$types';
import type { Post } from '$lib/types/api';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
    const id = Math.floor(Math.random() * 251) + 1;
    const post: Post = await (await fetch(`https://dummyjson.com/posts/${id}`)).json();
    return json(post);
};
