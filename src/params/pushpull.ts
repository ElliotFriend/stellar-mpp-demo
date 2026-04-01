import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'push' | 'pull' => {
    return param === 'pull' || param === 'push';
}) satisfies ParamMatcher;
