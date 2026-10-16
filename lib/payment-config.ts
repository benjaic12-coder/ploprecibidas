// Único adaptador de configuración de pagos. Los valores vigentes se editan en
// Admin > Configuración y se guardan en plop_settings (key = public).
// No dupliques alias/CBU en la home, componentes ni pedidos nuevos.
export type TransferConfig={alias:string;cbu:string;holder:string;bank:string};
export const RECEIPT_CONFIG={maxBytes:5*1024*1024,mimeTypes:['image/jpeg','image/png','image/webp','application/pdf']} as const;
export function transferConfig(value:Partial<TransferConfig>):TransferConfig{
 return Object.fromEntries(['alias','cbu','holder','bank'].map(key=>[key,value[key as keyof TransferConfig]?.trim()||'COMPLETAR'])) as TransferConfig;
}
