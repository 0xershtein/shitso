<script lang="ts">
	// Smooth "pulse" line of daily votes. Total as a soft area, bad votes as an amber line.
	let { days, trendUp }: { days: { day: string; bad: number; good: number }[]; trendUp: boolean } = $props();

	const W = 600, H = 120, PAD = 8;
	const max = $derived(Math.max(1, ...days.map((d) => d.bad + d.good)));
	const px = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, days.length - 1);
	const py = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

	function smooth(points: [number, number][]): string {
		if (points.length < 2) return '';
		let d = `M ${points[0][0]} ${points[0][1]}`;
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
			const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
			const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
			d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
		}
		return d;
	}
	const totalPts = $derived(days.map((d, i) => [px(i), py(d.bad + d.good)] as [number, number]));
	const badPts = $derived(days.map((d, i) => [px(i), py(d.bad)] as [number, number]));
	const totalPath = $derived(smooth(totalPts));
	const badPath = $derived(smooth(badPts));
	const area = $derived(`${totalPath} L ${px(days.length - 1)} ${H - PAD} L ${px(0)} ${H - PAD} Z`);
	const last = $derived(totalPts[totalPts.length - 1] ?? [0, H]);
</script>

<svg viewBox="0 0 {W} {H}" class="h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
	<defs>
		<linearGradient id="pulse-fill" x1="0" x2="0" y1="0" y2="1">
			<stop offset="0" stop-color="{trendUp ? '#f59e0b' : '#10b981'}" stop-opacity="0.35" />
			<stop offset="1" stop-color="{trendUp ? '#f59e0b' : '#10b981'}" stop-opacity="0" />
		</linearGradient>
	</defs>
	{#each [0.25, 0.5, 0.75] as g (g)}
		<line x1="0" x2={W} y1={H * g} y2={H * g} stroke="#262626" stroke-width="1" />
	{/each}
	<path d={area} fill="url(#pulse-fill)" />
	<path d={totalPath} fill="none" stroke={trendUp ? '#fbbf24' : '#34d399'} stroke-width="2.5" stroke-linecap="round" />
	<path d={badPath} fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 4" stroke-linecap="round" opacity="0.8" />
	<circle cx={last[0]} cy={last[1]} r="4" fill={trendUp ? '#fbbf24' : '#34d399'} />
	<circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={trendUp ? '#fbbf24' : '#34d399'} stroke-width="2" class="pulse-ring" />
</svg>

<style>
	.pulse-ring {
		transform-origin: center;
		transform-box: fill-box;
		animation: ring 1.8s ease-out infinite;
	}
	@keyframes ring {
		0% { transform: scale(1); opacity: 0.9; }
		100% { transform: scale(3.2); opacity: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse-ring { animation: none; }
	}
</style>
