export function scrollAtCenter(
  parentElement: HTMLElement,
  targetElement: HTMLElement,
  mode: ScrollBehavior
): void {
  const parentElementHeight: number = parentElement.offsetHeight;
  const targetElementheight: number = targetElement.offsetHeight;
  parentElement.scroll({
    top:
      targetElement.offsetTop -
      parentElement.offsetTop -
      (parentElementHeight - targetElementheight) / 2,
    behavior: mode,
  });
}

export function scrollInMenu(
  parentElement: HTMLElement,
  targetElement: HTMLElement,
  mode: ScrollBehavior
): void {
  const parentElementHeight: number = parentElement.offsetHeight;
  const targetElementheight: number = targetElement.offsetHeight;

  parentElement.scroll({
    top:
      targetElement.offsetTop -
      (parentElementHeight - targetElementheight),
    behavior: mode,
  });
}
