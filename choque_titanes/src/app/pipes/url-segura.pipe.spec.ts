import { UrlSeguraPipe } from './url-segura.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('UrlSeguraPipe', () => {
  let pipe: UrlSeguraPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new UrlSeguraPipe(sanitizer);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
