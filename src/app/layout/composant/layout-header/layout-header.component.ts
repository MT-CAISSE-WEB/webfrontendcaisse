import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CaisseService } from '../../../features/caisse_journal/services/caisse.service';
import { caissePeriodeModel } from '../../../features/caisse_journal/models/periodecaisse.model';
import { CaissePeriodeService } from '../../../features/caisse_journal/services/caisseperiode.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MenuConfigService, MenuItem } from '../services/menu-config.service';
import { MenuService } from '../services/menu.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { AffectationCaisseModel } from '../../../features/caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../../features/caisse_journal/services/affectationcaisse.service';
import { ToastrService } from 'ngx-toastr';
import { APP_ROOT_PARAMETREPAGE_PARAMETRE } from '../../../_core/routes/frontend.root';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { LoaderService } from '../../../_core/utils/loaders.service';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { BilletageModalComponent } from '../../../features/operations/billetage-modal/billetage-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout-header',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    RouterModule,
    NgbModalModule,
  ],
  templateUrl: './layout-header.component.html',
  styleUrl: './layout-header.component.css',
})
export class LayoutHeaderComponent implements OnInit, OnDestroy {
  caisserecent: caissePeriodeModel = new caissePeriodeModel();
  caisseperiodes: any[] = [];
  fb: FormBuilder = new FormBuilder();
  caisseperiodeForm: FormGroup = this.fb.group({});
  msgErros: string = '';
  error: string = '';
  loading: boolean = false;
  caisseSolde: any;
  isMenuOpen = false;
  private menuSubscription!: Subscription;

  //Liste des routes
  root_parametre = APP_ROOT_PARAMETREPAGE_PARAMETRE;

  // Change password
  root_changepassword = 'app/administration/changepassword';

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses = false;

  caissesStatuses: { [id: string]: string } = {};

  constructor(
    private modalService: NgbModal,
    private caisseuserservice: AffectationCaisseService,
    private caisseservice: CaisseService,
    private router: Router,
    private loader: LoaderService,
    private caisseStatusService: CaissePeriodeService,
    private caisseService: CaisseService,
    private toastr: ToastrService,
    private menuService: MenuService,
    private menuConfigService: MenuConfigService,
  ) {}

  ngOnInit(): void {
    //récuperer les caisses de l'utilisateur
    this.caisseperiodeForm = this.fb.group({
      caisses: this.fb.array([]),
    });

    this.getCaisseUser();

    this.menuSubscription = this.menuService.isMenuOpen$.subscribe((isOpen) => {
      this.isMenuOpen = isOpen;
    });

    // Charger les items du menu avec les rôles de l'utilisateur
    this.loadMenuItems();
  }

  ngOnDestroy(): void {
    this.menuSubscription.unsubscribe();
  }

  /**
   * Bascule le menu gauche
   */
  toggleMenu(): void {
    this.menuService.toggleMenu();
  }

