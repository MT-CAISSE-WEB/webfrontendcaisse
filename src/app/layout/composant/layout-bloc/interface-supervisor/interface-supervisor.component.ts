import { Component, OnInit } from '@angular/core';
import { CaisseSolde } from '../../../../features/caisse_journal/models/caisse.model';
import { CaisseService } from '../../../../features/caisse_journal/services/caisse.service';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  constructor(private caisseservice: CaisseService, private toastr: ToastrService,) {}

  ngOnInit(): void {
    this.caisseservice.get_soldeAllCaisse().subscribe({
      next: (res) => {
        console.log('resultat ', res);
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

  //Récuperer les soldes
  getSoldeAllCaisse() {
    this.caisseservice.get_soldeAllCaisse().subscribe({
      next: (res) => {
        if (res.success) {
          this.caisseAllSolde = res.data;
        }else {
          this.toastr.error(res.message || 'Erreur de chargement');
        }
      },
      error: (err) => {
        this.toastr.error(err.message || 'Erreur technique');
      }
    });
  }

}
