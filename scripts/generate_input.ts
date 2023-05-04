import {
  bytesToBigInt,
  stringToBytes,
  fromHex,
  toCircomBigIntBytes,
  packBytesIntoNBytes,
  bufferToUint8Array,
  bufferToString,
} from '../helpers/binaryFormat';
import {
  CIRCOM_FIELD_MODULUS,
  MAX_HEADER_PADDED_BYTES,
  MAX_BODY_PADDED_BYTES,
  STRING_PRESELECTOR,
} from '../helpers/constants';
import { shaHash } from '../helpers/shaHash';
import { dkimVerify } from '../helpers/dkim';
import { Hash } from './fast-sha256';
import * as fs from 'fs';
import { base64 } from 'ethers/lib/utils';
var Cryo = require('cryo');
const pki = require('node-forge').pki;

export interface ICircuitInputs {
  modulus?: string[];
  signature?: string[];
  base_message?: string[];
  in_padded?: string[];
  in_body_padded?: string[];
  in_body_len_padded_bytes?: string;
  in_padded_n_bytes?: string[];
  in_len_padded_bytes?: string;
  in_body_hash?: string[];
  precomputed_sha?: string[];
  body_hash_idx?: string;
  addressParts?: string[];
  address?: string;
  address_plus_one?: string;
  twitter_username_idx?: string;
}

enum CircuitType {
  RSA = 'rsa',
  SHA = 'sha',
  TEST = 'test',
  JWT = 'jwt',
}

function assert(cond: boolean, errorMessage: string) {
  if (!cond) {
    throw new Error(errorMessage);
  }
}

// Works only on 32 bit sha text lengths
function int32toBytes(num: number): Uint8Array {
  let arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  let view = new DataView(arr);
  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

// Works only on 32 bit sha text lengths
function int8toBytes(num: number): Uint8Array {
  let arr = new ArrayBuffer(1); // an Int8 takes 4 bytes
  let view = new DataView(arr);
  view.setUint8(0, num); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

function mergeUInt8Arrays(a1: Uint8Array, a2: Uint8Array): Uint8Array {
  // sum of individual array lengths
  var mergedArray = new Uint8Array(a1.length + a2.length);
  mergedArray.set(a1);
  mergedArray.set(a2, a1.length);
  return mergedArray;
}

// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
async function sha256Pad(
  prehash_prepad_m: Uint8Array,
  maxShaBytes: number
): Promise<[Uint8Array, number]> {
  let length_bits = prehash_prepad_m.length * 8; // bytes to bits
  let length_in_bytes = int32toBytes(length_bits);
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7));
  while (
    (prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !==
    0
  ) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
  }
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
  assert(
    (prehash_prepad_m.length * 8) % 512 === 0,
    'Padding did not complete properly!'
  );
  let messageLen = prehash_prepad_m.length;
  while (prehash_prepad_m.length < maxShaBytes) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int32toBytes(0));
  }
  assert(
    prehash_prepad_m.length === maxShaBytes,
    'Padding to max length did not complete properly!'
  );

  return [prehash_prepad_m, messageLen];
}

async function Uint8ArrayToCharArray(a: Uint8Array): Promise<string[]> {
  return Array.from(a).map((x) => x.toString());
}

async function Uint8ArrayToString(a: Uint8Array): Promise<string> {
  return Array.from(a)
    .map((x) => x.toString())
    .join(';');
}

async function findSelector(
  a: Uint8Array,
  selector: number[]
): Promise<number> {
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (a[i] === selector[j]) {
      j++;
      if (j === selector.length) {
        return i - j + 1;
      }
    } else {
      j = 0;
    }
    i++;
  }
  return -1;
}

async function partialSha(
  msg: Uint8Array,
  msgLen: number
): Promise<Uint8Array> {
  const shaGadget = new Hash();
  return await shaGadget.update(msg, msgLen).cacheState();
}

