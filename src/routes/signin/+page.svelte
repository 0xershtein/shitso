<script lang="ts">
	import { t } from '$lib/i18n';
	let { data } = $props();
	const L = $derived(data.locale);
</script>

<section class="mx-auto max-w-sm py-16 text-center">
	<h1 class="text-2xl font-black">{t(L, 'signin.title')}</h1>
	<p class="mt-2 text-sm text-neutral-400">{t(L, 'signin.sub')}</p>

	<div class="mt-8 space-y-3">
		{#if data.providers.includes('twitter')}
			<form method="POST">
				<input type="hidden" name="providerId" value="twitter" />
				<input type="hidden" name="redirectTo" value={data.redirectTo} />
				<button class="w-full rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200">{t(L, 'signin.x')}</button>
			</form>
		{/if}
		{#if data.providers.length === 0}
			<p class="text-sm text-red-400">{t(L, 'signin.none')}</p>
		{/if}
	</div>
</section>
