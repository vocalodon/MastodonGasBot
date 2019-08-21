import { strict } from "assert";

export class SheetAsDatabase {
    spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
    sheet: GoogleAppsScript.Spreadsheet.Sheet = Object();
    range: GoogleAppsScript.Spreadsheet.Range = Object();
    colTitles: string[] = [];
    values: any[][] = [];
    sheetName: string;

    constructor(sheetName: string, spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet) {
        if (spreadsheet != undefined) {
            this.spreadsheet = spreadsheet;
        }
        else {
            this.spreadsheet = SpreadsheetApp.getActive();
        }
        this.sheetName = sheetName;
    }

    readData() {
        this.sheet = this.spreadsheet.getSheetByName(this.sheetName);
        this.range = this.sheet.getDataRange();
        this.values = this.range.getValues();
        this.colTitles = this.values[0];
    }
    writeData() {
        this.range.setValues(this.values);
        SpreadsheetApp.flush();
    }
}


export class ConfigData extends SheetAsDatabase {
    configs() {
        let rows = [];
        let values = this.values.slice(1);
        for (let row of values) {
            let cols: { [key: string]: string } = {};
            for (let colIndex in row) {
                let key = this.colTitles[colIndex];
                let value = row[colIndex];
                cols[key] = value;
            }
            rows.push(cols);
        }
        return rows;
    }
    setConfig(indexRow: number, updateRow: { [key: string]: string }) {
        for (let keyCol in this.colTitles) {
            let title = this.colTitles[Number(keyCol)];
            this.values[indexRow + 1][Number(keyCol)] = updateRow[title];
        }
        this.writeData();
    }
}
