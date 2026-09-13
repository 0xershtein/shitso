<script lang="ts">
	// Tier-specific emoji rain. Bad tiers fall, good tiers rise. No external deps.
	let { tier, seed = 'x' }: { tier: string; seed?: string } = $props();

	const SETS: Record<string, string[]> = {
		biohazard: ['☣️', '💩', '🔥', '🚮', '☠️'],
		certified: ['💩', '🧢', '🤡', '💩', '🐍'],
		questionable: ['🤨', '🧐', '👀', '❓', '🤔'],
		respected: ['🫡', '🐐', '🔥', '💎', '👏'],
		unrated: []
	};

	function hash(s: string) {
		let h = 7;
		for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
		return h;
	}

	const drops = $derived.by(() => {
		const set = SETS[tier] ?? [];
		if (set.length === 0) return [];
		const h = hash(seed + tier);
		return Array.from({ length: 18 }, (_, i) => {
			const r = (h * (i + 1)) % 1000;
			return {
				id: i,
				char: set[(i + r) % set.length],
				left: (i * 53 + r) % 100,
				delay: ((r % 40) / 10).toFixed(1),
				duration: (5 + (r % 50) / 10).toFixed(1),
				size: 14 + (r % 18)
			};
		});
	});

	const up = $derived(tier === 'respected');
	const caption = $derived(
		tier === 'biohazard'
			? 'the internet is evacuating'
			: tier === 'certified'
				? 'the internet has spoken'
				: tier === 'questionable'
					? 'the internet is squinting'
					: 'the internet approves'
	);
</script>

{#if drops.length > 0}
	<figure class="relative mb-6 h-32 overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950/60" aria-hidden="true">
		{#each drops as d (d.id)}
			<span
				class="pointer-events-none absolute select-none {up ? 'rise' : 'fall'}"
				style="left:{d.left}%; animation-delay:{d.delay}s; animation-duration:{d.duration}s; font-size:{d.size}px"
			>
				{d.char}
			</span>
		{/each}
		<figcaption class="absolute right-3 bottom-1.5 text-[11px] text-neutral-500">{caption}</figcaption>
	</figure>
{/if}

<style>
	.fall {
		top: -2rem;
		animation-name: fall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	.rise {
		bottom: -2rem;
		animation-name: rise;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes fall {
		0% {
			transform: translateY(0) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translateY(10rem) rotate(30deg);
			opacity: 0.2;
		}
	}
	@keyframes rise {
		0% {
			transform: translateY(0) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translateY(-10rem) rotate(-30deg);
			opacity: 0.2;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fall,
		.rise {
			animation: none;
			top: auto;
			bottom: 0.5rem;
		}
	}
</style>
