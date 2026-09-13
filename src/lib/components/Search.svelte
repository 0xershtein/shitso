<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { t, type Locale } from '$lib/i18n';
	import { normalizeHandle } from '$lib/emojis';
	import { getRecent, pushRecent, clearRecent } from '$lib/recent';

	let { locale, popular = [] }: { locale: Locale; popular?: { handle: string; total: number; shitScore: number; tier: string }[] } = $props();
	const L = $derived(locale);

	type Item = { handle: string; total?: number; shitScore?: number; tier?: string };
	let q = $state('');
	let open = $state(false);
	let recent = $state<string[]>([]);
	let results = $state<Item[]>([]);
	let active = $state(-1);
	let error = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let input: HTMLInputElement | undefined = $state();

	onMount(() => (recent = getRecent()));

	const cleaned = $derived(q.trim().replace(/^@/, '').toLowerCase());
	const recentItems = $derived(recent.filter((h) => !cleaned || h.startsWith(cleaned)).map((h) => ({ handle: h })));
	const list = $derived.by((): { group: 'recent' | 'results' | 'popular'; items: Item[] }[] => {
		const groups = [];
		if (recentItems.length) groups.push({ group: 'recent' as const, items: recentItems });
		if (cleaned && results.length) groups.push({ group: 'results' as const, items: results.filter((r) => !recent.includes(r.handle)) });
		if (!cleaned && popular.length) groups.push({ group: 'popular' as const, items: popular.filter((p) => !recent.includes(p.handle)).slice(0, 6) });
		return groups.filter((g) => g.items.length);
	});
	const flat = $derived(list.flatMap((g) => g.items));

	function fetchSuggest() {
		clearTimeout(timer);
		if (!cleaned) {
			results = [];
			return;
		}
		timer = setTimeout(async () => {
			try {
				const r = await fetch(`/api/v1/suggest?q=${encodeURIComponent(cleaned)}`);
				const body = await r.json();
				if (body.results) results = body.results;
			} catch {
				/* ignore */
			}
		}, 120);
	}

	function go(handle: string) {
		const h = normalizeHandle(handle);
		if (!h) {
			error = t(L, 'home.badHandle');
			return;
		}
		pushRecent(h);
		open = false;
		goto(`/@${h}`);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			open = true;
			active = Math.min(flat.length - 1, active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(-1, active - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (active >= 0 && flat[active]) go(flat[active].handle);
			else go(q);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<svelte:window onclick={(e) => { if (!(e.target as HTMLElement).closest?.('[data-search]')) open = false; }} />

<div class="relative mx-auto max-w-md" data-search>
	<div class="flex gap-2">
		<div class="flex flex-1 items-center rounded-lg border border-neutral-800 bg-neutral-900 px-3 focus-within:border-neutral-600">
			<span class="text-neutral-500">@</span>
			<input
				bind:this={input}
				bind:value={q}
				oninput={() => { open = true; active = -1; error = null; fetchSuggest(); }}
				onfocus={() => (open = true)}
				onkeydown={onKey}
				placeholder={t(L, 'home.placeholder')}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				aria-label="X handle"
				class="w-full bg-transparent px-2 py-3 outline-none placeholder:text-neutral-600"
			/>
		</div>
		<button type="button" onclick={() => go(q)} class="rounded-lg bg-white px-4 font-semibold text-black hover:bg-neutral-200">{t(L, 'home.lookup')}</button>
	</div>
	{#if error}<p class="mt-2 text-sm text-red-400">{error}</p>{/if}

	{#if open && list.length}
		<div class="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 text-left shadow-2xl">
			{#each list as g (g.group)}
				<div class="flex items-center justify-between px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
					<span>{t(L, `search.${g.group}`)}</span>
					{#if g.group === 'recent'}
						<button type="button" onclick={() => { clearRecent(); recent = []; }} class="normal-case tracking-normal text-neutral-600 hover:text-neutral-300">{t(L, 'search.clear')}</button>
					{/if}
				</div>
				{#each g.items as it (g.group + it.handle)}
					{@const idx = flat.indexOf(it)}
					<button
						type="button"
						onmousedown={(e) => e.preventDefault()}
						onclick={() => go(it.handle)}
						onmouseenter={() => (active = idx)}
						class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm {active === idx ? 'bg-neutral-900' : ''}"
					>
						<img src="/avatar/{it.handle}" alt="" class="size-6 rounded-full bg-neutral-800" loading="lazy" />
						<span class="min-w-0 flex-1 truncate">@{it.handle}</span>
						{#if it.total !== undefined}
							<span class="text-xs text-neutral-500">{t(L, 'home.votes', { n: it.total })}</span>
							<span class="w-10 text-right text-xs font-semibold {(it.shitScore ?? 0) >= 50 ? 'text-amber-400' : 'text-emerald-400'}">{it.shitScore}%</span>
						{/if}
					</button>
				{/each}
			{/each}
		</div>
	{/if}
</div>
