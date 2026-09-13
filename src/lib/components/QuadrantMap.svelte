<script lang="ts">
	import type { Quadrant } from '$lib/read';
	import { t, type Locale } from '$lib/i18n';

	let { warmth, competence, quadrant, locale }: { warmth: number; competence: number; quadrant: Quadrant | null; locale: Locale } = $props();

	// x: cold → warm, y: clueless → capable (top)
	const x = $derived(50 + warmth * 48);
	const y = $derived(50 - competence * 48);
	const corners: { q: Quadrant; cls: string; tint: string }[] = [
		{ q: 'envy', cls: 'top-2 left-2', tint: 'bg-yellow-400/15' },
		{ q: 'admiration', cls: 'top-2 right-2 text-right', tint: 'bg-emerald-400/15' },
		{ q: 'contempt', cls: 'bottom-2 left-2', tint: 'bg-red-400/15' },
		{ q: 'pity', cls: 'bottom-2 right-2 text-right', tint: 'bg-sky-400/15' }
	];
	const quadCls: Record<Quadrant, string> = {
		envy: 'top-0 left-0',
		admiration: 'top-0 right-0',
		contempt: 'bottom-0 left-0',
		pity: 'bottom-0 right-0'
	};
</script>

<div class="relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950/60">
	{#if quadrant}
		<div class="absolute size-1/2 {quadCls[quadrant]} {corners.find((c) => c.q === quadrant)?.tint}"></div>
	{/if}
	<div class="absolute inset-y-0 left-1/2 w-px bg-neutral-800"></div>
	<div class="absolute inset-x-0 top-1/2 h-px bg-neutral-800"></div>

	{#each corners as c (c.q)}
		<span class="absolute {c.cls} text-[10px] font-semibold uppercase tracking-wider {quadrant === c.q ? 'text-neutral-100' : 'text-neutral-600'}">
			{t(locale, `read.q.${c.q}`)}
		</span>
	{/each}

	<span class="absolute top-1/2 left-1.5 -translate-y-1/2 text-[9px] text-neutral-600">{t(locale, 'read.warmth.lo')}</span>
	<span class="absolute top-1/2 right-1.5 -translate-y-1/2 text-[9px] text-neutral-600">{t(locale, 'read.warmth.hi')}</span>
	<span class="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] text-neutral-600">{t(locale, 'read.competence.hi')}</span>
	<span class="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-neutral-600">{t(locale, 'read.competence.lo')}</span>

	<div class="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.15)] transition-all duration-700" style="left: {x}%; top: {y}%"></div>
</div>
