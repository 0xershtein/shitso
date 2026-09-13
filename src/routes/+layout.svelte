<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { afterNavigate } from '$app/navigation';

	const GA = !dev && env.PUBLIC_GA_ID ? env.PUBLIC_GA_ID : null;
	afterNavigate(() => {
		if (GA && typeof gtag === 'function') gtag('event', 'page_view', { page_path: location.pathname });
	});
	import { t, LOCALES } from '$lib/i18n';
	import { MIN_FOLLOWERS, MIN_ACCOUNT_AGE_DAYS } from '$lib/eligibility';

	let { data, children } = $props();
	const L = $derived(data.locale);
	const langHref = (l: string) => {
		const u = new URL(page.url);
		u.searchParams.set('lang', l);
		return u.pathname + u.search;
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>shit.so</title>
	<meta name="description" content={t(L, 'home.sub')} />
	{#if GA}
		<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag() { dataLayer.push(arguments); }
			gtag('js', new Date());
			gtag('config', '{GA}', { send_page_view: false, anonymize_ip: true });
		</script>
	{/if}
</svelte:head>

<div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4">
	<header class="flex items-center justify-between py-5">
		<a href="/" class="text-xl font-black tracking-tight">💩 shit<span class="text-neutral-500">.so</span></a>
		<nav class="flex items-center gap-3 text-sm">
			{#if data.session?.user}
				<span class="text-neutral-400">
					{data.session.user.handle ? `@${data.session.user.handle}` : data.session.user.name}
				</span>
				{#if data.pendingCount !== null}
					<a href="/inspector" class="rounded-md border px-2 py-1 text-xs {data.pendingCount ? 'border-amber-700 text-amber-300' : 'border-neutral-800 text-neutral-500'}">🕵️ {data.pendingCount}</a>
				{/if}
				<form method="POST" action="/signout">
					<button class="rounded-md border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900">{t(L, 'nav.signout')}</button>
				</form>
			{:else}
				<a href="/signin" class="rounded-md bg-white px-3 py-1.5 font-semibold text-black hover:bg-neutral-200">{t(L, 'nav.signin')}</a>
			{/if}
		</nav>
	</header>

	<main class="flex-1 pb-16">
		{@render children()}
	</main>

	<footer class="flex flex-wrap items-center justify-between gap-2 py-6 text-xs text-neutral-600">
		<span>
			{t(L, 'footer.rule', { f: MIN_FOLLOWERS, d: MIN_ACCOUNT_AGE_DAYS })} ·
			<a href="https://x.com/erendotdmg" class="underline hover:text-neutral-400">@erendotdmg</a>
		</span>
		<span class="flex gap-2">
			{#each LOCALES as l (l)}
				<a
					href={langHref(l)}
					data-sveltekit-reload
					class="uppercase {l === L ? 'text-neutral-300' : 'hover:text-neutral-400'}">{l}</a
				>
			{/each}
		</span>
	</footer>
</div>
