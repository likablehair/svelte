<script type="ts">
    export let files: FileList = undefined,
        persistentFiles: File[] = [],
        height: string = "100%",
        width: string = "100%",
        backgroundColor: string = "rgba(255,255,255,0)",
        textColor: string = "black",
        rounded: boolean = true,
        elevation: boolean = true,
        dropAreaActive: boolean = true;

    let inputElement: HTMLElement = undefined;
    let dropAreaElevation: boolean = false;

    const highlight: (highlighted: boolean) => void = (highlighted) => {
        if (elevation) dropAreaElevation = highlighted;
        dropAreaActive = highlighted;
    };

    function handleFileDrop(event) {
        files = event.dataTransfer.files;
        persistentFiles = [...persistentFiles, ...Array.from(files)];
    }

    function handleFileFromInput(event) {
        files = event.target.files;
        persistentFiles = [...persistentFiles, ...Array.from(files)];
    }
</script>

<div
    class="drop-area"
    on:click={() => inputElement.click()}
    on:dragover|preventDefault={() => highlight(true)}
    on:dragleave={() => highlight(false)}
    on:dragend={() => highlight(false)}
    on:drop|preventDefault={handleFileDrop}
    on:mouseenter={() => highlight(true)}
    on:mouseleave={() => highlight(false)}
    style:height
    style:width
    style="background-color: {backgroundColor}; color: {textColor};"
    class:rounded
    class:elevated={dropAreaElevation}
>
    <slot name="body">
        <span> Drop file here or click to upload </span>
    </slot>

    <input
        type="file"
        multiple
        bind:files
        bind:this={inputElement}
        on:input={handleFileFromInput}
    />
</div>

<style>
    .drop-area {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        transition: 0.2s;
    }
    .drop-area > input {
        display: none;
    }
    .elevated {
        --shadow-color: #000;
        --ring-inset: inset;
        --ring-offset-width: 0px;
        --ring-color: rgb(255 255 255/0.1);
        --ring-offset-shadow: var(--ring-inset) 0 0 0
            calc(1px + var(--ring-offset-width)) var(--ring-color);
        --ring-shadow: 0 0 #0000;
        --shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
            0 4px 6px -4px rgb(0 0 0 / 0.1);
        --shadow-colored: 0 10px 15px -3px var(--shadow-color),
            0 4px 6px -4px var(--shadow-color);
        box-shadow: var(--ring-offset-shadow, 0 0 #0000),
            var(--ring-shadow, 0 0 #0000), var(--shadow);
    }
    .rounded {
        border-radius: 5px;
    }
</style>
