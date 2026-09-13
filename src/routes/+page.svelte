<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { tierFor, MIN_VOTES_FOR_TIER } from '$lib/tiers';
	import { ago, t } from '$lib/i18n';
	import Search from '$lib/components/Search.svelte';

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

<section class="py-10 text-center">
	<h1 class="text-4xl font-black tracking-tight sm:text-5xl" lang="en">{t(L, 'home.title')}</h1>
	<p class="mx-auto mt-3 max-w-md text-neutral-400">{t(L, 'home.sub')}</p>
	<p class="mx-auto mt-4 inline-flex max-w-md items-center gap-2 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-300">
		<span class="text-lg">🎁</span>{t(L, 'home.gift')}
	</p>

	<p class="mt-2 text-xs text-neutral-500"><a href="/extension" class="underline hover:text-neutral-300">🧩 {t(L, 'ext.sub').split('.')[0]}</a></p>
	<div class="mt-8">
		<Search locale={L} popular={(data.hot.length ? data.hot : data.shit).map((r) => ({ handle: r.target, total: r.total, shitScore: r.shitScore, tier: tierFor(r.shitScore, r.total).key }))} />
	</div>

	<div class="mt-6 flex flex-wrap justify-center gap-1 text-2xl">
		{#each EMOJIS as e (e.key)}<span title={t(L, `emoji.${e.key}`)}>{e.char}</span>{/each}
	</div>
	<p class="mt-2 text-xs text-neutral-600">{t(L, 'home.stats', { votes: data.stats.votes, targets: data.stats.targets })}</p>
</section>

{#snippet row(target: string, total: number, shitScore: number, i: number, right: string | undefined = undefined)}
	{@const tier = tierFor(shitScore, total)}
	<li>
		<a href="/@{target}" class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-900">
			<span class="w-5 text-right text-xs text-neutral-600">{i + 1}</span>
			<img src="/avatar/{target}" alt="" class="size-7 rounded-full bg-neutral-800" loading="lazy" />
			<span class="min-w-0 flex-1 truncate">@{target}</span>
			<span class="hidden shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold md:inline {tier.badge}">{tier.emoji} {t(L, `tier.${tier.key}.label`)}</span>
			<span class="shrink-0 text-xs text-neutral-500">{right ?? t(L, 'home.votes', { n: total })}</span>
			{#if total >= MIN_VOTES_FOR_TIER}
				<span class="w-11 shrink-0 text-right text-sm font-semibold {tier.accent}">{shitScore}%</span>
			{:else}
				<span class="w-11 shrink-0 text-right text-xs text-neutral-600" title={t(L, 'profile.tierPending')}>—</span>
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

{#if data.bullshits.length > 0}
	<section class="mb-8">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">📸 {t(L, 'home.latestBs')}</h2>
		<div class="flex gap-4 overflow-x-auto pb-3">
			{#each data.bullshits as b, i (b.id)}
				<a href="/@{b.target}" class="w-36 shrink-0 rounded-sm bg-[#f5f5f0] p-1.5 shadow-lg transition hover:scale-105" style="transform: rotate({((i * 7) % 5) - 2}deg)">
					<img src={b.url} alt="" class="w-full" loading="lazy" />
					<div class="truncate px-0.5 pt-1 text-[10px] text-neutral-600">{b.voterHandle ? `@${b.voterHandle}` : '?'} → @{b.target}</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if data.hot.length > 0}
	<section class="mb-8">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'home.hot')}</h2>
		<ol class="divide-y divide-neutral-900 rounded-lg border border-neutral-900">
			{#each data.hot as r, i (r.target)}{@render row(r.target, r.total, r.shitScore, i, t(L, 'home.today', { n: r.last24h }))}{/each}
		</ol>
	</section>
{/if}

<section class="grid gap-8 sm:grid-cols-2">
	{@render board(t(L, 'home.mostShit'), data.shit, t(L, 'home.emptyShit'))}
	{@render board(t(L, 'home.mostGoat'), data.goat, t(L, 'home.emptyGoat'))}
</section>

{#if data.feed.length > 0}
	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'home.live')}</h2>
		<ul class="space-y-1 text-sm">
			{#each data.feed as f, i (i)}
				{@const e = emojiByKey(f.emoji)}
				<li class="flex items-center gap-2 text-neutral-400">
					<span class="w-8 text-right text-[11px] text-neutral-600">{ago(L, f.at, true)}</span>
					<span class="text-neutral-300">{f.voterHandle ? `@${f.voterHandle}` : t(L, 'home.someone')}</span>
					<span>{t(L, 'home.gave')}</span>
					<span class="text-lg leading-none" title={e ? t(L, `emoji.${e.key}`) : ''}>{e?.char ?? '❓'}</span>
					<span>{t(L, 'home.to')}</span>
					<a href="/@{f.target}" class="font-semibold text-neutral-200 hover:underline">@{f.target}</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
