<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { emojiByKey } from '$lib/emojis';
	import { ago, t, type Locale } from '$lib/i18n';

	type Item = { voter: string | null; target: string; emoji: string; at: Date | string };
	let { initial, locale }: { initial: Item[]; locale: Locale } = $props();
	const L = $derived(locale);

	const key = (i: Item) => `${i.voter ?? '?'}|${i.target}|${new Date(i.at).getTime()}`;
	// svelte-ignore state_referenced_locally
	let items = $state<(Item & { k: string })[]>(initial.map((i) => ({ ...i, k: key(i) })));
	let now = $state(Date.now());
	let fresh = $state<Set<string>>(new Set());

	async function poll() {
		if (document.hidden) return;
		try {
			const r = await fetch('/api/v1/feed');
			const body = (await r.json()) as { items: Item[] };
			const known = new Set(items.map((i) => i.k));
			const incoming = body.items.map((i) => ({ ...i, k: key(i) }));
			const added = incoming.filter((i) => !known.has(i.k)).map((i) => i.k);
			if (added.length) {
				fresh = new Set(added);
				items = incoming.slice(0, 12);
				setTimeout(() => (fresh = new Set()), 2500);
			}
		} catch {
			/* next tick */
		}
	}

	onMount(() => {
		const p = setInterval(poll, 12_000);
		const c = setInterval(() => (now = Date.now()), 30_000);
		return () => {
			clearInterval(p);
			clearInterval(c);
		};
	});
</script>

<section class="mt-10">
	<h2 class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
		<span class="relative flex size-2">
			<span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
			<span class="relative inline-flex size-2 rounded-full bg-emerald-400"></span>
		</span>
		{t(L, 'home.live')}
	</h2>
	<ul class="divide-y divide-neutral-900 overflow-hidden rounded-lg border border-neutral-900">
		{#each items as f (f.k)}
			{@const e = emojiByKey(f.emoji)}
			<li
				animate:flip={{ duration: 350 }}
				in:fly={{ y: -16, duration: 350 }}
				class="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-1000 {fresh.has(f.k) ? 'bg-emerald-950/40' : ''}"
			>
				{#if f.voter}
					<a href="/@{f.voter}" class="flex min-w-0 items-center gap-2 hover:underline">
						<img src="/avatar/{f.voter}" alt="" class="size-6 shrink-0 rounded-full bg-neutral-800" loading="lazy" />
						<span class="truncate text-neutral-300">@{f.voter}</span>
					</a>
				{:else}
					<span class="flex items-center gap-2 text-neutral-500"><span class="size-6 rounded-full bg-neutral-800"></span>{t(L, 'home.someone')}</span>
				{/if}
				<span class="flex shrink-0 items-center gap-1 px-1 text-neutral-600">
					<span class="h-px w-3 bg-neutral-700"></span>
					<span class="text-xl leading-none" title={e ? t(L, `emoji.${e.key}`) : ''}>{e?.char ?? '❓'}</span>
					<span class="h-px w-3 bg-neutral-700"></span>
					<span class="text-[10px]">→</span>
				</span>
				<a href="/@{f.target}" class="flex min-w-0 flex-1 items-center gap-2 hover:underline">
					<img src="/avatar/{f.target}" alt="" class="size-6 shrink-0 rounded-full bg-neutral-800" loading="lazy" />
					<span class="truncate font-semibold text-neutral-200">@{f.target}</span>
				</a>
				<span class="shrink-0 text-[11px] text-neutral-600">{(void now, ago(L, f.at, true))}</span>
			</li>
		{/each}
	</ul>
</section>
