<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import { createIpfs } from '../util/ipfs';

	if (browser) {
		window.ipfsPromise = createIpfs();
	}
</script>

<slot />
