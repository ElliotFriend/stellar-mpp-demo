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
    userId: string;
    image: string;
    rating: number; // float
    reviewCount: number;
    mealType: string[];
}

const DUMMY_JSON_URL = 'https://dummyjson.com/recipes';

export const GET: RequestHandler = async ({ fetch }) => {
    const { recipes }: { recipes: Recipe[] } = await (await fetch(DUMMY_JSON_URL)).json();
    return json(recipes);
};
