import type { RequestHandler } from './$types';
import type { Quote } from '$lib/types/api';
import { json } from '@sveltejs/kit';

const DUMMY_JSON_URL = 'https://dummyjson.com/quotes';

export const GET: RequestHandler = async ({ fetch }) => {
    const { quotes }: { quotes: Quote[] } = await (await fetch(DUMMY_JSON_URL)).json();
    return json(quotes);
};
