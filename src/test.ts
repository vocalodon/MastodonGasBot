
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
                    let src = [2, 4, 2, 4, 6, 4, 0, 0, 1, 1, 1, 7, 8, 12, 17, 7, 2, 2, 2, 18, 0, 0, 0, 8];
                    src[23] += 1;
                    let updatedTable = updateTable("2019-10-12T23:59:59+0900", "[2,4,2,4,6,4,0,0,1,1,1,7,8,12,17,7,2,2,2,18,0,0,0,8]");
                    let dst = JSON.parse(updatedTable);
                    for (let i in dst) {
                        assert(src[i] === dst[i]);
                    }
                },
                'should return counted up array when nul string is presentedd': function () {
                    let src = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    src[23] += 1;
                    let updatedTable = updateTable("2019-10-12T23:59:59+0900", "");
                    let dst = JSON.parse(updatedTable);
                    for (let i in dst) {
                        assert(src[i] === dst[i]);
                    }
                }
            },
            'isTriggerEnable': {
                'hold_time property should be 4:00:00': function () {
                    let configData = new ConfigData("bot property");
                    configData.readData();
                    let configs = configData.configs();
                    let date = new Date("Dec 30 1899 04:00:00").getTime();
                    let propertyDate = (<Date>configs[0]["hold_time"]).getTime();
                    assert(propertyDate === date);
                }
            }
        }
    })
}