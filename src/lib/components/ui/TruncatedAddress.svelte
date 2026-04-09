<script lang="ts">
    interface Props {
        address: string;
        startChars: number;
        endChars: number;
    }

    let { address, startChars = 4, endChars = 4 }: Props = $props();
    const shortenedText = $derived(
        `${address.slice(0, startChars)}...${address.slice(endChars * -1)}`,
    );
</script>

<span>{shortenedText}</span>
