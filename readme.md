# Async Calls Prototype

**To Run:**


```javascript
node requests
```


**Specify parameters:**


```javascript
node requests (numberOfCalls) (numberOfConcurrent) (numberOfRetries) --noLogs
```

1. **numberOfCalls** is the total number of requests to be sent.
2. **numberOfConcurrent** is the number of requests to be sent simultaneously.
3. **numberOfRetries** is the number of retries a request will have.
4. **showLogs** = any value here except empty ones will show logs.


**Example:**

```javascript
node requests 100 10 0
```

*This will send 100 requests, 10 at a time and with 0 retries*

**Logs:**

```bash
Params: Retries: 0, Calls: 100, Concurrent: 10
Total Retries: 0, Total Nulls: 17, Total Runtime: 19.03
Result: [[],[],[],[],[],[],[],[],[],[],null,null,[],[],null,[],[],[],null,
[],[],[],[],null,[],[],[],null,null,[],[],[],[],null,[],[],[],[],[],[],[],
[],[],[],[],[],null,[],[],[],[],[],[],[],[],[],[],[],[],[],null,[],[],[],
null,[],[],[],[],[],null,null,[],[],[],[],null,[],[],[],[],[],null,[],[],
[],[],[],[],[],[],[],[],[],null,[],[],[],[],null]
```

**Example:**

```javascript
node requests 100 30 2
```

**Logs:**

```javascript
Request 0 start: 0.03
Request 1 start: 0.03
Request 2 start: 0.04
Request 3 start: 0.04
Request 4 start: 0.04
Request 5 start: 0.04
Request 6 start: 0.04
Request 7 start: 0.04
Request 8 start: 0.04
Request 9 start: 0.04
...
Params: Retries: 2, Calls: 100, Concurrent: 30
Total Retries: 26, Total Nulls: 0, Total Runtime: 22.68
Result: [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[]]
```

**Example:**

```javascript
node requests 100 100 0 --noLogs
```

**Logs:**

```javascript
Params: Retries: 0, Calls: 100, Concurrent: 100
Total Retries: 0, Total Nulls: 22, Total Runtime: 2
```

You can also change the failRate of the **mockAPI** in the *parameters.js* file:

```javascript
export const calls = Number(process.argv[2]) || 100;
export const concurrent = Number(process.argv[3]) || 20;
export const retries = Number(process.argv[4]) || 0;
export const failRate = 0.2;
export const showLogs = process.argv.includes("--noLogs") ? false : true;
```
