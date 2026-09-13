<script lang="ts">
	import { page } from '$app/state';

	const code = $derived(page.url.searchParams.get('error') ?? 'Default');
	const copy: Record<string, { title: string; body: string }> = {
		Configuration: {
			title: 'that took too long.',
			body: 'the X login screen sat open for more than 15 minutes, so the sign-in expired. try again and click authorize right away.'
		},
		AccessDenied: {
			title: 'you said no.',
			body: 'you cancelled on the X screen. no hard feelings, you can still browse.'
		},
		OAuthCallbackError: {
			title: 'X hiccupped.',
			body: 'the handshake with X failed halfway. try once more.'
		},
		Default: {
			title: 'something went sideways.',
			body: 'sign-in failed. try again, and if it keeps happening tell @erendotdmg.'
		}
	};
	const c = $derived(copy[code] ?? copy.Default);
</script>

<svelte:head><title>sign in failed · shit.so</title></svelte:head>

<section class="mx-auto max-w-sm py-16 text-center">
	<div class="text-5xl">💩</div>
	<h1 class="mt-4 text-2xl font-black">{c.title}</h1>
	<p class="mt-2 text-sm text-neutral-400">{c.body}</p>
	<a href="/signin" class="mt-8 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black hover:bg-neutral-200">try again</a>
	<p class="mt-3 text-[11px] text-neutral-600">error code: {code}</p>
</section>
