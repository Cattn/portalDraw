<script lang="ts">
	import { Button, FAB } from 'm3-svelte';
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import DrawingToolbar from '$lib/components/DrawingToolbar.svelte';
	import WhiteboardDrawer from '$lib/components/WhiteboardDrawer.svelte';
	import { onMount } from 'svelte';
	import iconKeyboardArrowUp from '@iconify/icons-material-symbols/keyboard-arrow-up';
	import type { PageServerData } from "./$types"
	import type { Board, User } from '$lib/types';
	import Boards from '$lib/apiManager/boards';

	let {data}: {data: PageServerData} = $props()

	const users = data.users
	let boards: Board[] = [];

	onMount(() => {
		Boards.getBoards().then((userBoards: Board[]) => {
			boards = userBoards;
		});
	});
</script>

<div>
	{#if users.length > 0}
	  {#each users as user}
		<div>
		  <span>Username</span>
		  <span>{user.username}</span>
		</div>
	  {/each}
	{/if}
  </div>