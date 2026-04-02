import type { RequestHandler } from './$types';
import type { Recipe } from '$lib/types/api';
import { json } from '@sveltejs/kit';

const DUMMY_JSON_URL = 'https://dummyjson.com/recipes';

export const GET: RequestHandler = async ({ fetch }) => {
    const { recipes }: { recipes: Recipe[] } = await (await fetch(DUMMY_JSON_URL)).json();
    return json(recipes);
};
