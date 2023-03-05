<script lang="ts">
  import type { TimeLineItem } from "$lib/timeline/SimpleTimeLine.svelte";

  import SimpleTimeLine from "$lib/timeline/SimpleTimeLine.svelte";

  let items: TimeLineItem[] = [
    {
      name: "dinosaurs",
      title: "Era dei dinosauri",
      description:
        "Do officia in excepteur sint. Esse non consectetur ut veniam qui ullamco sint laboris do elit nostrud enim est.",
      from: new Date(),
      to: new Date(2022, 5, 10),
    },
    {
      name: "spaiens",
      title: "Era dei sapiens",
      description:
        "Veniam fugiat consequat reprehenderit occaecat nostrud exercitation est. Incididunt sint deserunt tempor ut consequat voluptate nulla commodo.",
      from: new Date(2022, 5, 10),
      to: new Date(2022, 6, 15),
    },
    {
      name: "pietra",
      title: "Era della pietra",
      description:
        "Reprehenderit incididunt exercitation duis in excepteur nostrud labore cupidatat nisi dolor enim.",
      from: new Date(2022, 7, 10),
      to: new Date(2022, 8, 15),
    },
  ];
</script>

<div style:display="flex" style:justify-content="center">
  <SimpleTimeLine width="700px" {items} circleAlignment="center" />
</div>

<div
  style:margin-top="30px"
  style:display="flex"
  style:justify-content="center"
>
  <SimpleTimeLine width="600px" timesWidth="120px" {items} singleSided={true} />
</div>

<div
  style:margin-top="30px"
  style:display="flex"
  style:justify-content="center"
>
  <SimpleTimeLine width="600px" timesWidth="120px" {items}>
    <svelte:fragment slot="infos" let:alignment>
      {alignment}
    </svelte:fragment>
  </SimpleTimeLine>
</div>
