pragma circom 2.0.3;

// include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./base64.circom";
include "./jwt_email_regex.circom";
include "./jwt_type_regex.circom";
include "./jwt_kid_regex.circom";

// k - bignum
template JWTVerify(max_msg_bytes, max_json_bytes, n, k, max_header_bytes, reveal_max_kid, group_match_count_kid) {
    // signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input message[max_msg_bytes]; // TODO: header + . + payload. idk if it's k, we should pad this in javascript beforehand
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];

    signal input message_padded_bytes; // length of the message including the padding

    signal input address;
    signal input address_plus_one;

    signal input kid[reveal_max_kid]; // length of the kid

    signal input period_idx; // index of the period in the base64 encoded msg
    var max_domain_len = 30;

    signal input kid_group;

    signal input domain_idx; // index of email domain in message
    // signal input domain[max_domain_len]; // input domain with padding
    // signal reveal_email[max_domain_len][max_json_bytes]; // reveals found email domain

    signal z[20];

    // *********** hash the padded message ***********
    component sha = Sha256Bytes(max_msg_bytes);
    for (var i = 0; i < max_msg_bytes; i++) {
        sha.in_padded[i] <== message[i];
    }
    sha.in_len_padded_bytes <== message_padded_bytes;

    var msg_len = (256+n)\n;
    component base_msg[msg_len];
    for (var i = 0; i < msg_len; i++) {
        base_msg[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        base_msg[i\n].in[i%n] <== sha.out[255 - i];
    }
    for (var i = 256; i < n*msg_len; i++) {
        base_msg[i\n].in[i%n] <== 0;
    }

    // *********** verify signature for the message *********** 
    component rsa = RSAVerify65537(n, k);
    for (var i = 0; i < msg_len; i++) {
        rsa.base_message[i] <== base_msg[i].out;
    }
    for (var i = msg_len; i < k; i++) {
        rsa.base_message[i] <== 0;
    }
    for (var i = 0; i < k; i++) {
        rsa.modulus[i] <== modulus[i];
    }
    for (var i = 0; i < k; i++) {
        rsa.signature[i] <== signature[i];
    }

    // TODO: Check that the JWT does have some public signal in it (claims?)
    // *********** verify some array of bits is within the range of the base_message ***********
}

component main { public [ modulus, address, kid ] } = JWTVerify(1472, 1104, 121, 17, 77, 40, 0);
