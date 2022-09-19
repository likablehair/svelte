import '@testing-library/jest-dom'
import { fireEvent, getByTestId, render } from '@testing-library/svelte'
import ButtonPlayground from './Button/+page.svelte'

test('shows proper slots when rendered', async () => {
  const { getByText } = render(ButtonPlayground, {})

  const button = getByText('ButtonWithAccount')
  const accountSpanIcon = getByTestId(button, 'account-icon')
  expect(accountSpanIcon).not.toBeNull()

  await fireEvent.click(button)
})


test('button clicks properly ', async () => {
  const { getByText } = render(ButtonPlayground, {})

  const button = getByText('ButtonToClick')

  await fireEvent.click(button)
})