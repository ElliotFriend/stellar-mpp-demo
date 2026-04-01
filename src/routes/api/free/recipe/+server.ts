import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

interface Recipe {
    id: number;
    name: string;
    ingredients: string[];
    instructions: string[];
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    difficulty: string;
    cuisine: string;
    caloriesPerServing: number;
    tags: string[];
    image: string;
    rating: number;
    reviewCount: number;
    mealType: string[];
}

export const GET: RequestHandler = async ({ fetch }) => {
    const id = Math.floor(Math.random() * 50) + 1;
    const recipe: Recipe = await (await fetch(`https://dummyjson.com/recipes/${id}`)).json();
    return json(recipe);
};
