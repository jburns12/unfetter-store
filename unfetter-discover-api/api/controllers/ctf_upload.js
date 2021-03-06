// const fs = request('fs');

const fetch = require('node-fetch');

const CTF_PARSE_HOST = process.env.CTF_PARSE_HOST || 'http://localhost';
const CTF_PARSE_PORT = process.env.CTF_PARSE_PORT || 10010;
const CTF_PARSE_PATH = process.env.CTF_PARSE_PATH || '/upload';

const upload = (req, res) => {

    const err = { 
            error:
                { 
                    status: 500, source: '', title: 'Error', 
                    code: '', detail: 'An unknown error has occurred.' 
                }
        };
    if (!req || !req.swagger || !req.swagger.params) {
        return res.status(500).json(err);
    }

    // console.log(`upload req`, req.swagger.params);
    // console.log(req.swagger.params.upfile.value);
    const fName = req.swagger.params.upfile.value.originalname;
    console.log(fName);
    const contents = req.swagger.params.upfile.value.buffer.toString('utf8');
    console.log(`csv.length=${contents.length}`);
    // console.log(contents);
    // const timestamp = new Date().getMilliseconds();
    // const tmpFileName = `${fName}-${timestamp}`;
    // fs.writeFileSync(tmpFileName, contents);

    const body = JSON.stringify({ data: contents });
    const headers = { 'content-type': 'application/json', 'accept': 'application/json' };
    const url = `${CTF_PARSE_HOST}:${CTF_PARSE_PORT}${CTF_PARSE_PATH}`;
    console.log(url);
    console.log(body);
    fetch(url, {
        headers,
        method: 'POST',
        body
    }).then((response) => {
        // console.log('response', response);
        // console.log('response', response.json());
        response.json().then((json) => {
            console.log('upload response', json);
            res.json(json);
        });
    }).catch((ex) => {
        err.error.detail = ex;
        return res.status(500).json(err);
    })

};

module.exports = {
    upload
};