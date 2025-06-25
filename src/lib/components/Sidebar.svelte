<script lang="ts">
    import { Button } from "m3-svelte";
    import { apiService } from '$lib/services/api';
    import { goto } from '$app/navigation';
    import { settingsStore } from '$lib/stores/settings.svelte';
    import { drawingStore } from '$lib/stores/drawing.svelte';
    import { currentBoard } from '$lib/store';
    import { scale, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount, onDestroy } from 'svelte';
    
    let isCreating = $state(false);
    let isVisible = $state(true);
    let isSaving = $state(false);

    // Reactive variables for animation settings
    let animateTransitions = $derived(settingsStore.ui.animateTransitions);

    function toggleSidebar() {
        isVisible = !isVisible;
    }

    // Listen for keyboard shortcut events
    onMount(() => {
        const handleToggle = () => toggleSidebar();
        window.addEventListener('toggle-sidebar', handleToggle);
        
        return () => {
            window.removeEventListener('toggle-sidebar', handleToggle);
        };
    });
    
    async function createNewBoard() {
        if (isCreating) return;
        
        isCreating = true;
        try {
            const newBoard = await apiService.createBoard({
                name: `Board ${new Date().toLocaleString()}`,
                description: 'A new collaborative drawing board',
                is_public: true
            });
            
            // Force navigation to new board - using window.location for reliable state reset
            window.location.href = `/board/${newBoard.id}`;
        } catch (error) {
            console.error('Failed to create board:', error);
            alert('Failed to create board. Please try again.');
            isCreating = false;
        }
    }
    
    function saveCanvasAsImage() {
        if (isSaving || !drawingStore.canvas) return;
        
        isSaving = true;
        try {
            // Get current board name from store - use $currentBoard to get reactive value
            const board = $currentBoard;
            const boardName = board?.name ? board.name.replace(/[^a-z0-9]/gi, '_') : 'canvas_drawing';
            
            drawingStore.exportCanvasAsImage(boardName);
        } catch (error) {
            console.error('Failed to save canvas as image:', error);
            alert('Failed to save canvas as image. Please try again.');
        } finally {
            isSaving = false;
        }
    }
</script>

{#if isVisible}
<div 
    class="w-20 fixed right-0 top-0 rounded-l-3xl z-10 bg-primary-container h-screen"
    in:fly={animateTransitions ? { x: 80, duration: 500, delay: 200, easing: quintOut } : undefined}
    out:fly={animateTransitions ? { x: 80, duration: 300, easing: quintOut } : undefined}
>
    <div class="flex flex-col items-center justify-between h-full">
        <div 
            class="flex flex-col items-center mt-5"
            {...animateTransitions ? { in: scale, params: { duration: 400, delay: 300, easing: quintOut } } : {}}
        >
            <!-- Toggle Button (small) -->
            <div class="toggle-button">
                <Button 
                    square 
                    iconType="full" 
                    variant="elevated"
                    onclick={toggleSidebar}
                    title="Toggle sidebar (Ctrl+B)"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"/>
                </svg>
                </Button>
            </div>
        </div>
        <div 
            class="flex flex-col mb-5 items-center gap-4"
            {...animateTransitions ? { in: scale, params: { duration: 400, delay: 400, easing: quintOut } } : {}}
        >
            <Button 
                square 
                iconType="full" 
                variant="filled"
                onclick={createNewBoard}
                disabled={isCreating}
                title={isCreating ? "Creating board..." : "Create new board"}
            >
                {#if isCreating}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="animate-spin">
                        <path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
                        <path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M18 12.998h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5v-5a1 1 0 0 1 2 0v5h5a1 1 0 0 1 0 2" />
                    </svg>
                {/if}
            </Button>
            <Button 
                square 
                iconType="full" 
                variant="filled"
                onclick={saveCanvasAsImage}
                disabled={isSaving || !drawingStore.canvas}
                title={isSaving ? "Saving image..." : "Save canvas as image"}
            >
                {#if isSaving}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="animate-spin">
                        <path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
                        <path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zm0 0V5zm2-2h10q.3 0 .45-.275t-.05-.525l-2.75-3.675q-.15-.2-.4-.2t-.4.2L11.25 16L9.4 13.525q-.15-.2-.4-.2t-.4.2l-2 2.675q-.2.25-.05.525T7 17" />
                    </svg>
                {/if}
            </Button>
            <Button onclick={() => goto('/settings')} square iconType="full" variant="filled">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M10.825 22q-.675 0-1.162-.45t-.588-1.1L8.85 18.8q-.325-.125-.612-.3t-.563-.375l-1.55.65q-.625.275-1.25.05t-.975-.8l-1.175-2.05q-.35-.575-.2-1.225t.675-1.075l1.325-1Q4.5 12.5 4.5 12.337v-.675q0-.162.025-.337l-1.325-1Q2.675 9.9 2.525 9.25t.2-1.225L3.9 5.975q.35-.575.975-.8t1.25.05l1.55.65q.275-.2.575-.375t.6-.3l.225-1.65q.1-.65.588-1.1T10.825 2h2.35q.675 0 1.163.45t.587 1.1l.225 1.65q.325.125.613.3t.562.375l1.55-.65q.625-.275 1.25-.05t.975.8l1.175 2.05q.35.575.2 1.225t-.675 1.075l-1.325 1q.025.175.025.338v.674q0 .163-.05.338l1.325 1q.525.425.675 1.075t-.2 1.225l-1.2 2.05q-.35.575-.975.8t-1.25-.05l-1.5-.65q-.275.2-.575.375t-.6.3l-.225 1.65q-.1.65-.587 1.1t-1.163.45zM11 20h1.975l.35-2.65q.775-.2 1.438-.587t1.212-.938l2.475 1.025l.975-1.7l-2.15-1.625q.125-.35.175-.737T17.5 12t-.05-.787t-.175-.738l2.15-1.625l-.975-1.7l-2.475 1.05q-.55-.575-1.212-.962t-1.438-.588L13 4h-1.975l-.35 2.65q-.775.2-1.437.588t-1.213.937L5.55 7.15l-.975 1.7l2.15 1.6q-.125.375-.175.75t-.05.8q0 .4.05.775t.175.75l-2.15 1.625l.975 1.7l2.475-1.05q.55.575 1.213.963t1.437.587zm1.05-4.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.487 1.025T8.55 12t1.013 2.475T12.05 15.5M12 12" />
                </svg>
            </Button>
        </div>
    </div>
</div>
{:else}
<!-- Floating toggle button when sidebar is hidden -->
<div 
    class="fixed right-4 top-4 z-10"
    in:scale={animateTransitions ? { duration: 300, easing: quintOut } : undefined}
    out:scale={animateTransitions ? { duration: 200, easing: quintOut } : undefined}
>
    <div class="floating-button">
        <Button 
            square 
            iconType="full" 
            variant="filled"
            onclick={toggleSidebar}
            title="Show sidebar (Ctrl+B)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"/>
            </svg>
        </Button>
    </div>
</div>
{/if}

<style>
    .toggle-button :global(button) {
        margin-bottom: 0.5rem;
    }

    .floating-button :global(button) {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
</style>