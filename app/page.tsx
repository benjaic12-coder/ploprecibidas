import Store from './store';
import {catalogStructuredData,serializeStructuredData} from '@/lib/seo';
export default function Page(){return <><script id="plop-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeStructuredData(catalogStructuredData())}}/><Store/></>}
