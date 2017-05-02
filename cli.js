#!/usr/bin/env node

'use strict'

const meow = require('meow')
const chalk = require('chalk')
const get = require('lodash/fp/get')
const map = require('lodash/fp/map')

const count = 0

const cli = meow(
  {
    help: [
      'Usage',
      '  $ copy-github-labels -t <token> <source-repo> <destination-repo>',
      '',
      'Options',
      "  -d           Dry run, don't actually copy anything",
      '  -t, --token  Token to authenticate with GitHub API',
      '',
      'Examples',
      '  $ copy-github-labels -t token jvandemo/source-repo jvandemo/destination-repo',
    ],
  },
  {
    boolean: ['d'],
    alias: {
      t: 'token',
    },
  }
)

if (!cli.flags.token) {
  cli.showHelp(1)
}

if (cli.input.length < 2) {
  cli.showHelp(1)
}

const source = cli.input[0]
const destination = cli.input[1]

console.log({ source, destination })

const options = {
  dryRun: cli.flags.d,
}
const copyGitHubLabels = require('./index')(options)

copyGitHubLabels.authenticate({
  type: 'token',
  token: cli.flags.token,
})

if (cli.flags.d) {
  console.log(chalk.yellow('Dry run, no labels are copied for real:'))
}

/**
 * Copy labels.
 *
 * The returned label looks like this:
 * {
 *   "url":"https://api.github.com/repos/jvandemo/testje/labels/effort2:%20medium%20(day)",
 *   "name":"effort2: medium (day)",
 *   "color":"bfe5bf",
 *   "meta":{
 *     "x-ratelimit-limit":"5000",
 *     "x-ratelimit-remaining":"4832",
 *     "x-ratelimit-reset":"1444192372",
 *     "x-oauth-scopes":"gist, repo, user",
 *     "location":"https://api.github.com/repos/jvandemo/testje/labels/effort2:%20medium%20(day)",
 *     "etag":"\"87c21039795ca6752192f8cfe5954ecb\"",
 *     "status":"201 Created"
 *   }
 * }
 */

copyGitHubLabels.deleteAllLabels({ repo: destination }).then(labels => {
  console.log(labels.join("\n"))
})

copyGitHubLabels.copy({ source, destination }).then(labels => {
  console.log(map(get('name'))(labels).join("\n"))
})

// , function(err, label) {
//   const error = JSON.parse(err)
//   const labelName = 'Unknown label'

//   if (label && label.name) {
//     labelName = label.name
//   }

//   count++

//   if (err) {
//     // If error occurs during first iteration and no label is returned,
//     // it is probably a general error like an invalid token so we should exit
//     // while we still can.
//     // if((!label) && (count === 1)){
//     //   console.error(error.message);
//     //   process.exit(1);
//     // }
//     return console.log(
//       chalk.dim(count + '. ') +
//         chalk.bold(labelName) +
//         ': ' +
//         chalk.red('failed (' + error.message) +
//         ')'
//     )
//   }

//   console.log(chalk.dim(count + '. ') + chalk.bold(labelName) + ': ' + chalk.green('ok'))
// })
