const chai = require('chai')
const expect = chai.expect
const CopyGitHubLabels = require('../')

describe('CopyGitHubLabels', function() {
  it('should be a function', function() {
    expect(CopyGitHubLabels).to.be.a('function')
  })
})

describe('copyGitHubLabels', function() {
  var copyGitHubLabels = CopyGitHubLabels()

  it('should be an object', function() {
    expect(copyGitHubLabels).to.be.a('object')
  })

  describe('#authenticate', function() {
    it('should be a function', function() {
      expect(copyGitHubLabels.authenticate).to.be.a('function')
    })
  })

  describe('#copy', function() {
    it('should be a function', function() {
      expect(copyGitHubLabels.copy).to.be.a('function')
    })
  })
})
