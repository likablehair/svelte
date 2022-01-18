<script lang="ts">
  import { onMount } from 'svelte';

  type Section = {
    title: string
  }

  let isMobile: boolean = false;
  let sections: Section[] = [
    {
      title: '10 apr, 2021'
    },
    {
      title: 'Titolo 2'
    },
    {
      title: 'Titolo 3'
    },
    {
      title: 'Titolo 4'
    },
    {
      title: 'Titolo 5'
    },
    {
      title: 'Titolo 6'
    },
    {
      title: 'Titolo 7'
    },
    {
      title: 'Titolo 8'
    },
    {
      title: 'Titolo 9'
    },
    {
      title: 'Titolo 10'
    },
    {
      title: 'Titolo 11'
    },
    {
      title: 'Titolo 12'
    },
    {
      title: 'Titolo 13'
    },
    {
      title: 'Titolo 14'
    },
    {
      title: 'Titolo 15'
    },
    {
      title: 'Titolo 16'
    },
    {
      title: 'Titolo 17'
    },
  ];

  let titleElements: HTMLElement[] = [];
  onMount(() => {
    if(!!titleElements[0]) {
      titleElements[0].scrollIntoView({
        block: 'center',
      });
    }
  })


  let scrollableDiv, titlesMobile, visibleIndex = 0, titlesMobileElement: HTMLElement,
  function handleElemenScroll(event) {
    let scrollValue: number = scrollableDiv.scrollTop
    let scrollableDivHeight: number = scrollableDiv.offsetHeight
    let titlesMobileHeight: number = titlesMobileElement.offsetHeight

    let newVisibleIndex = Math.floor(scrollValue / scrollableDivHeight)
    if(newVisibleIndex != visibleIndex) {
      changeVisibleSection(newVisibleIndex, newVisibleIndex > visibleIndex)
    }
  }

  function changeVisibleSection(index: number, top=true) {
    visibleIndex = index

    scrollTitlesToIndex(index)
    if(top) {
      scrollableDiv.scrollTop = index * scrollableDiv.offsetHeight
    } else {
      scrollableDiv.scrollTop = ((index + 1) * scrollableDiv.offsetHeight) - 1 + titlesMobileElement.offsetHeight
    }
  }

  let titlesScrollableDiv: HTMLElement,
    interval,
    target

  function scrollTitlesToIndex(index: number) {
    if(!!titleElements[index]) {
      const distanceFromParent = titleElements[index].offsetTop - titleElements[index].parentElement.offsetTop,
        titleElementHeight = titleElements[index].offsetHeight,
        parentHeight = titleElements[index].parentElement.offsetHeight

      target = distanceFromParent - Math.floor((parentHeight / 2) - (titleElementHeight / 2))

      if(!!interval) clearInterval(interval)
      interval = setInterval(() => {
        if(titlesScrollableDiv.scrollTop > target - 5 && titlesScrollableDiv.scrollTop < target + 5) {
          clearInterval(interval)
          titlesScrollableDiv.scrollTop = target
        }
        else if(titlesScrollableDiv.scrollTop > target && titlesScrollableDiv.scrollTop - target < 100) titlesScrollableDiv.scrollTop -= 5
        else if(titlesScrollableDiv.scrollTop > target) titlesScrollableDiv.scrollTop -= 10
        else if(titlesScrollableDiv.scrollTop < target && target - titlesScrollableDiv.scrollTop < 100) titlesScrollableDiv.scrollTop += 5
        else if(titlesScrollableDiv.scrollTop < target ) titlesScrollableDiv.scrollTop += 10
      }, 20)
    }
  }

  $: cssVariables = Object.entries({
      '--section-number': sections.length
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import '$lib/common/tailwind.css';
</script>

<div class="timeline-container" style={cssVariables}>
  <div 
    class="flex flex-col md:flex-row h-full"
  >
    <div class="w-1/5 flex-col h-full-screen menu-container overflow-auto hidden md:flex" bind:this={titlesScrollableDiv}>
      <div class="flex-none h-1/2"></div>
      {#each sections as section, index}
        <div 
          class="font-sans subpixel-antialiased tracking-wide transition-all cursor-pointer"
          class:text-2xl={index == visibleIndex}
          class:font-bold={index == visibleIndex}
          bind:this={titleElements[index]}
          on:click={() => changeVisibleSection(index)}
        >
          {section.title}
        </div>
      {/each }
      <div class="flex-none h-1/2"></div>
    </div>
    <div class="flex md:hidden justify-center" bind:this={titlesMobileElement}>
      <div 
        class="font-sans subpixel-antialiased text-2xl font-bold tracking-wide transition-all cursor-pointer"
      >
        {sections[visibleIndex].title}
      </div>
    </div>
    <div 
      class="w-4/5 justify-center overflow-auto scrollable-div" 
      on:scroll={handleElemenScroll} 
      bind:this={scrollableDiv}
    >
      <div class="item-container">
        {#each sections as section, index}
          <div 
            class="sticky top-0 contain-section transition-all"
            class:opacity-0={index != visibleIndex}
          >
            {section.title}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .timeline-container {
    height: var(--height);
    width: var(--width);
    max-width: var(--max-width);
    max-height: var(--max-height);
  }

  .menu-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .menu-container::-webkit-scrollbar { 
    display: none;
  }

  .scrollable-div {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollable-div::-webkit-scrollbar { 
    display: none;
  }

  .contain-section {
    height: var(--height);
    max-width: var(--max-width);
  }

  .item-container {
    height: calc(var(--height) * var(--section-number));
  }
</style>