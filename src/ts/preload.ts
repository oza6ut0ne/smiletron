import window from './window'
if (process.env.NODE_ENV === 'development') {
    window.__devtron = { require: require, process: process }
}