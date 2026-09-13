<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>shit.so</title>
	<meta name="description" content="give a shit about people on X. one vote per person, change it anytime." />
</svelte:head>

<div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4">
	<header class="flex items-center justify-between py-5">
		<a href="/" class="text-xl font-black tracking-tight">💩 shit<span class="text-neutral-500">.so</span></a>
		<nav class="flex items-center gap-3 text-sm">
			{#if data.session?.user}
				<span class="text-neutral-400">
					{data.session.user.handle ? `@${data.session.user.handle}` : data.session.user.name}
				</span>
				<form method="POST" action="/signout">
					<button class="rounded-md border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900">sign out</button>
				</form>
			{:else}
				<a href="/signin" class="rounded-md bg-white px-3 py-1.5 font-semibold text-black hover:bg-neutral-200">sign in</a>
			{/if}
		</nav>
	</header>

	<main class="flex-1 pb-16">
		{@render children()}
	</main>

	<footer class="py-6 text-xs text-neutral-600">
		one X account, one vote per person. 10+ followers, 7+ day old account. change your mind anytime. ·
		<a href="https://x.com/erendotdmg" class="underline hover:text-neutral-400">@erendotdmg</a>
	</footer>
</div>
