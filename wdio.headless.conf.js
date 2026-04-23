import allure from 'allure-commandline'

const oneMinute = 60 * 1000

const execArgv = ['--loader', 'esm-module-alias/loader']

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.e2e.js'],
  exclude: [],
  maxInstances: 1,

  capabilities: [
    {
      maxInstances: 1,
      browserName: 'chrome',
      browserVersion: 'stable',
      'goog:chromeOptions': {
        args: [
          '--no-sandbox',
          '--disable-infobars',
          '--headless',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      }
    }
  ],

  execArgv,
  logLevel: 'info',
  logLevels: {
    webdriver: 'error'
  },
  bail: 1,
  baseUrl: 'http://localhost:3002',
  waitforTimeout: 10000,
  waitforInterval: 200,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results'
      }
    ]
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: oneMinute
  },

  afterTest: async function (
    test,
    context,
    { error, result, duration, passed, retries }
  ) {
    if (error) {
      await browser.takeScreenshot()
    }
  },

  onComplete: function (exitCode, config, capabilities, results) {
    const reportError = new Error('Could not generate Allure report')
    const generation = allure(['generate', 'allure-results', '--clean'])

    return new Promise((resolve, reject) => {
      const generationTimeout = setTimeout(() => reject(reportError), oneMinute)

      generation.on('exit', function (exitCode) {
        clearTimeout(generationTimeout)

        if (exitCode !== 0) {
          return reject(reportError)
        }

        resolve()
      })
    })
  }
}