  get caisseStatus() {
    return this.caisseStatusService;
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant ?? 0);
  }

  logout() {
    localStorage.clear();
  }

  getCaisseUser() {
    this.loadingCaisses = true;
    this.caisseuserservice
      .getCaisseByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caissesUser = res.data;
            if (this.caissesUser.length > 0) {
              this.getcaissesPeriodes();
              //Charger les soldes
              this.getSoldeCaisse();
            } else {
              this.loadingCaisses = false;
              //this.toastr.warning("Aucune caisse affectée à l\'utilisateur");
            }
          }
        },
        error: (err) => {
          this.loadingCaisses = false;
          this.toastr.error(err.error.message);
        },
      });
  }

  reloadPage() {
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  //Récuperer les soldes
  getSoldeCaisse() {
    this.caisseService.getSolde().subscribe({
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

  getSolde(item: any): number {
    return (
      (Number(item?.soldeinitialisation) || 0) + (Number(item?.solde) || 0)
    );
  }

  // calculSolde(item: any): string {
  //   return this.formatCFA(this.getSolde(item));
  // }

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

  getSoldeClass(item: any): string {
    const solde = this.getSolde(item);
    const seuil = Number(item?.seuilmnimal) || 0;

    if (solde == 0) {
      return 'text-danger';
    }

    if (solde == seuil) {
      return 'text-warning';
    }

    if (solde > seuil) {
      return 'text-success';
    }

    return 'text-muted';
  }

  getCaisseClass(item: FormArray<FormGroup<any>>): string {
    const nbr = item.length;

    if (nbr == 1) {
      return 'col-xl-12 col-md-12';
    }

    if (nbr == 2) {
      return 'col-xl-6 col-md-6 col-sm-6';
    }

    if (nbr > 2) {
      return 'col-xl-4 col-md-4';
    }

    return 'col-xl-3 col-md-6';
  }

  //Récuperer les caisses périodes
  getcaissesPeriodes() {
    this.loadingCaisses = true;
    this.caisseuserservice
      .getCaissePeriodeByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caisseperiodes = res.data;
            this.initForm();
            this.loadingCaisses = false;
          } else {
            this.toastr.error('Echec de récupération de la période');
          }
        },
        error: (err) => {
          this.toastr.error(err.error.message);
        },
      });
  }

  initForm() {
    this.caissesArray.clear(); // si rechargement
    this.caisseperiodes.forEach((c) => {
      this.caissesArray.push(
        this.fb.group({
          idperiode: [c.dernierePeriode.idperiode],
          idcaisse: [c.caisse.idcaisse],
          statut: [c.dernierePeriode.statut],
          dateperiode: [c.dernierePeriode.dateperiode],
          caisse: [c.caisse],
        }),
      );
    });
  }

  get caissesArray(): FormArray<FormGroup> {
    return this.caisseperiodeForm.get('caisses') as FormArray<FormGroup>;
  }

  openCaisseUser() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.caisseperiodeForm.controls;
    if (this.caisseperiodeForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.caisseperiodeForm.value;

    const _caisse = {
      ...formValue,
    };

    if (this.isJourneeOuverte()) {
      this.openBilletageModal();
      //this.closeCaisse(this.user.idutilisateur, _caisse.caisses);   // Journée ouverte → fermer
    } else {
      this.openCaisse(this.user.idutilisateur, _caisse.caisses);
      //Chargement de la page
      this.reloadPage(); // Journée fermée → ouvrir
    }
  }

  openCaisse(iduser: string, caisses: any) {
    this.caisseservice.open(iduser, caisses).subscribe({
      next: (res) => {
        if (res.success) {
          this.error = 'Caisse ouverte';
          this.toastr.info('Ouverture de la journée');
        } else {
          this.toastr.error('Erreur serveur des données');
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Modification échec';
        this.loading = false;
        this.toastr.error('Erreur serveur des données', err.error.message);
      },
    });
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  isJourneeOuverte(): boolean {
    return this.caisseperiodes.some(
      (p) => p.dernierePeriode.statut?.toLowerCase() === 'ouverte',
    );
  }

  isJourneeCloturee(): boolean {
    return this.caisseperiodes.some(
      (p) => p.dernierePeriode.statut?.toLowerCase() === 'cloturee',
    );
  }

  isJourneeValide(): boolean {
    return this.caisseperiodes.some(
      (p) => p.statut?.toLowerCase() === 'validee',
    );
  }

  actionJournee() {
    if (this.isJourneeOuverte()) {
      //this.closeCaisseUser();     // journée déjà ouverte → on la clôture
    } else {
      this.openCaisseUser(); // journée fermée → on l’ouvre
    }
  }

  closeCaisse(iduser: string, caisses: any) {
    this.caisseservice.close(iduser, caisses).subscribe({
      next: (res) => {
        res.success
          ? this.toastr.info('Fermeture de la journée')
          : this.toastr.error('Erreur serveur de données');
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      },
    });
  }

  handleCaisseAction() {
    /** Vérification du formulaire */
    this.msgErros = '';
    const controls = this.caisseperiodeForm.controls;

    if (this.caisseperiodeForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** Récupération des données */
    const formValue = this.caisseperiodeForm.value;
    const caisses = formValue.caisses;

    /** Décision */
    if (this.isJourneeOuverte()) {
      this.closeCaisse(this.user.idutilisateur, caisses); // Journée ouverte → fermer
    } else {
      this.openCaisse(this.user.idutilisateur, caisses); // Journée fermée → ouvrir
    }
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

    return `${dayShort} ${day} ${month} ${year}`;
  }

  openBilletageModal() {
    const modalRef = this.modalService.open(BilletageModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });

    modalRef.componentInstance.caisses = this.caisseperiodeForm.value.caisses;
    modalRef.componentInstance.caisseSolde = this.caisseSolde;

    modalRef.result.then((result) => {
      console.log('Billetage reçu', result);
    });
  }

  // Propriétés pour le menu contextuel
  searchQuery: string = '';
  filteredItems: MenuItem[] = [];
  selectedIndex: number = -1;
  isContextMenuOpen: boolean = false;
  menuItems: MenuItem[] = [];

  /**
   * Charge les items du menu en fonction des rôles de l'utilisateur
   */
  private loadMenuItems(): void {
    const user = this.getUser();
    const userRoles =
      user?.roles?.map((r: any) => this.mapRoleCode(r.code)) || [];
    this.menuItems = this.menuConfigService.getMenuItemsForUser(userRoles);
  }

  /**
   * Mappe le code du rôle vers un nom lisible
   */
  private mapRoleCode(code: string): string {
    const roleMap: { [key: string]: string } = {
      '00': 'superadmin',
      '01': 'admin',
      '02': 'superviseur',
      '03': 'comptable',
      '04': 'caissier',
      '05': 'demandeur',
    };
    return roleMap[code] || '';
  }

  /**
   * Récupère l'utilisateur connecté
   */
  private getUser(): any {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('user') || '{}');
    }
    return {};
  }

  /**
   * Ouvre le menu contextuel et met le focus sur la recherche
   */
  openContextMenu(): void {
    this.isContextMenuOpen = !this.isContextMenuOpen;
    if (this.isContextMenuOpen) {
      // Recharger les items au cas où les rôles auraient changé
      this.loadMenuItems();
      setTimeout(() => {
        const input = document.querySelector(
          '.context-search-field',
        ) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
      this.searchQuery = '';
      this.filteredItems = [];
    }
  }

  /**
   * Ferme le menu contextuel
   */
  closeContextMenu(): void {
    this.isContextMenuOpen = false;
    this.searchQuery = '';
    this.filteredItems = [];
    this.selectedIndex = -1;
  }

  /**
   * Filtre les éléments du menu selon la recherche
   */
  filterMenuItems(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredItems = [];
      this.selectedIndex = -1;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredItems = this.menuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.label
          .toLowerCase()
          .replace(/[éèêë]/g, 'e')
          .replace(/[àâä]/g, 'a')
          .includes(query),
    );
    this.selectedIndex = this.filteredItems.length > 0 ? 0 : -1;
  }

  /**
   * Efface la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredItems = [];
    this.selectedIndex = -1;
    const input = document.querySelector(
      '.context-search-field',
    ) as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * Navigation au clavier dans les résultats
   */
  onSearchKeydown(event: KeyboardEvent): void {
    if (this.filteredItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex =
          (this.selectedIndex + 1) % this.filteredItems.length;
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex =
          (this.selectedIndex - 1 + this.filteredItems.length) %
          this.filteredItems.length;
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (
          this.selectedIndex >= 0 &&
          this.selectedIndex < this.filteredItems.length
        ) {
          const item = this.filteredItems[this.selectedIndex];
          this.router.navigate([item.route]);
          this.closeContextMenu();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeContextMenu();
        break;
    }
  }

  /**
   * Scroll vers l'élément sélectionné
   */
  private scrollToSelected(): void {
    setTimeout(() => {
      const selected = document.querySelector(
        '.context-result-item.active',
      ) as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 50);
  }

  /**
   * Raccourci clavier pour ouvrir le menu (Cmd+K ou Ctrl+K)
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isContextMenuOpen) {
        this.closeContextMenu();
      } else {
        this.openContextMenu();
        // Forcer l'ouverture du dropdown
        const dropdown = document.querySelector(
          '#page-header-menu-dropdown',
        ) as HTMLElement;
        if (dropdown) {
          dropdown.click();
        }
      }
    }
  }

  /**
   * Récupère les catégories uniques du menu
   * Filtrées selon les items disponibles pour l'utilisateur
   */
  getCategories(): string[] {
    const categories = new Set(this.menuItems.map((item) => item.category));
    return Array.from(categories);
  }

  /**
   * Récupère les items d'une catégorie spécifique
   * @param category - Le nom de la catégorie
   * @returns La liste des items de cette catégorie
   */
  getItemsByCategory(category: string): MenuItem[] {
    return this.menuItems.filter((item) => item.category === category);
  }

  /**
   * Récupère l'icône pour une catégorie
   * @param category - Le nom de la catégorie
   * @returns Le nom de l'icône Remix Icon
   */
  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      Administration: 'ri-shield-keyhole-line',
      Paramétrages: 'ri-settings-4-line',
      'Données de base': 'ri-database-2-line',
      'Caisse et Journal': 'ri-wallet-3-line',
      'Gestion du budget': 'ri-honour-line',
      Opérations: 'ri-stack-line',
      Consultations: 'ri-dashboard-2-line',
      Comptabilisation: 'ri-calculator-line',
    };
    return iconMap[category] || 'ri-folder-line';
  }

  /**
   * Navigue vers une page avec gestion d'erreur
   * @param route - La route vers laquelle naviguer
   */
  navigateTo(route: string): void {
    console.log('Route:', route);
    if (!route) {
      console.warn('Route vide, navigation annulée');
      return;
    }

    // Fermer le menu
    this.closeContextMenu();

    // Nettoyer la route (enlever les espaces, etc.)
    const cleanRoute = route.trim();

    // S'assurer que la route commence par un slash
    const finalRoute = cleanRoute.startsWith('/')
      ? cleanRoute
      : '/' + cleanRoute;

    // Navigation avec timeout pour laisser le temps au menu de se fermer
    setTimeout(() => {
      this.router
        .navigate([finalRoute])
        .then((success) => {
          if (success) {
            console.log('Navigation réussie vers:', finalRoute);
          } else {
            console.warn('Navigation échouée vers:', finalRoute);
            // Essayer de naviguer vers la route telle quelle
            this.router.navigate([cleanRoute]);
          }
        })
        .catch((error) => {
          console.error('Erreur de navigation:', error);
        });
    }, 100);
  }
}
