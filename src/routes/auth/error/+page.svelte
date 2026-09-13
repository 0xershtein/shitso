<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	let { data } = $props();
	const L = $derived(data.locale);
	const raw = $derived(page.url.searchParams.get('error') ?? 'Default');
	const code = $derived(['Configuration', 'AccessDenied', 'OAuthCallbackError'].includes(raw) ? raw : 'Default');
</script>

<svelte:head><title>{t(L, 'err.Default.title')} · shit.so</title></svelte:head>

<section class="mx-auto max-w-sm py-16 text-center">
	<div class="text-5xl">💩</div>
	<h1 class="mt-4 text-2xl font-black">{t(L, `err.${code}.title`)}</h1>
	<p class="mt-2 text-sm text-neutral-400">{t(L, `err.${code}.body`)}</p>
	<a href="/signin" class="mt-8 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black hover:bg-neutral-200">{t(L, 'err.retry')}</a>
	<p class="mt-3 text-[11px] text-neutral-600">{t(L, 'err.code', { c: raw })}</p>
</section>
