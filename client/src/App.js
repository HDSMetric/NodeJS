import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

function App() {

  const initAccountInfo = {
    dsacnt: "",
    smscnt: 0,
    maxsigner: 0,
    ekyccnt: 0,
    diskspace: ""
  }

  const initBase64Info = {
    text: '',
    base64: '',
    bytes: '',
    hexStr: ''
  }

  const initUploadSignImgState = {
    email: '',
    img: ''
  }


  const initUploadSealImgState = {
    email: '',
    img: ''
  }

  const initUploadDocState = {
    email: '',
    file: '',
  }

  const initAuthCodeState = {
    email: '',
    contractnum: ''
  }

  // Use State:
  const _DEFAULT_EMAIL = "funny@yopmail.com";
  const [accesstoken, setAccessToken] = useState('');
  const [accountInfo, setAccountInfo] = useState(initAccountInfo);
  const [signatureImg, setSignatureImg] = useState();
  const [sealImg, setSealImg] = useState();
  const [base64Info, setBase64Info] = useState(initBase64Info);
  const [uploadSignImg, setUploadSignImg] = useState(initUploadSignImgState);
  const [uploadSealImg, setUploadSealImg] = useState(initUploadSealImgState);
  const [uploadDoc, setUploadDoc] = useState(initUploadDocState);
  const [defaultEmail, setDefaultEmail] = useState(_DEFAULT_EMAIL);
  const [docListJson, setDocListJson] = useState("");
  const [useDefaultEmail, setUseDefaultEmail] = useState(false);
  const [deleteContractNum, setDeleteContractNum] = useState("");
  const [downloadContractNum, setDownloadContractNum] = useState("");
  const [downloadPdfData, setDownloadPdfData] = useState("");
  const [docDetailContractNum, setdocDetailContractNum] = useState("");
  const [docDetailResponseJson, setDocDetailResponseJson] = useState("");
  const [authCodeState, setAuthCodeState] = useState(initAuthCodeState);
  const [manualAutoContractNum, setManualAutoContractNum] = useState("");
  const [manualContractResponseJson, setManualContractResponseJson] = useState("");
  const [signCoordContractNum, setSignCoordContractNum] = useState("");
  const [uploadDocResponseJson, setUploadDocResponseJson] = useState("");

  const onClickDefaultEmail = () => {
    toast.success("Success: Set Default Email");
    setUploadDoc({ ...uploadDoc, email: defaultEmail });
    setUploadSignImg({ ...uploadSignImg, email: defaultEmail });
    setUploadSealImg({ ...uploadSealImg, email: defaultEmail });
    setAuthCodeState({ ...authCodeState, email: defaultEmail });
    setUseDefaultEmail(true);
  }

  const genericFetchPost = async (url, requestBody) => {
    const stringifiedBody = JSON.stringify(requestBody);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringifiedBody,
    });
    const body = await response.json();
    return body;
  }

  const callGetAccountInfo = async () => {
    const requestBody = { accesstoken: accesstoken };
    const responseBody = await genericFetchPost('/api/signserver/account/infomation', requestBody);
    return responseBody;
  }

  const callGetAccessToken = async () => {
    const response = await fetch('/api/signserver/accesstoken');
    const body = await response.json();
    return body;
  }

  const callGetDocumentList = async () => {
    const requestBody = { accesstoken: accesstoken };
    const responseBody = await genericFetchPost('/api/signserver/contract/list', requestBody);
    return responseBody;
  }

  const callPostDocumentDetail = async () => {
    const obj = {
      "contractnum": docDetailContractNum
    }
    const requestBody = { accesstoken: accesstoken, dataBody: obj };
    const responseBody = await genericFetchPost('/api/signserver/contract/details', requestBody);
    return responseBody;
  }

  const callPostSendAuthCode = async () => {
    const obj = {
      "signer": {
        "email": authCodeState.email
      },
      "contractnum": authCodeState.contractnum,
      "type": "1" // hard-coded
    }
    const requestBody = { accesstoken: accesstoken, dataBody: obj };
    const responseBody = await genericFetchPost('/api/signserver/contract/authcode', requestBody);
    return responseBody;
  }

  const callPostVerifyDoc = async () => {
    const base64Encoded = await getBase64(uploadDoc.file);
    console.log("callPostVerifyDoc-base64Encoded = ", base64Encoded);

    const myBody = {
      accesstoken: accesstoken,
      fileBase64: base64Encoded.trim(),
      fileName: uploadDoc.file.name
    }

    const stringifiedBody = JSON.stringify(myBody);
    const blob = new Blob([stringifiedBody], {
      type: 'application/json'
    });

    let dataForm = new FormData();
    dataForm.append('file', uploadDoc.file);
    dataForm.append("document", blob);
    const response = await axios.post('http://localhost:5000/api/signserver/contract/signature/verify', dataForm, {
      mode: 'no-cors',
    });
    const body = await response.data;
    return body;
  }

  const callPostUploadDocument = async () => {
    const base64Encoded = await getBase64(uploadDoc.file);
    console.log("callPostUploadDocument-base64Encoded = ", base64Encoded);

    const myBody = {
      accesstoken: accesstoken,
      email: uploadDoc.email,
      fileBase64: base64Encoded.trim(),
      fileName: uploadDoc.file.name,
    }

    const stringifiedBody = JSON.stringify(myBody);
    const blob = new Blob([stringifiedBody], {
      type: 'application/json'
    });

    let dataForm = new FormData();
    dataForm.append('file', uploadDoc.file);
    dataForm.append("document", blob);
    const response = await axios.post('http://localhost:5000/api/signserver/contract/file', dataForm);
    const body = await response.data;
    return body;
  }

  const callPostDeleteDoc = async () => {
    const obj = {
      "contractnum": deleteContractNum
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/contract/delete', requestBody);
    return responseBody;
  }

  const callPostDownloadDoc = async () => {
    const obj = {
      "contractnum": downloadContractNum
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/contract/download', requestBody);
    return responseBody;
  }

  const callPostManualSignDoc = async () => {
    const obj = {
      "signerInfo": {
        "email": defaultEmail // hard-coded for now
      },
      "contractnum": manualAutoContractNum
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/contract/signature/manual', requestBody);
    return responseBody;
  }

  const callPostAutoSignDoc = async () => {
    const obj = {
      "signerInfo": {
        "email": defaultEmail, // hard-coded for now
        "signkeyword": "Lorem",
        "authtype": 0
      },
      "contractnum": manualAutoContractNum,
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/contract/signature/automatic', requestBody);
    return responseBody;
  }

  const callUpdateSigningCoordinate = async () => {
    const signsetObj = [{ "pageindex": 1, "top": 30, "left": 30, "fieldtype": "sign" }] // hard-coded
    const obj = {
      "contractInfo": {
        "contractnum": signCoordContractNum,
        "signerinfo": [{
          "email": defaultEmail, // hard-coded for now
          "signset": JSON.stringify(signsetObj) //hard-coded for now
        }]
      }
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/contract/coordinate', requestBody);
    return responseBody;
  }

  const callPostUploadSignatureImage = async () => {
    const obj = {
      "img": uploadSignImg.img,
      "signer": {
        "email": uploadSignImg.email
      }
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/user/signimg', requestBody);
    return responseBody;
  }

  const callPostUploadSealImage = async () => {
    const obj = {
      "img": uploadSealImg.img,
      "signer": {
        "email": uploadSealImg.email
      }
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/user/stampimg', requestBody);
    return responseBody;
  }

  const callPostUploadCompanyImage = async () => {
    const obj = {
      "img": uploadSealImg.img
    }
    const requestBody = {accesstoken: accesstoken, dataBody: obj};
    const responseBody = await genericFetchPost('/api/signserver/user/companyimg', requestBody);
    return responseBody;
  }

  const onTextMessageChange = (e) => {
    const encodedData = btoa(e.target.value); // encode a string
    const bytes = base64ToArrayBuffer(encodedData); // array buffer == byte array
    const hexString = byteArrayToHexString(bytes);
    setBase64Info({ ...base64Info, text: e.target.value, base64: encodedData, bytes: bytes, hexStr: hexString });
  }

  const onEmailUploadSignChange = (e) => {
    setUploadSignImg({ ...uploadSignImg, email: e.target.value });
  }

  const onEmailUploadSealChange = (e) => {
    setUploadSealImg({ ...uploadSealImg, email: e.target.value });
  }

  const onDeleteContractNumChange = (e) => {
    setDeleteContractNum(e.target.value);
  }

  const onDownloadContractNumChange = (e) => {
    setDownloadContractNum(e.target.value);
  }

  const onGetdocDetailContractNumChange = (e) => {
    setdocDetailContractNum(e.target.value);
  }

  const onPostManualSignContractNumChange = (e) => {
    setManualAutoContractNum(e.target.value);
  }

  const onPostSignCoordContractNumChange = (e) => {
    setSignCoordContractNum(e.target.value);
  }

  const onSendAuthCodeContractNumChange = (e) => {
    setAuthCodeState({ ...authCodeState, contractnum: e.target.value });
  }

  const onEmailUploadDocChange = (e) => {
    setUploadDoc({ ...uploadDoc, email: e.target.value });
  }

  const onEmailSendAuthCodeChange = (e) => {
    setAuthCodeState({ ...authCodeState, email: e.target.value });
  }

  const onUploadDocFileChange = (e) => {
    const [file] = e.target.files;
    console.log(file.name.split('.').pop());
    setUploadDoc({ ...uploadDoc, file: file });
  }

  const onSignImgChange = async (e) => {
    const [file] = e.target.files;
    console.log("uploaded img file:", file);
    try {
      const { width, height } = await getImageDimensions(URL.createObjectURL(file));
      console.log(`Image dimensions: ${width}px x ${height}px`);
      if (width > 300 || height > 300) {
        alert('image width and height greater than 300 x 300px');
        throw "image width and height greater than 300 x 300px"
      }
      else {
        setSignatureImg(URL.createObjectURL(file));
        const base64Encoded = await getBase64(file);
        console.log('base64Encoded:', base64Encoded);
        const bytes = base64ToArrayBuffer(base64Encoded);
        console.log('bytes:', bytes);
        const hexString = byteArrayToHexString(bytes);
        console.log('hexString:', hexString);
        setUploadSignImg({ ...uploadSignImg, img: hexString });
      }
    } catch (e) {
      // Could not load image from specified URL
      console.error(e);
    }
  };

  const onSealImgChange = async (e) => {
    const [file] = e.target.files;
    console.log("uploaded seal file:", file);
    try {
      const { width, height } = await getImageDimensions(URL.createObjectURL(file));
      console.log(`Image dimensions: ${width}px x ${height}px`);
      if (width > 300 || height > 300) {
        alert('image width and height greater than 300 x 300px');
        throw "image width and height greater than 300 x 300px"
      }
      else {
        setSealImg(URL.createObjectURL(file));
        const base64Encoded = await getBase64(file);
        console.log('base64Encoded:', base64Encoded);
        const bytes = base64ToArrayBuffer(base64Encoded);
        console.log('bytes:', bytes);
        const hexString = byteArrayToHexString(bytes);
        console.log('hexString:', hexString);
        setUploadSealImg({ ...uploadSealImg, img: hexString });
      }
    } catch (e) {
      // Could not load image from specified URL
      console.error(e);
    }
  };

  const base64ToArrayBuffer = (base64) => {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  const byteArrayToHexString = (byteArray) => {
    var hexString = '';
    var nextHexByte;
    for (var i = 0; i < byteArray.byteLength; i++) {
      nextHexByte = byteArray[i].toString(16);    // Integer to base 16
      if (nextHexByte.length < 2) {
        nextHexByte = "0" + nextHexByte;        // Otherwise 10 becomes just a instead of 0a
      }
      hexString += nextHexByte;
    }
    return hexString;
  }

  // returns image file in base 64 format: 
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  }

  // returns image dimensions for specified URL
  const getImageDimensions = (url) => {
    console.log('get image dimensions');
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        width: img.width,
        height: img.height,
      });
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const hexToBase64 = (str) => {
    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
  }

  const downloadPDFHref = `data:application/pdf;base64,${hexToBase64(downloadPdfData)}`;

  const divStyle = {
    width: '50rem'
  };

  const cardUtilities = "card mt-2 mb-2 mx-auto border-0"

  const cardHeaderDivStyle = {
    backgroundColor: "black",
    color: "white"
  }

  const redCircle = {
    background: "red",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
  }

  const greenCircle = {
    background: "green",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
  }

  const handleToastNotif = (res, actionName) => {
    if (res.result == 0) {
      toast.success(`Success: ${actionName}`);
    }
    else {
      toast.error(`Fail Code: ${res.result} ${res.message ? ", Message: " + res.message : ""}`);
    }
  }

  return (
    <div className="App" style={{ backgroundColor: "#F4F7FC" }}>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="mt-2 mb-2 mx-auto" style={divStyle}>
        <h1>
          Signing Cloud API List
        </h1>
      </div>

      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Set Default E-mail</div>
        <div className="card-body">
          <a className='btn btn-primary text-white' onClick={onClickDefaultEmail}>
            set as default e-mail
          </a>
          <p className='card-text'>
            default e-mail: {defaultEmail}
          </p>
          <p className='card-text'>
            checked: {useDefaultEmail ? "done" : "no"}
          </p>
          <div style={useDefaultEmail ? greenCircle : redCircle}>
          </div>
        </div>
      </div>

      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Get Access Token</div>
        <div className="card-body">
          <a className='btn btn-primary text-white' onClick={
            () => {
              return callGetAccessToken().then(res => {
                setAccessToken(res.body.at);
                handleToastNotif(res, "Get Access Token");
              })
            }
          }>
            get access token
          </a>
          <p className='card-text'>
            Current access token: {accesstoken}
          </p>
        </div>
      </div>

      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Get Account Information</div>
        <div className="card-body">
          <a className='btn btn-primary text-white' onClick={
            () => {
              return callGetAccountInfo().then(res => {
                setAccountInfo(res.body.info);
                handleToastNotif(res, "Get Account Info");
              })
            }
          }>
            get account information
          </a>
          <p className='card-text'>
            Current account info: {JSON.stringify(accountInfo)}
          </p>
        </div>
      </div>

      {/* upload signature image */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Upload Signature Image</div>
        <img src={signatureImg} className="card-img-top" alt="" style={{ width: 100 + '%', height: 200 }} />
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="email-address" aria-label="email-address" aria-describedby="basic-addon1"
            onChange={onEmailUploadSignChange}
            value={uploadSignImg.email}
          />
          <input type="file" onChange={onSignImgChange}></input>
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostUploadSignatureImage().then(res => {
                  console.log('response [callPostUploadSignatureImage]:', res);
                  handleToastNotif(res, "Upload Sign Image");
                });
              }}
          >
            post signature image
          </a>
        </div>
      </div>

      {/* upload seal image */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Upload Seal / Company Image</div>
        <img src={sealImg} className="card-img-top" alt="" style={{ width: 100 + '%', height: 200 }} />
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="email-address" aria-label="email-address" aria-describedby="basic-addon1"
            onChange={onEmailUploadSealChange}
            value={uploadSealImg.email}
          />
          <input type="file" onChange={onSealImgChange}></input>
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostUploadSealImage().then(res => {
                  console.log('response [callPostUploadSealImage]:', res);
                  handleToastNotif(res, "Upload Seal Image");
                });
              }}
          >
            post seal image
          </a>
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostUploadCompanyImage().then(res => {
                  console.log('response [callPostUploadCompanyImage]:', res);
                  handleToastNotif(res, "Upload Company Image");
                });
              }}
          >
            post company image
          </a>
        </div>
      </div>

      {/* base 64 encoding */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Base64 Encoding</div>
        <div className="card-body">
          <div className="input-group mb-3">
            <input type="text"
              className="form-control" placeholder="text" aria-label="text" aria-describedby="basic-addon1"
              onChange={onTextMessageChange}
            />
          </div>
          <p className='card-text'>
            Encoded string: {base64Info.text}
          </p>
          <p className='card-text'>
            ASCII Byte of encoded string -- refer directly to ASCII table: {base64Info.bytes}
          </p>
          <p className='card-text'>
            Base 64 -- refer from base64 table: {base64Info.base64}
          </p>
          <p className='card-text'>
            Hex String: {base64Info.hexStr}
          </p>
        </div>
      </div>

      {/* upload document */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Upload / Verify Document</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="email-address" aria-label="email-address" aria-describedby="basic-addon1"
            onChange={onEmailUploadDocChange}
            value={uploadDoc.email}
          />
          <input type="file" onChange={onUploadDocFileChange}></input>
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostUploadDocument().then(res => {
                  console.log('response [callPostUploadDocument]:', res);
                  handleToastNotif(res, "Post Upload Document");
                  setUploadDocResponseJson(res.body.contractnum);
                });
              }}
          >
            upload document
          </a>
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostVerifyDoc().then(res => {
                  console.log('response [callPostVerifyDoc]:', res);
                  handleToastNotif(res, "Post Verify Document");
                });
              }}
          >
            verify document
          </a>
          <p className='card-text'>
            Contract Number: {uploadDocResponseJson}
          </p>
        </div>
      </div>

      {/* get document list */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Get Document List</div>
        <div className="card-body">
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callGetDocumentList().then(res => {
                  // stringify with 4 spaces at each level
                  const beautify = JSON.stringify(res.body, null, 4);
                  setDocListJson(beautify);
                  console.log(beautify);
                  handleToastNotif(res, "Get Document List");
                });
              }}
          >
            get document list
          </a>
          <textarea className='card-text' id="text" name="text" rows="12" cols="100" value={docListJson}></textarea>
        </div>
      </div>

      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Delete Document</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onDeleteContractNumChange}
            value={deleteContractNum}
          />
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostDeleteDoc().then(res => {
                  console.log('response [callPostDeleteDoc]:', res);
                  handleToastNotif(res, "Post Delete Document");
                });
              }}
          >
            delete document
          </a>
        </div>
      </div>

      {/* download document */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Download Document</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onDownloadContractNumChange}
            value={downloadContractNum}
          />
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostDownloadDoc().then(res => {
                  handleToastNotif(res, "Post Download Document");
                  console.log('response [callPostDownloadDoc]:', res.body.pdfdata);
                  setDownloadPdfData(res.body.pdfdata.trim());
                });
              }}
          >
            download document
          </a>
          <a className="link-dark" href={downloadPDFHref} download="download_doc_output.pdf">download pdf to local</a>
          <p className='card-text'>
            PDF hexstring value: {downloadPdfData.slice(0, 10)} {downloadPdfData.length !== 0 ? "..." : ""}
          </p>
        </div>
      </div>

      {/* get document detail */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Get Document Detail</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onGetdocDetailContractNumChange}
            value={docDetailContractNum}
          />
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostDocumentDetail().then(res => {
                  console.log('response [callPostDocumentDetail]:', res);
                  setDocDetailResponseJson(JSON.stringify(res.body));
                  handleToastNotif(res, "Get Document Detail");
                });
              }}
          >
            get document detail
          </a>
          <p className='card-text'>
            Json: {docDetailResponseJson}
          </p>
        </div>
      </div>

      {/* send authentication code */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Send Authentication Code</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="email-address" aria-label="email-address" aria-describedby="basic-addon1"
            onChange={onEmailSendAuthCodeChange}
            value={authCodeState.email}
          />
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onSendAuthCodeContractNumChange}
            value={authCodeState.contractnum}
          />
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostSendAuthCode().then(res => {
                  console.log('response [callPostSendAuthCode]:', res);
                  handleToastNotif(res, "Send Authentication Code");
                });
              }}
          >
            send authentication code
          </a>
        </div>
      </div>

      {/* post update signing coordinate */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Post Update Signing Coordinate</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onPostSignCoordContractNumChange}
            value={signCoordContractNum}
          />
          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callUpdateSigningCoordinate().then(res => {
                  console.log('response [callUpdateSigningCoordinate]:', res);
                  handleToastNotif(res, "Post Update Signing Coordinate");
                });
              }}
          >
            update signing coordinate
          </a>
        </div>
      </div>

      {/* post manual sign / auto sign doc */}
      <div className={cardUtilities} style={divStyle}>
        <div className="card-header font-weight-bold" style={cardHeaderDivStyle}>Post Manual / Auto Sign Doc</div>
        <div className="card-body">
          <input type="text"
            className="form-control" placeholder="contract-number" aria-label="contract-number" aria-describedby="basic-addon1"
            onChange={onPostManualSignContractNumChange}
            value={manualAutoContractNum}
          />

          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostManualSignDoc().then(res => {
                  console.log('response [callPostManualSignDoc]:', res);
                  handleToastNotif(res, "Post Manual Sign Doc");
                  setManualContractResponseJson(res.body.url);
                });
              }}
          >
            manual sign document
          </a>

          <a className='btn btn-primary text-white'
            onClick={
              () => {
                return callPostAutoSignDoc().then(res => {
                  console.log('response [callPostAutoSignDoc]:', res);
                  handleToastNotif(res, "Post Manual Sign Doc");
                });
              }}
          >
            automatic sign document
          </a>
          <p className='card-text'>
            URL: {manualContractResponseJson}
          </p>
        </div>
      </div>

    </div>
  );
}

export default App;
