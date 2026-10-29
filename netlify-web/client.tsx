// This entry must stay side-effect-free except for importing the bootstrap.
// Lazy pages share bootstrap exports; a domain cache query must not mount React twice.
import('./bootstrap');
