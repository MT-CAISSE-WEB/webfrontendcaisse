import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { CaissePeriodeService } from '../../../../features/caisse_journal/services/caisseperiode.service';
import { CaisseService } from '../../../../features/caisse_journal/services/caisse.service';
import { ToastrService } from 'ngx-toastr';
import { OperationService } from '../../../../features/operations/service/operation.service';
import { AffectationCaisseModel } from '../../../../features/caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../../../features/caisse_journal/services/affectationcaisse.service';
import { ConsultationOpService } from '../../../../features/consultations/services/operations.service';
import {
  APP_ROOT_DMD_DECAISSEMENT,
  APP_ROOT_OPERATION_GENERAL,
} from '../../../../_core/routes/frontend.root';
import { DemandeService } from '../../../../features/demande/services/demande.service';
import { EnteteDemande } from '../../../../features/demande/models/entete-demande.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationModalComponent } from '../../../../_core/modal/operation-modal/operation-modal.component';
import { OperationPJService } from '../../../../features/PJ/service/operationpj.service';
import { ExcelService } from '../../../../_core/services/exportExcel.service';
import { PdfService } from '../../../../_core/services/pdf.service';
import { PrintService } from '../../../../_core/services/print.service';

@Component({
  selector: 'app-interface-caissier',
  standalone: true,
  imports: [
    RouterLink,
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './interface-caissier.component.html',
  styleUrl: './interface-caissier.component.css',
})
export class InterfaceCaissierComponent implements OnInit {
  root_operation = APP_ROOT_OPERATION_GENERAL;
  root_demande_decaissement = APP_ROOT_DMD_DECAISSEMENT;
  caisseSolde: any;
  msgErros: string = '';
  error: string = '';
  loading: boolean = false;
  loadingDmd: boolean = false;

  // Définissez des propriétés de pagination
  currentPageL: number = 1;
  currentPageH: number = 1;

  // Nombre d'éléments par page
  totalPagesL: number = 0;
  totalPagesH: number = 0;
  limitL: number = 6;
  limitH: number = 6;

  //Valeurs des operations
  operationGlobal: any[] = [];
  totalEncaissementGlobal = 0;
  totalDecaissementGlobal = 0;
  totalDemandesPayeesJour = 0;

  totalEncaissementJour = 0;
  totalDecaissementJour = 0;

  pourcentageEncaissementJour = 0;
  pourcentageDecaissementJour = 0;
  ratioDemandesJour = 0;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses: boolean = false;
  loadingHistory: boolean = false;
  loadingLast: boolean = false;

  //Caisse du caissier
  caissesDuCaissier: any[] = [];

  opLast: any = [];
  opHistory: any = [];
  caisseperiodes: any[] = [];
  params: any = {};

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  entetesDmd: EnteteDemande[] = [];

  // tout sélectionné/désélectionné
  allSelected = false;

  objectsSelected: EnteteDemande[] = [];
  selectedItems: any[] = [];

  caissier: boolean = false;

  constructor(
    private modalService: NgbModal,
    private caisseservice: CaisseService,
    private caisseStatusService: CaissePeriodeService,
    private caisseuserservice: AffectationCaisseService,
    private toastr: ToastrService,
    private service: ConsultationOpService,
    private demandeService: DemandeService,
    private operationservice: OperationService,
    private pjService: OperationPJService,
    private excelService: ExcelService,
    private printService: PrintService,
    private pdfService: PdfService,
  ) {}

  ngOnInit(): void {
    //Charger les périodes caisses
    this.getcaissesPeriodes();
    //Charger les caisses du caissier et ses soldes
    this.getCaisseUser();

    this.loadAllDemandes();
  }

  // ouvrir le modal avec l'ID de la demande
  openOperationModal(iddemande: string) {
    const modalRef = this.modalService.open(OperationModalComponent, {
      size: 'xl',
      backdrop: 'static',
    });
    modalRef.componentInstance.iddemande = iddemande;
    modalRef.componentInstance.title = 'Décaissement de demande';

    modalRef.result
      .then((result) => {
        if (result) {
          // ✅ APPELEZ LA SAUVEGARDE
          this.createOperation(result.operation, result.files);
        }
      })
      .catch(() => {
        // Modal fermé sans sauvegarde
      });
  }

  // ➕ Ajoutez cette méthode pour sauvegarder l'opération
  createOperation(operation: any, files?: File[]) {
    this.loading = true;

    this.operationservice.create(operation).subscribe({
      next: (res) => {
        if (res.success) {
          // Upload des fichiers si nécessaire
          if (files && files.length > 0 && res.data?.idoperation) {
            this.uploadFiles(res.data.idoperation, files);
          } else {
            this.toastr.success('✅ Opération enregistrée avec succès');
            this.loadAllDemandes();
            this.loading = false;
          }
        } else {
          this.toastr.error(
            res.message || "❌ Erreur lors de l'enregistrement",
          );
          this.loading = false;
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || '❌ Erreur backend');
        this.loading = false;
      },
    });
  }

  // Uploader les fichiers
  uploadFiles(idoperation: string, files: File[]) {
    const userId = this.user.idutilisateur;
    this.pjService.create(idoperation, files, userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(`${res.data.length} fichier(s) uploadé(s)`);
          this.loadAllDemandes();
          this.loading = false;
        } else {
          this.toastr.error("❌ Erreur lors de l'upload des fichiers");
          this.loading = false;
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || "❌ Erreur lors de l'upload");
        this.loading = false;
      },
    });
  }

  //Récuperer les soldes
  getSoldeCaisse() {
    this.caisseservice.getSolde().subscribe({
      next: (res) => {
        if (res.success) {
          this.caisseSolde = res.data;
          this.caisseSolde = this.caisseSolde.filter((cs: any) =>
            this.caissesUser.some((cu) => cu.idcaisse === cs.idcaisse),
          );
        }
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getCaisseUser() {
    this.loadingCaisses = true;
    this.caisseuserservice
      .getCaisseByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caissesUser = res.data || [];
            if (this.caissesUser.length > 0) {
              this.caissesDuCaissier = this.caissesUser.map((c) => c.idcaisse);
              this.params.caisses = this.caissesDuCaissier;

              //Chargement des paiements de caisses
              this.getAllOp();
            }
            this.getSoldeCaisse();
            //Get data
            this.sendParams();
          }
        },
        error: (err) => {
          this.loadingCaisses = false;
          this.toastr.error(err.error.message);
        },
      });
  }

  //Filter les operations de la caisse du caissier
  filtrerOperationsDuCaissier(
    operations: any[],
    caissesDuCaissier: any[],
  ): any[] {
    return operations.filter((op) => caissesDuCaissier.includes(op.idcaisse));
  }

  getSolde(item: any): number {
    return (
      (Number(item?.soldeinitialisation) || 0) + (Number(item?.solde) || 0)
    );
  }

  getcaissesPeriodes() {
    this.loadingCaisses = true;
    this.caisseuserservice
      .getCaissePeriodeByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caisseperiodes = res.data;
            if (this.caisseperiodes.length > 0) {
              this.params.date = this.formatDateInput(
                new Date(this.caisseperiodes[0].dernierePeriode.dateperiode),
              );
            }
            this.loadingCaisses = false;
          }
        },
        error: (err) => {
          this.toastr.error(err.error.message);
        },
      });
  }

  calculSolde(item: any): string {
    if (item.codedevise! != 'USD') {
      return this.formatCFA(this.getSolde(item));
    } else {
      return this.formatNumber(this.getSolde(item));
    }
  }

  formatNumber(montant: number | string | undefined): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    if (isNaN(valeur)) return '';

    return valeur.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant ?? 0);
  }

  getEntree(item: any): number {
    return (
      (Number(item?.soldeinitialisation) || 0) +
      (Number(item?.encaissement) || 0)
    );
  }

  calculEntree(item: any): string {
    if (item.codedevise! != 'USD') {
      return this.formatCFA(this.getEntree(item));
    } else {
      return this.formatNumber(this.getEntree(item));
    }
  }

  getCaisseClass(item: any[]): string {
    const nbr = item.length;

    if (nbr == 1) {
      return 'col-xl-4 col-md-6';
    }

    if (nbr == 2) {
      return 'col-xl-4 col-md-6';
    }

    if (nbr > 2) {
      return 'col-xl-4 col-md-4';
    }

    return 'col-xl-3 col-md-6';
  }

  getSoldeClass(item: any): string {
    const solde = this.getSolde(item);
    const seuil = Number(item?.seuilmnimal) || 0;

    if (solde == 0) {
      return 'bx bx-dollar-circle text-danger';
    }

    if (solde == seuil) {
      return 'bx bx-dollar-circle text-warning';
    }

    if (solde > seuil) {
      return 'bx bx-dollar-circle text-success';
    }

    return 'bx bx-dollar-circle text-info';
  }

  getLastOperation(data: any) {
    data.page = this.currentPageL;
    data.limit = this.limitL;
    this.loadingLast = true;
    this.service.getLastOperation(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.opLast = res.data.data;
          this.totalPagesL = res.data.totalPages;
          this.loadingLast = false;
        } else {
          this.loadingLast = false;
        }
      },
      error: (err) => {
        this.loadingLast = false;
      },
    });
  }

  getAllOp() {
    this.loadingLast = true;
    const params = {};
    this.service.getAllpayment(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operationGlobal = res.data.data || [];
          if (this.operationGlobal.length != 0) this.calculerIndicateurs();
          this.loadingLast = false;
        } else {
          this.loadingLast = false;
        }
      },
      error: (err) => {
        console.log(err);
        this.loadingLast = false;
      },
    });
  }

  //Calcul des indicateurs
  calculerIndicateurs() {
    const jour = this.formatDateInput(
      new Date(this.caisseperiodes[0].dernierePeriode.dateperiode),
    );

    //Filtrer les operations du caissier
    const operations = this.filtrerOperationsDuCaissier(
      this.operationGlobal,
      this.caissesDuCaissier,
    );

    // Filtrer les opérations du jour
    const operationsJour = operations.filter((o) =>
      o.dateoperation.startsWith(jour),
    );

    // Grouper par demande
    const demandesMap = new Map<string, number>();

    const demandesGlobalMap = new Map<string, number>();

    operationsJour.forEach((o) => {
      if (!o.iddemande) return;

      const montant = o.decaissement || 0;
      if (demandesMap.has(o.iddemande)) {
        demandesMap.set(o.iddemande, demandesMap.get(o.iddemande)! + montant);
      } else {
        demandesMap.set(o.iddemande, montant);
      }
    });

    operations.forEach((o) => {
      if (!o.iddemande) return;

      const montant = o.decaissement || 0;

      if (demandesGlobalMap.has(o.iddemande)) {
        demandesGlobalMap.set(
          o.iddemande,
          demandesGlobalMap.get(o.iddemande)! + montant,
        );
      } else {
        demandesGlobalMap.set(o.iddemande, montant);
      }
    });

    const totalDemandesGlobal = Array.from(demandesGlobalMap.values()).reduce(
      (sum, m) => sum + m,
      0,
    );

    //Total des demandes payées
    this.totalDemandesPayeesJour = Array.from(demandesMap.values()).reduce(
      (sum, m) => sum + m,
      0,
    );

    //Totaux globaux
    this.totalEncaissementGlobal = operations.reduce(
      (sum, o) => sum + o.encaissement,
      0,
    );

    this.totalDecaissementGlobal = operations.reduce(
      (sum, o) => sum + o.decaissement,
      0,
    );

    //Totaux du jour
    this.totalEncaissementJour = operations
      .filter((o) => o.dateoperation.startsWith(jour))
      .reduce((sum, o) => sum + o.encaissement, 0);

    this.totalDecaissementJour = operations
      .filter((o) => o.dateoperation.startsWith(jour))
      .reduce((sum, o) => sum + o.decaissement, 0);

    //Pourcentages
    this.pourcentageEncaissementJour =
      this.totalEncaissementGlobal > 0
        ? (this.totalEncaissementJour / this.totalEncaissementGlobal) * 100
        : 0;

    this.pourcentageDecaissementJour =
      this.totalDecaissementGlobal > 0
        ? (this.totalDecaissementJour / this.totalDecaissementGlobal) * 100
        : 0;

    this.ratioDemandesJour =
      totalDemandesGlobal > 0
        ? (this.totalDemandesPayeesJour / totalDemandesGlobal) * 100
        : 0;
  }

  getHistoryOperation(data: any) {
    data.page = this.currentPageH;
    data.limit = this.limitH;
    this.loadingHistory = true;
    this.service.getHistoryOperation(data).subscribe({
      next: (res) => {
        this.opHistory = res.data.data;
        this.totalPagesH = res.data.totalPages;
        this.loadingHistory = false;
      },
      error: (err) => {
        this.loadingHistory = true;
      },
    });
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  sendParams() {
    //Dernières opérations
    this.getLastOperation(this.params);
    //Historiques opérations
    this.getHistoryOperation(this.params);
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
  changePageLast(page: number) {
    this.currentPageL = page;
    this.getLastOperation(this.params); // recharge les données
  }

  //Recharger la table des historiques
  changePageHistory(page: number) {
    this.currentPageH = page;
    this.getHistoryOperation(this.params); // recharge les données
  }

  // afficher toutes les demandes
  loadAllDemandes() {
    this.loadingDmd = true;
    const params = {
      page: this.currentPage,
      limit: 30,
      search: '',
      date: '',
      status: '',
      user: this.user.idutilisateur,
    };
    this.demandeService.getAllEntetes(params).subscribe({
      next: (res) => {
        if (res.success) {
          // this.entetesDmd = res.data.data;
          this.entetesDmd = res.data.data.map((item: any) => ({
            ...item,
          }));

          // filtre statut validé
          this.entetesDmd = this.entetesDmd.filter(
            (d: any) => d.statut === 3 && d.decaisse === 0,
          );

          this.totalPages = res.data.totalPages;
          this.loadingDmd = false;
        } else {
          this.loadingDmd = false;
          this.toastr.error('Erreur de récuperation des données');
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
        this.loadingDmd = false;
      },
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.loadAllDemandes(); // recharge les données
  }

  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.iddemande);
    return ids.includes(_id);
  }

  iscaissier(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '04') {
          this.caissier = true;
        }
      }
    }
    return this.caissier;
  }

  /**
   * Exporte les données en Excel avec ton service existant
   */
  exportToExcel(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      // 1️⃣ Définir les colonnes avec leurs libellés
      const columns = [
        { header: 'Pièce', field: 'piece' },
        { header: 'Montant', field: 'montantFormate' },
        { header: 'Type', field: 'typeoperation' },
        { header: 'Payé', field: 'payeFormate' },
        { header: 'Référence', field: 'refFormate' },
        { header: 'Date', field: 'dateFormatee' },
      ];

      // 2️⃣ Préparer les données
      const data = this.opLast.map((item: any) => {
        const caisse = item.caisses?.[0] || {};
        return {
          piece: item.piece || '-',
          montantFormate: `${this.formatNumber(item.montantop)} ${item.deviseop || ''}`,
          typeoperation: item.typeoperation || '-',
          payeFormate: `${this.formatNumber(caisse.montant)} ${caisse.devise || ''}`,
          refFormate: `${this.formatNumber(caisse.montant_ref)} ${this.user.devise_ref_code}`,
          dateFormatee: this.formatDateFR(item.date),
        };
      });

      // 3️⃣ Exporter
      const fileName = `operations_caisse_${new Date().toISOString().split('T')[0]}`;
      this.excelService.exportToExcel(data, columns, fileName);
      this.toastr.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      this.toastr.error("Erreur lors de l'export Excel");
    }
  }

  /**
   * Utilisation directe de exportRawData si besoin
   */
  exportRawData(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const fileName = `operations_raw_${new Date().toISOString().split('T')[0]}`;
      this.excelService.exportRawData(this.opLast, fileName);
      this.toastr.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      this.toastr.error("Erreur lors de l'export Excel");
    }
  }

  /**
   * Utilisation pour exporter toutes les données (y compris les détails)
   */
  exportFullData(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      // Préparer les données avec tous les détails
      const data = this.opLast.flatMap((item: any) => {
        return (item.caisses || []).map((caisse: any) => ({
          piece: item.piece || '-',
          montant_operation: item.montantop || 0,
          devise_operation: item.deviseop || '',
          type_operation: item.typeoperation || '-',
          montant_paye: caisse.montant || 0,
          devise_paye: caisse.devise || '',
          montant_ref: caisse.montant_ref || 0,
          devise_ref: this.user.devise_ref_code,
          date_operation: this.formatDateFR(item.date),
          code_caisse: caisse.codecaisse || '',
          libelle_caisse: caisse.libelle || '',
        }));
      });

      const fileName = `operations_details_${new Date().toISOString().split('T')[0]}`;
      this.excelService.exportRawData(data, fileName);
      this.toastr.success('Export Excel détaillé réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      this.toastr.error("Erreur lors de l'export Excel");
    }
  }

  /**
   * Export au format Sage X3 (si nécessaire)
   */
  exportSageX3(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      // Préparer les données au format Sage X3
      const rows: any[][] = [
        ['Pièce', 'Montant', 'Devise', 'Type', 'Date', 'Caisse'],
      ];

      this.opLast.forEach((item: any) => {
        (item.caisses || []).forEach((caisse: any) => {
          rows.push([
            item.piece || '-',
            caisse.montant || 0,
            caisse.devise || '',
            item.typeoperation || '-',
            new Date(item.date).toLocaleDateString('fr-FR'),
            caisse.codecaisse || '',
          ]);
        });
      });

      const fileName = `sage_import_${new Date().toISOString().split('T')[0]}`;
      this.excelService.exportSageX3(rows, fileName);
      this.toastr.success('Export Sage X3 réussi');
    } catch (error) {
      console.error('Erreur export Sage X3:', error);
      this.toastr.error("Erreur lors de l'export Sage X3");
    }
  }

  /**
   * Export PDF
   */
  exportToPDF(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const columns = [
        { header: 'Pièce', field: 'piece' },
        { header: 'Montant', field: 'montantFormate' },
        { header: 'Type', field: 'typeoperation' },
        { header: 'Payé', field: 'payeFormate' },
        { header: 'Référence', field: 'refFormate' },
        { header: 'Date', field: 'dateFormatee' },
      ];

      const data = this.opLast.map((item: any) => {
        const caisse = item.caisses?.[0] || {};
        return {
          piece: item.piece || '-',
          montantFormate: `${item.montantop} ${item.deviseop || ''}`,
          typeoperation: item.typeoperation || '-',
          payeFormate: `${caisse.montant} ${caisse.devise || ''}`,
          refFormate: `${caisse.montant_ref} ${this.user.devise_ref_code}`,
          dateFormatee: this.formatDateFR(item.date),
        };
      });

      const title = `Opérations de caisse`;
      const fileName = `operations_caisse_${new Date().toISOString().split('T')[0]}`;

      this.pdfService.exportToPDF(data, columns, fileName, title);
      this.toastr.success('Export PDF réussi');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      this.toastr.error("Erreur lors de l'export PDF");
    }
  }

  /**
   * Impression
   */
  printData(): void {
    if (!this.opLast || this.opLast.length === 0) {
      this.toastr.warning('Aucune donnée à imprimer');
      return;
    }

    try {
      const columns = [
        { header: 'Pièce', field: 'piece' },
        { header: 'Montant', field: 'montantFormate' },
        { header: 'Type', field: 'typeoperation' },
        { header: 'Payé', field: 'payeFormate' },
        { header: 'Référence', field: 'refFormate' },
        { header: 'Date', field: 'dateFormatee' },
      ];

      const data = this.opLast.map((item: any) => {
        const caisse = item.caisses?.[0] || {};
        return {
          piece: item.piece || '-',
          montantFormate: `${this.formatNumber(item.montantop)} ${item.deviseop || ''}`,
          typeoperation: item.typeoperation || '-',
          payeFormate: `${this.formatNumber(caisse.montant)} ${caisse.devise || ''}`,
          refFormate: `${this.formatNumber(caisse.montant_ref)} ${this.user.devise_ref_code}`,
          dateFormatee: this.formatDateFR(item.date),
        };
      });

      const title = `Opérations de caisse - ${new Date().toLocaleDateString('fr-FR')}`;
      this.printService.printData(data, columns, title);
      this.toastr.info("Fenêtre d'impression ouverte");
    } catch (error) {
      console.error('Erreur impression:', error);
      this.toastr.error("Erreur lors de l'impression");
    }
  }
}
