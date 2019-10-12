var exports = GASUnit.exports
var assert = GASUnit.assert

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
                    var src = [2, 4, 2, 4, 6, 4, 0, 0, 1, 1, 1, 7, 8, 12, 17, 7, 2, 2, 2, 18, 0, 0, 0, 8];
                    src[23] += 1;
                    var updatedTable = updateTable("2019-10-12T23:59:59+0900", "[2,4,2,4,6,4,0,0,1,1,1,7,8,12,17,7,2,2,2,18,0,0,0,8]");
                    var dst = JSON.parse(updatedTable);
                    for (var i in dst) {
                        assert(src[i] === dst[i]);
                    }
                },
                'should return counted up array when nul string is presentedd': function () {
                    var src = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    src[23] += 1;
                    var updatedTable = updateTable("2019-10-12T23:59:59+0900", "");
                    var dst = JSON.parse(updatedTable);
                    for (var i in dst) {
                        assert(src[i] === dst[i]);
                    }
                }
            }
        }
    })
}