import { Component, OnInit } from '@angular/core';
import { CaisseSolde } from '../../../../features/caisse_journal/models/caisse.model';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConsultationOpService } from '../../../../features/consultations/services/operations.service';
import { CaisseSelectionService } from '../../../../_core/services/caisse-selection.service';
import { Router } from '@angular/router';
import { APP_ROOT_SOLDECAISSE_CONSULTATION } from '../../../../_core/routes/frontend.root';

@Component({
  selector: 'app-interface-supervisor',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-supervisor.component.html',
  styleUrl: './interface-supervisor.component.css',
})
export class InterfaceSupervisorComponent implements OnInit {
  caisseAllSolde: CaisseSolde[] = [];
  loading = true;
  selectedCaisseId: string | null = null;

  constructor(
    private service: ConsultationOpService,
    private toastr: ToastrService,
    private caisseSelectionService: CaisseSelectionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.getSoldeAllCaisse();
  }

  getSoldeAllCaisse() {
    this.service.get_soldeAllCaisse().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.caisseAllSolde = res.data;
        } else {
          this.toastr.error(res.message || 'Erreur de chargement');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des soldes :', err);
        this.loading = false;
      },
    });
  }

  getSolde(caisse: any): number {
    return (
      (caisse.soldeouverture || 0) +
      (caisse.total_encaissement || 0) -
      (caisse.total_decaissement || 0)
    );
  }

  onCaisseClick(idcaisse: string): void {
    this.selectedCaisseId = idcaisse;
    this.caisseSelectionService.selectCaisse(idcaisse);
    this.router.navigate([APP_ROOT_SOLDECAISSE_CONSULTATION], {
      queryParams: { caisseId: idcaisse },
    });
  }
}
