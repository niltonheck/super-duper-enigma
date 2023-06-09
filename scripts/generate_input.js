"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.generateJWT = exports.insert13Before10 = exports.generate_inputs = exports.getCircuitInputs = void 0;
var binaryFormat_1 = require("../helpers/binaryFormat");
var constants_1 = require("../helpers/constants");
var shaHash_1 = require("../helpers/shaHash");
var fast_sha256_1 = require("./fast-sha256");
var Cryo = require("cryo");
var pki = require("node-forge").pki;
var CircuitType;
(function (CircuitType) {
    CircuitType["RSA"] = "rsa";
    CircuitType["SHA"] = "sha";
    CircuitType["TEST"] = "test";
    CircuitType["JWT"] = "jwt";
})(CircuitType || (CircuitType = {}));
function assert(cond, errorMessage) {
    if (!cond) {
        throw new Error(errorMessage);
    }
}
// Works only on 32 bit sha text lengths
function int32toBytes(num) {
    var arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    var view = new DataView(arr);
    view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
// Works only on 32 bit sha text lengths
function int8toBytes(num) {
    var arr = new ArrayBuffer(1); // an Int8 takes 4 bytes
    var view = new DataView(arr);
    view.setUint8(0, num); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
function mergeUInt8Arrays(a1, a2) {
    // sum of individual array lengths
    var mergedArray = new Uint8Array(a1.length + a2.length);
    mergedArray.set(a1);
    mergedArray.set(a2, a1.length);
    return mergedArray;
}
// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
function sha256Pad(prehash_prepad_m, maxShaBytes) {
    return __awaiter(this, void 0, void 0, function () {
        var length_bits, length_in_bytes, messageLen;
        return __generator(this, function (_a) {
            length_bits = prehash_prepad_m.length * 8;
            length_in_bytes = int32toBytes(length_bits);
            prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(Math.pow(2, 7)));
            while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !==
                0) {
                prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
            }
            prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
            assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
            messageLen = prehash_prepad_m.length;
            while (prehash_prepad_m.length < maxShaBytes) {
                prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int32toBytes(0));
            }
            assert(prehash_prepad_m.length === maxShaBytes, "Padding to max length did not complete properly!");
            return [2 /*return*/, [prehash_prepad_m, messageLen]];
        });
    });
}
function Uint8ArrayToCharArray(a) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Array.from(a).map(function (x) { return x.toString(); })];
        });
    });
}
function Uint8ArrayToString(a) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Array.from(a)
                    .map(function (x) { return x.toString(); })
                    .join(";")];
        });
    });
}
function findSelector(a, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var i, j;
        return __generator(this, function (_a) {
            i = 0;
            j = 0;
            while (i < a.length) {
                if (a[i] === selector[j]) {
                    j++;
                    if (j === selector.length) {
                        return [2 /*return*/, i - j + 1];
                    }
                }
                else {
                    j = 0;
                }
                i++;
            }
            return [2 /*return*/, -1];
        });
    });
}
function partialSha(msg, msgLen) {
    return __awaiter(this, void 0, void 0, function () {
        var shaGadget;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shaGadget = new fast_sha256_1.Hash();
                    return [4 /*yield*/, shaGadget.update(msg, msgLen).cacheState()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function getCircuitInputs(rsa_signature, rsa_modulus, msg, eth_address, circuit) {
    return __awaiter(this, void 0, void 0, function () {
        var modulusBigInt, prehash_message_string, signatureBigInt, period_idx, prehashBytesUnpadded, postShaBigintUnpadded, _a, _b, _c, messagePadded, messagePaddedLen, shaOut, _d, _e, _f, _g, _h, circuitInputs, modulus, signature, message_padded_bytes, message, base_message, address, address_plus_one;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log("Starting processing of inputs: ".concat(eth_address));
                    modulusBigInt = rsa_modulus;
                    prehash_message_string = msg;
                    signatureBigInt = rsa_signature;
                    period_idx = prehash_message_string.indexOf(".");
                    prehashBytesUnpadded = typeof prehash_message_string == "string"
                        ? new TextEncoder().encode(prehash_message_string)
                        : Uint8Array.from(prehash_message_string);
                    _a = binaryFormat_1.bytesToBigInt;
                    _b = binaryFormat_1.stringToBytes;
                    return [4 /*yield*/, (0, shaHash_1.shaHash)(prehashBytesUnpadded)];
                case 1:
                    postShaBigintUnpadded = _a.apply(void 0, [_b.apply(void 0, [(_j.sent()).toString()])]) % constants_1.CIRCOM_FIELD_MODULUS;
                    return [4 /*yield*/, sha256Pad(prehashBytesUnpadded, 1472)];
                case 2:
                    _c = _j.sent(), messagePadded = _c[0], messagePaddedLen = _c[1];
                    return [4 /*yield*/, partialSha(messagePadded, messagePaddedLen)];
                case 3:
                    shaOut = _j.sent();
                    _d = assert;
                    return [4 /*yield*/, Uint8ArrayToString(shaOut)];
                case 4:
                    _e = (_j.sent());
                    _f = Uint8ArrayToString;
                    _h = (_g = Uint8Array).from;
                    return [4 /*yield*/, (0, shaHash_1.shaHash)(prehashBytesUnpadded)];
                case 5: return [4 /*yield*/, _f.apply(void 0, [_h.apply(_g, [_j.sent()])])];
                case 6:
                    _d.apply(void 0, [_e ===
                            (_j.sent()),
                        "SHA256 calculation did not match!"]);
                    modulus = (0, binaryFormat_1.toCircomBigIntBytes)(modulusBigInt);
                    signature = (0, binaryFormat_1.toCircomBigIntBytes)(signatureBigInt);
                    message_padded_bytes = messagePaddedLen.toString();
                    return [4 /*yield*/, Uint8ArrayToCharArray(messagePadded)];
                case 7:
                    message = _j.sent();
                    base_message = (0, binaryFormat_1.toCircomBigIntBytes)(postShaBigintUnpadded);
                    address = (0, binaryFormat_1.bytesToBigInt)((0, binaryFormat_1.fromHex)(eth_address)).toString();
                    address_plus_one = ((0, binaryFormat_1.bytesToBigInt)((0, binaryFormat_1.fromHex)(eth_address)) + 1n).toString();
                    if (circuit === CircuitType.RSA) {
                        circuitInputs = {
                            modulus: modulus,
                            signature: signature,
                            base_message: base_message
                        };
                    }
                    else if (circuit === CircuitType.JWT) {
                        circuitInputs = {
                            message: message,
                            modulus: modulus,
                            signature: signature,
                            message_padded_bytes: message_padded_bytes,
                            address: address,
                            address_plus_one: address_plus_one,
                            period_idx: period_idx
                        };
                    }
                    else {
                        assert(circuit === CircuitType.SHA, "Invalid circuit type");
                        // circuitInputs = {
                        //   m,
                        //   m_padded_bytes,
                        // };
                    }
                    return [2 /*return*/, {
                            circuitInputs: circuitInputs,
                            valid: {}
                        }];
            }
        });
    });
}
exports.getCircuitInputs = getCircuitInputs;
function generate_inputs(msg, signature, modulus, address) {
    return __awaiter(this, void 0, void 0, function () {
        var sig, message, circuitType, eth_address, _modulus, fin_result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sig = BigInt("0x" + Buffer.from(signature, "base64").toString("hex"));
                    console.log("decoded sig");
                    console.log(sig);
                    message = Buffer.from(msg);
                    circuitType = CircuitType.JWT;
                    eth_address = address;
                    _modulus = BigInt(modulus);
                    return [4 /*yield*/, getCircuitInputs(sig, _modulus, message, eth_address, circuitType)];
                case 1:
                    fin_result = _a.sent();
                    return [2 /*return*/, fin_result.circuitInputs];
            }
        });
    });
}
exports.generate_inputs = generate_inputs;
function do_generate(msg, signature, modulus, address) {
    return __awaiter(this, void 0, void 0, function () {
        var gen_inputs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, generate_inputs(msg, signature, modulus, address)];
                case 1:
                    gen_inputs = _a.sent();
                    return [2 /*return*/, gen_inputs];
            }
        });
    });
}
function insert13Before10(a) {
    return __awaiter(this, void 0, void 0, function () {
        var ret, j, i;
        return __generator(this, function (_a) {
            ret = new Uint8Array(a.length + 1000);
            j = 0;
            for (i = 0; i < a.length; i++) {
                if (a[i] === 10) {
                    ret[j] = 13;
                    j++;
                }
                ret[j] = a[i];
                j++;
            }
            return [2 /*return*/, ret.slice(0, j)];
        });
    });
}
exports.insert13Before10 = insert13Before10;
var generateJWT = function (msg, signature, modulus, address) { return __awaiter(void 0, void 0, void 0, function () {
    var circuitInputs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, do_generate(msg, signature, modulus, address)];
            case 1:
                circuitInputs = _a.sent();
                // console.log("Writing to file...");
                // fs.writeFileSync(`./jwt.json`, JSON.stringify(circuitInputs), { flag: "w" });
                return [2 /*return*/, JSON.stringify(circuitInputs)];
        }
    });
}); };
exports.generateJWT = generateJWT;
module.exports = {
    generateJWT: exports.generateJWT
};
