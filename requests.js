"use strict";

import { calls, concurrent, retries, failRate, showLogs } from "./parameters.js";

let counter = 0;

const getTime = function(){
    const time = performance.now();
    return (Math.round(time/10)/100);
}

const writeLog = function(message){
    if(!showLogs) return;
    console.log(message);
}

const sleep = async function (delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('ok');
        }, delay * 1000);
    });
};

class AsyncCall {
    constructor(_func, _parameters, _retries = 0, _retryCondition, _initialDelay = 1) {
        this.delayMultiplier = 1.5;
        this.func = _func;
        this.parameters = _parameters;
        this.retries = _retries;
        this.retryCondition = _retryCondition;
        this.initialDelay = _initialDelay;
        this.origRetries = _retries;
    }
    async call(waitingTime = this.initialDelay) {
        try {
            let result;
            if (typeof this.func !== 'function') {
                throw new Error(`Cannot call an invalid function: ${JSON.stringify(this.func)}`);
            }
            if (Array.isArray(this.parameters)) {
                result = await this.func(...this.parameters);
            }
            else if (this.parameters === null) {
                result = await this.func();
            }
            else {
                throw new Error(`Invalid parameters given: ${JSON.stringify(this.parameters)}`);
            }
            const willRetry = await this.retryCondition(result);

            if (willRetry && this.retries > 0) {
                writeLog(`Waiting for ${waitingTime} seconds for request ${this.parameters[0]}`);
                this.retries--;
                counter++;
                await sleep(waitingTime);
                writeLog(`Retry ${this.origRetries - this.retries} for Request ${this.parameters[0]}.`);
                return await this.call(waitingTime * this.delayMultiplier);
            }
            else {
                return result;
            }
        }
        catch (error) {
            const willRetry = await this.retryCondition(error);

            if (willRetry && this.retries > 0) {
                writeLog(`Waiting for ${waitingTime} seconds for request ${this.parameters[0]}`);
                this.retries--;
                counter++;
                await sleep(waitingTime);
                writeLog(`Retry ${this.origRetries - this.retries} for Request ${this.parameters[0]}.`);
                return await this.call(waitingTime * this.delayMultiplier);
            }
            else {
                throw error;
            }
        }
    }
}
const chunkPromises = async (functionCalls, concurrencyLimit = 10, fallback = null) => {
    try {
        const chunkSize = concurrencyLimit > functionCalls.length ? functionCalls.length : concurrencyLimit;
        let upperBound = chunkSize;
        let index = 0;
        const chunks = [];
        let finalResult = [];
        for (let i = 0; i < functionCalls.length; i++) {
            if (i >= upperBound) {
                upperBound += chunkSize;
                index++;
            }
            if (chunks[index]) {
                chunks[index].push(functionCalls[i]);
            }
            else {
                chunks[index] = [functionCalls[i]];
            }
        }
        for (let i = 0; i < chunks.length; i++) {
            const partialResult = await Promise.allSettled(chunks[i].map((fnCall) => {
                return fnCall.call();
            }));
            // console.log(`Partial result from index:${i * chunkSize} to ${i * chunkSize + chunkSize - 1}: ${JSON.stringify(partialResult)}`);
            finalResult = finalResult.concat(partialResult);
        }
        // console.log(`Final result: ${JSON.stringify(finalResult)}`);
        return finalResult.map((res) => (res.status === 'fulfilled' ? res.value : fallback));
    }
    catch (error) {
        console.error(`In Chunking promises, service returned an error: ${error}`);
        const arr = new Array(functionCalls.length);
        return arr.fill(fallback);
    }
};

//API Call Mocked: Takes 1-2 seconds, throws an error
const mockAPI = async function (x = 10) {
    try {
        writeLog(`Request ${x} start: ${getTime()}`);
        await sleep(Math.random() * 1 + 1);
        const random = Math.random();
        if (random > failRate) {
            writeLog(`Request ${x} finish: ${getTime()}`);
            return [];
        }
        else {
            writeLog(`Request ${x} error: ${getTime()}`);
            throw new Error('Internal Server Error');
        }
    }
    catch (error) {
        throw error;
    }
};


//API Call Mocked: Takes 1-2 seconds, returns null
const mockAPI2 = async function (x = 10) {
    try {
        writeLog(`Request ${x} start: ${getTime()}`);
        await sleep(Math.random() * 1 + 1);
        const random = Math.random();
        if (random > failRate) {
            writeLog(`Request ${x} finish: ${getTime()}`);
            return [];
        }
        else {
            writeLog(`Request ${x} error: ${getTime()}`);
            throw new Error('Internal Server Error');
        }
    }
    catch (error) {
        return null;
    }
};

const setup = async function () {
    const requests = [];

    for (let i = 0; i < calls; i++) {
        //4th parameter is the retry condition:
        //If the function returns true, the retry will be triggered, 
        const request = new AsyncCall(i%2 === 0? mockAPI : mockAPI2, [i], retries, (res) => {
            return res === null || res.message === 'Internal Server Error';
        }, 1);
        requests.push(request);
    }

    const startTime = getTime();
    const result = await chunkPromises(requests, concurrent);
    const runTime = getTime() - startTime;
    const countNull = result.filter((res) => res === null).length;
    
    console.log(`Params: Retries: ${retries}, Calls: ${calls}, Concurrent: ${concurrent}`);
    console.log(`Total Retries: ${counter}, Total Nulls: ${countNull}, Total Runtime: ${runTime}`);
    writeLog(`Result: ${JSON.stringify(result)}`)
};


setup();
