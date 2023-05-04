const fs = require("fs"); // Import the filesystem module
const { MAX_HEADER_PADDED_BYTES } = require("../helpers/constants");

function stringToAsciiArray(str) {
  // Create an empty array to store the ASCII values
  const asciiValues = [];
  const pad_len = 960;

  // Loop through each character in the string
  for (let i = 0; i < str.length; i++) {
    // Get the ASCII value of the current character and add it to the array
    asciiValues.push(str.charCodeAt(i).toString());
  }

  for (i = str.length; i < pad_len; i++) {
    asciiValues.push("0");
  }

  // Return the array of ASCII values
  return asciiValues;
}

function stringToNonCharAsciiArray(str, div) {
  const arr_len = str.length / div;
  return arr_len;
}
function stringToAscii(str) {
  // Initialize an empty string to store the ASCII representation
  let ascii = "";

  // Loop through each character in the string
  for (let i = 0; i < str.length; i++) {
    // Get the ASCII value of the current character and append it to the string
    ascii += str.charCodeAt(i) + "";
  }

  // Return the ASCII representation
  return ascii;
}

function createTypeJson(msg) {
  m = stringToAsciiArray(msg);
  const data = {
    msg: m,
  };
  const jsonData = JSON.stringify(data);
  fs.writeFileSync("jwt_email.json", jsonData);
}

function pad(amt_left, array) {
  for (var i = 0; i < amt_left; i++) {
    array.push("0");
  }

  return array;
}

// helper: get str representation of ASCII array
function AsciiArryToString(arr) {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

function convertTokenToJSON(token) {
  var json = Buffer.from(token, "base64");
  return AsciiArryToString(json);
}

// finds email domain in JSON and returns index
function findEmailInJSON(json) {
  let domain_index;
  let domain;
  const email_regex = /([-a-zA-Z._+]+)@([-a-zA-Z]+).([a-zA-Z]+)/;
  const match = json.match(email_regex);
  console.log(match);
  if (match) {
    domain = match[2]; // [0] = whole group, then capture groups
    let email_index = match.index;
    domain_index = match[0].indexOf(domain) + email_index;
  }
  return { domain, domain_index };
}

function findPayload(token) {
  const period_idx = token.indexOf(".");
  return token.substring(period_idx + 1);
}

function createJWTJson(msg, mod, sig, addr, addr1) {
  message = stringToAsciiArray(msg);
  modulus = stringToAsciiArray(mod);
  domain = stringToAsciiArray("berkeley.edu");

  const data = {
    message: pad(MAX_HEADER_PADDED_BYTES - message.length, message),
    // payload: pad(MAX_HEADER_PADDED_BYTES - payload.length, payload),
    modulus: modulus,
    signature: stringToAsciiArray(sig),
    message_padded_bytes: message.length,
    address: stringToAscii(addr),
    address_plus_one: stringToAscii(addr1),
    domain_idx: 140,
    domain: pad(30 - domain.length, domain),
  };
  // Convert the data to a JSON string
  const jsonData = JSON.stringify(data);

  // Write the JSON string to a file
  fs.writeFileSync("jwt.json", jsonData);

  console.log("JSON file created successfully");
  console.log(stringToNonCharAsciiArray(sig, 17));
}

createJWTJson(
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhYWU4ZDdjOTIwNThiNWVlYTQ1Njg5NWJmODkwODQ1NzFlMzA2ZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDY5NDQ3Mjk4MzcxLWJ2bGxnaTlpNmo1OGo4amZrZ25wZjh2cjE5YnBwNzAxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2OTQ0NzI5ODM3MS1idmxsZ2k5aTZqNThqOGpma2ducGY4dnIxOWJwcDcwMS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMTI3NjM5NTk1NTk5MTA3MzIzOCIsImVtYWlsIjoiaGVjay5uaWx0b25AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJSc0h3N2RCM25JNUx3dndSVFJIYkRRIiwibm9uY2UiOiIxMjMiLCJuYW1lIjoiTmlsdG9uIEhlY2siLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUdObXl4YTFvUGNFYk13ZnVBeWlXUlNnZXFoRVVHUWdlX0cweTRaUDhCby13QT1zOTYtYyIsImdpdmVuX25hbWUiOiJOaWx0b24iLCJmYW1pbHlfbmFtZSI6IkhlY2siLCJsb2NhbGUiOiJwdC1CUiIsImlhdCI6MTY4MDE4MzY4NSwiZXhwIjoxNjgwMTg3Mjg1LCJqdGkiOiI2MmVjMzNhMTQ4M2U1M2I1NzM3MzliMmQwZGE0YWE4ZTg4ODJjMjk4In0",
  "sguIKIvlEVBsEGk77iV2yNQxpY_Qkiy3yuMfY4wpmnPlevlDKASu6uP_CGubzThiBHlChYDDNvYfOitWXDwpxbJ_MqmajA-dDbrI5LdggyJpSoWPKThPJ1CKRhRiRXJjXGi6Gg6TfbYRwu0ziyDgZZ125NszuNOUO1pc1qGun4SPifzY7OY6BtADZDqTWHFTfm_yhgBgyElE-r4d-ZqPe9tYYqCnAvILBuZbPYt3UC3fAr9JltdUO54vxKblo2z2fd-H9zBn9jRZOBkuVVB8QSV5sre-H23CTBABSpZpe0SrJpXgG9AuV4Da7FRHBC9A-oLYLe-UF5_5c6_cd7c_KQ",
  "Eu4Orez3-jbGHS9HGYBp74aQMMabyr2-2RKJclSLHCq8_OW57ClGPK2yWfxRbK-Aw9CBl1GCWwsvPmOU2QQVyNx1qK1JsaUiHpfzGVcsPomm2bYPxBCcFyUN7DiusNa3uZj1WnQP45Raa_CLIDaUluV5ux839eNaSjZogg3Fv5fzybd8q27qPZrXOIdNlQ0fb57pVWvH4XR49_o3V7Mwh0M5F8QjXx2n8lCLWePWVDutV57yhKPqaK5FmjYLSXqWTHzuVCcOrpwpkl-CbY-bCZVswn28MpHlqRuzzBzKAV6eKs7pnLpo61jioE4uVE9dxMZfnP3GCbRA8rUxiDVpUg",
  "0x0ACBa2baA02F59D8a3d738d97008f909fB92e9FB",
  "0x0ACBa2baA02F59D8a3d738d97008f909fB92e9FB"
);
