pragma circom 2.0.3;

include "../circuits/regex_helpers.circom";

template exp (msg_bytes, reveal_bytes, group_idx) {
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

    component eq[6][num_bytes];
    component lt[4][num_bytes];
    component and[10][num_bytes];
    component multi_or[1][num_bytes];
    signal states[num_bytes+1][8];
    
    for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
    }
    for (var i = 1; i < 8; i++) {
        states[0][i] <== 0;
    }
    
    var match_group_indexes[1] = [1];
    for (var i = 0; i < num_bytes; i++) {
        //digits
        lt[0][i] = LessThan(8);
        lt[0][i].in[0] <== 47;
        lt[0][i].in[1] <== in[i];
        lt[1][i] = LessThan(8);
        lt[1][i].in[0] <== in[i];
        lt[1][i].in[1] <== 58;
        and[0][i] = AND();
        and[0][i].a <== lt[0][i].out;
        and[0][i].b <== lt[1][i].out;
        and[1][i] = AND();
        and[1][i].a <== states[i][1];
        and[1][i].b <== and[0][i].out;
        //digits
        lt[2][i] = LessThan(8);
        lt[2][i].in[0] <== 47;
        lt[2][i].in[1] <== in[i];
        lt[3][i] = LessThan(8);
        lt[3][i].in[0] <== in[i];
        lt[3][i].in[1] <== 58;
        and[2][i] = AND();
        and[2][i].a <== lt[2][i].out;
        and[2][i].b <== lt[3][i].out;
        and[3][i] = AND();
        and[3][i].a <== states[i][7];
        and[3][i].b <== and[2][i].out;
        multi_or[0][i] = MultiOR(2);
        multi_or[0][i].in[0] <== and[1][i].out;
        multi_or[0][i].in[1] <== and[3][i].out;
        states[i+1][1] <== multi_or[0][i].out;
        //"
        eq[0][i] = IsEqual();
        eq[0][i].in[0] <== in[i];
        eq[0][i].in[1] <== 34;
        and[4][i] = AND();
        and[4][i].a <== states[i][0];
        and[4][i].b <== eq[0][i].out;
        states[i+1][2] <== and[4][i].out;
        //e
        eq[1][i] = IsEqual();
        eq[1][i].in[0] <== in[i];
        eq[1][i].in[1] <== 101;
        and[5][i] = AND();
        and[5][i].a <== states[i][2];
        and[5][i].b <== eq[1][i].out;
        states[i+1][3] <== and[5][i].out;
        //x
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 120;
        and[6][i] = AND();
        and[6][i].a <== states[i][3];
        and[6][i].b <== eq[2][i].out;
        states[i+1][4] <== and[6][i].out;
        //p
        eq[3][i] = IsEqual();
        eq[3][i].in[0] <== in[i];
        eq[3][i].in[1] <== 112;
        and[7][i] = AND();
        and[7][i].a <== states[i][4];
        and[7][i].b <== eq[3][i].out;
        states[i+1][5] <== and[7][i].out;
        //"
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 34;
        and[8][i] = AND();
        and[8][i].a <== states[i][5];
        and[8][i].b <== eq[4][i].out;
        states[i+1][6] <== and[8][i].out;
        //:
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 58;
        and[9][i] = AND();
        and[9][i].a <== states[i][6];
        and[9][i].b <== eq[5][i].out;
        states[i+1][7] <== and[9][i].out;
    }
    signal final_state_sum[num_bytes+1];
    final_state_sum[0] <== states[0][7];
    for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][7];
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
