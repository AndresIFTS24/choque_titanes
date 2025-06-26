import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'urlSegura'
})
export class UrlSeguraPipe implements PipeTransform {

  constructor(private _sanitizer: DomSanitizer){}

  transform(url:string): SafeResourceUrl {
    return this._sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}