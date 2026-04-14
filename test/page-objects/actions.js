import { $ } from '@wdio/globals'

const DEFAULT_TIMEOUT = 10000

const resolve = (target) => (typeof target === 'string' ? $(target) : target)

export const clickWhenReady = async (target, timeoutMsg) => {
  const element = await resolve(target)
  await element.waitForClickable({ timeout: DEFAULT_TIMEOUT, timeoutMsg })
  return element.click()
}

export const setValueWhenReady = async (target, value, timeoutMsg) => {
  const element = await resolve(target)
  await element.waitForDisplayed({ timeout: DEFAULT_TIMEOUT, timeoutMsg })
  return element.setValue(value)
}
