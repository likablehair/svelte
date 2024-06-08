import lodash from "lodash"

const list: {
  title: string,
  description: string,
  status: 'stable' | 'beta' | 'deprecated',
  type: 'composed' | 'simple' | 'layout',
  url: string
}[] = [
  {
    title: 'Button',
    description: 'A button to click',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Button'
  }, {
    title: 'LinkButton',
    description: 'A button that use a link tag',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/LinkButton'
  }, {
    title: 'TextField',
    description: 'A simple textfield',
    status: 'deprecated',
    type: 'simple',
    url: '/docs/components/simple-components/TextField'
  }, {
    title: 'Checkbox',
    description: 'A simple checkbox',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Checkbox'
  }, {
    title: 'Card',
    description: 'A card with header, body and footer. The body is scrollable and the header and footer are fixed',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Card'
  }, {
    title: 'Avatar',
    description: 'Circle image.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Avatar'
  }, {
    title: 'DescriptiveAvatar',
    description: 'Circle Image with description',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/DescriptiveAvatar' 
  }, {
    title: 'Gesture',
    description: 'Handle touch gesture movements',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Gesture'
  }, {
    title: 'ProgressBar',
    description: 'Makes some progress to get there.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/ProgressBar'
  }, {
    title: 'IntersectionObserver',
    description: 'Get if there are intersection with the current viewport',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/IntersectionObserver'
  }, {
    title: 'MediaQuery',
    description: 'Get the viewport size and exposed some variable',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/MediaQuery'
  }, {
    title: 'Menu',
    description: 'Custom elements that appear on the screen wherever you want them to be positioned',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Menu'
  }, {
    title: 'SimpleTextField',
    description: 'A simple text input',
    status: 'beta',
    type: 'simple',
    url: '/docs/components/simple-components/SimpleTextField'
  }, {
    title: 'AlertBanner',
    description: 'An alert that shows you noticeable information',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/AlertBanner'
  }, {
    title: 'Dialog',
    description: 'A dialog for peace',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Dialog'
  }, {
    title: 'DatePicker',
    description: 'Day to change, day to stick to the habits',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/DatePicker'
  }, {
    title: 'DatePickerTextField',
    description: 'If you want a date, you\'ll have a date.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/simple-components/DatePickerTextField'
  }, {
    title: 'YearPickerTextField',
    description: 'If you want a year, you\'ll have a year.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/YearPickerTextField'
  }, {
    title: 'TimePicker',
    description: 'Time to change, always time to change',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/TimePicker'
  }, {
    title: 'Autocomplete',
    description: 'Autocompletion out of the limits.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Autocomplete'
  }, {
    title: 'Chip',
    description: 'Cheap Chip.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Chip'
  }, {
    title: 'Drawer',
    description: 'Drop your things in this drawer.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Drawer'
  }, {
    title: 'SelectableVerticalList',
    description: 'Vertical horizon, selectable soul.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/SelectableVerticalList'
  }, {
    title: 'TabSwitcher',
    description: 'Switch to a new tab, switch to a new life.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/TabSwitcher'
  }, {
    title: 'ColorInvertedSelector',
    description: 'A selector with inversion.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/ColorInvertedSelector'
  }, {
    title: 'SimpleTable',
    description: 'Grid beautiful view.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/SimpleTable'
  }, {
    title: 'Paginator',
    description: 'One page at a time.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/Paginator'
  }, {
    title: 'FileInput',
    description: 'One input to control them.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/FileInput'
  },{
    title: 'FileInputList',
    description: 'One list input to list control them.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/FileInputList'
  }, {
    title: 'PaginatedTable',
    description: 'Table and pagination agreement.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/PaginatedTable'
  }, {
    title: 'Filters',
    description: 'Make it easy, make it filter.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/Filters'
  }, {
    title: 'ToggleList',
    description: 'List of toggle button',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/ToggleList'
  }, {
    title: 'AsyncAutocomplete',
    description: 'Autocomplete in different time and space.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/AsyncAutocomplete'
  }, {
    title: 'Dropdown',
    description: 'Easily drop your things down.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/Dropdown'
  }, {
    title: 'AvatarDropdown',
    description: 'Easily choose your avatar.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/AvatarDropdown'
  }, {
    title: 'YearSelector',
    description: 'Select your year.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/YearSelector'
  }, {
    title: 'MenuOrDrawer',
    description: 'Put all the menus in the drawer please.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/MenuOrDrawer'
  }, {
    title: 'MenuOrDrawerOptions',
    description: 'If a menu does not have an option is not a menu.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/MenuOrDrawerOptions'
  }, {
    title: 'ToolTip',
    description: 'A tip for the tool.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/ToolTip'
  }, {
    title: 'StableDividedSideBarLayout',
    description: 'Layout of this doc.',
    status: 'beta',
    type: 'layout',
    url: '/docs/components/layouts/StableDividedSideBarLayout'
  }, {
    title: 'UnstableDividedSideBarLayout',
    description: 'Layout so unstable.',
    status: 'beta',
    type: 'layout',
    url: '/docs/components/layouts/UnstableDividedSideBarLayout'
  }, {
    title: 'GanymedeBarChart',
    description: 'Ganymede Bar Chart.',
    status: 'beta',
    type: 'simple',
    url: '/docs/components/simple-components/GanymedeBarChart'
  }, {
    title: 'GanymedeLineChart',
    description: 'Ganymede Line Chart.',
    status: 'beta',
    type: 'simple',
    url: '/docs/components/simple-components/GanymedeLineChart'
  }, {
    title: 'GanymedePieChart',
    description: 'Ganymede Pie Chart.',
    status: 'beta',
    type: 'simple',
    url: '/docs/components/simple-components/GanymedePieChart'
  }, {
    title: 'DashboardGridShaper',
    description: 'Shape new generation dashboards.',
    status: 'beta',
    type: 'simple',
    url: '/docs/components/simple-components/DashboardGridShaper'
  }, {
    title: 'CountriesAutocomplete',
    description: 'Every nation includes the flag.',
    status: 'beta',
    type: 'composed',
    url: '/docs/components/composed-components/CountriesAutocomplete'
  }, {
    title: 'FlagIcon',
    description: 'No to racism.',
    status: 'stable',
    type: 'simple',
    url: '/docs/components/simple-components/FlagIcon'
  }, {
    title: 'ActivableButton',
    description: 'Activate the power now.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/ActivableButton'
  }, {
    title: 'IconsDropdown',
    description: 'Chose an icon from the list.',
    status: 'stable',
    type: 'composed',
    url: '/docs/components/composed-components/IconsDropdown'
  }, {
    title: 'TreeEditor',
    description: 'Save the trees.',
    status: 'beta',
    type: 'composed',
    url: '/docs/components/composed-components/TreeEditor'
  }
]

export default lodash.sortBy(list, 'title')