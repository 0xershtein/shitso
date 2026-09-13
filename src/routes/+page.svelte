<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { tierFor, MIN_VOTES_FOR_TIER } from '$lib/tiers';
	import { ago, t } from '$lib/i18n';
	import Search from '$lib/components/Search.svelte';
	import LiveFeed from '$lib/components/LiveFeed.svelte';

	let { data } = $props();
	const L = $derived(data.locale);
</script>

<svelte:head>
	<title>shit.so · give a shit</title>
	<meta name="description" content={t(L, 'home.sub')} />
	<link rel="canonical" href="https://shit.so/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://shit.so/" />
	<meta property="og:title" content="shit.so · give a shit" />
	<meta property="og:description" content={t(L, 'home.sub')} />
	<meta property="og:image" content="{data.origin}/og.png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section class="py-6 text-center">
	<h1 class="text-4xl font-black tracking-tight sm:text-5xl" lang="en">{t(L, 'home.title')}</h1>
	<p class="mx-auto mt-2 max-w-md text-neutral-400">{t(L, 'home.sub')}</p>
	<div class="mt-5">
		<Search locale={L} popular={(data.hot.length ? data.hot : data.shit).map((r) => ({ handle: r.target, total: r.total, shitScore: r.shitScore, tier: tierFor(r.shitScore, r.total).key }))} />
	</div>
	<div class="mt-3 flex flex-wrap justify-center gap-1 text-xl">
		{#each EMOJIS as e (e.key)}<span title={t(L, `emoji.${e.key}`)}>{e.char}</span>{/each}
	</div>
	<p class="mt-1 text-xs text-neutral-600">{t(L, 'home.stats', { votes: data.stats.votes, targets: data.stats.targets })}</p>
</section>

<section class="mb-8 grid gap-3 sm:grid-cols-2">
	<div class="flex flex-col justify-center rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm">
		<div class="font-semibold text-emerald-300">🎁 {t(L, 'home.gift')}</div>
		<a href="/extension" class="mt-2 text-xs text-neutral-400 underline hover:text-neutral-200">🧩 {t(L, 'ext.sub').split('.')[0]}</a>
	</div>
	<div class="rounded-lg border border-neutral-900 bg-neutral-950/60 px-4 py-3 text-sm">
		<div class="mb-1.5 font-semibold text-neutral-200">🐦 {t(L, 'home.byTweet')}</div>
		<code class="block rounded bg-neutral-900 px-3 py-1.5 font-mono text-xs text-neutral-100">@giveashit_bot @elonmusk 💩</code>
		<div class="mt-1.5 text-[11px] text-neutral-500">{t(L, 'home.byTweetReply')} <code class="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-neutral-200">@giveashit_bot 💩</code></div>
	</div>
</section>


{#snippet row(target: string, total: number, shitScore: number, i: number, right: string | undefined = undefined)}
	{@const tier = tierFor(shitScore, total)}
	<li>
		<a href="/@{target}" class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-900">
			<span class="w-5 text-right text-xs text-neutral-600">{i + 1}</span>
			<img src="/avatar/{target}" alt="" class="size-7 rounded-full bg-neutral-800" loading="lazy" />
			<span class="min-w-0 flex-1 truncate">@{target}</span>
			{#if tier.key !== 'unrated'}
				<span class="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold {tier.badge}" title={t(L, `tier.${tier.key}.label`)}>{tier.emoji}<span class="hidden 2xl:inline"> {t(L, `tier.${tier.key}.label`)}</span></span>
			{/if}
			<span class="hidden shrink-0 text-xs text-neutral-500 sm:inline">{right ?? t(L, 'home.votes', { n: total })}</span>
			{#if total >= MIN_VOTES_FOR_TIER}
				<span class="w-11 shrink-0 text-right text-sm font-semibold {tier.accent}">{shitScore}%</span>
			{:else}
				<span class="w-11 shrink-0 text-right text-sm text-neutral-500" title={t(L, 'tier.early')}>{shitScore}%</span>
			{/if}
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

<section class="mb-8 grid gap-8 sm:grid-cols-2">
	<div>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'home.hot')}</h2>
		{#if data.hot.length === 0}
			<p class="text-sm text-neutral-600">—</p>
		{:else}
			<ol class="divide-y divide-neutral-900 rounded-lg border border-neutral-900">
				{#each data.hot.slice(0, 6) as r, i (r.target)}{@render row(r.target, r.total, r.shitScore, i, t(L, 'home.today', { n: r.last24h }))}{/each}
			</ol>
		{/if}
	</div>
	<div>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">📸 {t(L, 'home.latestBs')}</h2>
		{#if data.bullshits.length === 0}
			<p class="text-sm text-neutral-600">{t(L, 'bs.wallEmpty')}</p>
		{:else}
			<div class="flex gap-3 overflow-x-auto pb-2">
				{#each data.bullshits as b, i (b.id)}
					<a href="/@{b.target}" class="w-28 shrink-0 rounded-sm bg-[#f5f5f0] p-1 shadow-lg transition hover:scale-105" style="transform: rotate({((i * 7) % 5) - 2}deg)">
						<img src={b.url} alt="" class="w-full" loading="lazy" />
						<div class="truncate px-0.5 pt-0.5 text-[9px] text-neutral-600">@{b.target}</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>


<section class="grid gap-8 sm:grid-cols-2">
	{@render board(t(L, 'home.mostShit'), data.shit, t(L, 'home.emptyShit'))}
	{@render board(t(L, 'home.mostGoat'), data.goat, t(L, 'home.emptyGoat'))}
</section>

{#if data.feed.length > 0}
	<LiveFeed locale={L} initial={data.feed.map((f) => ({ voter: f.voterHandle, target: f.target, emoji: f.emoji, at: f.at }))} />
{/if}
