import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CrudOperationsService {

  constructor() { }

  /**
   * Méthode générique pour supprimer un élément individuel
   * @param service Le service contenant la méthode delete
   * @param item L'élément à supprimer
   * @param idField Le nom du champ ID (par défaut 'id')
   * @returns Observable<boolean> true si succès, false sinon
   */
  deleteItem<T>(
    service: any,
    item: T,
    idField: string = 'id'
  ): Observable<boolean> {
    const id = (item as any)[idField];
    return service.delete(id).pipe(
      map((res: any) => res.success === true)
    );
  }

  /**
   * Méthode générique pour supprimer plusieurs éléments
   * @param service Le service contenant la méthode delete
   * @param items Les éléments à supprimer
   * @param idField Le nom du champ ID (par défaut 'id')
   * @returns Observable<boolean[]> tableau des résultats de suppression
   */
  deleteMultipleItems<T>(
    service: any,
    items: T[],
    idField: string = 'id'
  ): Observable<boolean[]> {
    const deleteObservables = items.map(item =>
      this.deleteItem(service, item, idField)
    );
    return forkJoin(deleteObservables);
  }

  /**
   * Méthode générique pour actualiser les données
   * @param getDataFunction Fonction qui récupère les données
   * @param resetFunction Fonction optionnelle pour réinitialiser l'état
   */
  refreshData(
    getDataFunction: () => void,
    resetFunction?: () => void
  ): void {
    if (resetFunction) {
      resetFunction();
    }
    getDataFunction();
  }

  /**
   * Méthode générique pour compter les éléments par statut
   * @param items Liste des éléments
   * @param statusField Nom du champ de statut
   * @param statusValue Valeur du statut (ou '' pour tous)
   * @returns Nombre d'éléments correspondant au statut
   */
  countByStatus<T>(
    items: T[],
    statusField: string,
    statusValue: any
  ): number {
    if (statusValue === '') return items.length;
    return items.filter(item => (item as any)[statusField] === statusValue).length;
  }
}