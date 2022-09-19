const express = require('express');
const bodyParser = require('body-parser');
const CryptoJS = require("crypto-js");
const FormData = require('form-data');
const axios = require('axios');
const fs = require("fs");
const multer = require('multer');
const upload = multer({});

const app = express();
const port = process.env.PORT || 5000;

_API_SECRET_KEY = "9BD3A9BBEB661AE1C9684F95021CB22728BE97EE"; // insert your api secret key here, hard-coded
_CLIENT_ID = "C9348B7BCFB12A389FD0"; // insert your client id here, hard-coded
_UPLOAD_FILE_PATH = "C:/Users/zeyu.thye/Downloads/privatedoc.docx"; // insert the uploaded file path same as client side, hard-coded
_SIGN_CLOUD_DEMO_URL = 'https://demo.signingcloud.com:9443/signserver/v1';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Generic Function:
const genericParams = (accesstoken, encryptedData, mac) => {
    const params = new URLSearchParams();
    params.append('accesstoken', accesstoken);
    params.append('data', encryptedData.toString(CryptoJS.enc.Hex));
    params.append('mac', mac.toString(CryptoJS.enc.Hex));
    return params
};

const genericAxiosPost = (url, params, res) => {
    // This syntax for application/x-www-form-urlencoded format: 
    axios.post(_SIGN_CLOUD_DEMO_URL + url, params)
        .then(response => {
            console.log(`${url}: ${response}`);
            console.log(`[generic post] status code: ${response.data.result.toString()}`);
            const responseBody = formatResponseBody(response);
            res.send(responseBody);
        }).catch(e => {
            console.error(e);
        });
};

const genericAxiosGet = (url, params, res) => {
    axios.get(_SIGN_CLOUD_DEMO_URL + url, {
        params: params
    }).then(response => {
        console.log(`${url}: ${response.data}`);
        console.log(`[generic get] status code: ${response.data.result.toString()}`);
        const responseBody = formatResponseBody(response);
        res.send(responseBody);
    }).catch(e => {
        console.error(e);
    });
};

// Helper Function:
const formatResponseBody = (response) => {
    const decrypted_res = response.data.result === 0 && response.data.data !== undefined ? decrypt(response.data.data) : "";
    const responseBody = { ...response.data };
    responseBody["body"] = decrypted_res; //create new object property called body 
    console.log("formattedResponseBody:", JSON.stringify(responseBody));
    return responseBody;
}

const hex_to_ascii = (str1) => {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

const decrypt = (data) => {
    console.log("data:", data)
    var secret = _API_SECRET_KEY;
    var parsedKey = CryptoJS.SHA256(secret);
    var ciphertext = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(data));
    var decryptedData = CryptoJS.AES.decrypt(ciphertext, parsedKey,
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );
    var decryptedText = decryptedData.toString();
    console.log("decryptedText", decryptedText)
    var decryptJson = JSON.parse(hex_to_ascii(decryptedText));
    console.log("decryptJson", decryptJson)
    return decryptJson;
}

const encrypt = (data) => {
    var secret = _API_SECRET_KEY;
    var parsedKey = CryptoJS.SHA256(secret);
    return CryptoJS.AES.encrypt(data, parsedKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
}

const getMac = (encryptedData) => {
    var secret = _API_SECRET_KEY;
    return CryptoJS.SHA256(encryptedData.ciphertext + secret);
}

const setRequestHeader = (dataBody) => {
    console.log("dataBody=", dataBody);
    var encryptedData = encrypt(JSON.stringify(dataBody));
    var mac = getMac(encryptedData);
    return [encryptedData.ciphertext, mac];
}

const setUploadFileHash = (base64ByteString) => {
    var words = CryptoJS.enc.Base64.parse(base64ByteString);
    const res = CryptoJS.SHA256(words).toString(CryptoJS.enc.Hex);
    return res
}

// get access token
app.get('/api/signserver/accesstoken', (req, res) => {
    const params = {client_id: _CLIENT_ID};
    genericAxiosGet('/accesstoken', params, res);
});

// get account information:
app.post('/api/signserver/account/infomation', (req, res) => {
    console.log('my accesstoken [param]:', req.body.accesstoken)
    const params = {accesstoken: req.body.accesstoken};
    genericAxiosGet('/account/infomation', params, res);
});

// get document list: 
app.post('/api/signserver/contract/list', (req, res) => {
    const dataBody = {
        "startIndex": "0",
        "pageSize": "50",
        "rDetail": "2",
        "contractState": 1 // -1 for not filtering based on status 
    };

    const [encryptedData, mac] = setRequestHeader(dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosGet('/contract/list', params, res);
})

// post send authentication code:
app.post('/api/signserver/contract/authcode', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    axios.post(_SIGN_CLOUD_DEMO_URL + '/contract/authcode?accesstoken=' + req.body.accesstoken + "&data=" + encryptedData.toString(CryptoJS.enc.Hex) + "&mac=" + mac.toString(CryptoJS.enc.Hex))
        .then(response => {
            const responseBody = formatResponseBody(response);
            res.send(responseBody);
        }).catch(e => {
            console.error(e);
        })
});

// post manual signature:
app.post('/api/signserver/contract/signature/manual', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/contract/signature/manual', params, res);
});

