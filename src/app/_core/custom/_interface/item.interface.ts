export interface SelectItem {
  id: number;
  code: string;
  label: string;
}

export interface TableColumn {
  field: string;
  label: string;
}

export const clientColumns = [
  { field: 'id', label: 'ID' },
  { field: 'name', label: 'Nom' },
  { field: 'email', label: 'Email' }
];