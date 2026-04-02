import type { RequestHandler } from './$types';
import type { Quote } from '$lib/types/api';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
    const quote: Quote = await (await fetch('https://dummyjson.com/quotes/random')).json();
    return json(quote);
};
