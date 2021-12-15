// wdio.minibrowser-heroku.conf.js

/**
 * This configuration file connects to the WebKitGTK2-based browser, MiniBrowser. 
 * Safari is one of the three most commonly used browsers, but to run it requires
 * expensive Apple hardware which cannot be virtualized in the cloud in a cost-effective
 * manner.  
 * 
 * MiniBrowser, like Safari, is based on the WebKit browser engine, and MiniBrowser runs
 * natively in Linux. Thus, MiniBrowser may be a suitable alternative to testing directly
 * on Apple's Safari browser.
 * 
 * Additionally, MiniBrowser can be deployed on a Docker image locally, or deployed to
 * a cloud platform, such as Heroku.
 * 
 * This configuration file connects to a cloud container service, as configured in the 
 * hidden .env file or by setting the following environment variables:
 * 
 * CLOUD_CONTAINER_APP_URL=https://YOUR_APP.herokuapp.com
 * CLOUD_CONTAINER_ACCESS_TOKEN=YOUR_CONTAINER_ACCESS_TOKEN (ex: set in Config Vars in Heroku app settings)
 * CLOUD_CONTAINER_ARCH=x86_64 by default
 */

require('dotenv').config();
const merge = require('deepmerge');
const config = {};
config.default = require('./wdio.conf.js').config;

const video = require('wdio-video-reporter');

const ARCH = process.env.CLOUD_CONTAINER_ARCH === undefined
    ? 'x86_64' 
    : process.env.CLOUD_CONTAINER_ARCH;

// insert modified configuration inside
config.override = {
    debug: true,
    execArgv: ['--inspect=127.0.0.1:9229'],
    port: 443,
    protocol: 'https',
    hostname: process.env.CLOUD_CONTAINER_APP_URL,
    headers: {
        'authorization': 'Bearer ' + process.env.CLOUD_CONTAINER_ACCESS_TOKEN
    },
    strictSSL: true,
    logLevel: 'warn',
    specLogLevel: 'debug',   // log level for logger.js
    services: ['eslinter'],
    capabilities: [{
        maxInstances: 1,
        browserName: 'MiniBrowser',
        browserVersion: '2.34.1',
        'webkitgtk:browserOptions': {
            args: [
                '--automation'
            ],
            binary: `/usr/lib/${ARCH}-linux-gnu/webkit2gtk-4.0/MiniBrowser`
        }
    }],
    mochaOpts: {
        ui: 'bdd',
        // 60 secs or 20 minutes - larger value helps prevent the browser closing while debugging
        timeout: 60000 //1200000
    },
    /*
     * In the onPrepare hook, we instruct WebdriverIO to wait for the cloud service health check
     * to return a 200 OK status code. The health check will recheck the server once every
     * 4 seconds (retryTimeout) and make at least 5 attempts (maxAttempts) before terminating 
     * the wdio runner.
     */
    onPrepare(config, capabilities) {
        const opts = {
            retryTimeout: 4000,
            maxAttempts: 5
        }
        const https = require('https');
        const wdioLogger = require('@wdio/logger').default;
        const logger = wdioLogger('wdio-cloud-container-service');
        var attempts = 0;
        logger.warn('Warming up Cloud Container host at: ' + config.hostname + '...');
        const webdriverPath = config.path === undefined ? '' : config.path;
        return new Promise((resolve, reject) => {
            const healthCheckInterval = setInterval(() => {
                console.log(`${config.protocol}://${config.hostname}:${config.port}${webdriverPath}/status`);
                https.get(`${config.protocol}://${config.hostname}:${config.port}${webdriverPath}/status`, {
                    headers: {
                        'authorization': 'Bearer ' + process.env.CLOUD_CONTAINER_ACCESS_TOKEN
                    }
                }, res => {
                    if (++attempts > opts.maxAttempts) {
                        logger.error('Problem launching Cloud Container service. Status: ' + res.statusCode);
                        clearInterval(healthCheckInterval);
                        reject(new Error('Cloud Container Service failed'));
                        return;
                    }
                    let data = [];
                    //logger.warn('Status Code:', res.statusCode);

                    res.on('data', chunk => {
                        data.push(chunk);
                    });

                    res.on('end', () => {
                        //logger.warn('Response ended: ');
                        if (res.statusCode >= 200 && res.statusCode < 400) {
                            clearInterval(healthCheckInterval);
                            resolve();
                        } else {
                            logger.warn('Waiting for Cloud Container service to launch... Status code: ' + res.statusCode);
                        }
                    });
                }).on('error', err => {
                    console.log('Error: ', err.message);
                    reject(err.message);
                });
            }, opts.retryTimeout);
        }).catch((err) => {
            logger.error('SEVERE: Cloud Container service failed to launch. Exiting...');
            process.exit(1);
        });
    }
};

// overwrite any arrays in default with arrays in override.
const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

// have main config file as default but overwrite environment specific information
exports.config = merge(config.default, config.override, { arrayMerge: overwriteMerge, clone: false });
