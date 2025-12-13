import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";
import { CaisseService } from './caisse.service';
import { caisseModel } from "../models/caisse.model";
import { AffectationCaisseModel } from "../models/affectationcaisse.model";

@Injectable({
  providedIn: 'root'
})
export class CaissePeriodeService {
    
    private statusesSource = new BehaviorSubject<{ [id: string]: string }>({});
    private periodeSource = new BehaviorSubject<{ [id: string] : string}>({});
    statuses$ = this.statusesSource.asObservable();
    periode$ = this.periodeSource.asObservable();

    constructor(private caisseService: CaisseService) {}

    // Charger les statuts de toutes les caisses utilisateur
    loadStatuses(caissesUser: any[]) {
        const statuses: { [id: string]: string } = {};

        caissesUser.forEach(caisse => {
        this.caisseService.getRecentCaisse(caisse.idcaisse).subscribe({
            next: (res) => {
                statuses[caisse.idcaisse] = res.success 
                    ? res.data.statut 
                    : "inconnu";

                    this.statusesSource.next(statuses); 
                },
                error: () => {
                    statuses[caisse.idcaisse] = "erreur";
                    this.statusesSource.next(statuses);
                }
            });
        });
    }

    // Récupérer le statut d'une caisse
    getStatut(id: string) {
        return this.statusesSource.value[id] || "chargement...";
    }

    // Mise à jour depuis le header
    updateStatuses(newStatuses: { [id: string]: string }) {
        this.statusesSource.next(newStatuses);
    }

    // Charger les idperiode de toutes les caisses utilisateur
    loadPeriodes(caissesUser: any[]) {
        const periodes: { [id: string]: string } = {};

        caissesUser.forEach(caisse => {
        this.caisseService.getRecentCaisse(caisse.idcaisse).subscribe({
            next: (res) => {
                periodes[caisse.idcaisse] = res.success 
                    ? res.data.statut 
                    : "inconnu";

                    this.statusesSource.next(periodes); 
                },
                error: () => {
                    periodes[caisse.idcaisse] = "erreur";
                    this.statusesSource.next(periodes);
                }
            });
        });
    }

    // Récupérer la periode d'une caisse
    getPeriode(id: string) {
        return this.periodeSource.value[id] || "chargement...";
    }

    getCaissesPeriodes(caisses: AffectationCaisseModel[]) {
        const requests = caisses.map(c =>
            this.caisseService.getRecentCaisse(c.idcaisse)
        );

        return forkJoin(requests); // retourne un tableau de réponses
    }
}