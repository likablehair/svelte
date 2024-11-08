<script lang="ts">
  import '../../../css/main.css'
  import './Skeleton.css'
</script>

<div
  class="skeleton"
></div>

<style>

  .skeleton {
    background: var(
      --skeleton-card-background,
      var(--skeleton-default-card-background)
    );
    width: var(
      --skeleton-card-width,
      var(--skeleton-default-card-width)
    );
    height: var(
      --skeleton-card-height,
      var(--skeleton-default-card-height)
    );
    max-width: var(
      --skeleton-card-max-width,
      var(--skeleton-default-card-max-width)
    );
    max-height: var(
      --skeleton-card-max-height,
      var(--skeleton-default-card-max-height)
    );
    min-width: var(
      --skeleton-card-min-width,
      var(--skeleton-default-card-min-width)
    );
    min-height: var(
      --skeleton-card-min-height,
      var(--skeleton-default-card-min-height)
    );
    padding: var(
      --skeleton-card-padding,
      var(--skeleton-default-card-padding)
    );
    position: relative;
    border-radius: 5px;
    box-shadow: 0 10px 100px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  @keyframes loading {
    0% {
      transform: skewX(-10deg) translateX(-100%);
    }
    100% {
      transform: skewX(-10deg) translateX(200%);
    }
  }

  .skeleton::before {
    content: "";
    position: absolute;
    background: linear-gradient(
      90deg,
      transparent,
      var(
        --skeleton-animation-color,
        var(--skeleton-default-animation-color)
      ),
      transparent
    );
    width: 50%;
    height: 100%;
    top: 0;
    left: 0;
    animation: loading 1.2s infinite;
  }
</style>
