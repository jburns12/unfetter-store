/* ~~~ Program Constants ~~~ */

// The maximum amount of tries mongo will attempt to connect
const MAX_NUM_CONNECT_ATTEMPTS = 10;
// The amount of time between each connection attempt in ms
const CONNECTION_RETRY_TIME = 5000;
const MITRE_STIX_URLS = {'enterprise-attack': 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json',
                         'mobile-attack': 'https://raw.githubusercontent.com/mitre/cti/master/mobile-attack/mobile-attack.json',
                         'pre-attack': 'https://raw.githubusercontent.com/mitre/cti/master/pre-attack/pre-attack.json'};

/* ~~~ Vendor Libraries ~~~ */

const fs = require('fs');
const mongoose = require('mongoose');
const url = require('url');
const fetch = require('node-fetch');
const argv = require('yargs')

    .alias('h', 'host')
    .describe('h', 'Host name and/or IP address for MongoDB')
    .default('h', process.env.MONGO_HOST || 'localhost')

    .alias('d', 'database')
    .describe('d', 'Database for MongoDB')
    .default('d', process.env.MONGO_DB || 'stix')

    .alias('p', 'port')
    .describe('p', 'Port for MongoDB')
    .default('p', process.env.MONGO_PORT || 27017)

    .alias('s', 'stix')
    .describe('s', 'File paths for STIX bundles (0 to n)')
    .array('s')

    .alias('e', 'enhanced-stix-properties')
    .describe('e', 'File paths for enhanced STIX properties bundles (0 to n).  Must map to a an existing STIX id')
    .array('e')

    .alias('c', 'config')
    .describe('c', 'File paths for configuration files (0 to n)')
    .array('c')

    .alias('m', 'add-mitre-data')
    .describe('m', 'Option to uploaded STIX data from Mite\'s github')
    .boolean('m')

    .help('help')
    .argv;

/* ~~~ Local Imports ~~~ */

const stixModel = mongoose.model('stix', new mongoose.Schema({
    _id: String,
    stix: {
        created: Date,
        modified: Date
    }
}, { strict: false }), 'stix');
const configModel = mongoose.model('config', new mongoose.Schema({
    _id: String
}, { strict: false }), 'config');

/* ~~~ Utility Functions ~~~ */

function readJson(filePath) {
    let json;
    if (fs.existsSync(filePath)) {
        const string = fs.readFileSync(filePath, 'utf-8');
        json = JSON.parse(string);
    } else {
        console.log(`File Path [${filePath}] not found`);
    }
    return json;
}

function filesToJson(filePaths) {
    return filePaths
        .map(filePath => readJson(filePath))
        .filter(jsonObj => jsonObj);
}

function getMitreData(domain) {
    let instanceOptions = {};

    if (process.env.HTTPS_PROXY_URL && process.env.HTTPS_PROXY_URL !== '') {
        console.log('Attempting to configure proxy');
        const HttpsProxyAgent = require('https-proxy-agent');
        let proxy = url.parse(process.env.HTTPS_PROXY_URL);
        // Workaround for UNABLE_TO_GET_ISSUER_CERT_LOCALLY fetch error due to proxy + self-signed cert
        proxy.rejectUnauthorized = false;
        instanceOptions.agent = new HttpsProxyAgent(proxy);
    } else {
        console.log('Not using a proxy');
    }
    return new Promise((resolve, reject) => {
        fetch(MITRE_STIX_URLS[domain], instanceOptions)
            .then(fetchRes => fetchRes.json())
            .then(fetchRes => {
                let stixToUpload = fetchRes.objects
                    .map(stix => {
                        let retVal = {};
                        retVal._id = stix.id;
                        retVal.stix = {};
                        for(let prop in stix) {
                            if(prop.match(/^x_/) !== null) {
                                if(retVal.extendedProperties === undefined) {
                                    retVal.extendedProperties = {};
                                }
                                retVal.extendedProperties[prop] = stix[prop];
                            } else {
                                retVal.stix[prop] = stix[prop];
                            }
                        }
                        let collectionUuid;

                        if (domain === 'enterprise-attack') {
                            collectionUuid = '95ecc380-afe9-11e4-9b6c-751b66dd541e';
                        }
                        else if (domain === 'mobile-attack'){
                            collectionUuid = '2f669986-b40b-4423-b720-4396ca6a462b';
                        }
                        else {
                            collectionUuid = '062767bd-02d2-4b72-84ba-56caef0f8658'
                        }
                        retVal.metaProperties = {};
                        retVal.metaProperties['collection'] = [];
                        retVal.metaProperties['collection'].push(collectionUuid);
                        return retVal;
                    });
                resolve(stixToUpload);
            })
            .catch(err => reject(err));
    })
}

