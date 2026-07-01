import { Component, OnInit } from '@angular/core';
import { CaisseSolde } from '../../../../features/caisse_journal/models/caisse.model';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConsultationOpService } from '../../../../features/consultations/services/operations.service';

@Component({
  selector: 'app-interface-supervisor',
  imports: [RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './interface-supervisor.component.html',
  styleUrl: './interface-supervisor.component.css'
})
export class InterfaceSupervisorComponent implements OnInit {
  caisseAllSolde: CaisseSolde[] = [];
  loading = true;

  constructor(private service: ConsultationOpService, private toastr: ToastrService,) {}

  ngOnInit(): void {
    this.getSoldeAllCaisse();
  }

  //Récuperer les soldes
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
      }
    });
  }

  getSolde(caisse: any): number {
    return (
      (caisse.soldeouverture || 0) +
      (caisse.total_encaissement || 0) -
      (caisse.total_decaissement || 0)
    );
  }

}
