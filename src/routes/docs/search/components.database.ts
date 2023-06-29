import lodash from "lodash"

let list: {
  title: string,
  description: string,
  status: 'stable' | 'beta' | 'deprecated',
  url: string
}[] = [
  {
    title: 'Button',
    description: 'A button to click',
    status: 'stable',
    url: '/docs/components/simple-components/Button'
  }, {
    title: 'LinkButton',
    description: 'A button that use a link tag',
    status: 'stable',
    url: '/docs/components/simple-components/LinkButton'
  }, {
    title: 'TextField',
    description: 'A simple textfield',
    status: 'deprecated',
    url: '/docs/components/simple-components/TextField'
  }, {
    title: 'Card',
    description: 'A card with header, body and footer. The body is scrollable and the header and footer are fixed',
    status: 'stable',
    url: '/docs/components/simple-components/Card'
  }, {
    title: 'Gesture',
    description: 'Handle touch gesture movements',
    status: 'stable',
    url: '/docs/components/simple-components/Gesture'
  }, {
    title: 'IntersectionObserver',
    description: 'Get if there are intersection with the current viewport',
    status: 'stable',
    url: '/docs/components/simple-components/IntersectionObserver'
  }, {
    title: 'MediaQuery',
    description: 'Get the viewport size and exposed some variable',
    status: 'stable',
    url: '/docs/components/simple-components/MediaQuery'
  }, {
    title: 'Menu',
    description: 'Custom elements that appear on the screen wherever you want them to be positioned',
    status: 'stable',
    url: '/docs/components/simple-components/Menu'
  }, {
    title: 'SimpleTextField',
    description: 'A simple text input',
    status: 'beta',
    url: '/docs/components/simple-components/SimpleTextField'
  }, {
    title: 'AlertBanner',
    description: 'An alert that shows you noticeable information',
    status: 'stable',
    url: '/docs/components/simple-components/AlertBanner'
  }, {
    title: 'Dialog',
    description: 'A dialog for peace',
    status: 'stable',
    url: '/docs/components/simple-components/Dialog'
  }, {
    title: 'DatePicker',
    description: 'Day to change, day to stick to the habits',
    status: 'stable',
    url: '/docs/components/simple-components/DatePicker'
  }, {
    title: 'Autocomplete',
    description: 'Autocompletion out of the limits.',
    status: 'stable',
    url: '/docs/components/simple-components/Autocomplete'
  }, {
    title: 'Chip',
    description: 'Cheap Chip.',
    status: 'stable',
    url: '/docs/components/simple-components/Chip'
  }
]

export default lodash.sortBy(list, 'title')