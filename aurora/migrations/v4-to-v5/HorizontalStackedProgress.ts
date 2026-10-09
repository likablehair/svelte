import type { ComponentMigration } from '../types.js';

const segmentLabelNote =
	'In v5 the content under a segment is replaced as a whole: `{#snippet segmentLabelSnippet({ item })}…{/snippet}`, writing only the part that was visible (`item.label`, or `item.valueLabel ?? item.value`). Without `segmentLabels` nothing is shown under the segments anyway: then just delete it.';
const legendNote =
	'In v5 the content of a legend entry is replaced as a whole (the colored dot stays): `{#snippet legendItemSnippet({ item })}…{/snippet}`, writing only the part that was visible (`item.label`, or `item.valueLabel ?? item.value`). Without a visible legend (v4 `legendVisible` false, the default) just delete it.';

export default {
	from: 'HorizontalStackedProgress',
	to: 'HorizontalStackedProgress',
	props: {
		renamed: [
			{ from: 'labelVisible', to: 'segmentLabels' },
			{ from: 'legendVisible', to: 'legend' },
			{
				from: 'hideLabelUnderPercentage',
				to: 'minLabelPercentage',
				note: 'Same rule: labels of segments at or below this percentage of the bar are hidden.'
			},
			{
				from: 'tooltipVisible',
				to: 'valueTooltip',
				note: 'The tooltip now reads "label: value" (v4: the value only).'
			}
		],
		removed: [
			{ name: 'labelTextVisible', note: segmentLabelNote, replacement: 'segmentLabelSnippet' },
			{ name: 'labelValueVisible', note: segmentLabelNote, replacement: 'segmentLabelSnippet' },
			{ name: 'legendTextVisible', note: legendNote, replacement: 'legendItemSnippet' },
			{ name: 'legendValueVisible', note: legendNote, replacement: 'legendItemSnippet' }
		],
		defaults: [
			{
				name: 'segmentLabels',
				v4: 'true',
				v5: 'false',
				keepV4: 'segmentLabels',
				note: 'v4 `labelVisible`. v4 wrote labels only under entries with a `label`; v5 writes the value under every segment, so plain-number entries get a value under them too (hide them with `minLabelPercentage` or `segmentLabelSnippet`).'
			},
			{
				name: 'legend',
				v4: 'false',
				v5: 'true',
				keepV4: 'legend={false}',
				note: 'v4 `legendVisible`. With `legend={false}` the legend stays in the page, visually hidden, for screen readers.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--progress-bar-height',
				to: '--horizontal-stacked-progress-height',
				note: 'Only when set on a HorizontalStackedProgress (v4 passed it to an inner ProgressBar per segment).'
			},
			{
				from: '--progress-bar-border-radius',
				to: '--horizontal-stacked-progress-segment-border-radius',
				note: 'Only when set on a HorizontalStackedProgress.'
			},
			{
				from: '--horizontal-stacked-progress-label-gap',
				to: '--horizontal-stacked-progress-segment-label-gap'
			},
			{
				from: '--horizontal-stacked-progress-default-label-gap',
				to: '--horizontal-stacked-progress-default-segment-label-gap'
			},
			{
				from: '--horizontal-stacked-progress-dot-height',
				to: '--horizontal-stacked-progress-dot-size',
				note: 'The dot is square: delete `--horizontal-stacked-progress-dot-width` and `-dot-min-width` on the same usage.'
			},
			{
				from: '--horizontal-stacked-progress-default-dot-height',
				to: '--horizontal-stacked-progress-default-dot-size'
			},
			{
				from: '--horizontal-stacked-progress-value-font-weight',
				to: '--horizontal-stacked-progress-segment-value-font-weight',
				note: 'v4 used it for the value under a segment and in the legend: when the legend is shown, also set `--horizontal-stacked-progress-legend-value-font-weight`.'
			},
			{
				from: '--horizontal-stacked-progress-default-value-font-weight',
				to: '--horizontal-stacked-progress-default-segment-value-font-weight',
				note: 'The legend value reads `--horizontal-stacked-progress-default-legend-value-font-weight`.'
			}
		],
		removed: [
			{
				name: '--horizontal-stacked-progress-dot-width',
				note: 'The dot is square now. If the usage has no `-dot-height`, rename this one to `--horizontal-stacked-progress-dot-size`; otherwise delete it.',
				replacement: '--horizontal-stacked-progress-dot-size'
			},
			{
				name: '--horizontal-stacked-progress-dot-min-width',
				note: 'The dot does not shrink any more. Delete it.'
			},
			{
				name: '--horizontal-stacked-progress-default-dot-width',
				note: 'The dot is square now: the default is `--horizontal-stacked-progress-default-dot-size`.'
			},
			{
				name: '--horizontal-stacked-progress-default-dot-min-width',
				note: 'The dot does not shrink any more. Delete it.'
			},
			{
				name: '--progress-bar-background-color',
				note: 'Only when set on a HorizontalStackedProgress. Segments have no track any more; the part of the bar beyond the entries (with `total`) is `--horizontal-stacked-progress-rest-background`.',
				replacement: '--horizontal-stacked-progress-rest-background'
			},
			{
				name: '--progress-bar-highlight-color',
				note: 'Had no effect on a HorizontalStackedProgress (each segment set its own color). Delete it; set `color` on the entries instead.'
			},
			{
				name: '--progress-bar-width',
				note: 'Only when set on a HorizontalStackedProgress: it sized each inner bar. Delete it; the whole component is `--horizontal-stacked-progress-width`.'
			},
			...[
				['--progress-bar-tooltip-background-color', '--tooltip-background'],
				['--progress-bar-tooltip-border-radius', '--tooltip-border-radius'],
				['--progress-bar-tooltip-padding', '--tooltip-padding']
			].map(([name, replacement]) => ({
				name,
				note: 'Only when set on a HorizontalStackedProgress. The segment tooltips are the v5 `Tooltip`, rendered inside the component: set its variable there.',
				replacement
			}))
		],
		changed: [
			...[
				['label-font-size', 'segment-label-font-size'],
				['label-font-weight', 'segment-label-font-weight']
			].flatMap(([v4, v5]) =>
				['', 'default-'].map((d) => ({
					name: `--horizontal-stacked-progress-${d}${v4}`,
					note: `v4 styled the text under each segment with it; in v5 the same name styles the header \`label\`. Rename it to \`--horizontal-stacked-progress-${d}${v5}\`. The legend text uses \`--horizontal-stacked-progress-${d}legend-font-size\`.`
				}))
			),
			...['', 'default-'].map((d) => ({
				name: `--horizontal-stacked-progress-${d}value-font-size`,
				note: `v4 styled the value under each segment and in the legend with it; in v5 the same name styles the header value (\`showValue\`). Rename it to \`--horizontal-stacked-progress-${d}segment-value-font-size\`. The legend value follows \`--horizontal-stacked-progress-${d}legend-font-size\`.`
			}))
		]
	},
	manual: [
		{
			id: 'horizontal-stacked-progress-look',
			summary:
				'One 12px bar of separate segments with a 3px gap and a legend in a row below (dot, label, value); v4 drew one 5px ProgressBar per segment with a 4px gap, labels under the segments and no legend (when shown: a column of dot, value, label). Default colors come from `--global-color-data-1…6` (v4: shades of primary).',
			action:
				'For the v4 layout apply the `defaults` (`segmentLabels legend={false}`) and pass `--horizontal-stacked-progress-height="5px"`. Where the colors must match other primary-tinted UI, give each entry a `color`.'
		},
		{
			id: 'horizontal-stacked-progress-accessible-name',
			summary:
				'The root is a `role="group"` named by `label`; the bars are hidden from screen readers, which read the legend list instead (also with `legend={false}`).',
			action:
				'Pass `label` (a visible title above the bar) or `aria-label` saying what the bar measures, and give entries a `label` so the legend reads more than numbers.'
		}
	],
	added: [
		'`total`: the entries take `value / total` of the bar and the rest stays empty.',
		'`label`, `labelSnippet`, `showValue`, `valueSnippet({ value, total, percent })`: a header like ProgressBar.',
		'`legendItemSnippet({ item, percentage })`, `segmentLabelSnippet({ item, percentage })`.',
		'The `ProgressItem` type is exported from the package.',
		'`class` and native attributes on the root.',
		'`--horizontal-stacked-progress-rest-background`, `-segment-border-radius`, `-hover-*`, `-legend-*`, `-dot-border-radius`, `-header-gap`, `-duration`.'
	]
} satisfies ComponentMigration;
