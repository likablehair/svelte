export function scrollAtCenter(parentElement: HTMLElement, targetElement: HTMLElement): void {
  const parentElementHeight: number = parentElement.offsetHeight
  const targetElementheight: number = targetElement.offsetHeight
  parentElement.scroll({
    top: targetElement.offsetTop - parentElement.offsetTop - (parentElementHeight - targetElementheight)/2,
    behavior: "smooth"
  })
}