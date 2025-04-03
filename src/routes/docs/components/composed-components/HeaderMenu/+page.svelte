<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import DescriptiveAvatar from "$lib/components/simple/media/DescriptiveAvatar.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>Descriptive Avatar</h1>
<ComponentSubtitle>Circle Image with description.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DescriptiveAvatar
    src="/avatars/avatar1.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    src="/avatars/avatar1.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
    direction="column"
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    src="/no/image.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
    reverse
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    title="Nome cognome"
    subtitle="ruolo"
    direction="column"
    reverse
  ></DescriptiveAvatar>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'src', type: 'string', description: 'The source URL of the avatar image.', default: 'undefined' },
    { name: 'title', type: 'string', description: 'The title to display in the descriptive avatar.', default: 'undefined' },
    { name: 'subtitle', type: 'string', description: 'The subtitle to display in the descriptive avatar.', default: 'undefined' },
    { name: 'avatarText', type: 'string', description: 'The fallback text for the avatar if there is no image, defaults to the first two characters of title.', default: 'title?.substring(0, 2).toUpperCase()' },
    { name: 'direction', type: '"row" | "column"', description: 'The direction of the content layout (row or column).', default: '"row"' },
    { name: 'reverse', type: 'boolean', description: 'Whether to reverse the layout direction.', default: 'false' },
    { name: 'referrerpolicy', type: 'ReferrerPolicy', description: 'The referrer policy for the avatar image.', default: '"no-referrer"' },
  ]}
  styleProps={[
    { name: '--descriptive-avatar-image-gap', type: 'size', description: 'The gap between the avatar image and text.', default: '8px' },
    { name: '--descriptive-avatar-text-gap', type: 'size', description: 'The gap between the text elements (title, subtitle).', default: '2px' },
    { name: '--descriptive-avatar-title-font-size', type: 'size', description: 'The font size of the title.', default: '1.1rem' },
    { name: '--descriptive-avatar-subtitle-font-size', type: 'size', description: 'The font size of the subtitle.', default: '1rem' },
    { name: '--descriptive-avatar-cursor', type: 'cursor', description: 'The cursor style for the avatar container when it is clickable.', default: '"pointer"' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'children', description: 'The default slot for rendering additional content inside the avatar container.', default: `
<div class="flex flex-col text-gapped">
  {#if !!title}
    <div 
      class="font-bold title"
      class:text-start={direction == 'row' && !reverse}
      class:text-center={direction == 'column'}
      class:text-end={direction == 'row' && reverse}
    >{title}</div>
  {/if}
  {#if !!subtitle}
    <div 
      class="subtitle"
      class:text-start={direction == 'row' && !reverse}
      class:text-center={direction == 'column'}
      class:text-end={direction == 'row' && reverse}
    >{subtitle}</div>
  {/if}
</div>
    `,
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: 'onclick', description: 'Triggered when the avatar container is clicked.', properties: [
      { name: 'event', type: 'MouseEvent', description: 'The click event object.' }
    ]}
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>