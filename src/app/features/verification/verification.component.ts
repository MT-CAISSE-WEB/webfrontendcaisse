import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReceService } from '../../_core/services/recu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verification',
  imports: [CommonModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css'],
})
export class VerificationComponent implements OnInit {
  receData: any = null;
  loading = true;
  date: Date = new Date();
  error: string | null = null;
  numeroRecu: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receService: ReceService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.numeroRecu = params['op'];
      if (this.numeroRecu) {
        this.loadRecuData(this.numeroRecu);
        const pdfUrl = `http://192.168.1.72:5000/api/operation/data/${this.numeroRecu}`;
        window.location.href = pdfUrl;
      } else {
        this.error = 'Aucun numéro de reçu spécifié dans le QR code.';
        this.loading = false;
      }
    });
  }

  loadRecuData(numero: string): void {
    this.loading = true;
    this.error = null;

    this.receService.getReceData(numero).subscribe({
      next: (response: any) => {
        if (response?.success && response.data) {
          this.receData = response.data;
        } else {
          this.error = response?.message || 'Reçu introuvable.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error =
          'Erreur lors du chargement du reçu. Vérifiez le numéro ou votre connexion.';
        this.loading = false;
        this.snackBar.open(this.error, 'Fermer', { duration: 5000 });
        console.error('Erreur API:', err);
      },
    });
  }

  // Méthode pour réessayer
  retry(): void {
    if (this.numeroRecu) {
      this.loadRecuData(this.numeroRecu);
    }
  }

  /**
   * Convertit un montant numérique en lettres (français)
   * @param {number} montant - Le montant à convertir
   * @param {string} devise - La devise (ex: 'XAF', 'FCFA', 'EUR')
   * @returns {string} Le montant en toutes lettres
   */
  montantEnLettres(montant: any, devise = 'XAF') {
    const units = [
      '',
      'UN',
      'DEUX',
      'TROIS',
      'QUATRE',
      'CINQ',
      'SIX',
      'SEPT',
      'HUIT',
      'NEUF',
    ];
    const teens = [
      'DIX',
      'ONZE',
      'DOUZE',
      'TREIZE',
      'QUATORZE',
      'QUINZE',
      'SEIZE',
      'DIX-SEPT',
      'DIX-HUIT',
      'DIX-NEUF',
    ];
    const tens = [
      '',
      'DIX',
      'VINGT',
      'TRENTE',
      'QUARANTE',
      'CINQUANTE',
      'SOIXANTE',
      'SOIXANTE-DIX',
      'QUATRE-VINGT',
      'QUATRE-VINGT-DIX',
    ];

    function convertLessThanOneThousand(n: any) {
      let result = '';
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;

      if (hundred > 0) {
        result += units[hundred] + ' CENT';
        if (hundred > 1) result += 'S';
        if (remainder > 0) result += ' ';
      }

      if (remainder > 0) {
        if (remainder < 10) {
          result += units[remainder];
        } else if (remainder < 20) {
          result += teens[remainder - 10];
        } else {
          const ten = Math.floor(remainder / 10);
          const unit = remainder % 10;
          result += tens[ten];
          if (unit > 0) {
            if (ten === 7 || ten === 9) {
              result += '-' + units[unit + 1];
            } else {
              result += '-' + units[unit];
            }
          }
        }
      }

      return result;
    }

    if (montant === 0) {
      return `ZÉRO ${devise === 'EUR' ? 'EURO' : devise === 'USD' ? 'DOLLAR' : devise === 'CDF' ? 'FRANCS CONGOLAIS' : 'FRANCS CFA'}`;
    }

    const isNegative = montant < 0;
    montant = Math.abs(Math.round(montant));

    const scales = [
      { value: 1000000000, name: 'MILLIARD' },
      { value: 1000000, name: 'MILLION' },
      { value: 1000, name: 'MILLE' },
    ];

    let result = '';
    let remaining = montant;

    for (const scale of scales) {
      const count = Math.floor(remaining / scale.value);
      if (count > 0) {
        const part = convertLessThanOneThousand(count);
        result += (result ? ' ' : '') + part + ' ' + scale.name;
        if (count > 1 && scale.name !== 'MILLE') {
          result += 'S';
        }
        remaining %= scale.value;
      }
    }

    if (remaining > 0) {
      const part = convertLessThanOneThousand(remaining);
      result += (result ? ' ' : '') + part;
    }

    const currencyName =
      devise === 'EUR'
        ? 'EURO'
        : devise === 'USD'
          ? 'DOLLAR'
          : devise === 'XAF' || devise === 'FCFA'
            ? 'FRANCS CFA'
            : devise === 'CDF'
              ? 'FRANCS CONGOLAIS'
              : 'UNITÉ';

    result +=
      ' ' +
      (montant === 1
        ? currencyName
        : currencyName + (currencyName === 'FRANCS CFA' ? '' : 'S'));

    if (isNegative) {
      result = 'MOINS ' + result;
    }

    return result;
  }

  /**
   * Formate une date au format français
   * @param {Date|string} date - La date à formater
   * @returns {string} La date formatée
   */
  formaterDate(date: any) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formate un montant avec séparateurs de milliers
   * @param {number} montant - Le montant à formater
   * @param {string} devise - La devise
   * @returns {string} Le montant formaté
   */
  formaterMontant(montant: any, devise = '') {
    if (montant === null || montant === undefined)
      return '0' + (devise ? ' ' + devise : '');
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(montant) + (devise ? ' ' + devise : '')
    );
  }
}
