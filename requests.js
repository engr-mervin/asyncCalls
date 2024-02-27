"use strict";

import { calls, concurrent, retries, failRate, showLogs } from "./parameters.js";


const getTime = function(){
    const time = performance.now();
    return (Math.round(time/10)/100);
}

const sleep = async function (delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('ok');
        }, delay * 1000);
    });
};

class AsyncCall {
    constructor(_func, _parameters, _retries = 0, _retryCondition) {
        this.delayMultiplier = 1.5;
        this.func = _func;
        this.parameters = _parameters;
        this.retries = _retries;
        this.retryCondition = _retryCondition;
    }
    async call(waitingTime = 0.5) {
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
                if(showLogs){
                    console.log(`Waiting for ${waitingTime} seconds for request ${this.parameters[0]}`);
                }
                this.retries--;

                await sleep(waitingTime);

                
                if(showLogs){
                    console.log(`Retrying Request ${this.parameters[0]}.`);
                }
                return await this.call(waitingTime * this.delayMultiplier);
            }
            else {
                return result;
            }
        }
        catch (error) {
            if (this.retries === 0) {
                throw error;
            }
            if(showLogs){
                console.log(`Retrying Request ${this.parameters[0]}.`);
            }
            this.retries--;
            await sleep(waitingTime);
            return await this.call(waitingTime * this.delayMultiplier);
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

//API Call Mocked: Takes 1-2 seconds, 20% Error, 80% success
const mockAPI = async function (x = 10) {
    try {
        if(showLogs){
            console.log(`Request ${x} start: ${getTime()}`);
        }
        await sleep(Math.random() * 1 + 1);


        const random = Math.random();
        if (random > failRate) {
             
            if(showLogs){
                console.log(`Request ${x} finish: ${getTime()}`);
            }
            return [];
        }
        else {
            if(showLogs){
                console.log(`Request ${x} error: ${getTime()}`);
            }
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
        const request = new AsyncCall(mockAPI, [i], retries, (res) => {
            return res === null;
        });
        requests.push(request);
    }

    const startTime = getTime();
    const result = await chunkPromises(requests, concurrent);
    const runTime = getTime() - startTime;
    const countNull = result.filter((res) => res === null).length;
    console.log(`Retries: ${retries}, Calls: ${calls}, Nulls: ${countNull}, Runtime: ${runTime}, Concurrent: ${concurrent}`);
    if(showLogs){
        console.log(`Result: ${JSON.stringify(result)}`)
    }
};


setup();
