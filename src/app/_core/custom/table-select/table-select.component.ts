import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR , FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-select',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './table-select.component.html',
  styleUrl: './table-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TableSelectComponent),
      multi: true
    }
  ]
})
export class TableSelectComponent implements ControlValueAccessor {

  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() search = true;
  @Input() pagination = true;

  @Output() loadData = new EventEmitter<any>();

  value: any;
  showTable = false;

  filteredData: any[] = [];

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    this.filteredData = this.data;
  }

  writeValue(value: any) {
    this.value = value;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  toggleTable() {
    this.showTable = !this.showTable;
  }

  selectItem(item: any) {
    this.value = item;
    this.onChange(item);
    this.showTable = false;
  }

  searchValue(event: any) {
    const value = event.target.value.toLowerCase();

    this.filteredData = this.data.filter(row =>
      Object.values(row).some(v =>
        String(v).toLowerCase().includes(value)
      )
    );
  }

  // get pagedData(){
  //   return this.filteredData.slice(
  //     (this.page-1)*this.pageSize,
  //     this.page*this.pageSize
  //   );
  // }

}
