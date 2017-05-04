'use strict'

const assert = require('assert')
const co = require('co')
const extend = require('lodash/fp/extend')
const map = require('lodash/fp/map')
const GitHubApi = require('github')
const promisify = require('es6-promisify')

const defaultOptions = {
  // required
  version: '3.0.0',
  // optional
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  headers: {
    'user-agent': 'Copy-GitHub-Labels', // GitHub is happy with a unique user agent
  },
}

let exp = {}

const authenticate = credentials => {
  exp.github.authenticate(credentials)
}

/**
 * Copies labels from source to destination
 * @method copy
 * @param {String|Object} options.source - Source repo, either a string like
 *   'user/repo' or an object of the form { user, repo }
 * @param {String|Object} options.destination - Destination repo, either a
 *   string like 'user/repo' or an object of the form { user, repo }
 * @param {Boolean} options.dryRun - whether or not to actually copy the labels
 * @returns {Promise.<undefined>} The promise to copy the labels
 */
const copy = co.wrap(function* ({ source, destination, dryRun = false }) {
  const sourceRepository = parseRepo(source)
  const destinationRepository = parseRepo(destination)

  assert(sourceRepository, 'Invalid source repository')
  assert(destinationRepository, 'Invalid destination repository')

  // Get all labels from source
  const getLabels = promisify(exp.github.issues.getLabels).bind(exp.github.issues)
  const createLabel = promisify(exp.github.issues.createLabel).bind(exp.github.issues)

  const labels = yield getLabels(sourceRepository)

  const results = yield map(label => {
    if (dryRun) { return label }
    return createLabel({
      user: destinationRepository.user,
      repo: destinationRepository.repo,
      name: label.name,
      color: label.color,
    })
  })(labels)

  // If the response contains a link header with rel="next", then
  // fetch the following page because there are more labels available
  if (labels.meta && labels.meta.link) {
    if (labels.meta.link.indexOf('rel="next"') !== -1) {
      sourceRepository.page += 1
      return yield exp.copy({
        source: sourceRepository,
        destination: destinationRepository,
        dryRun,
      })
    }
  }
  return results
})

/**
 * Deletes all labels from given repo
 * @method deleteAllLabels
 * @param {String|Object} options.repo - Target repo, either a string like
 *   'user/repo' or an object of the form { user, repo }
 * @param {Boolean} options.dryRun - whether or not to actually delete the labels
 * @returns {Promise.<undefined>} The promise to delete the labels
 */
const deleteAllLabels = co.wrap(function* ({ repo, dryRun = false }) {
  const repository = parseRepo(repo)
  assert(repository, 'Invalid repository')

  // Get all labels from source
  const getLabels = promisify(exp.github.issues.getLabels).bind(exp.github.issues)
  const deleteLabel = promisify(exp.github.issues.deleteLabel).bind(exp.github.issues)

  const labels = yield getLabels(repository)

  const results = yield map(label => {
    if (dryRun) { return label }
    return deleteLabel({
      user: repository.user,
      repo: repository.repo,
      name: label.name,
    })
  })(labels)

  // If the response contains a link header with rel="next", then
  // fetch the following page because there are more labels available
  if (labels.meta && labels.meta.link) {
    if (labels.meta.link.indexOf('rel="next"') !== -1) {
      repository.page += 1
      return yield exp.deleteAllLabels({ repo: repository, dryRun })
    }
  }
  return results
})

/**
 * Parse repository
 *
 * Accepts string like:
 *
 * 'jvandemo/copy-github-labels'
 *
 * or objects like:
 *
 * {
 *   user: 'jvandemo',
 *   repo: 'copy-github-labels'
 * }
 * @param repo
 * @returns {*}
 */
const parseRepo = input => {
  if (typeof input === 'string') {
    const parts = input.split('/')
    if (parts.length < 2) return null
    return {
      user: parts[0],
      repo: parts[1],
      page: 1,
    }
  }
  if (input && input.user && input.repo) {
    if (!input.hasOwnProperty('page')) input.page = 1
    return input
  }
  return null
}

const init = (opts = {}) => {
  const options = extend(defaultOptions)(opts)
  const github = new GitHubApi(options)
  exp = {
    authenticate,
    copy,
    deleteAllLabels,
    github,
    options,
  }
  return exp
}

module.exports = init