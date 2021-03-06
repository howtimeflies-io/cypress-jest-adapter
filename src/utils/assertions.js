import * as asyncMatchers from 'expect/build/asymmetricMatchers'
import jestExpect from 'expect'
import matchers from './matchers'
import { enhanceAsyncMatcherToStringFn, isPromise } from './utils'

export default function(chai, utils) {
  const Assertion = chai.Assertion
  const flag = utils.flag
  const assertMethods = matchers(chai, utils)

  Object.keys(assertMethods).forEach(name => {
    Assertion.addMethod(name, assertMethods[name])
  })

  Assertion.addProperty('resolves', function() {
    const received = flag(this, 'object')
    if (!isPromise(received)) {
      throw new Error(`resolves: test value must be a Promise.`)
    }

    const methods = { not: {} }
    Object.keys(assertMethods).forEach(name => {
      methods[name] = (...args) => {
        return received.then(
          fulfillmentValue => {
            flag(this, 'object', fulfillmentValue)
            return assertMethods[name].apply(this, args)
          },
          error =>
            (() => {
              throw new Error(
                `resolves: Received promise rejected instead of resolved. Rejected message: ${
                  error.message
                }`
              )
            }).apply(this)
        )
      }
      methods.not[name] = (...args) => {
        return received.then(
          fulfillmentValue => {
            flag(this, 'negate', true)
            flag(this, 'object', fulfillmentValue)
            return assertMethods[name].apply(this, args)
          },
          error =>
            (() => {
              throw new Error(
                `resolves: Received promise rejected instead of resolved. Rejected message: ${
                  error.message
                }`
              )
            }).apply(this)
        )
      }
    })
    return methods
  })
  Assertion.addProperty('rejects', function() {
    const received = flag(this, 'object')
    if (!isPromise(received)) {
      throw new Error(`rejects: test value must be a Promise.`)
    }

    const methods = { not: {} }
    Object.keys(assertMethods).forEach(name => {
      methods[name] = (...args) => {
        return received.then(
          fulfillmentValue =>
            (() => {
              throw new Error(
                `rejects: Received promise resolved instead of rejected. Resolved value: ${fulfillmentValue}`
              )
            }).apply(this),
          error => {
            if (name === 'toThrow') {
              flag(this, 'object', () => {
                throw error
              })
            } else {
              flag(this, 'object', error)
            }
            return assertMethods[name].apply(this, args)
          }
        )
      }
      methods.not[name] = (...args) => {
        return received.then(
          fulfillmentValue =>
            (() => {
              throw new Error(
                `rejects: Received promise resolved instead of rejected. Resolved value: ${fulfillmentValue}`
              )
            }).apply(this),
          error => {
            flag(this, 'negate', true)
            if (name === 'toThrow') {
              flag(this, 'object', () => {
                throw error
              })
            } else {
              flag(this, 'object', error)
            }
            return assertMethods[name].apply(this, args)
          }
        )
      }
    })
    return methods
  })

  expect.anything = enhanceAsyncMatcherToStringFn(
    asyncMatchers.anything,
    () => `Anything`
  )
  expect.any = enhanceAsyncMatcherToStringFn(
    asyncMatchers.any,
    args => `Any ${args.name}`
  )
  expect.arrayContaining = enhanceAsyncMatcherToStringFn(
    asyncMatchers.arrayContaining,
    args => `Array Containing [${args}]`
  )
  expect.objectContaining = enhanceAsyncMatcherToStringFn(
    asyncMatchers.objectContaining,
    args => `Object Containing {${JSON.stringify(args)}}`
  )
  expect.stringContaining = enhanceAsyncMatcherToStringFn(
    asyncMatchers.stringContaining,
    args => `String Containing ${args}`
  )
  expect.stringMatching = enhanceAsyncMatcherToStringFn(
    asyncMatchers.stringMatching,
    args => `String Matching ${args}`
  )
  expect.not = {
    arrayContaining: enhanceAsyncMatcherToStringFn(
      asyncMatchers.arrayNotContaining,
      args => `Array Not Containing [${args}]`
    ),
    objectContaining: enhanceAsyncMatcherToStringFn(
      asyncMatchers.objectNotContaining,
      args => `Object Not Containing {${JSON.stringify(args)}}`
    ),
    stringContaining: enhanceAsyncMatcherToStringFn(
      asyncMatchers.stringNotContaining,
      args => `String Not Containing ${args}`
    ),
    stringMatching: enhanceAsyncMatcherToStringFn(
      asyncMatchers.stringNotMatching,
      args => `String Not Matching ${args}`
    )
  }
  expect.assertions = jestExpect.assertions
  expect.hasAsertions = jestExpect.hasAssertions
}
