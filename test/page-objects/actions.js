const DEFAULT_TIMEOUT = 10000

export const clickWhenReady = async (element, timeoutMsg) => {
  await element.waitForClickable({ timeout: DEFAULT_TIMEOUT, timeoutMsg })
  return element.click()
}

export const setValueWhenReady = async (element, value, timeoutMsg) => {
  await element.waitForDisplayed({ timeout: DEFAULT_TIMEOUT, timeoutMsg })
  return element.setValue(value)
}
