<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Avatar from "$lib/components/simple/media/Avatar.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>Avatar</h1>
<ComponentSubtitle>Circle Image.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Avatar
    src="/avatars/avatar1.jpeg"
  ></Avatar>
  <Avatar
    src="/no/image.jpg"
    text="FB"
  ></Avatar>
  <Avatar
    text="FP"
  ></Avatar>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'src', type: 'string', description: 'The source URL of the avatar image.', default: 'undefined' },
    { name: 'alt', type: 'string', description: 'The alternative text for the avatar image.', default: '""' },
    { name: 'text', type: 'string', description: 'The fallback text if there is no image or the image is loading.', default: 'undefined' },
    { name: 'referrerpolicy', type: 'ReferrerPolicy', description: 'The referrer policy for the avatar image.', default: '"no-referrer"' },
    { name: 'imageLoadingStatus', type: "'error' | 'success'", description: 'The current loading status of the avatar image.', default: '"success"' },
  ]}
  styleProps={[
    { name: '--avatar-width', type: 'size', description: 'The width of the avatar.', default: '40px' },
    { name: '--avatar-height', type: 'size', description: 'The height of the avatar.', default: '40px' },
    { name: '--avatar-min-width', type: 'size', description: 'The minimum width of the avatar.',  },
    { name: '--avatar-max-width', type: 'size', description: 'The maximum width of the avatar.',  },
    { name: '--avatar-min-height', type: 'size', description: 'The minimum height of the avatar.',  },
    { name: '--avatar-max-height', type: 'size', description: 'The maximum height of the avatar.',  },
    { name: '--avatar-border-radius', type: 'size', description: 'The border radius of the avatar.', default: '9999px' },
    { name: '--avatar-border', type: 'color', description: 'The border color of the avatar.',  },
    { name: '--avatar-background-color', type: 'color', description: 'The background color of the avatar when text is shown.', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--avatar-text-color', type: 'color', description: 'The text color for the fallback text in the avatar.', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--avatar-text-size', type: 'size', description: 'The font size of the fallback text in the avatar.', default: 'calc(var(--avatar-height, var(--avatar-default-height)) - calc(var(--avatar-height, var(--avatar-default-height)) / 1.7))' },
    { name: '--avatar-text-weight', type: 'weight', description: 'The font weight of the fallback text in the avatar.', default: '700' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'children', description: 'Fallback content when there is no image.', default: '<div class="avatar">{text || ""}</div>', }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>