<script lang="ts">
	let { data } = $props();
</script>

<section class="mx-auto max-w-sm py-16 text-center">
	<h1 class="text-2xl font-black">sign in to give a shit</h1>
	<p class="mt-2 text-sm text-neutral-400">one account, one vote per person. we only read your handle, follower count and account age.</p>

	<div class="mt-8 space-y-3">
		{#if data.providers.includes('twitter')}
			<form method="POST">
				<input type="hidden" name="providerId" value="twitter" />
				<input type="hidden" name="redirectTo" value={data.redirectTo} />
				<button class="w-full rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200">
					continue with X
				</button>
			</form>
		{/if}
		{#if data.providers.length === 0}
			<p class="text-sm text-red-400">no login provider configured yet.</p>
		{/if}
	</div>
</section>
