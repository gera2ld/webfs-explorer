<script lang="ts">
	export let name = '';
	export let content: Uint8Array;

	$: imageUrl = URL.createObjectURL(new Blob([content]));

	function handleLoad() {
		URL.revokeObjectURL(imageUrl);
	}
</script>

<div class="flex flex-col items-center p-4">
	<img class="max-h-[720px]" src={imageUrl} on:load={handleLoad} alt={name} />
	<div class="mt-2">{name}</div>
</div>
