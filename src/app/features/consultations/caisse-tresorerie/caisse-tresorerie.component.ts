import { CurrencyPipe , CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { caissePeriodeModel } from '../../caisse_journal/models/periodecaisse.model';
import { CaissePeriodeService } from '../../caisse_journal/services/caisseperiode.service';
import { caisseModel } from '../../caisse_journal/models/caisse.model';
import { CaisseService } from '../../caisse_journal/services/caisse.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-caisse-tresorerie',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './caisse-tresorerie.component.html',
  styleUrl: './caisse-tresorerie.component.css',
  providers: [CurrencyPipe]
})
export class CaisseTresorerieComponent implements OnInit{
  title = "Solde de caisse par date";
  params : any = {};
  breadCrumbs : any = {};
  loading: Boolean = false;

  msgErros : string = "";
  fb: FormBuilder = new FormBuilder();
  
  searchForm: FormGroup = this.fb.group({});
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Liste periode 
  caisseperiodes: caissePeriodeModel[] = [];
  caisses : caisseModel[] = [];
  error : string = "";

  datas : any[] = [];
  totaux: any = {};

  totalSoldeOuverture: number = 0;
  totalEncaissements: number = 0;
  totalDecaissements: number = 0;
  totalSoldeTheorique: number = 0;


  constructor(private currencyPipe: CurrencyPipe, private caissePeriodeservice: CaissePeriodeService, private caisseservice: CaisseService, private toastr : ToastrService){}

  ngOnInit(): void {
    //Initialisation des caisses
    this.initSearchForm();
    //Chargement des caisses
    this.getAllcaisses();
  }


  getAllcaisses(){
    this.loading = true; // Démarrer le chargement
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.caisseservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.caisses = res.data.data; // Stocker toutes les caisses
          this.totalPages = res.data.totalPages;
        }
        this.loading = false; // Arrêter le chargement
      },
      error: (err) => {
        this.loading = false; // Arrêter le chargement même en cas d'erreur
        this.toastr.error('Erreur lors du chargement des caisses. Veuillez réessayer.');
      }
    });
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    const today = new Date().toISOString().split('T')[0];

    this.searchForm = this.fb.group({
      dateDebut: [today],
      dateFin: [today],
      caisse: ['']
    });
  }
  
  getSoldeByDate(payload: any){
    this.loading = true; // Démarrer le chargement
    this.caisseservice.get_soldeCaisse(payload)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.datas = response.data.dates || [];
          this.totaux = response.data.totaux || {};
          console.log('Données reçues :', this.totaux);
        },
        error: (error) => {
          this.loading = false;
          this.toastr.error('Erreur lors de la récupération des données', 'Erreur');
        }
    });
  }

  //Utilisateur connecté
  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  get form() {
    return this.searchForm.controls;
  }

  onSubmit(): void {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.searchForm.controls;
    if (this.searchForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }

    const payload = {
      startDate: this.searchForm.value.dateDebut,
      endDate: this.searchForm.value.dateFin,
      idcaisse: this.searchForm.value.caisse
    };

    this.getSoldeByDate(payload);
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  resetFilters() {
    this.searchForm.reset();
    this.onSubmit(); // ou recharge à vide
  }

  exportToExcel(): void {
    if (!this.datas || this.datas.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    // Préparer les données pour Excel : une ligne par caisse par jour
    const excelData: any[] = [];

    this.datas.forEach((periode: any) => {
      const date = new Date(periode.dateperiode).toLocaleDateString('fr-FR');
      periode.caisses.forEach((caisse: any) => {
        excelData.push({
          'Date': date,
          'Caisse code': caisse.codecaisse,
          'Caisse libellé': caisse.libelle,
          'Devise': caisse.codedevise,
          'Solde ouverture': caisse.soldeouverture,
          'Total encaissement': caisse.total_encaissement,
          'Total décaissement': caisse.total_decaissement,
          'Solde théorique': caisse.solde_theorique,
          'Solde clôture prévisionnel': caisse.solde_previsionnel_fermeture,
          'Statut': caisse.statut || 'FERMÉ'
        });
      });
    });

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    // Ajuster la largeur des colonnes (optionnel)
    worksheet['!cols'] = [
      {wch:12}, {wch:12}, {wch:30}, {wch:8}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:20}, {wch:10}
    ];

    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultation caisses');

    // Exporter le fichier
    XLSX.writeFile(workbook, `consultation_caisses_${new Date().toISOString().slice(0,19)}.xlsx`);
  }

  exportToExcelByCurrency(): void {
    const dataByCurrency = new Map<string, any[]>();
    this.datas.forEach(periode => {
      periode.caisses.forEach((caisse: { codedevise: any; codecaisse: any; libelle: any; soldeouverture: any; total_encaissement: any; total_decaissement: any; solde_theorique: any; solde_previsionnel_fermeture: any; statut: any; }) => {
        const devise = caisse.codedevise;
        if (!dataByCurrency.has(devise)) dataByCurrency.set(devise, []);
        dataByCurrency.get(devise)!.push({
          'Date': new Date(periode.dateperiode).toLocaleDateString('fr-FR'),
          'Caisse code': caisse.codecaisse,
          'Caisse libellé': caisse.libelle,
          'Solde ouverture': caisse.soldeouverture,
          'Total encaissement': caisse.total_encaissement,
          'Total décaissement': caisse.total_decaissement,
          'Solde théorique': caisse.solde_theorique,
          'Solde clôture prév.': caisse.solde_previsionnel_fermeture,
          'Statut': caisse.statut || 'FERMÉ'
        });
      });
    });

    const workbook = XLSX.utils.book_new();
    for (let [devise, rows] of dataByCurrency.entries()) {
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, `Devise ${devise}`);
    }
    XLSX.writeFile(workbook, `consultation_par_devise.xlsx`);
  }

  exportToPDF(): void {
    if (!this.datas || this.datas.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let yOffset = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.text(`Consultation - ${this.title}`, 14, yOffset);
    yOffset += 10;
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, yOffset);
    yOffset += 10;

    // Parcourir chaque période
    for (let i = 0; i < this.datas.length; i++) {
      const periode = this.datas[i];
      const dateStr = new Date(periode.dateperiode).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // Vérifier si on doit ajouter une nouvelle page
      if (i > 0 && yOffset > 180) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.text(`Période : ${dateStr}`, 14, yOffset);
      yOffset += 6;

      // Construire le tableau pour cette période
      const tableHeaders = [['Caisse', 'Devise', 'Solde ouverture', 'Encaissements', 'Décaissements', 'Solde théorique', 'Solde clôture prév.', 'Statut']];
      const tableRows = periode.caisses.map((c: any) => [
        `${c.codecaisse} - ${c.libelle}`,
        c.codedevise,
        this.formatCFA(c.soldeouverture),
        this.formatCFA(c.total_encaissement),
        this.formatCFA(c.total_decaissement),
        this.formatCFA(c.solde_theorique),
        this.formatCFA(c.solde_previsionnel_fermeture),
        c.statut || 'FERMÉ'
      ]);

      autoTable(doc, {
        startY: yOffset,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' },
          7: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      yOffset = (doc as any).lastAutoTable.finalY + 10;
    }

    // Sauvegarder le PDF
    doc.save(`consultation_caisses_${new Date().toISOString().slice(0,19)}.pdf`);
  }

}
