import { Component, Input, Output, EventEmitter, OnInit, HostListener, forwardRef, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-field-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './custom-field-select.component.html',
  styleUrls: ['./custom-field-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomFieldSelectComponent),
      multi: true
    }
  ]
})
export class CustomFieldSelectComponent implements OnInit, ControlValueAccessor, OnChanges {

  /* MODE */
  @Input() mode: 'frontend' | 'backend' = 'frontend';

  /* DONNEES */
  @Input() data: any[] = [];

  /* EVENEMENT BACKEND */
  @Output() loadData = new EventEmitter<any>();

  /* EVENEMENT SELECTION */
  @Output() valueChange = new EventEmitter<any>();

  /* CHAMP A AFFICHER */
  @Input() codeField: string = 'code';
  @Input() labelField: string = 'label';

  /* COLONNES A AFFICHER */
  @Input() columns: { field: string, label: string, key?: boolean }[] = [];

  /* PLACEHOLDER */
  @Input() placeholder: string = 'Rechercher...';

  filteredData: any[] = [];
  pagedData: any[] = [];

  private pendingValue: any = null;

  /* SEARCH */
  searchTerm: string = '';
  selectedItem: any = null;
  lastSearch = '';

  /* PAGINATION */
  page: number = 1;
  pageSize: number = 3;
  totalPages: number = 0;

  /* UI */
  isOpen: boolean = false;

  /* CONTROL VALUE ACCESSOR */
  onChange: any = () => {};
  onTouched: any = () => {};

  @ViewChild('searchInput') searchInput: any;

  constructor(private cdr: ChangeDetectorRef) {}

  // -------------------------------
  // CONTROL VALUE ACCESSOR
  // -------------------------------
  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.selectedItem = null;
      this.searchTerm = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.data?.length) {
      const found = this.data.find(x => x[this.idField] === value);
      if (found) {
        this.selectedItem = found;
        this.searchTerm = found[this.labelField];
      } else {
        this.pendingValue = value; // attendre que data arrive
      }
    } else {
      this.pendingValue = value; // attendre que data arrive
    }

    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Optionnel
  }

  // -------------------------------
  // LIFECYCLE
  // -------------------------------
  ngOnInit(): void {
    if (this.mode === 'frontend') {
      this.filteredData = [...this.data];
      this.updatePagination();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data?.length) {
      this.filteredData = [...this.data];
      this.updatePagination();

      // appliquer pendingValue si existant
      if (this.pendingValue !== null && this.pendingValue !== undefined) {
        const found = this.data.find(x => x[this.idField] === this.pendingValue);
        if (found) {
          this.selectedItem = found;
          this.searchTerm = found[this.labelField];
          this.pendingValue = null;
          this.cdr.detectChanges();
        }
      }
    }
  }

  // -------------------------------
  // UI / DROPDOWN
  // -------------------------------
  open(): void {
    this.isOpen = true;
    if (this.mode === 'backend' && this.pagedData.length === 0) {
      this.fetchBackend();
    }
  }

  close(): void {
    this.isOpen = false;
  }

  filterData(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.selectedItem = null;
      this.onChange(null);
      this.onTouched();
    }

    if (this.mode === 'frontend') {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = this.data.filter(x =>
        String(x[this.codeField]).toLowerCase().includes(term) ||
        String(x[this.labelField]).toLowerCase().includes(term)
      );
      this.page = 1;
      this.updatePagination();
    }

    if (this.mode === 'backend') {
      if (this.searchTerm === this.lastSearch) return;
      this.lastSearch = this.searchTerm;
      this.page = 1;
      this.fetchBackend();
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedData = this.filteredData.slice(start, end);
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      if (this.mode === 'frontend') this.updatePagination();
      if (this.mode === 'backend') this.fetchBackend();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      if (this.mode === 'frontend') this.updatePagination();
      if (this.mode === 'backend') this.fetchBackend();
    }
  }

  fetchBackend(): void {
    this.loadData.emit({
      search: this.searchTerm,
      page: this.page,
      pageSize: this.pageSize
    });
  }

  setBackendData(data: any[], total: number): void {
    this.pagedData = data;
    this.totalPages = Math.ceil(total / this.pageSize);
  }

  select(item: any): void {
    this.selectedItem = item;
    this.searchTerm = item[this.labelField];
    const value = item[this.idField];
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(item);
    this.close();
  }

  trackByFn(index: number, item: any) {
    return item.id || index;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) {
    if (!event.target.closest('.erp-select')) {
      this.close();
    }
  }

  get idField(): string {
    return this.columns.find(c => c.key)?.field ?? 'id';
  }
}