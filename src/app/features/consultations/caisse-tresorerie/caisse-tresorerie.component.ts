import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { caisseModel } from '../../caisse_journal/models/caisse.model';
import { CaisseService } from '../../caisse_journal/services/caisse.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TotauxGlobaux {
  solde_ouverture_ref: number;
  total_encaissement_ref: number;
  total_decaissement_ref: number;
  solde_global_ref: number;
}

interface CaisseData {
  idcaisse: string;
  codecaisse: string;
  libelle: string;
  codedevise: string;
  soldeouverture: number;
  total_encaissement: number;
  total_decaissement: number;
  solde_theorique: number;
  solde_previsionnel_fermeture: number;
  statut: string;
}

interface PeriodeData {
  dateperiode: string;
  caisses: CaisseData[];
  totauxGlobaux?: TotauxGlobaux;
}

interface User {
  devise_ref_code: string;
}

@Component({
  selector: 'app-caisse-tresorerie',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './caisse-tresorerie.component.html',
  styleUrls: ['./caisse-tresorerie.component.css'],
})
export class CaisseTresorerieComponent implements OnInit {
  title = 'Solde de caisse par date';
  loading = false;
  msgErros = '';

  // Form
  searchForm: FormGroup;

  // Data
  caisses: caisseModel[] = [];
  datas: PeriodeData[] = [];
  totaux: TotauxGlobaux = {
    solde_ouverture_ref: 0,
    total_encaissement_ref: 0,
    total_decaissement_ref: 0,
    solde_global_ref: 0,
  };

  // Accordion state
  activeAccordion: number | null = null;

  constructor(
    private fb: FormBuilder,
    private caisseService: CaisseService,
    private toastr: ToastrService,
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.loadCaisses();
  }

  // ============================================
  // FORM MANAGEMENT
  // ============================================
  private createSearchForm(): FormGroup {
    return this.fb.group({
      dateDebut: [''],
      dateFin: [''],
      caisse: [''],
    });
  }

  resetFilters(): void {
    this.searchForm = this.createSearchForm();
    this.onSubmit();
  }

  // ============================================
  // DATA LOADING
  // ============================================
  loadCaisses(): void {
    this.loading = true;
    this.caisseService.getAll({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        if (res.success) {
          this.caisses = res.data.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erreur de chargement des caisses');
      },
    });
  }

  getSoldeByDate(payload: any): void {
    this.loading = true;
    this.caisseService.get_soldeCaisse(payload).subscribe({
      next: (response) => {
        this.datas = response.data.dates || [];
        this.totaux = response.data.totaux || this.totaux;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Erreur lors de la récupération des données');
      },
    });
  }

  // ============================================
  // ACCORDION MANAGEMENT
  // ============================================
  toggleAccordion(index: number): void {
    this.activeAccordion = this.activeAccordion === index ? null : index;
  }

  // ============================================
  // SEARCH
  // ============================================
  onSubmit(): void {
    if (this.searchForm.invalid) {
      this.markAllAsTouched();
      this.toastr.warning(MESSAGE_CHAMPS_OBLIGATOIRE);
      return;
    }

    const payload = {
      startDate: this.searchForm.value.dateDebut,
      endDate: this.searchForm.value.dateFin,
      idcaisse: this.searchForm.value.caisse,
    };

    this.getSoldeByDate(payload);
  }

  private markAllAsTouched(): void {
    Object.values(this.searchForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  get user(): User {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    if (montant == null) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  }

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================
  exportToExcel(): void {
    if (!this.datas || this.datas.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const excelData: any[] = [];

    this.datas.forEach((periode) => {
      const date = new Date(periode.dateperiode).toLocaleDateString('fr-FR');
      periode.caisses.forEach((caisse) => {
        excelData.push({
          Date: date,
          'Caisse code': caisse.codecaisse,
          'Caisse libellé': caisse.libelle,
          Devise: caisse.codedevise,
          'Solde ouverture': caisse.soldeouverture,
          'Total encaissement': caisse.total_encaissement,
          'Total décaissement': caisse.total_decaissement,
          'Solde théorique': caisse.solde_theorique,
          'Solde clôture prévisionnel': caisse.solde_previsionnel_fermeture,
          Statut: caisse.statut || 'FERMÉ',
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultation caisses');
    XLSX.writeFile(
      workbook,
      `consultation_caisses_${new Date().toISOString().slice(0, 19)}.xlsx`,
    );
  }

  exportToPDF(): void {
    if (!this.datas || this.datas.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    let yOffset = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.text(`Consultation - ${this.title}`, 14, yOffset);
    yOffset += 10;
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, yOffset);
    yOffset += 10;

    // Totaux globaux
    doc.setFontSize(14);
    doc.text('Totaux Globaux', 14, yOffset);
    yOffset += 6;

    const totauxHeaders = [['', 'Montant']];
    const totauxRows = [
      [
        "Total d'ouverture",
        `${this.formatCFA(this.totaux.solde_ouverture_ref)} ${this.user.devise_ref_code}`,
      ],
      [
        'Total encaissements',
        `${this.formatCFA(this.totaux.total_encaissement_ref)} ${this.user.devise_ref_code}`,
      ],
      [
        'Total décaissements',
        `${this.formatCFA(this.totaux.total_decaissement_ref)} ${this.user.devise_ref_code}`,
      ],
      [
        'Solde global',
        `${this.formatCFA(this.totaux.solde_global_ref)} ${this.user.devise_ref_code}`,
      ],
    ];

    autoTable(doc, {
      startY: yOffset,
      head: totauxHeaders,
      body: totauxRows,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    yOffset = (doc as any).lastAutoTable.finalY + 10;

    // Parcourir chaque période
    for (let i = 0; i < this.datas.length; i++) {
      const periode = this.datas[i];
      const dateStr = new Date(periode.dateperiode).toLocaleDateString(
        'fr-FR',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      // Vérifier si on doit ajouter une nouvelle page
      if (i > 0 && yOffset > 180) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.text(`Période : ${dateStr}`, 14, yOffset);
      yOffset += 6;

      // Construire le tableau pour cette période
      const tableHeaders = [
        [
          'Caisse',
          'Devise',
          'Solde ouverture',
          'Encaissements',
          'Décaissements',
          'Solde théorique',
          'Solde clôture prév.',
          'Statut',
        ],
      ];
      const tableRows = periode.caisses.map((c: CaisseData) => [
        `${c.codecaisse} - ${c.libelle}`,
        c.codedevise,
        this.formatCFA(c.soldeouverture),
        this.formatCFA(c.total_encaissement),
        this.formatCFA(c.total_decaissement),
        this.formatCFA(c.solde_theorique),
        this.formatCFA(c.solde_previsionnel_fermeture),
        c.statut || 'FERMÉ',
      ]);

      autoTable(doc, {
        startY: yOffset,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' },
          7: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.save(
      `consultation_caisses_${new Date().toISOString().slice(0, 19)}.pdf`,
    );
  }
}
