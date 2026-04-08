<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { Keypair } from '@stellar/stellar-sdk';
    import Markdown from '@humanspeak/svelte-markdown';
    import { Mppx } from 'mppx/client';
    import { Receipt } from 'mppx';
    import { stellar } from '@stellar/mpp/charge/client';

    import AccountRequired from '$lib/components/AccountRequired.svelte';
    import MppModeToggle from '$lib/components/ui/MppModeToggle.svelte';

    interface DisplayMessage {
        role: 'user' | 'assistant';
        text: string;
        toolEvents?: ToolEvent[];
    }

    interface ToolEvent {
        kind:
            | 'calling'
            | 'paying'
            | 'challenge'
            | 'signing'
            | 'signed'
            | 'confirming'
            | 'paid'
            | 'done'
            | 'error';
        toolName: string;
        detail?: string;
        link?: { href: string; text: string };
    }

    let mppMode = $state<'pull' | 'push'>('pull');

    // Tool name -> API endpoint mapping (paid URLs are derived from mppMode)
    function getToolEndpoint(toolName: string): { url: string; paid: boolean } | undefined {
        const free: Record<string, string> = {
            get_random_quote: '/api/free/quote',
            get_random_recipe: '/api/free/recipe',
            get_random_post: '/api/free/post',
        };
        const paid: Record<string, string> = {
            get_all_quotes: 'quotes',
            get_all_recipes: 'recipes',
            get_all_posts: 'posts',
        };
        if (free[toolName]) return { url: free[toolName], paid: false };
        if (paid[toolName]) return { url: `/api/paid/${mppMode}/${paid[toolName]}`, paid: true };
        return undefined;
    }

    let displayMessages: DisplayMessage[] = $state([]);
    let apiMessages: { role: string; content: unknown }[] = $state([]);
    let inputText = $state('');
    let isStreaming = $state(false);
    let hasAccount = $derived(!!user.secretKey);
    let chatContainer: HTMLElement | undefined = $state();

    function scrollToBottom() {
        if (chatContainer) {
            requestAnimationFrame(() => {
                chatContainer!.scrollTop = chatContainer!.scrollHeight;
            });
        }
    }

    async function executeTool(toolName: string): Promise<{ result: string; events: ToolEvent[] }> {
        const endpoint = getToolEndpoint(toolName);
        const events: ToolEvent[] = $state([]);

        if (!endpoint) {
            events.push({ kind: 'error', toolName, detail: 'Unknown tool' });
            return { result: JSON.stringify({ error: 'Unknown tool' }), events };
        }

        events.push({ kind: 'calling', toolName, detail: endpoint.url });

        try {
            let res: Response;

            if (endpoint.paid && user.secretKey) {
                const keypair = Keypair.fromSecret(user.secretKey);
                const mppx = Mppx.create({
                    polyfill: false,
                    methods: [
                        stellar.charge({
                            keypair,
                            mode: mppMode,
                            onProgress(event) {
                                console.log('onprogress event', event);
                                switch (event.type) {
                                    case 'challenge':
                                        events.push({
                                            kind: 'challenge',
                                            toolName,
                                            detail: `${event.amount} USDC`,
                                        });
                                        return;
                                    case 'signing':
                                        events.push({
                                            kind: 'signing',
                                            toolName,
                                            detail: 'signing with keypair',
                                        });
                                        break;
                                    case 'signed':
                                        events.push({
                                            kind: 'signed',
                                            toolName,
                                            detail: `signed tx: ${event.transaction.slice(0, 18)}...${event.transaction.slice(event.transaction.length - 18)}`,
                                        });
                                        return;
                                    case 'confirming':
                                        events.push({
                                            kind: 'confirming',
                                            toolName,
                                            detail: 'waiting for blockchain settlement',
                                        });
                                        return;
                                    default:
                                        return;
                                }
                            },
                        }),
                    ],
                });

                res = await mppx.fetch(endpoint.url);

                const receiptRaw = res.headers.get('payment-receipt') ?? '';
                if (receiptRaw) {
                    try {
                        const receipt = Receipt.deserialize(receiptRaw);
                        events.push({
                            kind: 'paid',
                            toolName,
                            detail: `tx: ${receipt.reference.slice(0, 12)}...`,
                            link: {
                                href: `https://stellar.expert/explorer/testnet/tx/${receipt.reference}`,
                                text: 'View on Stellar Expert',
                            },
                        });
                    } catch {
                        events.push({ kind: 'error', toolName, detail: `HTTP ${res.status}` });
                    }
                }
            } else {
                res = await fetch(endpoint.url);
            }

            if (!res.ok) {
                events.push({
                    kind: 'error',
                    toolName,
                    detail: `HTTP ${res.status}`,
                });
                return { result: JSON.stringify({ error: `HTTP ${res.status}` }), events };
            }

            const data = await res.json();
            if (!endpoint.paid) {
                events.push({ kind: 'done', toolName });
            }
            return { result: JSON.stringify(data), events };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            events.push({ kind: 'error', toolName, detail: msg });
            return { result: JSON.stringify({ error: msg }), events };
        }
    }

    async function readStream(
        response: Response,
    ): Promise<{ content: unknown[]; stopReason: string }> {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let content: unknown[] = [];
        let stopReason = 'end_turn';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const event = JSON.parse(data);

                    if (
                        event.type === 'content_block_delta' &&
                        event.delta?.type === 'text_delta'
                    ) {
                        const lastMsg = displayMessages[displayMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'assistant') {
                            lastMsg.text += event.delta.text;
                        }
                        scrollToBottom();
                    }

                    if (event.type === 'final_message') {
                        content = event.message.content;
                        stopReason = event.message.stop_reason;
                    }

                    if (event.type === 'error') {
                        const lastMsg = displayMessages[displayMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'assistant') {
                            lastMsg.text += `\n\n*Error: ${event.error}*`;
                        }
                    }
                } catch (err) {
                    // skip unparseable lines
                    console.error('error parsing line', err);
                }
            }
        }

        return { content, stopReason };
    }

    async function sendMessages() {
        // Add assistant placeholder
        displayMessages.push({ role: 'assistant', text: '', toolEvents: [] });

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: apiMessages }),
        });

        if (!res.ok || !res.body) {
            const lastMsg = displayMessages[displayMessages.length - 1];
            if (lastMsg) lastMsg.text = '*Failed to connect to chat API.*';
            return;
        }

        const { content, stopReason } = await readStream(res);

        // Add assistant response to API messages
        apiMessages.push({ role: 'assistant', content });

        // Handle tool use
        if (stopReason === 'tool_use') {
            const toolBlocks = (content as { type: string; id: string; name: string }[]).filter(
                (b) => b.type === 'tool_use',
            );

            const currentDisplay = displayMessages[displayMessages.length - 1];
            const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

            for (const tool of toolBlocks) {
                const { result, events } = await executeTool(tool.name);
                if (currentDisplay) {
                    currentDisplay.toolEvents = [...(currentDisplay.toolEvents ?? []), ...events];
                }
                scrollToBottom();
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: tool.id,
                    content: result,
                });
            }

            apiMessages.push({ role: 'user', content: toolResults });

            // Continue the conversation — Claude will process tool results
            await sendMessages();
        }
    }

    async function handleSend() {
        const text = inputText.trim();
        if (!text || isStreaming) return;

        inputText = '';
        isStreaming = true;

        displayMessages.push({ role: 'user', text });
        apiMessages.push({ role: 'user', content: text });
        scrollToBottom();

        try {
            await sendMessages();
        } finally {
            isStreaming = false;
            scrollToBottom();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const eventStyles: Record<ToolEvent['kind'], string> = {
        calling: 'text-gray-500',
        challenge: 'text-amber-400',
        paying: 'text-amber-400',
        signing: 'text-amber-400',
        signed: 'text-amber-400',
        confirming: 'text-amber-400',
        paid: 'text-green-600',
        done: 'text-green-600',
        error: 'text-red-600',
    };

    const eventIcons: Record<ToolEvent['kind'], string> = {
        calling: '\u2192',
        challenge: '\u26A1',
        paying: '\u26A1',
        signing: '\u26A1',
        signed: '\u26A1',
        confirming: '\u26A1',
        paid: '\u2713',
        done: '\u2713',
        error: '\u2717',
    };
</script>

<div class="flex flex-col" style="height: calc(100vh - 8.5rem);">
    <div class="mb-4 flex items-start justify-between">
        <div>
            <div class="text-sm font-medium text-purple-600">Agent Demo</div>
            <h1 class="text-2xl font-bold tracking-tight">AI Chat</h1>
            <p class="mt-1 text-sm text-gray-500">
                Chat with an AI that can fetch resources from both free and paid APIs. Watch it make
                Stellar payments in real time.
            </p>
        </div>
        <MppModeToggle bind:mode={mppMode} />
    </div>

    {#if !hasAccount}
        <AccountRequired />
    {:else}
        <div
            bind:this={chatContainer}
            class="flex-1 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4"
        >
            {#if displayMessages.length === 0}
                <div class="flex h-full items-center justify-center text-sm text-gray-400">
                    Ask me to fetch some quotes, recipes, or posts!
                </div>
            {/if}

            {#each displayMessages as msg, i (`msg${i}`)}
                <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                    <div
                        class="max-w-[80%] rounded-lg px-4 py-2 text-sm {msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'}"
                    >
                        {#if msg.toolEvents && msg.toolEvents.length > 0}
                            <div class="mb-2 space-y-1 border-b border-gray-200 pb-2">
                                {#each msg.toolEvents as event, i (`${event.toolName}-${event.kind}-${i}`)}
                                    <div
                                        class="flex items-center gap-1.5 text-xs {eventStyles[
                                            event.kind
                                        ]}"
                                    >
                                        <span>{eventIcons[event.kind]}</span>
                                        <span class="font-medium">{event.toolName}</span>
                                        {#if event.detail}
                                            <span class="text-gray-400">{event.detail}</span>
                                        {/if}
                                        {#if event.link}
                                            <a
                                                href={event.link.href}
                                                target="_blank"
                                                rel="external noopener noreferrer"
                                                class="text-indigo-500 underline"
                                            >
                                                {event.link.text}
                                            </a>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        {#if msg.role === 'assistant'}
                            <div class="prose prose-sm max-w-none">
                                <Markdown source={msg.text} />
                            </div>
                        {:else}
                            <div class="whitespace-pre-wrap">{msg.text}</div>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if isStreaming}
                <div class="flex justify-start">
                    <div class="rounded-lg bg-gray-100 px-4 py-2">
                        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400"
                        ></span>
                    </div>
                </div>
            {/if}
        </div>

        <div class="mt-3 flex gap-2">
            <input
                type="text"
                bind:value={inputText}
                onkeydown={handleKeydown}
                placeholder="Ask for quotes, recipes, posts..."
                disabled={isStreaming}
                class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
                onclick={handleSend}
                disabled={isStreaming || !inputText.trim()}
                class="w-20 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Send
            </button>
        </div>
    {/if}
</div>
