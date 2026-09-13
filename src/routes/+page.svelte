<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { tierFor } from '$lib/tiers';

	let { data, form } = $props();

	function ago(d: Date) {
		const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
		if (s < 60) return 'now';
		if (s < 3600) return `${Math.floor(s / 60)}m`;
		if (s < 86400) return `${Math.floor(s / 3600)}h`;
		return `${Math.floor(s / 86400)}d`;
	}
</script>

<section class="py-10 text-center">
	<h1 class="text-4xl font-black tracking-tight sm:text-5xl">give a shit.</h1>
	<p class="mx-auto mt-3 max-w-md text-neutral-400">
		rate anyone on X with one of ten emojis. one vote per person, and you can change it whenever they change.
	</p>

	<form method="POST" action="?/search" use:enhance class="mx-auto mt-8 flex max-w-md gap-2">
		<div class="flex flex-1 items-center rounded-lg border border-neutral-800 bg-neutral-900 px-3 focus-within:border-neutral-600">
			<span class="text-neutral-500">@</span>
			<input name="handle" placeholder="elonmusk" autocomplete="off" autocapitalize="off" spellcheck="false" class="w-full bg-transparent px-2 py-3 outline-none placeholder:text-neutral-600" />
		</div>
		<button class="rounded-lg bg-white px-4 font-semibold text-black hover:bg-neutral-200">look up</button>
	</form>
	{#if form?.error}<p class="mt-2 text-sm text-red-400">{form.error}</p>{/if}

	<div class="mt-6 flex flex-wrap justify-center gap-1 text-2xl">
		{#each EMOJIS as e (e.key)}<span title={e.label}>{e.char}</span>{/each}
	</div>
	<p class="mt-2 text-xs text-neutral-600">{data.stats.votes} shits given about {data.stats.targets} people</p>
</section>

{#snippet row(target: string, total: number, shitScore: number, i: number, right: string | undefined = undefined)}
	{@const tier = tierFor(shitScore, total)}
	<li>
		<a href="/@{target}" class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-900">
			<span class="w-5 text-right text-xs text-neutral-600">{i + 1}</span>
			<img src="https://unavatar.io/x/{target}?fallback=false" alt="" class="size-7 rounded-full bg-neutral-800" loading="lazy" />
			<span class="min-w-0 flex-1 truncate">@{target}</span>
			<span class="hidden shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold md:inline {tier.badge}">{tier.emoji} {tier.label}</span>
			<span class="hidden shrink-0 text-xs text-neutral-500 lg:inline">{right ?? `${total} votes`}</span>
			<span class="w-11 shrink-0 text-right text-sm font-semibold {tier.accent}">{shitScore}%</span>
		</a>
	</li>
{/snippet}

{#snippet board(title: string, rows: { target: string; total: number; shitScore: number }[], empty: string)}
	<div>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
		{#if rows.length === 0}
			<p class="text-sm text-neutral-600">{empty}</p>
		{:else}
			<ol class="divide-y divide-neutral-900 rounded-lg border border-neutral-900">
				{#each rows as r, i (r.target)}{@render row(r.target, r.total, r.shitScore, i)}{/each}
			</ol>
		{/if}
	</div>
{/snippet}

{#if data.hot.length > 0}
	<section class="mb-8">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">🔥 hot right now · last 24h</h2>
		<ol class="divide-y divide-neutral-900 rounded-lg border border-neutral-900">
			{#each data.hot as r, i (r.target)}{@render row(r.target, r.total, r.shitScore, i, `+${r.last24h} today`)}{/each}
		</ol>
	</section>
{/if}

<section class="grid gap-8 sm:grid-cols-2">
	{@render board('most shit', data.shit, 'nobody is shit yet. suspicious.')}
	{@render board('most goat', data.goat, 'no goats yet. be the first to respect someone.')}
</section>

{#if data.feed.length > 0}
	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">live shits</h2>
		<ul class="space-y-1 text-sm">
			{#each data.feed as f, i (i)}
				{@const e = emojiByKey(f.emoji)}
				<li class="flex items-center gap-2 text-neutral-400">
					<span class="w-8 text-right text-[11px] text-neutral-600">{ago(f.at)}</span>
					<span class="text-neutral-300">{f.voterHandle ? `@${f.voterHandle}` : 'someone'}</span>
					<span>gave</span>
					<span class="text-lg leading-none" title={e?.label}>{e?.char ?? '❓'}</span>
					<span>to</span>
					<a href="/@{f.target}" class="font-semibold text-neutral-200 hover:underline">@{f.target}</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
