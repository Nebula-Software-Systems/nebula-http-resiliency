## Timeout strategy

To create a timeout strategy we need to call our policy factory using the _createTimeoutHttpExecutor_ method:

```js
const timeoutPolicyExecutor =
  PolicyExecutorFactory.createTimeoutHttpExecutor({
    timeoutInSeconds: 0.2,
  });
```

The _createTimeoutHttpExecutor_ method takes a [configuration object](../../../src/timeout/models/timeout-policy-type.ts)  to properly configure the timeout policy.

This configuration object only has one self-explanatory property: _timeoutInSeconds_. Whenever your request takes longer than the quantity specific in this property, a timeout error will be thrown under the _error_ property on the [result object](../../result/result.md).