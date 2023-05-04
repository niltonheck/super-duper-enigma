# zk-jwt-draft

The idea is to validate the JWT onchain (against it's modulus conterpart) and than extract the payload and validate it against the expected values.

This draft was inspired by the [emmaguo13/zk-blind](https://github.com/emmaguo13/zk-blind) repository and still uses some of the code from it.

## Scenario:

Let's say that the JWT has a property call "userid" and the value is "1234". The contract will validate the JWT and extract the "userid" property and compare it against the expected value "1234" (public signal?). If the values match, the contract will store the userid and return true, otherwise it will return false.

## Files

- `jwt.json` - A sample input file
  <br /><br />

  #### This file has:

  - `jwt` - The JWT to validate, each item in the array is a character of the message (header + '.' + payload) encoded in base64

  - `modulus` - The modulus of the RSA key used to sign the JWT

  - `kid` - The kid of the RSA key used to sign the JWT

  - `signature` - The signature of the JWT message (header + '.' + payload)

  - `message_padded_bytes` - The message (header + '.' + payload) padded to the size of the modulus. In this case we're using a number smaller than the actual limit.

  - `period_idx` - The index of the period character in the message (header + '.' + payload).

  - `kid_group` - The group index of the KID, currently unused but will be used to REGEX extract the KID from the header. Using [zk-regex](https://github.com/zkemail/zk-regex) method.

  - Other values are part of a previous implmentation and are not required as part of this draft.
    <br /><br />
