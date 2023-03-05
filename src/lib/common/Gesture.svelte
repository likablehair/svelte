<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  // TODO export the handler into a service to avoid mount 3 listeners for every component instance
  export let timeThreshold = 200,
    diagonalThreshold = 100;

  let lastTouch, startTouch: Touch, endTouch, startTime: Date, endTime: Date;
  function handleTouchStart(event: TouchEvent) {
    lastTouch = event.touches[0];
    startTouch = event.touches[0];
    startTime = new Date();
  }

  function handleTouchEnd(event: TouchEvent) {
    endTouch = event.changedTouches[0];
    endTime = new Date();

    let timeDifference = endTime.getTime() - startTime.getTime();
    if (timeDifference < timeThreshold) {
      let direction: "up" | "left" | "down" | "right";

      let xDifference: number = endTouch.clientX - startTouch.clientX;
      let yDifference: number = endTouch.clientY - startTouch.clientY;

      // check if is diagonal swipe
      if (
        Math.abs(Math.abs(xDifference) - Math.abs(yDifference)) <
        diagonalThreshold
      )
        return;

      if (Math.abs(xDifference) > Math.abs(yDifference)) {
        // horizontal
        if (xDifference > 0) {
          direction = "right";
        } else {
          direction = "left";
        }
      } else {
        // vertical
        if (yDifference > 0) {
          direction = "down";
        } else {
          direction = "up";
        }
      }

      dispatch("swipe-" + direction, {
        direction: direction,
        timeDifference: timeDifference,
        xDifference: xDifference,
        yDifference: yDifference,
      });

      dispatch("swipe", {
        direction: direction,
        timeDifference: timeDifference,
        xDifference: xDifference,
        yDifference: yDifference,
      });
    }
  }

  function handleTouchMove(event: TouchEvent) {
    let currentTouch = event.changedTouches[0];
    lastTouch = currentTouch;
  }
</script>

<svelte:window
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  on:touchmove={handleTouchMove}
/>