/* ~~~ Main Function ~~~ */
function run(stixObjects = []) {
    // STIX files
    if (argv['stix'] !== undefined) {
        console.log('Processing the following STIX files: ', argv.stix);
        for (let val of argv.stix) {
            let currFile = [];
            let fileNameArr = val.split('/');
            let collectionName = fileNameArr[fileNameArr.length - 1].split('.')[0];
            let collectionUuid;

            if (collectionName === 'enterprise-attack') {
                collectionUuid = '95ecc380-afe9-11e4-9b6c-751b66dd541e';
            }
            else {
                collectionUuid = '5d2668c0-4e41-4dd6-9d79-bf1ab86fddf1';
            }

            currFile.push(val);
            let stixToUpload = filesToJson(currFile)
                .map(bundle => bundle.objects)
                .reduce((prev, cur) => prev.concat(cur), [])
                .map(stix => {
                    let retVal = {};
                    retVal._id = stix.id;
                    retVal.stix = stix;
                    retVal.stix.x_mitre_collections = [collectionUuid];
                    return retVal;
                })
                .concat(stixObjects);

            // Enhanced stix files
            if (argv.enhancedStixProperties !== undefined) {
                console.log('Processing the following enhanced STIX properties files: ', argv.enhancedStixProperties);
                let enhancedPropsToUpload = filesToJson(argv.enhancedStixProperties)
                    .reduce((prev, cur) => prev.concat(cur), []);

                enhancedPropsToUpload.forEach(enhancedProps => {
                    let stixToEnhance = stixToUpload.find(stix => stix._id === enhancedProps.id);
                    if (stixToEnhance) {
                        if (enhancedProps.extendedProperties !== undefined) {
                            stixToEnhance.extendedProperties = enhancedProps.extendedProperties;
                        }

                        if (enhancedProps.metaProperties !== undefined) {
                            stixToEnhance.metaProperties = enhancedProps.metaProperties;
                        }
                        if (enhancedProps.previousVersions !== undefined) {
                            stixToEnhance.previousVersions = enhancedProps.previousVersions;
                        }
                    } else {
                        // TODO attempt to upload to database if not in processed STIX document
                        console.log('STIX property enhancement failed - Unable to find matching stix for: ', enhancedProps._id);
                    }
                });
            }
            promises.push(stixModel.create(stixToUpload));
        }
    } else if (stixObjects.length > 0) {
        promises.push(stixModel.create(stixObjects));
    } else if (argv.enhancedStixProperties !== undefined) {
        // TODO attempt to upload to database if not STIX document provided
        console.log('Enhanced STIX files require a base STIX file');
    }


    // Config files
    if (argv.config !== undefined) {
        console.log('Processing the following configuration files: ', argv.config);
        let configToUpload = filesToJson(argv.config)
            .reduce((prev, cur) => prev.concat(cur), []);
        promises.push(configModel.create(configToUpload));
    }

    if (promises !== undefined && promises.length) {
        Promise.all(promises)
            .then(results => {
                console.log('Successfully executed all operations');
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                });
            })
            .catch(err => {
                console.log('Error: ', err.message);
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                    process.exit(1);
                });
            })
    } else {
        console.log('There are no operations to perform');
        mongoose.connection.close(() => {
            console.log('closed mongo connection');
        });
    }
}

/* ~~~ Driver ~~~ */

let connAttempts = 0;
let conn;
let promises = [];

// Wait for mongoose to connect before processing
mongoose.connection.on('connected', function (err) {
    console.log('connected to mongodb');
    clearInterval(conIntervel);
    let allRes = [];
    // Add mitre data
    if (argv.addMitreData !== undefined && argv.addMitreData === true) {
        console.log('Adding Mitre data');
        getMitreData('enterprise-attack')
            .then(res => {
                allRes = allRes.concat(res);
                getMitreData('mobile-attack')
                .then(res => {
                    allRes = allRes.concat(res);
                    getMitreData('pre-attack')
                    .then(res => {
                        allRes = allRes.concat(res);
                        for (i = 0; i < allRes.length; ++i) {
                            let index = allRes.findIndex(k => k.stix.id == allRes[i].stix.id);
                            if (index != i) {
                                allRes[index].metaProperties.collection = allRes[index].metaProperties.collection.concat(allRes[i].metaProperties.collection);
                            }
                        }
                        run(allRes);
                    })
                    .catch(err => {
                        console.log(err);
                        mongoose.connection.close(() => {
                            console.log('closed mongo connection');
                            process.exit(1);
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                    mongoose.connection.close(() => {
                        console.log('closed mongo connection');
                        process.exit(1);
                    });
                });
            })
            .catch(err => {
                console.log(err);
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                    process.exit(1);
                });
            });
    } else {
        run();
    }
});
mongoose.connection.on('error', function (err) {
    console.log('Mongoose connection error: ' + err);
    if (connAttempts >= MAX_NUM_CONNECT_ATTEMPTS) {
        clearInterval(conIntervel);
        console.log('Maximum number of connection attempts exceeded. Terminating program.');
        process.exit(1);
    }
});
let conIntervel = setInterval(() => {
    connAttempts++;
    conn = mongoose.connect(`mongodb://${argv['host']}:${argv['port']}/${argv['database']}`);
}, CONNECTION_RETRY_TIME);
