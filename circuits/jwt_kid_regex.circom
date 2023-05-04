pragma circom 2.0.3;

include "../circuits/regex_helpers.circom";

template JWTKid (msg_bytes, reveal_bytes, group_idx) {
    signal input msg[msg_bytes];
    signal input match_idx;
    signal output start_idx;
    signal output group_match_count;
    signal output entire_count;

    signal reveal_shifted_intermediate[reveal_bytes][msg_bytes];
    signal output reveal_shifted[reveal_bytes];

    var num_bytes = msg_bytes;
    signal in[num_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        in[i] <== msg[i];
    }

    component eq[9][num_bytes];
    component lt[12][num_bytes];
    component and[17][num_bytes];
    component multi_or[4][num_bytes];
    signal states[num_bytes+1][10];
    
    for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
    }
    for (var i = 1; i < 10; i++) {
        states[0][i] <== 0;
    }
    
    var match_group_indexes[1] = [1];
    for (var i = 0; i < num_bytes; i++) {
        //UPPERCASE
        lt[0][i] = LessThan(8);
        lt[0][i].in[0] <== 64;
        lt[0][i].in[1] <== in[i];
        lt[1][i] = LessThan(8);
        lt[1][i].in[0] <== in[i];
        lt[1][i].in[1] <== 91;
        and[0][i] = AND();
        and[0][i].a <== lt[0][i].out;
        and[0][i].b <== lt[1][i].out;
        //lowercase
        lt[2][i] = LessThan(8);
        lt[2][i].in[0] <== 96;
        lt[2][i].in[1] <== in[i];
        lt[3][i] = LessThan(8);
        lt[3][i].in[0] <== in[i];
        lt[3][i].in[1] <== 123;
        and[1][i] = AND();
        and[1][i].a <== lt[2][i].out;
        and[1][i].b <== lt[3][i].out;
        //digits
        lt[4][i] = LessThan(8);
        lt[4][i].in[0] <== 47;
        lt[4][i].in[1] <== in[i];
        lt[5][i] = LessThan(8);
        lt[5][i].in[0] <== in[i];
        lt[5][i].in[1] <== 58;
        and[2][i] = AND();
        and[2][i].a <== lt[4][i].out;
        and[2][i].b <== lt[5][i].out;
        and[3][i] = AND();
        and[3][i].a <== states[i][1];
        multi_or[0][i] = MultiOR(3);
        multi_or[0][i].in[0] <== and[0][i].out;
        multi_or[0][i].in[1] <== and[1][i].out;
        multi_or[0][i].in[2] <== and[2][i].out;
        and[3][i].b <== multi_or[0][i].out;
        //UPPERCASE
        lt[6][i] = LessThan(8);
        lt[6][i].in[0] <== 64;
        lt[6][i].in[1] <== in[i];
        lt[7][i] = LessThan(8);
        lt[7][i].in[0] <== in[i];
        lt[7][i].in[1] <== 91;
        and[4][i] = AND();
        and[4][i].a <== lt[6][i].out;
        and[4][i].b <== lt[7][i].out;
        //lowercase
        lt[8][i] = LessThan(8);
        lt[8][i].in[0] <== 96;
        lt[8][i].in[1] <== in[i];
        lt[9][i] = LessThan(8);
        lt[9][i].in[0] <== in[i];
        lt[9][i].in[1] <== 123;
        and[5][i] = AND();
        and[5][i].a <== lt[8][i].out;
        and[5][i].b <== lt[9][i].out;
        //digits
        lt[10][i] = LessThan(8);
        lt[10][i].in[0] <== 47;
        lt[10][i].in[1] <== in[i];
        lt[11][i] = LessThan(8);
        lt[11][i].in[0] <== in[i];
        lt[11][i].in[1] <== 58;
        and[6][i] = AND();
        and[6][i].a <== lt[10][i].out;
        and[6][i].b <== lt[11][i].out;
        and[7][i] = AND();
        and[7][i].a <== states[i][9];
        multi_or[1][i] = MultiOR(3);
        multi_or[1][i].in[0] <== and[4][i].out;
        multi_or[1][i].in[1] <== and[5][i].out;
        multi_or[1][i].in[2] <== and[6][i].out;
        and[7][i].b <== multi_or[1][i].out;
        multi_or[2][i] = MultiOR(2);
        multi_or[2][i].in[0] <== and[3][i].out;
        multi_or[2][i].in[1] <== and[7][i].out;
        states[i+1][1] <== multi_or[2][i].out;
        //"
        eq[0][i] = IsEqual();
        eq[0][i].in[0] <== in[i];
        eq[0][i].in[1] <== 34;
        and[8][i] = AND();
        and[8][i].a <== states[i][0];
        and[8][i].b <== eq[0][i].out;
        states[i+1][2] <== and[8][i].out;
        //"
        eq[1][i] = IsEqual();
        eq[1][i].in[0] <== in[i];
        eq[1][i].in[1] <== 34;
        and[9][i] = AND();
        and[9][i].a <== states[i][1];
        and[9][i].b <== eq[1][i].out;
        //,
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 44;
        and[10][i] = AND();
        and[10][i].a <== states[i][3];
        and[10][i].b <== eq[2][i].out;
        multi_or[3][i] = MultiOR(2);
        multi_or[3][i].in[0] <== and[9][i].out;
        multi_or[3][i].in[1] <== and[10][i].out;
        states[i+1][3] <== multi_or[3][i].out;
        //k
        eq[3][i] = IsEqual();
        eq[3][i].in[0] <== in[i];
        eq[3][i].in[1] <== 107;
        and[11][i] = AND();
        and[11][i].a <== states[i][2];
        and[11][i].b <== eq[3][i].out;
        states[i+1][4] <== and[11][i].out;
        //i
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 105;
        and[12][i] = AND();
        and[12][i].a <== states[i][4];
        and[12][i].b <== eq[4][i].out;
        states[i+1][5] <== and[12][i].out;
        //d
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 100;
        and[13][i] = AND();
        and[13][i].a <== states[i][5];
        and[13][i].b <== eq[5][i].out;
        states[i+1][6] <== and[13][i].out;
        //"
        eq[6][i] = IsEqual();
        eq[6][i].in[0] <== in[i];
        eq[6][i].in[1] <== 34;
        and[14][i] = AND();
        and[14][i].a <== states[i][6];
        and[14][i].b <== eq[6][i].out;
        states[i+1][7] <== and[14][i].out;
        //:
        eq[7][i] = IsEqual();
        eq[7][i].in[0] <== in[i];
        eq[7][i].in[1] <== 58;
        and[15][i] = AND();
        and[15][i].a <== states[i][7];
        and[15][i].b <== eq[7][i].out;
        states[i+1][8] <== and[15][i].out;
        //"
        eq[8][i] = IsEqual();
        eq[8][i].in[0] <== in[i];
        eq[8][i].in[1] <== 34;
        and[16][i] = AND();
        and[16][i].a <== states[i][8];
        and[16][i].b <== eq[8][i].out;
        states[i+1][9] <== and[16][i].out;
    }
    signal final_state_sum[num_bytes+1];
    final_state_sum[0] <== states[0][9];
    for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][9];
    }
    entire_count <== final_state_sum[num_bytes];
    signal output reveal[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        reveal[i] <== in[i] * states[i+1][match_group_indexes[group_idx]];
    }
    

    // a flag to indicate the start position of the match
    var start_index = 0;
    // for counting the number of matches
    var count = 0;

    // lengths to be consistent with states signal
    component check_start[num_bytes + 1];
    component check_match[num_bytes + 1];
    component check_matched_start[num_bytes + 1];
    component matched_idx_eq[msg_bytes];

    for (var i = 0; i < num_bytes; i++) {
        if (i == 0) {
            count += states[1][match_group_indexes[group_idx]];
        }
        else {
            check_start[i] = AND();
            check_start[i].a <== states[i + 1][match_group_indexes[group_idx]];
            check_start[i].b <== 1 - states[i][match_group_indexes[group_idx]];

            count += check_start[i].out;

            check_match[i] = IsEqual();
            check_match[i].in[0] <== count;
            check_match[i].in[1] <== match_idx + 1;

            check_matched_start[i] = AND();
            check_matched_start[i].a <== check_match[i].out;
            check_matched_start[i].b <== check_start[i].out;
            start_index += check_matched_start[i].out * i;
        }

        matched_idx_eq[i] = IsEqual();
        matched_idx_eq[i].in[0] <== states[i + 1][match_group_indexes[group_idx]] * count;
        matched_idx_eq[i].in[1] <== match_idx + 1;
    }

    component match_start_idx[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        match_start_idx[i] = IsEqual();
        match_start_idx[i].in[0] <== i;
        match_start_idx[i].in[1] <== start_index;
    }

    signal reveal_match[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        reveal_match[i] <== matched_idx_eq[i].out * reveal[i];
    }

    for (var j = 0; j < reveal_bytes; j++) {
        reveal_shifted_intermediate[j][j] <== 0;
        for (var i = j + 1; i < msg_bytes; i++) {
            // This shifts matched string back to the beginning. 
            reveal_shifted_intermediate[j][i] <== reveal_shifted_intermediate[j][i - 1] + match_start_idx[i-j].out * reveal_match[i];
        }
        reveal_shifted[j] <== reveal_shifted_intermediate[j][msg_bytes - 1];
    }

    group_match_count <== count;
    start_idx <== start_index;
}
