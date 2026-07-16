import { Component, OnInit } from '@angular/core';
import { operationModel } from '../model/operation.model';
import { OperationService } from '../service/operation.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-operation-justifiee-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './operation-justifiee-list.component.html',
  styleUrl: './operation-justifiee-list.component.css'
})
export class OperationJustifieeListComponent implements OnInit {
  title = 'Liste decaissement à justifier';

  msgErros: string = '';
  loading: Boolean = false;

  operations: operationModel[] = [];
  operationsFiltrees: operationModel[] = [];

  // Set contenant les idoperations dont on a déplié la liste des salariés
  expandedSalaries: Set<string> = new Set();

  constructor(private operationservice: OperationService, private toastr: ToastrService,
    private router: Router, private route: ActivatedRoute
  ){}

  ngOnInit(): void {
    //Afficher toutes les opérations
    this.getAllOperations();
  }

  //Recuperer toutes les opérations
  getAllOperations() {
    this.loading = true;
    const params = {
      page: 1,
      limit: 100000,
      search: '',
      date: '',
      user: this.user.idutilisateur,
    };
    this.operationservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operations = res.data.data;
          if (this.operations.length != 0) {
            this.operationsFiltrees = this.operations.filter(
              (op) =>
                op.caisses?.some((caisse) =>
                  caisse.codtypeoperation
                    ?.toLowerCase()
                    .includes('decaissementaj'),
                )
            );
          }
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  justifier(operation: any) {
    this.router.navigate(['../ajustifiee', operation.idoperation], {
      relativeTo: this.route
    });
  }

  // Basculer l'affichage des salariés pour une opération
  toggleSalaries(idoperation: string) {
    if (this.expandedSalaries.has(idoperation)) {
      this.expandedSalaries.delete(idoperation);
    } else {
      this.expandedSalaries.add(idoperation);
    }
  }

  // Vérifier si la liste est dépliée
  isSalariesExpanded(idoperation: string): boolean {
    return this.expandedSalaries.has(idoperation);
  }

  // Retourner le nombre de salariés distincts ou le nombre de lignes
  getSalariesCount(op: any): number {
    return op.lignes?.length || 0;
  }

  // Redirection vers la justification
  // justifier(operation: any) {
  //   this.router.navigate(['/justifier', operation.idoperation]);
  // }


}
