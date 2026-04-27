export const COLUMNS_TIERS = [
    { field:'idtiers', label:'Id', key:true },
    // {field:'codetiers', label:'code'},
    {field:'designation', label:'Tiers'}
];

export const COLUMNS_NATURE = [
    { field:'idnature', label:'Id', key:true },
    // {field:'codenature', label:'code'},
    {field:'libelle', label:'Nature opération'}
];

export const COLUMNS_CENTRE = [
    {field:'idcentreanalytique', label:'Id', key:true },
    // {field:'codecentreanalytique', label:'code'},
    {field:'libelle', label:'Centre ana.'}
];

export const COLUMNS_DEPARTEMENT = [
    {field:'iddepartement', label:'Id', key:true },
    // {field:'codecentreanalytique', label:'code'},
    {field:'libelle', label:'--Selecctionner departement--'}
];

export const COLUMNS_BUDGET = [
    {field:'idbudget', label:'Id', key:true },
    // {field:'codecentreanalytique', label:'code'},
    {field:'libelle', label:'--Selecctionner budget--'}
];


export const DENOMINATION_BILLETAGE: any = {
  CDF: {
    billets: [10000, 5000, 2000, 1000, 500, 200, 100, 50],
    pieces: []
  },
  USD: {
    billets: [100, 50, 20, 10, 5],
    pieces: [0.50, 0.25, 0.10, 0.05]
  },
  XAF: {
    billets: [10000, 5000, 2000, 1000, 500],
    pieces: [500, 200, 100, 50, 25]
  },
};