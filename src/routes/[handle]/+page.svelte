<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { MIN_VOTES_FOR_TIER } from '$lib/tiers';
	import Reaction from '$lib/components/Reaction.svelte';

	let { data, form } = $props();

	let pending = $state<string | null>(null);
	const top = $derived(data.tally.top ? emojiByKey(data.tally.top) : null);
	const max = $derived(Math.max(1, ...Object.values(data.tally.counts)));
	const rhythmMax = $derived(Math.max(1, ...data.rhythm.map((d) => d.bad + d.good)));
	const perDay = $derived((data.stats.last7d / 7).toFixed(1));
	const trend = $derived(
		data.stats.prev7d === 0
			? data.stats.last7d > 0
				? 'new'
				: 'flat'
			: Math.round(((data.stats.last7d - data.stats.prev7d) / data.stats.prev7d) * 100)
	);
	const shareText = $derived(
		data.tally.total >= MIN_VOTES_FOR_TIER
			? `@${data.handle} is ${data.tier.emoji} ${data.tier.label} (${data.tally.shitScore}% shit, ${data.tally.total} votes). agree? https://shit.so/${data.handle}`
			: `does @${data.handle} deserve a 💩 or a 🐐? give a shit: https://shit.so/${data.handle}`
	);

	function ago(d: Date | null) {
		if (!d) return '—';
		const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return `${Math.floor(s / 86400)}d ago`;
	}
</script>

<svelte:head>
	<title>@{data.handle} is {data.tier.label} · shit.so</title>
	<meta property="og:title" content="@{data.handle} is {data.tally.shitScore}% shit {data.tier.emoji}" />
	<meta property="og:description" content="{data.tally.total} people gave a shit. tier: {data.tier.label}. give yours on shit.so" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:image" content="https://unavatar.io/x/{data.handle}" />
</svelte:head>

<div class="pointer-events-none fixed inset-0 -z-10 {data.tier.bg}"></div>

{#if data.tier.warning}
	<div
		class="mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm {data.tier.key === 'biohazard'
			? 'border-red-800 bg-red-950/70 text-red-200'
			: 'border-amber-800 bg-amber-950/70 text-amber-200'}"
		role="alert"
	>
		<span class="text-xl leading-none">{data.tier.emoji}</span>
		<p>{data.tier.warning}</p>
	</div>
{/if}

