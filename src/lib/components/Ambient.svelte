<script lang="ts">
	// Ambient tier atmosphere: blurred emojis rising endlessly behind the profile header,
	// like bubbles. Each one starts below the header, floats past the top, then loops.
	// Deterministic per handle so the page looks the same on every visit. Off for reduced motion.
	let { tier, seed = 'x' }: { tier: string; seed?: string } = $props();

	const SETS: Record<string, string[]> = {
		biohazard: ['☣️', '💩', '🔥', '☠️'],
		certified: ['💩', '🧢', '🤡', '🐍'],
		questionable: ['🤨', '👀', '❓'],
		respected: ['🫡', '🐐', '💎', '🔥'],
		unrated: []
	};
	function hash(s: string) {
		let h = 7;
		for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
		return h;
	}
	const items = $derived.by(() => {
		const set = SETS[tier] ?? [];
		if (!set.length) return [];
		const h = hash(seed + tier);
		return Array.from({ length: 9 }, (_, i) => {
			const r = (h * (i + 3)) % 997;
			const dur = 12 + (r % 10);
			return {
				id: i,
				char: set[(i + r) % set.length],
				left: 4 + ((i * 137 + r) % 92),
				size: 36 + (r % 40),
				delay: -((r % 100) / 100) * dur, // negative delay = already mid-flight on load
				dur,
				blur: r % 3,
				sway: (r % 2 ? 1 : -1) * (10 + (r % 20))
			};
		});
	});
</script>

{#if items.length}
	<div class="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
		{#each items as it (it.id)}
			<span
				class="rise absolute select-none"
				style="left:{it.left}%; font-size:{it.size}px; animation-delay:{it.delay}s; animation-duration:{it.dur}s; filter: blur({it.blur}px); --sway:{it.sway}px"
			>{it.char}</span>
		{/each}
	</div>
{/if}

<style>
	.rise {
		top: 105%;
		opacity: 0;
		animation-name: rise;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes rise {
		0% {
			top: 105%;
			transform: translateX(0) rotate(-8deg);
			opacity: 0;
		}
		12% {
			opacity: 0.16;
		}
		85% {
			opacity: 0.16;
		}
		100% {
			top: -30%;
			transform: translateX(var(--sway)) rotate(8deg);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rise {
			animation: none;
		}
	}
</style>
