import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    const count = Math.floor(Math.random() * 8) + 3; // 3–10 numbers
    const numbers = Array.from({ length: count }, () => ({
        value: Math.floor(Math.random() * 1000),
        hex: '',
        isEven: false,
    })).map((n) => ({
        value: n.value,
        hex: `0x${n.value.toString(16).toUpperCase()}`,
        isEven: n.value % 2 === 0,
    }));

    return json({
        count,
        sum: numbers.reduce((a, b) => a + b.value, 0),
        numbers,
    });
};
