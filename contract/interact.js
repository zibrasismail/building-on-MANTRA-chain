import { calculateFee, StdFee} from "@cosmjs/stargate"
import { coin } from "@cosmjs/amino"

const [addr, client] = await useOptions(malagaOptions).setup("password");
// Make sure you use the right path for the wasm binary
const wasm = fs.readFileSync("/Users/ash/cw-to-do-list/artifacts/cw_to_do_list.wasm")
const uploadFee = calculateFee(malagaOptions.fees.upload, malagaOptions.gasPrice)
const result = await client.upload(addr, wasm, uploadFee)
console.log(result)