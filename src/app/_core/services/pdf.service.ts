// services/pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  /**
   * Exporte les données en PDF
   */
  exportToPDF(
    data: any[],
    columns: { header: string; field: string }[],
    fileName: string,
    title: string = 'Rapport',
  ): void {
    if (!data || data.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    // Utiliser une police qui supporte l'Unicode
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ============ TITRE ============
    doc.setFontSize(18);
    doc.setTextColor(64, 81, 137);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    // Sous-titre
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    const subTitle = `Généré le ${new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    doc.text(subTitle, pageWidth / 2, 28, { align: 'center' });

    // Ligne de séparation
    doc.setDrawColor(64, 81, 137);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);

    // ============ PRÉPARATION DES DONNÉES ============
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) => {
      return columns.map((col) => {
        const value = this.resolveField(row, col.field);
        return value !== undefined && value !== null ? value : '-';
      });
    });

    // ============ TABLEAU ============
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 38,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      headStyles: {
        fillColor: [64, 81, 137],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto', halign: 'right' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto', halign: 'right' },
        4: { cellWidth: 'auto', halign: 'right' },
        5: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        // Numéro de page
        const pageNum = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${pageNum} sur ${doc.internal.pages.length - 1}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' },
        );
      },
    });

    // ============ PIED DE PAGE ============
    const finalY = (doc as any).lastAutoTable?.finalY || 0;
    if (finalY > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, finalY + 8, pageWidth - 14, finalY + 8);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Document généré automatiquement - Tous droits réservés',
        pageWidth / 2,
        finalY + 14,
        { align: 'center' },
      );
    }

    // ============ SAUVEGARDE ============
    doc.save(`${fileName}.pdf`);
  }

  /**
   * Exporte les données en PDF avec format personnalisé
   * Version corrigée avec nettoyage des caractères spéciaux
   */
  exportCustomPDF(
    data: any[],
    columns: {
      header: string;
      field: string;
      format?: (value: any) => string;
    }[],
    fileName: string,
    title: string = 'Rapport',
  ): void {
    if (!data || data.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    // ✅ Utiliser l'encodage UTF-8
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ✅ Nettoyer le titre
    const cleanTitle = this.cleanText(title);

    // ============ TITRE ============
    doc.setFontSize(20);
    doc.setTextColor(64, 81, 137);
    doc.text(cleanTitle, pageWidth / 2, 20, { align: 'center' });

    // ============ INFORMATIONS ============
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Texte complet avec formatage correct
    const infoText = `Date : ${dateStr}`;
    doc.text(infoText, 14, 30);

    const totalText = `Total : ${data.length} enregistrement(s)`;
    doc.text(totalText, 14, 37);

    // ============ LIGNE DE SÉPARATION ============
    doc.setDrawColor(64, 81, 137);
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    // ============ PRÉPARATION DES DONNÉES ============
    const headers = columns.map((col) => this.cleanText(col.header));
    const rows = data.map((row) => {
      return columns.map((col) => {
        let value = this.resolveField(row, col.field);
        if (col.format) {
          value = col.format(value);
        }
        const text =
          value !== undefined && value !== null ? String(value) : '-';
        return this.cleanText(text);
      });
    });

    // ============ TABLEAU ============
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
        halign: 'left',
      },
      headStyles: {
        fillColor: [64, 81, 137],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto', halign: 'center' },
        2: { cellWidth: 'auto', halign: 'right' },
        3: { cellWidth: 'auto', halign: 'center' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto', halign: 'center' },
      },
      didDrawPage: (data) => {
        // Numéro de page
        const pageNum = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${pageNum} / ${doc.internal.pages.length - 1}`,
          pageWidth - 14,
          pageHeight - 10,
          { align: 'right' },
        );
        doc.text('Confidentiel - Usage interne', 14, pageHeight - 10, {
          align: 'left',
        });
      },
    });

    // ============ SAUVEGARDE ============
    doc.save(`${fileName}.pdf`);
  }

  /**
   * Nettoie le texte des caractères spéciaux
   */
  private cleanText(text: string): string {
    if (!text) return '';

    const map: { [key: string]: string } = {
      é: 'e',
      è: 'e',
      ê: 'e',
      ë: 'e',
      à: 'a',
      â: 'a',
      ä: 'a',
      î: 'i',
      ï: 'i',
      ô: 'o',
      ö: 'o',
      ù: 'u',
      û: 'u',
      ü: 'u',
      ç: 'c',
      É: 'E',
      È: 'E',
      Ê: 'E',
      Ë: 'E',
      À: 'A',
      Â: 'A',
      Ä: 'A',
      Î: 'I',
      Ï: 'I',
      Ô: 'O',
      Ö: 'O',
      Ù: 'U',
      Û: 'U',
      Ü: 'U',
      Ç: 'C',
      ø: 'o',
      Ø: 'O',
      æ: 'ae',
      Æ: 'AE',
    };

    return text.replace(
      /[éèêëàâäîïôöùûüçÉÈÊËÀÂÄÎÏÔÖÙÛÜÇøØæÆ]/g,
      (match) => map[match] || match,
    );
  }

  /**
   * Résout un champ avec un chemin (ex: 'user.nom')
   */
  private resolveField(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => (o ? o[i] : ''), obj);
  }
}