export async function getCircuitInputs(
  rsa_signature: BigInt,
  rsa_modulus: BigInt,
  msg: Buffer,
  eth_address: string,
  circuit: CircuitType
): Promise<{
  valid: {
    validSignatureFormat?: boolean;
    validMessage?: boolean;
  };
  circuitInputs: ICircuitInputs;
}> {
  console.log(`Starting processing of inputs: ${eth_address}`);
  // Derive modulus from signature
  // const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const modulusBigInt = rsa_modulus;
  // Message is the email header with the body hash
  const prehash_message_string = msg;
  // const baseMessageBigInt = AAYUSH_PREHASH_MESSAGE_INT; // bytesToBigInt(stringToBytes(message)) ||
  // const postShaBigint = AAYUSH_POSTHASH_MESSAGE_PADDED_INT;
  const signatureBigInt = rsa_signature;
  const period_idx = prehash_message_string.indexOf('.');

  // Perform conversions
  const prehashBytesUnpadded =
    typeof prehash_message_string == 'string'
      ? new TextEncoder().encode(prehash_message_string)
      : Uint8Array.from(prehash_message_string);
  const postShaBigintUnpadded =
    bytesToBigInt(
      stringToBytes((await shaHash(prehashBytesUnpadded)).toString())
    ) % CIRCOM_FIELD_MODULUS;

  // Sha add padding
  const [messagePadded, messagePaddedLen] = await sha256Pad(
    prehashBytesUnpadded,
    1472
  );

  // Ensure SHA manual unpadded is running the correct function
  const shaOut = await partialSha(messagePadded, messagePaddedLen);
  assert(
    (await Uint8ArrayToString(shaOut)) ===
      (await Uint8ArrayToString(
        Uint8Array.from(await shaHash(prehashBytesUnpadded))
      )),
    'SHA256 calculation did not match!'
  );

  // Compute identity revealer
  let circuitInputs;
  const modulus = toCircomBigIntBytes(modulusBigInt);
  const signature = toCircomBigIntBytes(signatureBigInt);

  const message_padded_bytes = messagePaddedLen.toString();
  const message = await Uint8ArrayToCharArray(messagePadded); // Packed into 1 byte signals
  const base_message = toCircomBigIntBytes(postShaBigintUnpadded);

  const address = bytesToBigInt(fromHex(eth_address)).toString();
  const address_plus_one = (
    bytesToBigInt(fromHex(eth_address)) + 1n
  ).toString();

  if (circuit === CircuitType.RSA) {
    circuitInputs = {
      modulus,
      signature,
      base_message,
    };
  } else if (circuit === CircuitType.JWT) {
    circuitInputs = {
      message,
      modulus,
      signature,
      message_padded_bytes,
      address,
      address_plus_one,
      period_idx,
    };
  } else {
    assert(circuit === CircuitType.SHA, 'Invalid circuit type');
    // circuitInputs = {
    //   m,
    //   m_padded_bytes,
    // };
  }
  return {
    circuitInputs,
    valid: {},
  };
}

export async function generate_inputs(
  msg: string,
  signature: string,
  modulus: string,
  address: string
): Promise<any> {
  let sig = BigInt('0x' + Buffer.from(signature, 'base64').toString('hex'));

  console.log('decoded sig');
  console.log(sig);

  let message = Buffer.from(msg);
  let circuitType = CircuitType.JWT;

  // Eth address, currently used as the public key
  const eth_address = address;

  let _modulus = BigInt(modulus);
  let fin_result = await getCircuitInputs(
    sig,
    _modulus,
    message,
    eth_address,
    circuitType
  );

  return fin_result.circuitInputs;
}

async function do_generate(msg, signature, modulus, address) {
  const gen_inputs = await generate_inputs(msg, signature, modulus, address);
  return gen_inputs;
}

export async function insert13Before10(a: Uint8Array): Promise<Uint8Array> {
  let ret = new Uint8Array(a.length + 1000);
  let j = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 10) {
      ret[j] = 13;
      j++;
    }
    ret[j] = a[i];
    j++;
  }
  return ret.slice(0, j);
}

export const generateJWT = async (
  msg: string,
  signature: string,
  modulus: string,
  address: string
) => {
  // If main
  // if (typeof require !== "undefined" && require.main === module) {
  // debug_file();

  const circuitInputs = await do_generate(
    msg,
    signature,
    modulus,
    address
  ).then((res) => {
    console.log('Writing to file...');
    console.log(res);
    fs.writeFileSync(`./jwt.json`, JSON.stringify(res), { flag: 'w' });
  });

  // const circuitInputs = await do_generate(msg, signature, modulus, address);

  // console.log("Writing to file...");
  // fs.writeFileSync(`./jwt.json`, JSON.stringify(circuitInputs), { flag: "w" });

  // return JSON.stringify(circuitInputs);
  // gen_test();
  // }
};

module.exports = {
  generateJWT,
};
