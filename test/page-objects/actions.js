import { $, browser } from '@wdio/globals'

const DEFAULT_TIMEOUT = 10000

const resolve = (target) => (typeof target === 'string' ? $(target) : target)

const waitWith = async (waitFn, timeoutMsg) => {
  try {
    await waitFn({ timeout: DEFAULT_TIMEOUT, timeoutMsg })
  } catch (err) {
    const url = await browser.getUrl().catch(() => '(unknown)')
    err.message = `${err.message} (at ${url})`
    throw err
  }
}

export const clickWhenReady = async (target, timeoutMsg) => {
  const element = await resolve(target)
  await waitWith((opts) => element.waitForClickable(opts), timeoutMsg)
  return element.click()
}

export const setValueWhenReady = async (target, value, timeoutMsg) => {
  const element = await resolve(target)
  await waitWith((opts) => element.waitForDisplayed(opts), timeoutMsg)
  return element.setValue(value)
}
