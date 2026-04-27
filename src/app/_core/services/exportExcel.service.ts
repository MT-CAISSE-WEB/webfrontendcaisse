// excel.service.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  exportToExcel(data: any[], columns: any[], fileName: string) {

    // Transformer les données selon les colonnes
    const formattedData = data.map(row => {
      const obj: any = {};
      columns.forEach(col => {
        obj[col.header] = this.resolveField(row, col.field);
      });
      return obj;
    });

    // Créer worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    // Créer workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };

    // Export
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    this.saveFile(excelBuffer, fileName);
  }

  private resolveField(obj: any, path: string) {
    return path.split('.').reduce((o, i) => o ? o[i] : '', obj);
  }

  private saveFile(buffer: any, fileName: string) {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(data, `${fileName}_${new Date().getTime()}.xlsx`);
  }

}