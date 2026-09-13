<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';

	let { data, form } = $props();

	let pending = $state<string | null>(null);
	const top = $derived(data.tally.top ? emojiByKey(data.tally.top) : null);
	const max = $derived(Math.max(1, ...Object.values(data.tally.counts)));
</script>

<svelte:head>
	<title>@{data.handle} is {data.tally.shitScore}% shit · shit.so</title>
	<meta property="og:title" content="@{data.handle} is {data.tally.shitScore}% shit" />
	<meta property="og:description" content="{data.tally.total} people gave a shit. give yours on shit.so" />
</svelte:head>

<section class="flex items-center gap-4 py-6">
	<img
		src="https://unavatar.io/x/{data.handle}"
		alt=""
		class="size-20 rounded-full bg-neutral-800 ring-2 ring-neutral-800"
	/>
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<h1 class="truncate text-2xl font-black">@{data.handle}</h1>
			<a
				href="https://x.com/{data.handle}"
				target="_blank"
				rel="noopener"
				class="text-xs text-neutral-500 hover:text-neutral-300">x ↗</a
			>
		</div>
		<p class="mt-1 text-neutral-400">
			{#if data.tally.total === 0}
				nobody has given a shit yet.
			{:else}
				<span class="text-3xl font-black {data.tally.shitScore >= 50 ? 'text-amber-400' : 'text-emerald-400'}">
					{data.tally.shitScore}%
				</span>
				<span class="text-sm">shit · {data.tally.total} {data.tally.total === 1 ? 'vote' : 'votes'}</span>
				{#if top}
					<span class="ml-2 text-sm">mostly {top.char} {top.label}</span>
				{/if}
			{/if}
		</p>
	</div>
</section>

<section class="mt-4">
	<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
		{data.mine ? 'your shit' : 'give a shit'}
	</h2>

	{#if data.isSelf}
		<p class="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">
			this is you. you cannot rate yourself, but you can share this page and find out.
		</p>
	{:else}
		<form
			method="POST"
			action="?/vote"
			use:enhance={({ formData }) => {
				pending = String(formData.get('emoji'));
				return async ({ update }) => {
					await update();
					pending = null;
				};
			}}
			class="grid grid-cols-5 gap-2"
		>
			{#each EMOJIS as e (e.key)}
				{@const active = data.mine === e.key}
				<button
					name="emoji"
					value={e.key}
					disabled={pending !== null}
					class="flex flex-col items-center gap-1 rounded-lg border p-3 transition
						{active
						? 'border-white bg-neutral-100 text-black'
						: 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'}
						{pending === e.key ? 'opacity-50' : ''}"
					title={e.label}
				>
					<span class="text-2xl">{e.char}</span>
					<span class="text-[11px] {active ? 'text-neutral-700' : 'text-neutral-500'}">{e.label}</span>
				</button>
			{/each}
			{#if data.mine}
				<button
					name="emoji"
					value="none"
					class="col-span-5 mt-1 text-xs text-neutral-500 underline hover:text-neutral-300"
				>
					actually, i don't give a shit anymore
				</button>
			{/if}
		</form>
		{#if !data.session?.user}
			<p class="mt-2 text-xs text-neutral-500">you'll be asked to sign in with X first.</p>
		{/if}
		{#if form?.error}
			<p class="mt-2 text-sm text-red-400">{form.error}</p>
		{/if}
	{/if}
</section>

{#if data.tally.total > 0}
	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">the breakdown</h2>
		<ul class="space-y-1.5">
			{#each EMOJIS as e (e.key)}
				{@const n = data.tally.counts[e.key] ?? 0}
				<li class="flex items-center gap-3 text-sm">
					<span class="w-6 text-center text-lg">{e.char}</span>
					<div class="h-2 flex-1 overflow-hidden rounded bg-neutral-900">
						<div
							class="h-full {e.tone === 'bad' ? 'bg-amber-500' : 'bg-emerald-500'}"
							style="width: {(n / max) * 100}%"
						></div>
					</div>
					<span class="w-8 text-right tabular-nums text-neutral-400">{n}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-10 text-sm text-neutral-500">
	<a
		href="https://x.com/intent/post?text={encodeURIComponent(`@${data.handle} is ${data.tally.shitScore}% shit according to ${data.tally.total} people. give yours: https://shit.so/${data.handle}`)}"
		target="_blank"
		rel="noopener"
		class="underline hover:text-neutral-300">share this on X</a
	>
</section>
