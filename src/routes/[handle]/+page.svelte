<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMOJIS, emojiByKey } from '$lib/emojis';
	import { MIN_VOTES_FOR_TIER, isProvisional } from '$lib/tiers';
	import { MIN_FOLLOWERS, MIN_ACCOUNT_AGE_DAYS } from '$lib/eligibility';
	import { ago, t } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';
	import BullshitCam from '$lib/components/BullshitCam.svelte';
	import QuadrantMap from '$lib/components/QuadrantMap.svelte';
	import Pulse from '$lib/components/Pulse.svelte';
	import Ambient from '$lib/components/Ambient.svelte';
	import { onMount } from 'svelte';
	import { pushRecent } from '$lib/recent';

	let { data, form } = $props();
	const L = $derived(data.locale);

	let pending = $state<string | null>(null);
	let optimistic = $state<string | null>(null);
	let camOpen = $state(false);
	onMount(() => pushRecent(data.handle));
	let reported = $state<Set<number>>(new Set());
	let wallBusy = $state(false);

	async function bsAction(body: Record<string, unknown>) {
		wallBusy = true;
		try {
			await fetch('/api/bullshit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
			await invalidateAll();
		} finally {
			wallBusy = false;
		}
	}
	async function reportBs(id: number) {
		reported = new Set([...reported, id]);
		await fetch('/api/bullshit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'report', id }) });
	} // selected emoji shown before the server confirms
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
	const VERDICT: Record<string, string> = {
		respected: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200',
		questionable: 'border-yellow-500/50 bg-yellow-950/50 text-yellow-200',
		certified: 'border-amber-500/50 bg-amber-950/50 text-amber-200',
		biohazard: 'border-red-500/50 bg-red-950/50 text-red-200'
	};
	const VERDICT_ICON: Record<string, string> = { respected: '✅', questionable: '🤔', certified: '⚠️', biohazard: '🚫' };
	const BAD_SHADES = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-rose-400'];
	const GOOD_SHADES = ['bg-teal-400', 'bg-emerald-500', 'bg-green-500', 'bg-cyan-400', 'bg-sky-400'];
	function shade(e: { key: string; tone: string }) {
		const list = EMOJIS.filter((x) => x.tone === e.tone);
		const i = list.findIndex((x) => x.key === e.key);
		return e.tone === 'bad' ? BAD_SHADES[i % BAD_SHADES.length] : GOOD_SHADES[i % GOOD_SHADES.length];
	}
	const QUAD: Record<string, string> = {
		admiration: 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200',
		envy: 'border-yellow-500/60 bg-yellow-950/70 text-yellow-200',
		pity: 'border-sky-500/60 bg-sky-950/70 text-sky-200',
		contempt: 'border-red-500/60 bg-red-950/70 text-red-200'
	};
	const rated = $derived(data.tally.total > 0);
	const early = $derived(isProvisional(data.tally.total));
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
	<title>@{data.handle} · {rated ? `${data.tally.shitScore}% shit · ${tierLabel}` : t(L, 'profile.tierPending')} · shit.so</title>
	<meta name="description" content="@{data.handle}: {data.tally.shitScore}% shit, {data.tally.total} votes, {t('en', `tier.${data.tier.key}.label`)}. give yours on shit.so." />
	<link rel="canonical" href="https://shit.so/@{data.handle}" />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content="https://shit.so/@{data.handle}" />
	<meta property="og:title" content="@{data.handle} is {data.tally.shitScore}% shit {data.tier.emoji}" />
	<meta property="og:description" content="{data.tally.total} people gave a shit. tier: {t('en', `tier.${data.tier.key}.label`)}. give yours on shit.so" />
	<meta property="og:image" content="{data.origin}/@{data.handle}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{data.origin}/@{data.handle}/og.png" />
</svelte:head>

<div class="pointer-events-none fixed inset-0 -z-10 {data.tier.bg}"></div>



<section class="relative flex items-center gap-4 py-6">
	{#if rated}<Ambient tier={data.tier.key} seed={data.handle} />{/if}
	<div class="relative shrink-0">
		<img
			src="/avatar/{data.handle}"
			alt=""
			class="size-20 rounded-full bg-neutral-800 ring-4 {data.tier.ring} {data.tier.key === 'biohazard' ? 'grayscale' : ''}"
		/>
		{#if rated && data.tier.stamp}
			<span class="absolute -right-4 -bottom-2 rotate-[-12deg] rounded border-2 bg-neutral-950/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest {data.tier.stamp}" lang="en">{t('en', `tier.${data.tier.key}.label`)}</span>
		{/if}
	</div>
	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="truncate text-2xl font-black">@{data.handle}</h1>
			<span class="rounded-full border px-2 py-0.5 text-xs font-semibold {data.tier.badge}">{data.tier.emoji} {tierLabel}{#if early}<span class="ml-1 font-normal opacity-70">· {t(L, 'tier.early')}</span>{/if}</span>
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
		{#if rated && data.read.quadrant}
			<span class="mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold {QUAD[data.read.quadrant]}">
				<span class="size-1.5 rounded-full bg-current"></span>{t(L, `read.q.${data.read.quadrant}`)}
			</span>
		{/if}
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
		{#if data.tally.total > 0}
			<p class="mt-1 text-xs text-neutral-500">{t(L, `tier.${data.tier.key}.blurb`)}{#if early} {t(L, 'profile.moreVotes', { n: MIN_VOTES_FOR_TIER - data.tally.total, votes: votesWord(MIN_VOTES_FOR_TIER - data.tally.total) })}{/if}</p>
		{/if}
	</div>
</section>

{#if rated}
	<div class="mb-6 flex items-center gap-4 rounded-xl border px-5 py-4 {VERDICT[data.tier.key] ?? 'border-neutral-800 bg-neutral-900 text-neutral-200'}">
		<span class="text-4xl leading-none">{VERDICT_ICON[data.tier.key] ?? '❓'}</span>
		<div class="min-w-0 flex-1">
			<div class="text-2xl font-black leading-tight">{t(L, `verdict.${data.tier.key}`)}</div>
			<div class="text-sm opacity-80">{t(L, `verdict.${data.tier.key}.d`)}{#if early} · {t(L, 'verdict.early', { n: data.tally.total, min: MIN_VOTES_FOR_TIER })}{/if}</div>
		</div>
		<div class="hidden shrink-0 text-right sm:block">
			<div class="text-3xl font-black tabular-nums">{100 - data.tally.shitScore}%</div>
			<div class="text-[10px] uppercase tracking-wider opacity-70">{t(L, 'breakdown.good')}</div>
		</div>
	</div>
{/if}

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
		{t(L, 'profile.give')}
	</h2>

	{#if data.isSelf}
		<p class="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">{t(L, 'profile.self')}</p>
	{:else}
		{#snippet bullshitTile(cls: string)}
			{@const canSnap = !!(mine && data.eligible?.ok)}
			<button
				type="button"
				onclick={() => {
					if (!data.session?.user) location.href = `/signin?redirectTo=/@${data.handle}`;
					else if (canSnap) camOpen = true;
				}}
				disabled={!!data.session?.user && !canSnap}
				title={canSnap ? t(L, 'bs.button') : t(L, 'bs.voteFirst')}
				class="{cls} flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center transition
					{canSnap
					? 'border-neutral-500 bg-neutral-900/60 hover:border-white hover:bg-neutral-800 cursor-pointer'
					: 'border-neutral-800 bg-neutral-950/40 text-neutral-600 cursor-not-allowed'}"
			>
				<span class="text-4xl sm:text-5xl {canSnap ? '' : 'grayscale opacity-60'}">📸</span>
				<span class="text-xs font-bold leading-tight sm:text-sm">{t(L, 'bs.button')}</span>
				{#if !canSnap}
					<span class="text-[10px] leading-tight text-neutral-500">{data.session?.user ? t(L, 'bs.voteFirst') : t(L, 'elig.signin')}</span>
				{/if}
			</button>
		{/snippet}

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
			class="grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-3"
		>
			{#each EMOJIS as e, i (e.key)}
				{@const active = mine === e.key}
				{@const label = t(L, `emoji.${e.key}`)}
				{#if i === 5}
					{@render bullshitTile('hidden sm:flex sm:col-start-6 sm:row-start-1 sm:row-span-2')}
				{/if}
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
					<span class="max-w-full truncate px-1 text-[10px] sm:text-xs {active ? 'text-neutral-700' : 'text-neutral-500'}">{label}</span>
				</button>
			{/each}
			{#if mine}
				<button name="emoji" value="none" class="col-span-5 mt-1 text-left text-xs text-neutral-500 underline hover:text-neutral-300">{t(L, 'profile.remove')}</button>
			{/if}
		</form>
		{#if !data.session?.user}
			<p class="mt-2 text-xs text-neutral-500">{t(L, 'profile.signinHint', { f: MIN_FOLLOWERS, d: MIN_ACCOUNT_AGE_DAYS })}</p>
		{:else if data.eligible && !data.eligible.ok}
			<p class="mt-2 text-xs text-amber-400">{t(L, data.eligible.key, data.eligible.vars)}</p>
		{/if}
		<div class="mt-2 sm:hidden">
			{@render bullshitTile('flex h-28 w-full')}
		</div>
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
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'voters.title')} · {data.voters.length}</h2>
		{#if data.voters.length === 0}
			<p class="text-sm text-neutral-600">{t(L, 'voters.empty')}</p>
		{:else}
			<ul class="flex flex-wrap gap-2">
				{#each data.voters as v (v.handle)}
					{@const e = emojiByKey(v.emoji)}
					<li>
						<a href="/@{v.handle}" title="@{v.handle} · {e ? t(L, `emoji.${e.key}`) : ''} · {ago(L, v.at)}" class="group flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/60 py-1 pr-3 pl-1 text-xs hover:border-neutral-600">
							<span class="relative">
								<img src="/avatar/{v.handle}" alt="" class="size-7 rounded-full bg-neutral-800" loading="lazy" />
								<span class="absolute -right-1.5 -bottom-1.5 rounded-full bg-neutral-950 px-0.5 text-sm leading-none">{e?.char ?? '❓'}</span>
							</span>
							<span class="max-w-28 truncate text-neutral-300 group-hover:text-white">@{v.handle}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-10">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">📸 {t(L, 'bs.wall')}</h2>
			{#if data.isSelf}
				<button
					onclick={() => bsAction({ handle: data.handle, action: data.wallHidden ? 'show' : 'hide' })}
					disabled={wallBusy}
					class="text-xs text-neutral-500 underline hover:text-neutral-300 disabled:opacity-50"
				>
					{data.wallHidden ? t(L, 'bs.show') : t(L, 'bs.hide')}
				</button>
			{/if}
		</div>
		{#if data.isSelf && data.wallHidden}
			<p class="text-sm text-neutral-500">{t(L, 'bs.hiddenNote')}</p>
		{:else if data.wall.length === 0}
			{#if !data.wallHidden}<p class="text-sm text-neutral-600">{t(L, 'bs.wallEmpty')}</p>{/if}
		{:else}
			<div class="flex gap-4 overflow-x-auto pb-3">
				{#each data.wall as b, i (b.id)}
					<figure class="w-40 shrink-0 rounded-sm bg-[#f5f5f0] p-1.5 shadow-lg" style="transform: rotate({((i * 7) % 5) - 2}deg)">
						<div class="relative">
							<img src={b.url} alt="" class="w-full" loading="lazy" />
							{#if b.status === 'pending'}
								<span class="absolute top-2 left-0 bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">{t(L, 'bs.pending')}</span>
							{/if}
						</div>
						<figcaption class="flex flex-col gap-0.5 px-0.5 pt-1 text-[10px] text-neutral-600">
							<span class="truncate">{b.voterHandle ? `@${b.voterHandle}` : '?'} · {ago(L, b.createdAt, true)}</span>
							{#if b.mine}
								<button onclick={() => bsAction({ handle: data.handle, action: 'delete' })} disabled={wallBusy} class="self-start text-red-700 hover:underline">{t(L, 'bs.delete')}</button>
							{:else if data.session?.user}
								<button onclick={() => reportBs(b.id)} disabled={reported.has(b.id)} class="self-start hover:underline disabled:opacity-60">{reported.has(b.id) ? t(L, 'bs.reported') : t(L, 'bs.report')}</button>
							{/if}
						</figcaption>
					</figure>
				{/each}
			</div>
		{/if}
	</section>

	<section class="mt-10">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'read.title')}</h2>
		{#if !data.read.ready}
			<p class="text-sm text-neutral-500">{t(L, 'read.pending', { n: 1 })}</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
				<div>
					<QuadrantMap warmth={data.read.axes.warmth} competence={data.read.axes.competence} quadrant={data.read.quadrant} locale={L} />
					<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
						{#each ['dominance', 'honesty'] as axis (axis)}
							{@const v = data.read.axes[axis as keyof typeof data.read.axes]}
							<div>
								<div class="mb-1 flex justify-between text-[10px] text-neutral-500">
									<span>{t(L, `read.${axis}.lo`)}</span>
									<span class="font-semibold uppercase tracking-wider text-neutral-400">{t(L, `read.${axis}`)}</span>
									<span>{t(L, `read.${axis}.hi`)}</span>
								</div>
								<div class="relative h-1.5 rounded bg-neutral-900">
									<div class="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-700"></div>
									<div class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neutral-950 {v < 0 ? 'bg-amber-400' : 'bg-emerald-400'}" style="left: {50 + v * 50}%"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="flex flex-col justify-between rounded-lg border border-neutral-900 bg-neutral-950/60 p-5">
					<div>
						{#if early}<div class="mb-2 inline-block rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">{t(L, 'tier.early')} · {data.tally.total}/{MIN_VOTES_FOR_TIER}</div>{/if}
						<div class="text-[11px] uppercase tracking-wider text-neutral-500">{t(L, 'read.quadrant')}</div>
						<div class="mt-1 text-lg font-bold {data.tier.accent}">{t(L, `read.q.${data.read.quadrant}`)}</div>
						<div class="mt-4 text-[11px] uppercase tracking-wider text-neutral-500">{t(L, 'read.archetype')}</div>
						<div class="mt-1 text-3xl font-black">{t(L, `read.a.${data.read.archetype}`)}</div>
						<p class="mt-2 text-sm leading-relaxed text-neutral-400">{t(L, `read.a.${data.read.archetype}.d`)}</p>
						<p class="mt-3 text-xs text-neutral-500">
							{t(L, 'read.because')}
							{#each data.read.evidence as ev, i (ev.key)}
								{i > 0 ? ' · ' : ' '}{emojiByKey(ev.key)?.char} {Math.round(ev.share * 100)}%
							{/each}
						</p>
					</div>
					<a href={data.read.source.url} target="_blank" rel="noopener" class="mt-5 text-[11px] text-neutral-500 underline decoration-neutral-800 hover:text-neutral-300">
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
		<div class="rounded-lg border border-neutral-900 bg-neutral-950/60 px-2 pt-2">
			<Pulse days={data.rhythm} trendUp={typeof trend === 'number' ? trend >= 0 : trend === 'new'} />
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
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'profile.breakdown')}</h2>
			<p class="text-xs text-neutral-500">
				<span class="font-bold text-amber-400">{data.tally.shitScore}%</span> {t(L, 'breakdown.bad')} ·
				<span class="font-bold text-emerald-400">{100 - data.tally.shitScore}%</span> {t(L, 'breakdown.good')}
			</p>
		</div>
		<div class="flex h-4 w-full overflow-hidden rounded-full bg-neutral-900">
			{#each EMOJIS as e (e.key)}
				{@const n = data.tally.counts[e.key] ?? 0}
				{#if n > 0}
					<div class="{shade(e)} transition-all" style="width: {(n / data.tally.total) * 100}%" title="{e.char} {t(L, `emoji.${e.key}`)} · {n}"></div>
				{/if}
			{/each}
		</div>
		<div class="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
			{#each ['bad', 'good'] as tone (tone)}
				<div>
					<div class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider {tone === 'bad' ? 'text-amber-500' : 'text-emerald-500'}">{t(L, `breakdown.${tone}`)}</div>
					{#each EMOJIS.filter((e) => e.tone === tone) as e (e.key)}
						{@const n = data.tally.counts[e.key] ?? 0}
						{@const pct = data.tally.total ? Math.round((n / data.tally.total) * 100) : 0}
						<div class="flex items-center gap-2 py-0.5 text-sm {n === 0 ? 'opacity-40' : ''}">
							<span class="w-7 text-center text-xl leading-none">{e.char}</span>
							<span class="w-24 truncate text-neutral-300">{t(L, `emoji.${e.key}`)}</span>
							<div class="h-1.5 flex-1 overflow-hidden rounded bg-neutral-900">
								<div class="h-full {shade(e)}" style="width: {pct}%"></div>
							</div>
							<span class="w-10 text-right tabular-nums text-neutral-400">{pct}%</span>
							<span class="w-6 text-right text-xs tabular-nums text-neutral-600">{n}</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
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

{#if camOpen}
	<BullshitCam
		handle={data.handle}
		emojiChar={emojiByKey(mine ?? '')?.char ?? '💩'}
		locale={L}
		ttlDays={data.bullshitTtlDays}
		onclose={() => (camOpen = false)}
		ondone={() => invalidateAll()}
	/>
{/if}

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
