import type { RequestHandler } from './$types';
import type { Recipe } from '$lib/types/api';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
    const id = Math.floor(Math.random() * 50) + 1;
    const recipe: Recipe = await (await fetch(`https://dummyjson.com/recipes/${id}`)).json();
    return json(recipe);
};
