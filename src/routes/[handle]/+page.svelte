<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { MIN_VOTES_FOR_TIER } from '$lib/tiers';
	import { MIN_FOLLOWERS, MIN_ACCOUNT_AGE_DAYS } from '$lib/eligibility';
	import { ago, t } from '$lib/i18n';

	let { data, form } = $props();
	const L = $derived(data.locale);

	let pending = $state<string | null>(null);
	let optimistic = $state<string | null>(null); // selected emoji shown before the server confirms
	const mine = $derived(optimistic ?? data.mine);
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
	const tierLabel = $derived(t(L, `tier.${data.tier.key}.label`));
	const rated = $derived(data.tally.total >= MIN_VOTES_FOR_TIER);
	const shareText = $derived(
		rated
			? t(L, 'profile.shareRated', {
					h: data.handle,
					e: data.tier.emoji,
					tier: tierLabel,
					pct: data.tally.shitScore,
					n: data.tally.total,
					url: `https://shit.so/@${data.handle}`
				})
			: t(L, 'profile.shareUnrated', { h: data.handle, url: `https://shit.so/@${data.handle}` })
	);
	const votesWord = (n: number) => t(L, n === 1 ? 'profile.vote' : 'profile.votes');
	const fmt = (n: number) => new Intl.NumberFormat(L === 'tr' ? 'tr-TR' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

	// Emoji burst: particles fly out from behind the clicked button.
	let burstLayer: HTMLDivElement | undefined = $state();
	function burst(btn: HTMLElement, char: string) {
		if (!burstLayer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const r = btn.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		for (let i = 0; i < 14; i++) {
			const p = document.createElement('span');
			p.className = 'burst';
			p.textContent = char;
			const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.6;
			const dist = 70 + Math.random() * 90;
			p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
			p.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
			p.style.setProperty('--rot', `${(Math.random() - 0.5) * 240}deg`);
			p.style.setProperty('--dur', `${650 + Math.random() * 350}ms`);
			p.style.fontSize = `${16 + Math.random() * 16}px`;
			p.style.left = `${cx}px`;
			p.style.top = `${cy}px`;
			burstLayer.appendChild(p);
			p.addEventListener('animationend', () => p.remove(), { once: true });
		}
	}
</script>

<div bind:this={burstLayer} class="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true"></div>

<svelte:head>
	<title>@{data.handle} · {rated ? tierLabel : t(L, 'profile.tierPending')} · shit.so</title>
	<meta property="og:title" content="@{data.handle} is {data.tally.shitScore}% shit {data.tier.emoji}" />
	<meta property="og:description" content="{data.tally.total} people gave a shit. tier: {t('en', `tier.${data.tier.key}.label`)}. give yours on shit.so" />
	<meta property="og:image" content="{data.origin}/@{data.handle}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{data.origin}/@{data.handle}/og.png" />
</svelte:head>

<div class="pointer-events-none fixed inset-0 -z-10 {data.tier.bg}"></div>

{#if data.tier.hasWarning}
	<div
		class="mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm {data.tier.key === 'biohazard'
			? 'border-red-800 bg-red-950/70 text-red-200'
			: 'border-amber-800 bg-amber-950/70 text-amber-200'}"
		role="alert"
	>
		<span class="text-xl leading-none">{data.tier.emoji}</span>
		<p>{t(L, `tier.${data.tier.key}.warning`)}</p>
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
			<span class="rounded-full border px-2 py-0.5 text-xs font-semibold {data.tier.badge}">{data.tier.emoji} {tierLabel}</span>
			<a href="https://x.com/{data.handle}" target="_blank" rel="noopener" class="text-xs text-neutral-500 hover:text-neutral-300">{t(L, 'profile.x')}</a>
		</div>
		<p class="mt-1 text-neutral-400">
			{#if data.tally.total === 0}
				{t(L, 'profile.nobody')}
			{:else}
				<span class="text-3xl font-black {data.tier.accent}">{data.tally.shitScore}%</span>
				<span class="text-sm">{t(L, 'profile.shit')} · {data.tally.total} {votesWord(data.tally.total)}</span>
				{#if top}<span class="ml-2 text-sm">{t(L, 'profile.mostly')} {top.char} {t(L, `emoji.${top.key}`)}</span>{/if}
			{/if}
		</p>
		{#if data.profile && data.profile.followers !== null}
			<p class="mt-1 text-xs text-neutral-500">
				{#if data.profile.name}<span class="text-neutral-400">{data.profile.name}</span> · {/if}
				<span class="text-neutral-300">{fmt(data.profile.followers)}</span> {t(L, 'profile.followers')} ·
				<span class="text-neutral-300">{fmt(data.profile.following ?? 0)}</span> {t(L, 'profile.following')}
				{#if data.tally.total > 0 && data.profile.followers > data.tally.total}
					· {t(L, 'profile.careRate', { n: fmt(Math.round(data.profile.followers / data.tally.total)) })}
				{/if}
			</p>
		{/if}
		{#if data.tally.total > 0 && !rated}
			<p class="mt-1 text-xs text-neutral-500">{t(L, 'profile.moreVotes', { n: MIN_VOTES_FOR_TIER - data.tally.total, votes: votesWord(MIN_VOTES_FOR_TIER - data.tally.total) })}</p>
		{:else if data.tally.total > 0}
			<p class="mt-1 text-xs text-neutral-500">{t(L, `tier.${data.tier.key}.blurb`)}</p>
		{/if}
	</div>
</section>

{#if data.gif}
	<figure class="mb-6 overflow-hidden rounded-lg border border-neutral-900 bg-neutral-900">
		<img src={data.gif.url} alt={data.gif.title} class="mx-auto max-h-56" loading="lazy" />
		<figcaption class="flex justify-end px-3 py-1.5 text-[11px] text-neutral-500">
			<a href={data.gif.page} target="_blank" rel="noopener" class="hover:text-neutral-300">via {data.gif.via}</a>
		</figcaption>
	</figure>
{/if}

<section class="mt-2">
	<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500" lang={data.mine ? L : 'en'}>
		{mine ? t(L, 'profile.yours') : t(L, 'profile.give')}
	</h2>

	{#if data.isSelf}
		<p class="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">{t(L, 'profile.self')}</p>
	{:else}
		<form
			method="POST"
			action="?/vote"
			use:enhance={({ formData, submitter }) => {
				const key = String(formData.get('emoji'));
				pending = key;
				optimistic = key === 'none' ? null : key;
				const char = emojiByKey(key)?.char;
				if (submitter && char) burst(submitter as HTMLElement, char);
				return async ({ update }) => {
					await update();
					pending = null;
					optimistic = null;
				};
			}}
			class="grid grid-cols-5 gap-2 sm:gap-3"
		>
			{#each EMOJIS as e (e.key)}
				{@const active = mine === e.key}
				{@const label = t(L, `emoji.${e.key}`)}
				<button
					name="emoji"
					value={e.key}
					disabled={pending !== null}
					class="emoji-btn relative flex flex-col items-center gap-1.5 rounded-xl border py-4 transition sm:py-5
						{active ? 'border-white bg-neutral-100 text-black' : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-500 hover:bg-neutral-800/80'}
						{pending === e.key ? 'is-pending' : ''}"
					title={label}
				>
					<span class="emoji-glyph text-3xl sm:text-4xl">{e.char}</span>
					<span class="text-[11px] sm:text-xs {active ? 'text-neutral-700' : 'text-neutral-500'}">{label}</span>
				</button>
			{/each}
			{#if mine}
				<button name="emoji" value="none" class="col-span-5 mt-1 text-xs text-neutral-500 underline hover:text-neutral-300">{t(L, 'profile.remove')}</button>
			{/if}
		</form>
		{#if !data.session?.user}
			<p class="mt-2 text-xs text-neutral-500">{t(L, 'profile.signinHint', { f: MIN_FOLLOWERS, d: MIN_ACCOUNT_AGE_DAYS })}</p>
		{:else if data.eligible && !data.eligible.ok}
			<p class="mt-2 text-xs text-amber-400">{t(L, data.eligible.key, data.eligible.vars)}</p>
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
		{@render stat(t(L, 'profile.peopleWhoCare'), data.stats.voters)}
		{@render stat(t(L, 'profile.last24h'), data.stats.last24h, data.stats.prev24h ? t(L, 'profile.dayBefore', { n: data.stats.prev24h }) : undefined)}
		{@render stat(t(L, 'profile.mindChanges'), Math.max(0, data.stats.changes - data.stats.voters), t(L, 'profile.editedOrRemoved'))}
		{@render stat(t(L, 'profile.lastShit'), ago(L, data.stats.lastAt), data.stats.firstAt ? t(L, 'profile.first', { t: ago(L, data.stats.firstAt) }) : undefined)}
	</section>

	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'read.title')}</h2>
		{#if !data.read.ready}
			<p class="text-sm text-neutral-500">{t(L, 'read.pending', { n: MIN_VOTES_FOR_TIER })}</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-[1fr_1.1fr]">
				<div class="space-y-3 rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
					{#each ['warmth', 'competence', 'dominance', 'honesty'] as axis (axis)}
						{@const v = data.read.axes[axis as keyof typeof data.read.axes]}
						<div>
							<div class="mb-1 flex justify-between text-[11px] text-neutral-500">
								<span>{t(L, `read.${axis}.lo`)}</span>
								<span class="font-semibold uppercase tracking-wider text-neutral-400">{t(L, `read.${axis}`)}</span>
								<span>{t(L, `read.${axis}.hi`)}</span>
							</div>
							<div class="relative h-2 rounded bg-neutral-900">
								<div class="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-700"></div>
								<div
									class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neutral-950 {v < 0 ? 'bg-amber-400' : 'bg-emerald-400'}"
									style="left: {50 + v * 50}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
				<div class="flex flex-col justify-between rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
					<div>
						<div class="text-[11px] uppercase tracking-wider text-neutral-500">{t(L, 'read.quadrant')}: <span class="text-neutral-300">{t(L, `read.q.${data.read.quadrant}`)}</span></div>
						<div class="mt-2 text-2xl font-black">{t(L, `read.a.${data.read.archetype}`)}</div>
						<p class="mt-1 text-sm text-neutral-400">{t(L, `read.a.${data.read.archetype}.d`)}</p>
						<p class="mt-3 text-xs text-neutral-500">
							{t(L, 'read.because')}
							{#each data.read.evidence as ev, i (ev.key)}
								{i > 0 ? ' · ' : ' '}{emojiByKey(ev.key)?.char} {Math.round(ev.share * 100)}%
							{/each}
						</p>
					</div>
					<a href={data.read.source.url} target="_blank" rel="noopener" class="mt-4 text-[11px] text-neutral-500 underline decoration-neutral-800 hover:text-neutral-300">
						{t(L, 'read.source')}: {t(L, `read.s.${data.read.source.key}`)}
					</a>
				</div>
			</div>
		{/if}
	</section>

	<section class="mt-10">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'profile.rhythm')}</h2>
			<p class="text-xs text-neutral-400">
				<span class="font-bold text-neutral-200">{perDay}</span> {t(L, 'profile.perDay')}
				{#if trend === 'new'}
					<span class="ml-1 text-emerald-400">{t(L, 'profile.newThisWeek')}</span>
				{:else if typeof trend === 'number'}
					<span class="ml-1 {trend >= 0 ? 'text-amber-400' : 'text-emerald-400'}">{trend >= 0 ? '↑' : '↓'} {t(L, 'profile.vsLastWeek', { pct: Math.abs(trend) })}</span>
				{/if}
			</p>
		</div>
		<div class="flex h-24 items-end gap-1 rounded-lg border border-neutral-900 bg-neutral-950/60 p-3">
			{#each data.rhythm as d (d.day)}
				{@const total = d.bad + d.good}
				<div class="group relative flex h-full flex-1 flex-col justify-end" title="{d.day}: {d.bad} / {d.good}">
					<div class="w-full overflow-hidden rounded-sm" style="height: {(total / rhythmMax) * 100}%">
						<div class="bg-emerald-500" style="height: {total ? (d.good / total) * 100 : 0}%"></div>
						<div class="bg-amber-500" style="height: {total ? (d.bad / total) * 100 : 0}%"></div>
					</div>
					{#if total === 0}<div class="h-px w-full bg-neutral-800"></div>{/if}
				</div>
			{/each}
		</div>
		<div class="mt-1 flex justify-between text-[10px] text-neutral-600">
			<span>{t(L, 'profile.daysAgo')}</span><span>{t(L, 'profile.today')}</span>
		</div>
	</section>

	<section class="mt-10">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'profile.virality')}</h2>
			<p class="text-xs text-neutral-400"><span class="font-bold text-neutral-200">{data.virality.score}</span>/100 · {t(L, `v.${data.virality.label}`)}</p>
		</div>
		<div class="h-3 overflow-hidden rounded-full bg-neutral-900">
			<div class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all" style="width: {data.virality.score}%"></div>
		</div>
		<div class="mt-2 grid grid-cols-4 gap-2 text-[11px] text-neutral-500">
			{#each Object.entries(data.virality.parts) as [k, v] (k)}
				<div><span class="text-neutral-300">{Math.round(v * 100)}</span> {t(L, `v.${k}`)}</div>
			{/each}
		</div>
	</section>

	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'profile.breakdown')}</h2>
		<ul class="space-y-1.5">
			{#each EMOJIS as e (e.key)}
				{@const n = data.tally.counts[e.key] ?? 0}
				<li class="flex items-center gap-3 text-sm">
					<span class="w-6 text-center text-lg" title={t(L, `emoji.${e.key}`)}>{e.char}</span>
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
		class="inline-block rounded-md border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900 hover:text-neutral-200">{t(L, 'profile.share')}</a
	>
</section>

<style>
	:global(.burst) {
		position: absolute;
		transform: translate(-50%, -50%);
		animation: burst var(--dur) cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
		will-change: transform, opacity;
	}
	@keyframes burst {
		0% {
			transform: translate(-50%, -50%) scale(0.4) rotate(0);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.1) rotate(var(--rot));
			opacity: 0;
		}
	}
	.emoji-btn:active .emoji-glyph,
	.emoji-btn.is-pending .emoji-glyph {
		animation: pop 320ms ease-out;
	}
	.emoji-btn:hover .emoji-glyph {
		transform: scale(1.15);
		transition: transform 120ms ease-out;
	}
	@keyframes pop {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.45);
		}
		100% {
			transform: scale(1.15);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.emoji-btn .emoji-glyph {
			animation: none;
			transform: none;
		}
	}
</style>
