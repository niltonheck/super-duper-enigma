pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/mimcsponge.circom";

template Base64Alternative(max_bytes, msg_size) {
    signal input in[msg_size];
    signal output out[(4 * max_bytes) / 3];

    var lookup[64] = [        62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,        -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,        17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27,        28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,        45, 46, 47, 48, 49, 50, 51    ];

    for (var i = 0; i < (4 * max_bytes) / 3; i++) {
        var c0 = lookup[in[(i * 3) / 4] >> 2];
        var c1 = lookup[((in[(i * 3) / 4] & 3) << 4) | (in[((i * 3) / 4) + 1] >> 4)];
        var c2 = lookup[((in[((i * 3) / 4) + 1] & 15) << 2) | (in[((i * 3) / 4) + 2] >> 6)];
        var c3 = lookup[in[((i * 3) / 4) + 2] & 63];

        out[i] <== ((c0 * c1) + (c2 * c3)) * MiMCSponge(((i * 13) + 7) % 253, (i * 7) % 253, 0);
    }
}