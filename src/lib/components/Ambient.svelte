<script lang="ts">
	// Ambient tier atmosphere: small crisp emojis rising endlessly behind the profile header,
	// like bubbles. Spread across evenly spaced lanes so they never cluster; each lane is a
	// full-height strip and the animation is a pure transform (no layout work per frame).
	// Deterministic per handle. Off for reduced motion.
	let { tier, seed = 'x' }: { tier: string; seed?: string } = $props();

	const SETS: Record<string, string[]> = {
		biohazard: ['☣️', '💩', '🔥', '☠️'],
		certified: ['💩', '🧢', '🤡', '🐍'],
		questionable: ['🤨', '👀', '❓'],
		respected: ['🫡', '🐐', '💎', '🔥'],
		unrated: []
	};
	const LANES = 10;
	function hash(s: string) {
		let h = 7;
		for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
		return h;
	}
	const items = $derived.by(() => {
		const set = SETS[tier] ?? [];
		if (!set.length) return [];
		const h = hash(seed + tier);
		return Array.from({ length: LANES }, (_, i) => {
			const r = ((h >>> (i % 8)) * (i + 3)) % 997;
			const dur = 9 + (r % 8); // 9..16s
			return {
				id: i,
				char: set[(i + r) % set.length],
				left: (i + 0.5) * (100 / LANES) + ((r % 7) - 3), // lane center ± 3%
				size: 20 + (r % 18), // 20..37px
				delay: -((r % 100) / 100) * dur, // negative = already mid-flight on load
				dur,
				sway: (r % 2 ? 1 : -1) * (8 + (r % 16))
			};
		});
	});
</script>

{#if items.length}
	<div class="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
		{#each items as it (it.id)}
			<span
				class="lane absolute inset-y-0 flex w-0 items-end justify-center select-none"
				style="left:{it.left}%; --size:{it.size}px; --sway:{it.sway}px; animation-delay:{it.delay}s; animation-duration:{it.dur}s"
			><span class="leading-none" style="font-size:var(--size)">{it.char}</span></span>
		{/each}
	</div>
{/if}

<style>
	.lane {
		opacity: 0;
		will-change: transform, opacity;
		animation-name: rise;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	/* The lane is as tall as the header, so translateY(-100%) is exactly one header height. */
	@keyframes rise {
		0% {
			transform: translate(0, var(--size));
			opacity: 0;
		}
		15% {
			opacity: 0.22;
		}
		85% {
			opacity: 0.22;
		}
		100% {
			transform: translate(var(--sway), calc(-100% - var(--size)));
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lane {
			animation: none;
		}
	}
</style>
