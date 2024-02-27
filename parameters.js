
export const calls = Number(process.argv[2]) || 100;
export const concurrent = Number(process.argv[3]) || 20;
export const retries = Number(process.argv[4]) || 0;
export const failRate = 0.2;
export const showLogs = process.argv.includes("--noLogs") ? false : true;