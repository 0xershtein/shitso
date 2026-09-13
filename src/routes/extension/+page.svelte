<script lang="ts">
	import { t } from '$lib/i18n';
	let { data } = $props();
	const L = $derived(data.locale);
	const REPO = 'https://github.com/0xershtein/shitso';
</script>

<svelte:head>
	<title>{t(L, 'ext.title')} · shit.so</title>
	<meta name="description" content={t(L, 'ext.sub')} />
	<link rel="canonical" href="https://shit.so/extension" />
</svelte:head>

<section class="py-10">
	<h1 class="text-4xl font-black tracking-tight">🧩 {t(L, 'ext.title')}</h1>
	<p class="mt-3 max-w-xl text-neutral-400">{t(L, 'ext.sub')}</p>

	<div class="mt-8 grid gap-3 sm:grid-cols-3">
		{#each ['feed', 'profile', 'counts'] as k (k)}
			<div class="rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
				<div class="text-2xl">{t(L, `ext.f.${k}.icon`)}</div>
				<div class="mt-2 font-bold">{t(L, `ext.f.${k}`)}</div>
				<p class="mt-1 text-sm text-neutral-400">{t(L, `ext.f.${k}.d`)}</p>
			</div>
		{/each}
	</div>

	<h2 class="mt-12 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'ext.install')}</h2>
	<p class="mt-2 text-sm text-neutral-400">{t(L, 'ext.noStore')}</p>
	<ol class="mt-4 space-y-3">
		{#each [1, 2, 3, 4] as n (n)}
			<li class="flex gap-3">
				<span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold">{n}</span>
				<div class="text-sm leading-7">
					{#if n === 1}
						<a href="/downloads/shitso-extension.zip" class="font-semibold underline decoration-neutral-700 hover:decoration-white">{t(L, 'ext.s1')}</a>
						<span class="text-neutral-500"> · {t(L, 'ext.source')}: <a href="https://github.com/0xershtein/shitso-extension" target="_blank" rel="noopener" class="underline hover:text-neutral-300">github</a></span>
					{:else}
						{t(L, `ext.s${n}`)}
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	<a href="/downloads/shitso-extension.zip" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black hover:bg-neutral-200">⬇️ {t(L, 'ext.download')}</a>

	<p class="mt-8 text-xs text-neutral-500">{t(L, 'ext.privacy')}</p>
</section>
