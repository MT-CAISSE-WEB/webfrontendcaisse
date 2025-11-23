export const BASE_URL = "domaine.server.com/";
export const PREFIX = "https://";
export const  ROUTE_APP = "app";
export const  ROUTE_CONFIG = "config";

export const URL_MAIN_PROD = PREFIX + BASE_URL;
export const URL_MAIN_TEST = PREFIX + BASE_URL;
export const URL_MAIN_DEV = PREFIX + BASE_URL;
export const URL_MAIN_LOCAL = "http://localhost:5000/";
export const URL_MAIN_LOCAL_SOCKET = "http://localhost:5000/";

export const URL_LOCAL = {
    type : 'local',
    baseUrl: 'http://localhost:5000/api/',
    baseUrlFiles: 'http://localhost:5000/uploads/',
    baseUrlPdfs: 'http://localhost:5000/pdfs/',
};


export const URL_DEV= {
    type : 'dev',
    baseUrl: 'https://dev-api.nom_domaine.com/api/',
    baseUrlFiles: 'https://dev-api.nom_domaine.com/uploads/',
    baseUrlPdfs: 'https://dev-api.nom_domaine.com/pdfs/',
};

export const URL_TEST= {
    type : 'test',
    baseUrl: 'https://dev-api.nom_domaine.com/api/',
    baseUrlFiles: 'https://dev-api.nom_domaine.com/uploads/',
    baseUrlPdfs: 'https://dev-api.nom_domaine.com/pdfs/',
};

export const URL_PROD= {
    type : 'prod',
    baseUrl: 'https://dev-api.nom_domaine.com/api/',
    baseUrlFiles: 'https://dev-api.nom_domaine.com/uploads/',
    baseUrlPdfs: 'https://dev-api.nom_domaine.com/pdfs/',
};

// export let URL_API =
//     window.location.href.includes('dev-') || window.location.href.includes('dev.') ? URL_DEV :
//         window.location.href.includes('test-') || window.location.href.includes('test.')  ? URL_TEST :
//             window.location.href.includes('localhost') ? URL_LOCAL : URL_PROD;