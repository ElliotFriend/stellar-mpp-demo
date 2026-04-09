<script lang="ts">
    interface Props {
        token: string;
        balance: string;
    }
    let { token, balance }: Props = $props();
</script>

<div
    class="block content-center justify-items-center rounded-lg border border-gray-200 bg-white p-6"
>
    <div class="text-md font-medium">
        {token} Balance
    </div>
    <h3 class="mt-1 text-4xl font-semibold text-gray-900">
        {parseFloat(balance).toFixed(2)}
    </h3>
</div>
