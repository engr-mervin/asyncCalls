# Async Calls Prototype

**To Run:**


```javascript
node requests
```


**Specify parameters:**


```javascript
node requests (numberOfCalls) (numberOfConcurrent) (numberOfRetries) (showLogs)
```

1. **numberOfCalls** is the total number of requests to be sent.
2. **numberOfConcurrent** is the number of requests to be sent simultaneously.
3. **numberOfRetries** is the number of retries a request will have.
4. **showLogs** = any value here except empty ones will show logs.


**Example:**

```javascript
node requests 100 10 0
```

*This will send 100 requests, 10 at a time, with 0 retries and will not show logs.*

**Result:**

```bash
Retries: 0, Calls: 100, Nulls: 43, Runtime: 19.17, Concurrent: 10
```

You can also change the failRate of the **mockAPI** in the *parameters.js* file:

```javascript
export const calls = Number(process.argv[2]) || 100;
export const concurrent = Number(process.argv[3]) || 20;
export const retries = Number(process.argv[4]) || 0;
export const failRate = 0.5; //1 for always fail, 0 for always success
export const showLogs = !!process.argv[5];
```
