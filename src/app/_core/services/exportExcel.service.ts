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

 

  exportToExcelts(data: any[], columns: any[], fileName: string) {

    // Transformer les données selon les colonnes
     // Dans exportToExcel
    const formattedData = data.map(row => {
      const newRow = { ...row };
      Object.keys(newRow).forEach(key => {
        if (key.toLowerCase().includes('date') && newRow[key]) {
          newRow[key] = new Date(newRow[key]).toLocaleDateString('fr-FR');
        }
      });
      return newRow;
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

  exportRawData(data: any[], fileName: string) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = { Sheets: { Ecritures: worksheet}, SheetNames: ['Ecritures' ]};
      const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'array' });
      this.saveFile(excelBuffer,fileName);
  }

  exportSageX3(rows: any[][], fileName: string) {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook: XLSX.WorkBook = {Sheets: {ImportX3: worksheet}, SheetNames: ['ImportX3']};
    const excelBuffer = XLSX.write(workbook,{bookType: 'xlsx',type: 'array'});

    this.saveFile(excelBuffer,fileName);
  }

}