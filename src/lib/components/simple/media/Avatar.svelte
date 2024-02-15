<script lang="ts">
  import './Avatar.css'
  import '../../../css/main.css'

  export let src: string,
    alt: string = "",
    referrerpolicy: ReferrerPolicy | null | undefined = "no-referrer"
</script>


<img
  class="avatar"
  {src}
  {alt}
  {referrerpolicy}
/>

<style>
  .avatar {
    width: var(
      --avatar-width,
      var(--avatar-default-width)
    );
    height: var(
      --avatar-height,
      var(--avatar-default-height)
    );
    min-width: var(--avatar-min-width);
    max-width: var(--avatar-max-width);
    height: var(
      --avatar-height,
      var(--avatar-default-height)
    );
    min-height: var(--avatar-min-height);
    max-height: var(--avatar-max-height);
    border-radius: var(
      --avatar-border-radius,
      var(--avatar-default-border-radius)
    );
    object-fit: cover;
  }
</style>