// post automatic signature:
app.post('/api/signserver/contract/signature/automatic', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/contract/signature/automatic', params, res);
});


// post update signing coordinate:
app.post('/api/signserver/contract/coordinate', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/contract/coordinate', params, res);
});

// post upload signature image:
app.post('/api/signserver/user/signimg', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/user/signimg', params, res);
});

// post upload seal image:
app.post('/api/signserver/user/stampimg', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/user/stampimg', params, res);
});

// post upload company image:
app.post('/api/signserver/user/companyimg', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosPost('/user/companyimg', params, res);
});

// get document details: 
app.post('/api/signserver/contract/details', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosGet('/contract/details', params, res);
})

// get download document: 
app.post('/api/signserver/contract/download', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    const params = genericParams(req.body.accesstoken, encryptedData, mac);
    genericAxiosGet('/contract/file', params, res);
})

// delete document:
app.post('/api/signserver/contract/delete', (req, res) => {
    const [encryptedData, mac] = setRequestHeader(req.body.dataBody);
    console.log('encryptedData-hex', encryptedData.toString(CryptoJS.enc.Hex));
    console.log('mac-hex', mac.toString(CryptoJS.enc.Hex));
    axios.delete(_SIGN_CLOUD_DEMO_URL + '/contract/list' + "?mac=" + mac.toString(CryptoJS.enc.Hex) + "&data=" + encryptedData.toString(CryptoJS.enc.Hex) + "&accesstoken=" + req.body.accesstoken)
        .then(response => {
            console.log(`[DELETE] /api/signserver/contract/list: ${response}`);
            console.log(`status code: ${response.data.result}`);
            const responseBody = formatResponseBody(response);
            res.send(responseBody);
        }).catch(e => {
            console.error(e);
        });
})

// Post --> Verify Document:
app.post('/api/signserver/contract/signature/verify', upload.any(), (req, res) => {

    // from buffer string --> json object:
    var reqBody = JSON.parse(req.files[1].buffer.toString());

    var dataBody = {
        "verifyFileHash": setUploadFileHash(reqBody.fileBase64)
    }

    const [encryptedData, mac] = setRequestHeader(dataBody);

    // FormData only accepts --> String, Buffer and Stream:
    let dataForm = new FormData();
    dataForm.append("accesstoken", reqBody.accesstoken);
    dataForm.append("data", encryptedData.toString(CryptoJS.enc.Hex));
    dataForm.append("mac", mac.toString(CryptoJS.enc.Hex));
    dataForm.append('verifyFile', fs.createReadStream(`C:/Users/zeyu.thye/Downloads/${reqBody.fileName}`)); // hard-coded

    axios.post(_SIGN_CLOUD_DEMO_URL + '/contract/signature/verify', dataForm, { headers: dataForm.getHeaders() }).then(response => {
        console.log(`/api/signserver/signature/verify ${JSON.stringify(response.data)}`);
        console.log(`status code: ${response.data.result.toString()}`);
        res.header("Access-Control-Allow-Origin", "*");
        const responseBody = formatResponseBody(response);
        res.send(responseBody);
    }).catch(e => {
        console.error(e);
    })
});

// Post --> Upload Document:
app.post('/api/signserver/contract/file', upload.any(), (req, res) => {

    // from buffer string --> json object:
    var reqBody = JSON.parse(req.files[1].buffer.toString());

    signsetObj = [{ "pageindex": 1, "top": 10, "left": 20, "fieldtype": "sign" }] // hard-coded

    var dataBody = {
        "contractInfo": {
            "contractname": "upload doc from node.js",
            "signernum": 1,
            "contractnum": "",
            "isWatermark": false,
            "signerinfo": [{
                "caprovide": "1",
                "email": reqBody.email,
                "authtype": 0, // 1 for sms, 0 for default 
                "signset": JSON.stringify(signsetObj),
                "phonesn": "+60173309918" // for send auth code api, hard-coded
            }]
        },
        "uploadFileHash": setUploadFileHash(reqBody.fileBase64),
        "type": reqBody.fileName.split('.').pop()
    }


    console.log("data-body --> ", dataBody);

    const [encryptedData, mac] = setRequestHeader(dataBody);

    // FormData only accepts --> String, Buffer and Stream:
    let dataForm = new FormData();
    dataForm.append("accesstoken", reqBody.accesstoken);
    dataForm.append("data", encryptedData.toString(CryptoJS.enc.Hex));
    dataForm.append("mac", mac.toString(CryptoJS.enc.Hex));
    dataForm.append('uploadFile', fs.createReadStream(_UPLOAD_FILE_PATH));

    axios.post(_SIGN_CLOUD_DEMO_URL + '/contract/file', dataForm, { headers: dataForm.getHeaders() }).then(response => {
        console.log(`/api/signserver/contract/file ${response}`);
        console.log(`status code: ${response.data.result}`);
        res.header("Access-Control-Allow-Origin", "*");
        const responseBody = formatResponseBody(response);
        res.send(responseBody);
    }).catch(e => {
        console.error(e);
    })
});

app.listen(port, () => console.log(`Listening on port ${port}`));