<section class="flex items-center gap-4 py-4">
	<img
		src="https://unavatar.io/x/{data.handle}"
		alt=""
		class="size-20 rounded-full bg-neutral-800 ring-4 {data.tier.ring} {data.tier.key === 'biohazard' ? 'grayscale' : ''}"
	/>
	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="truncate text-2xl font-black">@{data.handle}</h1>
			<span class="rounded-full border px-2 py-0.5 text-xs font-semibold {data.tier.badge}">
				{data.tier.emoji} {data.tier.label}
			</span>
			<a href="https://x.com/{data.handle}" target="_blank" rel="noopener" class="text-xs text-neutral-500 hover:text-neutral-300">x ↗</a>
		</div>
		<p class="mt-1 text-neutral-400">
			{#if data.tally.total === 0}
				{data.tier.blurb}
			{:else}
				<span class="text-3xl font-black {data.tier.accent}">{data.tally.shitScore}%</span>
				<span class="text-sm">shit · {data.tally.total} {data.tally.total === 1 ? 'vote' : 'votes'}</span>
				{#if top}<span class="ml-2 text-sm">mostly {top.char} {top.label}</span>{/if}
			{/if}
		</p>
		{#if data.tally.total > 0 && data.tally.total < MIN_VOTES_FOR_TIER}
			<p class="mt-1 text-xs text-neutral-500">{MIN_VOTES_FOR_TIER - data.tally.total} more {MIN_VOTES_FOR_TIER - data.tally.total === 1 ? 'vote' : 'votes'} until a tier is assigned.</p>
		{:else if data.tally.total > 0}
			<p class="mt-1 text-xs text-neutral-500">{data.tier.blurb}</p>
		{/if}
	</div>
</section>

{#if !data.gif && data.tally.total >= MIN_VOTES_FOR_TIER}
	<Reaction tier={data.tier.key} seed={data.handle} />
{/if}

{#if data.gif}
	<figure class="mb-6 overflow-hidden rounded-lg border border-neutral-900 bg-neutral-900">
		<img src={data.gif.url} alt={data.gif.title} class="mx-auto max-h-56" loading="lazy" />
		<figcaption class="flex justify-between px-3 py-1.5 text-[11px] text-neutral-500">
			<span>the internet's reaction</span>
			<a href={data.gif.page} target="_blank" rel="noopener" class="hover:text-neutral-300">via {data.gif.via}</a>
		</figcaption>
	</figure>
{/if}

<section class="mt-2">
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
						{active ? 'border-white bg-neutral-100 text-black' : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-600'}
						{pending === e.key ? 'opacity-50' : ''}"
					title={e.label}
				>
					<span class="text-2xl">{e.char}</span>
					<span class="text-[11px] {active ? 'text-neutral-700' : 'text-neutral-500'}">{e.label}</span>
				</button>
			{/each}
			{#if data.mine}
				<button name="emoji" value="none" class="col-span-5 mt-1 text-xs text-neutral-500 underline hover:text-neutral-300">
					actually, i don't give a shit anymore
				</button>
			{/if}
		</form>
		{#if !data.session?.user}
			<p class="mt-2 text-xs text-neutral-500">you'll be asked to sign in with X first.</p>
		{/if}
		{#if form?.error}<p class="mt-2 text-sm text-red-400">{form.error}</p>{/if}
	{/if}
</section>

{#if data.tally.total > 0}
	<section class="mt-10 grid gap-3 sm:grid-cols-4">
		{#snippet stat(label: string, value: string | number, sub: string | undefined = undefined)}
			<div class="rounded-lg border border-neutral-900 bg-neutral-950/60 p-3">
				<div class="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
				<div class="mt-1 text-xl font-black tabular-nums">{value}</div>
				{#if sub}<div class="text-[11px] text-neutral-500">{sub}</div>{/if}
			</div>
		{/snippet}
		{@render stat('people who care', data.stats.voters)}
		{@render stat('last 24h', data.stats.last24h, data.stats.prev24h ? `${data.stats.prev24h} the day before` : undefined)}
		{@render stat('mind changes', Math.max(0, data.stats.changes - data.stats.voters), 'votes edited or removed')}
		{@render stat('last shit', ago(data.stats.lastAt), data.stats.firstAt ? `first ${ago(data.stats.firstAt)}` : undefined)}
	</section>

	<section class="mt-10">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">shit rhythm</h2>
			<p class="text-xs text-neutral-400">
				<span class="font-bold text-neutral-200">{perDay}</span> shits/day
				{#if trend === 'new'}
					<span class="ml-1 text-emerald-400">new this week</span>
				{:else if typeof trend === 'number'}
					<span class="ml-1 {trend >= 0 ? 'text-amber-400' : 'text-emerald-400'}">{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week</span>
				{/if}
			</p>
		</div>
		<div class="flex h-24 items-end gap-1 rounded-lg border border-neutral-900 bg-neutral-950/60 p-3">
			{#each data.rhythm as d (d.day)}
				{@const total = d.bad + d.good}
				<div class="group relative flex h-full flex-1 flex-col justify-end" title="{d.day}: {d.bad} bad, {d.good} good">
					<div class="w-full overflow-hidden rounded-sm" style="height: {(total / rhythmMax) * 100}%">
						<div class="bg-emerald-500" style="height: {total ? (d.good / total) * 100 : 0}%"></div>
						<div class="bg-amber-500" style="height: {total ? (d.bad / total) * 100 : 0}%"></div>
					</div>
					{#if total === 0}<div class="h-px w-full bg-neutral-800"></div>{/if}
				</div>
			{/each}
		</div>
		<div class="mt-1 flex justify-between text-[10px] text-neutral-600">
			<span>14 days ago</span><span>today</span>
		</div>
	</section>

	<section class="mt-10">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">virality potential</h2>
			<p class="text-xs text-neutral-400"><span class="font-bold text-neutral-200">{data.virality.score}</span>/100 · {data.virality.label}</p>
		</div>
		<div class="h-3 overflow-hidden rounded-full bg-neutral-900">
			<div
				class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all"
				style="width: {data.virality.score}%"
			></div>
		</div>
		<div class="mt-2 grid grid-cols-4 gap-2 text-[11px] text-neutral-500">
			{#each Object.entries(data.virality.parts) as [k, v] (k)}
				<div><span class="text-neutral-300">{Math.round(v * 100)}</span> {k}</div>
			{/each}
		</div>
	</section>

	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">the breakdown</h2>
		<ul class="space-y-1.5">
			{#each EMOJIS as e (e.key)}
				{@const n = data.tally.counts[e.key] ?? 0}
				<li class="flex items-center gap-3 text-sm">
					<span class="w-6 text-center text-lg">{e.char}</span>
					<div class="h-2 flex-1 overflow-hidden rounded bg-neutral-900">
						<div class="h-full {e.tone === 'bad' ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {(n / max) * 100}%"></div>
					</div>
					<span class="w-8 text-right tabular-nums text-neutral-400">{n}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-10 text-sm text-neutral-500">
	<a
		href="https://x.com/intent/post?text={encodeURIComponent(shareText)}"
		target="_blank"
		rel="noopener"
		class="inline-block rounded-md border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900 hover:text-neutral-200">share this on X</a
	>
</section>
