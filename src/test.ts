
import { ConfigData } from "./sheetData";
import { updateTable } from "./spreadsheet";
interface GASUnit {
    exports(suite: any): void;
    assert(value: any): void;
}
declare var GASUnit: GASUnit;

// @ts-ignore: Duplicate identifier 'exports'.
const exports = GASUnit.exports;
const assert = GASUnit.assert

function test_utils() {
    exports({
        'utils': {
            'concatUrl': {
                'should return correct URL when root / is not presented in the path': function () {
                    assert(concatUrl("https://vocalodon.net", "api/v1/apps") === "https://vocalodon.net/api/v1/apps")
                },
                'should return correct URL when last / in the base URL and root / in the path are presented': function () {
                    assert(concatUrl("https://vocalodon.net/", "/api/v1/apps") === "https://vocalodon.net/api/v1/apps")
                }
            }
        },
        'spreadsheet': {
            'updateTable': {
                'should return counted up array when last stringified table is presented': function () {
                    const src = [2, 4, 2, 4, 6, 4, 0, 0, 1, 1, 1, 7, 8, 12, 17, 7, 2, 2, 2, 18, 0, 0, 0, 8];
                    src[23] += 1;
                    const updatedTable = updateTable("2019-10-12T23:59:59+0900", "[2,4,2,4,6,4,0,0,1,1,1,7,8,12,17,7,2,2,2,18,0,0,0,8]");
                    const dst = JSON.parse(updatedTable);
                    for (const i in dst) {
                        assert(src[i] === dst[i]);
                    }
                },
                'should return counted up array when nul string is presentedd': function () {
                    const src = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    src[23] += 1;
                    const updatedTable = updateTable("2019-10-12T23:59:59+0900", "");
                    const dst = JSON.parse(updatedTable);
                    for (let i = 0; i < src.length; i++) {
                        assert(src[i] === dst[i]);
                    }
                }
            },
            'isTriggerEnable': {
                'hold time property should be 4:00:00': function () {
                    const configData = new ConfigData("bot property");
                    configData.readData();
                    const configs = configData.configs();
                    const date = (new Date("Dec 30 1899 04:00:00")).getTime();
                    const propertyDate = (<Date>configs[0]["hold time"]).getTime();
                    assert(propertyDate === date);
                },
                'hold fire property should be false': function () {
                    const configData = new ConfigData("bot property");
                    configData.readData();
                    const configs = configData.configs();
                    assert(configs[0]["hold fire"] === false)
                }
            }
        }
    })
}