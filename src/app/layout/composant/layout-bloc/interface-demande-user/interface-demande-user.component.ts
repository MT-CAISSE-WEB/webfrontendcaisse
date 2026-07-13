import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConsultationDecaissementaj } from '../../../../features/consultations/services/decaissementaj.service';
import { EnteteDemande } from '../../../../features/demande/models/entete-demande.model';
import { NaturePerDeptChartComponent } from '../../../../features/consultations/nature-par-departement/components/stats-nature-per-dept-chart/stats-nature-per-dept-chart.component';
import { ExcelService } from '../../../../_core/services/exportExcel.service';
import { PdfService } from '../../../../_core/services/pdf.service';
import { PrintService } from '../../../../_core/services/print.service';

@Component({
  selector: 'app-interface-demande-user',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-demande-user.component.html',
  styleUrl: './interface-demande-user.component.css',
})
export class InterfaceDemandeUserComponent implements OnInit {
  loadingRequest: boolean = false;
  //Valeurs des operations
  demandesGlobal: any[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;

  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 6;

  constructor(
    private toastr: ToastrService,
    private service: ConsultationDecaissementaj,
    private excelService: ExcelService,
    private pdfService: PdfService,
    private printService: PrintService,
  ) {}

  ngOnInit(): void {
    //charger les demandes de l'utilisateur
    this.loadDemandeUser();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // interface-demande-user.component.ts

  /**
   * Formate un montant en CFA (sans décimales)
   * Version robuste qui gère tous les cas
   */
  formatCFA(montant: number | string | null | undefined): string {
    // Si la valeur est null, undefined ou vide
    if (montant === null || montant === undefined || montant === '') {
      return '0';
    }

    // Si c'est une chaîne, la nettoyer
    if (typeof montant === 'string') {
      // Supprimer les espaces, les caractères non numériques (sauf le point et la virgule)
      let cleaned = montant.replace(/[^0-9,.]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) {
        return '0';
      }
      montant = parsed;
    }

    // Si ce n'est pas un nombre valide
    if (typeof montant !== 'number' || isNaN(montant)) {
      return '0';
    }

    // Arrondir à l'entier le plus proche
    const rounded = Math.round(montant);

    // Formater avec séparation des milliers
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');

    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');

    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  //Recharger la page des dernieres données
  changePage(page: number) {
    this.currentPage = page;
    //this.getLastOperation(this.params); // recharge les données
  }

  loadDemandeUser() {
    const data = {
      page: this.currentPage,
      limit: this.limit,
      idutilisateur: this.user.idutilisateur,
    };
    this.loadingRequest = true;
    this.service.getdemandeByuser(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.demandesGlobal = res.data.data;
          this.totalPages = res.data.totalPages;
          this.loadingRequest = false;
        } else {
          this.loadingRequest = false;
        }
      },
      error: (err) => {
        this.loadingRequest = false;
      },
    });
  }

  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce(
      (sum, l) =>
        sum +
        (typeof l.montantdemande === 'number'
          ? l.montantdemande
          : parseFloat(String(l.montantdemande)) || 0),
      0,
    );
  }

  // ============================================
  // FONCTIONS D'EXPORT
  // ============================================

  /**
   * Prépare les données pour l'export
   */
  private prepareExportData(): any[] {
    return this.demandesGlobal.map((item) => {
      const montantTotal = this.getTotalDemande(item);
      return {
        codedemande: item.codedemande || '-',
        datedemande: this.formatDateFR(item.datedemande),
        montant: this.formatCFA(montantTotal as number),
        devise: item.devise?.codedevise || '-',
        statut: this.getStatutLabel(item.statut),
        paye: item.decaisse === 1 ? 'Oui' : 'Non',
        departement: item.departement?.libelle || '-',
        typedemande: item.typedemande || '-',
        demandeur:
          `${item.demandeur?.nom || ''} ${item.demandeur?.prenom || ''}`.trim() ||
          '-',
      };
    });
  }

  /**
   * Récupère le libellé du statut
   */
  private getStatutLabel(statut: number): string {
    switch (statut) {
      case 0:
        return 'Non validée';
      case 1:
        return 'En cours';
      case 2:
        return 'À revoir';
      case 3:
        return 'Validée';
      case 4:
        return 'Rejetée';
      default:
        return 'Payée';
    }
  }

  /**
   * Export Excel
   */
  exportToExcel(): void {
    if (!this.demandesGlobal || this.demandesGlobal.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const columns = [
        { header: 'N° Demande', field: 'codedemande' },
        { header: 'Date demande', field: 'datedemande' },
        { header: 'Montant', field: 'montant' },
        { header: 'Devise', field: 'devise' },
        { header: 'Statut', field: 'statut' },
        { header: 'Payé', field: 'paye' },
        { header: 'Département', field: 'departement' },
        { header: 'Type demande', field: 'typedemande' },
        { header: 'Demandeur', field: 'demandeur' },
      ];

      const data = this.prepareExportData();
      const fileName = `mes_demandes_decaissement_${new Date().toISOString().split('T')[0]}`;
      this.excelService.exportToExcel(data, columns, fileName);
      this.toastr.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      this.toastr.error("Erreur lors de l'export Excel");
    }
  }

  /**
   * Export PDF
   */
  exportToPDF(): void {
    if (!this.demandesGlobal || this.demandesGlobal.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const columns = [
        { header: 'N° Demande', field: 'codedemande' },
        { header: 'Date', field: 'datedemande' },
        { header: 'Montant', field: 'montant' },
        { header: 'Devise', field: 'devise' },
        { header: 'Statut', field: 'statut' },
        { header: 'Payé', field: 'paye' },
        { header: 'Département', field: 'departement' },
      ];

      const data = this.prepareExportData();
      const title = `Mes demandes de décaissement`;
      const fileName = `mes_demandes_decaissement_${new Date().toISOString().split('T')[0]}`;

      this.pdfService.exportToPDF(data, columns, fileName, title);
      this.toastr.success('Export PDF réussi');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      this.toastr.error("Erreur lors de l'export PDF");
    }
  }

  // interface-demande-user.component.ts

  /**
   * Export PDF avec format personnalisé
   * Version corrigée avec nettoyage des caractères et formatage des montants
   */
  exportToPDFDetail(): void {
    if (!this.demandesGlobal || this.demandesGlobal.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      // Fonction pour nettoyer les caractères spéciaux
      const cleanText = (text: string): string => {
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
      };

      // Fonction pour formater correctement les montants
      const formatMontant = (value: any): string => {
        // Cas null/undefined/vide
        if (value === null || value === undefined || value === '') return '0';

        // Cas tableau : prendre le premier élément ou sommer
        if (Array.isArray(value)) {
          value = value.reduce(
            (sum, v) =>
              sum + (typeof v === 'number' ? v : parseFloat(String(v)) || 0),
            0,
          );
        }

        // Cas objet : essayer de récupérer une propriété 'montant' ou 'value'
        if (typeof value === 'object') {
          value = value.montant || value.value || 0;
        }

        let num: number;
        if (typeof value === 'string') {
          // Nettoyer la chaîne (garder chiffres, points, virgules)
          const cleaned = value.replace(/[^0-9,.]/g, '').replace(',', '.');
          num = parseFloat(cleaned) || 0;
        } else if (typeof value === 'number') {
          num = value;
        } else {
          return '0';
        }

        const rounded = Math.round(num);
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(rounded);
      };

      //  Préparer les données avec tous les champs formatés
      const columns = [
        {
          header: cleanText('N° Demande'),
          field: 'codedemande',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Date'),
          field: 'datedemande',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Montant'),
          field: 'montant',
          format: (v: any) => cleanText(String(v || '0')),
        },
        {
          header: cleanText('Devise'),
          field: 'devise',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Statut'),
          field: 'statut',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Paye'),
          field: 'paye',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Departement'),
          field: 'departement',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Type'),
          field: 'typedemande',
          format: (v: any) => cleanText(String(v || '-')),
        },
        {
          header: cleanText('Demandeur'),
          field: 'demandeur',
          format: (v: any) => cleanText(String(v || '-')),
        },
      ];

      //  Préparer les données avec formatage correct des montants
      // Dans exportToPDFDetail()
      const data = this.demandesGlobal.map((item) => {
        const montantTotal = this.getTotalDemande(item);

        const devise = item.devise?.codedevise || 'CDF'; // ✅ Valeur par défaut

        return {
          codedemande: item.codedemande || '-',
          datedemande: this.formatDateFR(item.datedemande),
          montant: montantTotal, // Devise toujours définie
          devise: devise, // Pour la colonne Devise
          statut: this.getStatutLabel(item.statut),
          paye: item.decaisse === 1 ? 'Oui' : 'Non',
          departement: item.departement?.libelle || '-',
          typedemande: item.typedemande || '-',
          demandeur:
            `${item.demandeur?.nom || ''} ${item.demandeur?.prenom || ''}`.trim() ||
            '-',
        };
      });

      // Nettoyer le titre
      const title = cleanText(`Mes demandes de decaissement`);
      const fileName = `mes_demandes_decaissement_detail_${new Date().toISOString().split('T')[0]}`;

      // Utiliser le service PDF avec les données nettoyées
      this.pdfService.exportCustomPDF(data, columns, fileName, title);
      this.toastr.success('Export PDF detaille reussi');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      this.toastr.error("Erreur lors de l'export PDF");
    }
  }

  /**
   * Impression
   */
  printData(): void {
    if (!this.demandesGlobal || this.demandesGlobal.length === 0) {
      this.toastr.warning('Aucune donnée à imprimer');
      return;
    }

    try {
      const columns = [
        { header: 'N° Demande', field: 'codedemande' },
        { header: 'Date', field: 'datedemande' },
        { header: 'Montant', field: 'montant' },
        { header: 'Devise', field: 'devise' },
        { header: 'Statut', field: 'statut' },
        { header: 'Payé', field: 'paye' },
        { header: 'Département', field: 'departement' },
        { header: 'Type', field: 'typedemande' },
        { header: 'Demandeur', field: 'demandeur' },
      ];

      const data = this.prepareExportData();
      const title = `Mes demandes de décaissement - ${new Date().toLocaleDateString('fr-FR')}`;
      this.printService.printData(data, columns, title);
      this.toastr.info("Fenêtre d'impression ouverte");
    } catch (error) {
      console.error('Erreur impression:', error);
      this.toastr.error("Erreur lors de l'impression");
    }
  }
}
