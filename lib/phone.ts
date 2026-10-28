export function validArgentinePhone(value:string){
 if(!/^[+\d\s()-]+$/.test(value))return false;
 let digits=value.replace(/\D/g,'');
 if(digits.startsWith('0054'))digits=digits.slice(2);
 if(value.trim().startsWith('+')&&!digits.startsWith('54'))return false;
 if(digits.startsWith('549')&&digits.length===13&&/[1-9]/.test(digits[3]))return true;
 if(digits.startsWith('54')&&digits.length===12&&/[1-9]/.test(digits[2]))return true;
 if(digits.startsWith('0'))digits=digits.slice(1);
 if(digits.length===12)for(const length of [2,3,4])if(digits.slice(length,length+2)==='15'){digits=digits.slice(0,length)+digits.slice(length+2);break}
 return digits.length===10&&/^[1-9]/.test(digits);
}
