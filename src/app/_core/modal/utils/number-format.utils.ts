import { tiersModel } from "../../../features/donnee_base/models/tiers.model";

export class OperationModalUtils {
  static formatDateForInput(date?: string | null): string {
    return date ? date.substring(0, 10) : '';
  }

  static checkSameDatePeriodes(periodes?: Array<{ periode?: { dateperiode?: string } } | null>): string | null {
    if (!periodes || periodes.length === 0) return null;
    const firstDate = periodes[0]?.periode?.dateperiode;
    const allSame = periodes.every(p => p?.periode?.dateperiode === firstDate);
    return allSame ? firstDate ?? null : null;
  }

  static normalizeValue(value: string): string {
    return (value ?? '').toLowerCase().replace(/\s/g, '');
  }

  static filterNature(value: any, naturesFiltrees: any[]): any[] {
    const filterValue = OperationModalUtils.normalizeValue(
      typeof value === 'string' ? value : value?.libelle || ''
    );
    return (naturesFiltrees || []).filter(option =>
      OperationModalUtils.normalizeValue(option.libelle).includes(filterValue)
    );
  }

  static filterTiers(value: any, tiers: any[]): any[] {
    const filterValue = OperationModalUtils.normalizeValue(
      typeof value === 'string' ? value : value?.designation || ''
    );
    return (tiers || []).filter(option =>
      OperationModalUtils.normalizeValue(option.designation).includes(filterValue)
    );
  }

  static filterCentre(value: any, centres: any[]): any[] {
    const filterValue = OperationModalUtils.normalizeValue(
      typeof value === 'string' ? value : value?.libelle || ''
    );
    return (centres || []).filter((option: any) =>
      OperationModalUtils.normalizeValue(option.libelle).includes(filterValue)
    );
  }

  static displayNature(nature: any, naturesFiltrees: any[]): string {
    if (!nature) return '';
    if (typeof nature === 'number') {
      const found = (naturesFiltrees || []).find((n: any) => n.idnature === nature);
      return found ? found.libelle : '';
    }
    return typeof nature === 'string' ? nature : nature.libelle || '';
  }

  static displayTiers(tiers: any, allTiers: any[]): string {
    if (!tiers) return '';
    if (typeof tiers === 'number') {
      const found = (allTiers || []).find((t: any) => t.idtiers === tiers);
      return found ? found.designation : '';
    }
    return typeof tiers === 'string' ? tiers : tiers.designation || '';
  }

  static displayCentre(centre: any, centresFiltrees: any[]): string {
    if (!centre) return '';
    if (typeof centre === 'number') {
      const found = (centresFiltrees || []).find((c: any) => c.idcentre === centre);
      return found ? found.libelle : '';
    }
    return typeof centre === 'string' ? centre : centre.libelle || '';
  }

  static formatNumber(montant: number | string | null | undefined): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    if (isNaN(valeur)) return '';
    return valeur.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  static formatDateFR(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '';
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

  static parseCFA(valeur: string | null | undefined): number {
    if (!valeur) return 0;
    return Number(valeur.replace(/[^\d]/g, ''));
  }

  static formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  static filterTiersByNature(value: any, nature: any, tiers: tiersModel[]): any[] {
    let filtered = tiers;
    // Filtrer par typetiers si la nature existe et a un typetiers
    if (nature && nature.typetiers != null) {
      filtered = filtered.filter(t => t.typetiers === nature.typetiers);
    }
    // Filtrer par texte saisi
    const search = typeof value === 'string' ? value : (value?.designation || '');
    const filterValue = OperationModalUtils.normalizeValue(search);
    if (filterValue) {
      filtered = filtered.filter(option =>
        OperationModalUtils.normalizeValue(option.designation).includes(filterValue)
      );
    }
    return filtered;
  }
}
