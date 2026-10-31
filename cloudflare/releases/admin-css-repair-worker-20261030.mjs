// Versioned CSS repair. client.txt and admin-orders.mjs are copied byte for byte
// from the active Worker; style.txt is the rebuilt complete Plop stylesheet.
import client from './client.txt';
import css from './style.txt';
import previousCss from './previous-style.txt';
import {handleAdminRequest} from './admin-orders.mjs';
const options={client,css,assetPath:'/assets/plop-admin-orders-e829489ac68c9f5f.js',stylePath:'/assets/plop-admin-orders-13040e83061dddbe.css',replaceEntry:true};
export default {fetch(request){
 if(new URL(request.url).pathname==='/assets/plop-admin-orders-078c9f3f90814e9a.css')return handleAdminRequest(request,{...options,css:previousCss,stylePath:'/assets/plop-admin-orders-078c9f3f90814e9a.css'});
 return handleAdminRequest(request,options);
}};
