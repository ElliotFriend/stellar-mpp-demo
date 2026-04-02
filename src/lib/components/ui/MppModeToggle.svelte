<script lang="ts">
    let { mode = $bindable() }: { mode: 'pull' | 'push' } = $props();
</script>

<div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700">Mode</span>
    <button
        onclick={() => (mode = mode === 'pull' ? 'push' : 'pull')}
        class="relative inline-flex h-7 w-[5.5rem] shrink-0 cursor-pointer items-center rounded-full border border-gray-300 bg-gray-100 transition-colors"
        role="switch"
        aria-checked={mode === 'push'}
    >
        <span
            class="absolute left-0.5 h-6 w-10 rounded-full bg-indigo-600 transition-transform {mode ===
            'push'
                ? 'translate-x-[calc(100%-0.125rem)]'
                : ''}"
        ></span>
        <span
            class="relative z-10 w-1/2 text-center text-xs font-medium transition-colors {mode ===
            'pull'
                ? 'text-white'
                : 'text-gray-500'}"
        >
            Pull
        </span>
        <span
            class="relative z-10 w-1/2 text-center text-xs font-medium transition-colors {mode ===
            'push'
                ? 'text-white'
                : 'text-gray-500'}"
        >
            Push
        </span>
    </button>
</div>
