import lodash from "lodash"

let list: {
  title: string,
  description: string,
  status: 'stable' | 'beta' | 'deprecated',
  url: string
}[] = [
  {
    title: 'Theming',
    description: 'Is always hard to chose the right style for your application.',
    status: 'stable',
    url: '/docs/theming'
  }, {
    title: 'Class attribute',
    description: 'Every components will have a class attribute, that will let you specify all the classes you want to apply to the root element of the components.',
    status: 'stable',
    url: '/docs/theming#class-attribute'
  }
]

export default lodash.sortBy(list, 'title')