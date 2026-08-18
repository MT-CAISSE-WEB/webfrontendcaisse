// src/app/services/rece.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReceService {
  // En développement (avec ngrok ou IP locale)
  private apiUrl = 'http://192.168.1.72:5000/api/operation/data'; // Remplace X par ton IP locale
  // En production
  // private apiUrl = 'https://ton-domaine.com/API/recu/data';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les données d'un reçu par son numéro
   * @param numero Code du reçu (ex: "OPE-2026-001")
   */
  getReceData(numero: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Ajoute le token si ton API le requiert
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    return this.http.get(`${this.apiUrl}/${numero}`, { headers }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération du reçu:', error);
        return throwError(
          () => new Error('Reçu introuvable ou erreur serveur'),
        );
      }),
    );
  }
}
