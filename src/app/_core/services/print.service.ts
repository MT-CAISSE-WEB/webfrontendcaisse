// services/print.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  /**
   * Imprime les données dans une nouvelle fenêtre
   */
  printData(
    data: any[],
    columns: {
      header: string;
      field: string;
      format?: (value: any) => string;
    }[],
    title: string = 'Rapport',
  ): void {
    if (!data || data.length === 0) {
      console.warn('Aucune donnée à imprimer');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      console.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    // Préparer les données
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) => {
      return columns.map((col) => {
        let value = this.resolveField(row, col.field);
        if (col.format) {
          value = col.format(value);
        }
        return value !== undefined && value !== null ? value : '-';
      });
    });

    const htmlContent = this.buildPrintHTML(headers, rows, title);
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Auto-impression après chargement
    printWindow.onload = function () {
      // Décommente pour impression automatique
      // printWindow.print();
    };
  }

  /**
   * Construit le HTML pour l'impression
   */
  private buildPrintHTML(
    headers: string[],
    rows: any[][],
    title: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 30px;
            background: #ffffff;
            color: #1e293b;
          }
          .print-header {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #405189;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .print-header h1 {
            font-size: 24px;
            color: #405189;
            margin-bottom: 5px;
          }
          .print-header .subtitle {
            color: #64748b;
            font-size: 14px;
          }
          .print-header .date {
            color: #94a3b8;
            font-size: 12px;
            text-align: right;
          }
          .print-header .date strong {
            color: #475569;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 10px;
          }
          th {
            background: #405189;
            color: #ffffff;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #405189;
          }
          td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          tr:hover {
            background: #f1f5f9;
          }
          .text-end {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }
          .badge-success {
            background: #dcfce7;
            color: #16a34a;
          }
          .badge-danger {
            background: #fee2e2;
            color: #dc2626;
          }
          .badge-warning {
            background: #fef3c7;
            color: #d97706;
          }
          .print-footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
          }
          .total-row {
            background: #f1f5f9 !important;
            font-weight: 600;
          }
          .total-row td {
            border-top: 2px solid #405189;
          }
          .no-print {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            border-top: 1px solid #e2e8f0;
          }
          .no-print button {
            padding: 10px 30px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-print {
            background: #405189;
            color: white;
          }
          .btn-print:hover {
            background: #2d3b6e;
          }
          .btn-close {
            background: #e2e8f0;
            color: #1e293b;
            margin-left: 10px;
          }
          .btn-close:hover {
            background: #cbd5e1;
          }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            th { background: #405189 !important; color: white !important; }
            td { border-color: #cbd5e1 !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <h1>${title}</h1>
            <div class="subtitle">Liste des opérations</div>
          </div>
          <div class="date">
            <strong>Généré le</strong><br>
            ${new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <div class="print-footer">
          Document généré automatiquement - ${new Date().toLocaleString('fr-FR')}
          <br>
          <span style="font-size: 10px; color: #cbd5e1;">
            Confidentiel - Usage interne
          </span>
        </div>

        <div class="no-print">
          <button class="btn-print" onclick="window.print()">
            🖨️ Imprimer
          </button>
          <button class="btn-close" onclick="window.close()">
            ✖ Fermer
          </button>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Résout un champ avec un chemin
   */
  private resolveField(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => (o ? o[i] : ''), obj);
  }
}
