<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS } from '$lib/emojis';

	let { data, form } = $props();
</script>

<section class="py-10 text-center">
	<h1 class="text-4xl font-black tracking-tight sm:text-5xl">give a shit.</h1>
	<p class="mx-auto mt-3 max-w-md text-neutral-400">
		rate anyone on X with one of ten emojis. one vote per person, and you can change it whenever they
		change.
	</p>

	<form method="POST" action="?/search" use:enhance class="mx-auto mt-8 flex max-w-md gap-2">
		<div class="flex flex-1 items-center rounded-lg border border-neutral-800 bg-neutral-900 px-3 focus-within:border-neutral-600">
			<span class="text-neutral-500">@</span>
			<input
				name="handle"
				placeholder="elonmusk"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				class="w-full bg-transparent px-2 py-3 outline-none placeholder:text-neutral-600"
			/>
		</div>
		<button class="rounded-lg bg-white px-4 font-semibold text-black hover:bg-neutral-200">look up</button>
	</form>
	{#if form?.error}
		<p class="mt-2 text-sm text-red-400">{form.error}</p>
	{/if}

	<div class="mt-6 flex flex-wrap justify-center gap-1 text-2xl">
		{#each EMOJIS as e (e.key)}
			<span title={e.label}>{e.char}</span>
		{/each}
	</div>
	<p class="mt-2 text-xs text-neutral-600">
		{data.stats.votes} shits given about {data.stats.targets} people
	</p>
</section>

<section class="grid gap-8 sm:grid-cols-2">
	{#snippet board(title: string, rows: typeof data.shit, empty: string)}
		<div>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
			{#if rows.length === 0}
				<p class="text-sm text-neutral-600">{empty}</p>
			{:else}
				<ol class="divide-y divide-neutral-900 rounded-lg border border-neutral-900">
					{#each rows as r, i (r.target)}
						<li>
							<a href="/{r.target}" class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-900">
								<span class="w-5 text-right text-xs text-neutral-600">{i + 1}</span>
								<img
									src="https://unavatar.io/x/{r.target}?fallback=false"
									alt=""
									class="size-7 rounded-full bg-neutral-800"
									loading="lazy"
								/>
								<span class="flex-1 truncate">@{r.target}</span>
								<span class="text-xs text-neutral-500">{r.total} votes</span>
								<span class="w-12 text-right text-sm font-semibold {r.shitScore >= 50 ? 'text-amber-400' : 'text-emerald-400'}">
									{r.shitScore}%
								</span>
							</a>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/snippet}

	{@render board('most shit', data.shit, 'nobody is shit yet. suspicious.')}
	{@render board('most goat', data.goat, 'no goats yet. be the first to respect someone.')}
</section>
