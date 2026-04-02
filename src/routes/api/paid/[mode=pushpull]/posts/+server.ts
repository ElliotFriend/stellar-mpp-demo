import type { RequestHandler } from './$types';
import type { Post } from '$lib/types/api';
import { json } from '@sveltejs/kit';

const DUMMY_JSON_URL = 'https://dummyjson.com/posts';

export const GET: RequestHandler = async ({ fetch }) => {
    const { posts }: { posts: Post[] } = await (await fetch(DUMMY_JSON_URL)).json();
    return json(posts);
};
